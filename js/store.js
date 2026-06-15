/* store.js — data model, CRUD, localStorage, import upsert, phases.
   Exposes window.Store. Browser-only, no modules (works on file://). */
(function () {
  'use strict';

  var LS_DATA = 'ct_items';
  var LS_DELETED = 'ct_deleted_ids';
  var LS_IMPORTED = 'ct_imported_ids'; // kept for backward compatibility

  // Fields overwritten from the source on every update.
  var SOURCE_FIELDS = [
    'title', 'dateStart', 'dateEnd', 'city', 'country', 'format', 'language',
    'links', 'program', 'authors', 'journal', 'year', 'doi', 'abstract',
    'descRu', 'sponsor', 'phase', 'nct', 'studyStatus', 'dateCompletion', 'tags'
  ];
  // Fields owned by the user, never clobbered by an update.
  var USER_FIELDS = ['notes', 'rating', 'status', 'attendance', 'inMyCalendar', 'files', 'notifyDays'];

  var items = [];
  var listeners = [];

  function uid() {
    return 'i_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function readLS(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeLS(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function deletedSet() {
    return new Set(readLS(LS_DELETED, []));
  }
  function markDeleted(importId) {
    if (!importId) return;
    var arr = readLS(LS_DELETED, []);
    if (arr.indexOf(importId) === -1) { arr.push(importId); writeLS(LS_DELETED, arr); }
  }

  function normalize(o) {
    o = o || {};
    var links = o.links || {};
    return {
      id: o.id || uid(),
      type: o.type === 'paper' ? 'paper' : (o.type === 'study' ? 'study' : 'conference'),
      title: o.title || '',
      dateStart: o.dateStart || '',
      dateEnd: o.dateEnd || '',
      city: o.city || '',
      country: o.country || '',
      format: o.format || 'offline',
      language: o.language || '',
      links: {
        site: links.site || '',
        reg: links.reg || '',
        stream: links.stream || '',
        rec: links.rec || ''
      },
      program: o.program || '',
      notes: o.notes || '',
      rating: typeof o.rating === 'number' ? o.rating : (parseInt(o.rating, 10) || 0),
      status: o.status || '',
      tags: Array.isArray(o.tags) ? o.tags.slice() : [],
      files: Array.isArray(o.files) ? o.files.slice() : [],
      notifyDays: Array.isArray(o.notifyDays) ? o.notifyDays.slice() : [],
      // paper fields
      authors: o.authors || '',
      journal: o.journal || '',
      year: o.year || '',
      doi: o.doi || '',
      abstract: o.abstract || '',
      // Block 1 new fields
      attendance: o.attendance || 'not_visited', // not_visited | visited | online
      inMyCalendar: !!o.inMyCalendar,
      descRu: o.descRu || '',
      // Block 2/3 study fields
      sponsor: o.sponsor || '',
      phase: o.phase || '',
      nct: o.nct || '',
      studyStatus: o.studyStatus || '',
      dateCompletion: o.dateCompletion || '',
      // meta
      importId: o.importId || '',
      createdAt: o.createdAt || Date.now(),
      updatedAt: o.updatedAt || Date.now()
    };
  }

  function persist() { writeLS(LS_DATA, items); }
  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) {} }); }
  function subscribe(fn) { listeners.push(fn); }

  function load() {
    items = (readLS(LS_DATA, []) || []).map(normalize);
  }

  function all() { return items.slice(); }
  function get(id) { return items.filter(function (x) { return x.id === id; })[0] || null; }

  function findByImportId(importId) {
    if (!importId) return null;
    return items.filter(function (x) { return x.importId === importId; })[0] || null;
  }

  function save(obj) {
    var existing = obj.id ? get(obj.id) : null;
    if (existing) {
      var merged = normalize(Object.assign({}, existing, obj));
      merged.createdAt = existing.createdAt;
      merged.updatedAt = Date.now();
      var idx = items.indexOf(existing);
      items[idx] = merged;
      persist(); emit();
      return merged;
    }
    var created = normalize(obj);
    items.push(created);
    persist(); emit();
    return created;
  }

  function remove(id) {
    var it = get(id);
    if (!it) return false;
    if (it.importId) markDeleted(it.importId);
    items = items.filter(function (x) { return x.id !== id; });
    persist(); emit();
    return true;
  }

  // Block 1: upsert. add new, update SOURCE_FIELDS on existing, keep USER_FIELDS.
  function importItems(incoming) {
    if (!Array.isArray(incoming)) return { added: 0, updated: 0 };
    var added = 0, updated = 0;
    incoming.forEach(function (raw) {
      if (!raw || !raw.importId) return;
      var existing = findByImportId(raw.importId);
      if (!existing) {
        var fresh = normalize(raw);
        items.push(fresh);
        added++;
      } else {
        var changed = false;
        var src = normalize(raw); // ensures defaults/shape for source fields
        SOURCE_FIELDS.forEach(function (f) {
          if (JSON.stringify(existing[f]) !== JSON.stringify(src[f])) {
            existing[f] = src[f];
            changed = true;
          }
        });
        if (raw.type && existing.type !== raw.type) { existing.type = src.type; changed = true; }
        if (changed) { existing.updatedAt = Date.now(); updated++; }
      }
    });
    if (added || updated) { persist(); emit(); }
    return { added: added, updated: updated };
  }

  // ---- phases ----
  function startOfToday() {
    var d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }
  function parseDate(s) {
    if (!s) return null;
    var d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    return isNaN(d.getTime()) ? null : d;
  }

  function phase(it) {
    var today = startOfToday();
    if (it.type === 'study') {
      var active = it.studyStatus === 'recruiting' || it.studyStatus === 'active';
      var s = parseDate(it.dateStart), e = parseDate(it.dateCompletion);
      if (!active) return 'past';
      if (!s && !e) return 'now';
      if (s && s > today) return 'future';
      if (e && e < today) return 'past';
      return 'now';
    }
    var ds = parseDate(it.dateStart);
    var de = parseDate(it.dateEnd) || ds;
    if (!ds) return 'future';
    if (de && de < today) return 'past';
    if (ds > today) return 'future';
    return 'now';
  }

  function conferences() { return items.filter(function (x) { return x.type === 'conference'; }); }
  function papers() { return items.filter(function (x) { return x.type === 'paper'; }); }
  function studies() { return items.filter(function (x) { return x.type === 'study'; }); }

  function byPhase(p) {
    return conferences().filter(function (x) { return phase(x) === p; });
  }
  function activeStudies() {
    return studies().filter(function (x) { return phase(x) === 'now'; });
  }

  load();

  window.Store = {
    normalize: normalize,
    all: all,
    get: get,
    save: save,
    remove: remove,
    importItems: importItems,
    phase: phase,
    conferences: conferences,
    papers: papers,
    studies: studies,
    activeStudies: activeStudies,
    byPhase: byPhase,
    future: function () { return byPhase('future'); },
    now: function () { return byPhase('now'); },
    past: function () { return byPhase('past'); },
    deletedSet: deletedSet,
    markDeleted: markDeleted,
    subscribe: subscribe,
    emit: emit,
    reload: load,
    SOURCE_FIELDS: SOURCE_FIELDS,
    USER_FIELDS: USER_FIELDS
  };
})();
