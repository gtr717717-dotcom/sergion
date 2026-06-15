/* modal.js — add/edit form. Exposes window.Modal { open, close }. */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var root, form, currentId = null;

  function field(label, name, value, type) {
    type = type || 'text';
    var input = (type === 'textarea')
      ? '<textarea name="' + name + '" rows="3">' + esc(value) + '</textarea>'
      : '<input type="' + type + '" name="' + name + '" value="' + esc(value) + '">';
    return '<label class="m-field"><span>' + esc(label) + '</span>' + input + '</label>';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function select(label, name, value, options) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (o[0] === value ? ' selected' : '') + '>' + esc(o[1]) + '</option>';
    }).join('');
    return '<label class="m-field"><span>' + esc(label) + '</span><select name="' + name + '">' + opts + '</select></label>';
  }

  function build(item) {
    var c = item || window.Store.normalize({});
    var isPaper = c.type === 'paper';
    var isStudy = c.type === 'study';
    var html = select('Type / Тип', 'type', c.type, [
      ['conference', T('badge.conference')], ['paper', T('badge.paper')], ['study', T('badge.study')]
    ]);

    html += field(T('field.title'), 'title', c.title);
    html += '<div class="m-row">' + field(T('field.dateStart'), 'dateStart', c.dateStart, 'date') +
      field(T('field.dateEnd'), 'dateEnd', c.dateEnd, 'date') + '</div>';

    if (isStudy) {
      html += '<div class="m-row">' + field(T('field.nct'), 'nct', c.nct) + field(T('field.phase'), 'phase', c.phase) + '</div>';
      html += '<div class="m-row">' + field(T('field.sponsor'), 'sponsor', c.sponsor) +
        field(T('field.dateCompletion'), 'dateCompletion', c.dateCompletion, 'date') + '</div>';
      html += select(T('field.studyStatus'), 'studyStatus', c.studyStatus, [
        ['recruiting', 'recruiting'], ['active', 'active'], ['completed', 'completed'], ['terminated', 'terminated'], ['', '—']
      ]);
    } else if (isPaper) {
      html += field(T('field.authors'), 'authors', c.authors);
      html += '<div class="m-row">' + field(T('field.journal'), 'journal', c.journal) + field(T('field.year'), 'year', c.year) + '</div>';
      html += field(T('field.doi'), 'doi', c.doi);
      html += field(T('field.abstract'), 'abstract', c.abstract, 'textarea');
    } else {
      html += '<div class="m-row">' + field(T('field.city'), 'city', c.city) + field(T('field.country'), 'country', c.country) + '</div>';
      html += '<div class="m-row">' +
        select(T('field.format'), 'format', c.format, [['offline', T('format.offline')], ['online', T('format.online')], ['hybrid', T('format.hybrid')]]) +
        field(T('field.language'), 'language', c.language) + '</div>';
      html += field(T('field.site'), 'links.site', c.links.site, 'url');
      html += '<div class="m-row">' + field(T('field.reg'), 'links.reg', c.links.reg, 'url') + field(T('field.rec'), 'links.rec', c.links.rec, 'url') + '</div>';
      html += field(T('field.program'), 'program', c.program, 'textarea');
      html += select(T('field.attendance'), 'attendance', c.attendance, [
        ['not_visited', T('attendance.not_visited')], ['visited', T('attendance.visited')], ['online', T('attendance.online')]
      ]);
    }

    html += field(T('field.descRu'), 'descRu', c.descRu, 'textarea');
    html += field(T('field.tags'), 'tags', (c.tags || []).join(', '));
    html += field(T('field.notes'), 'notes', c.notes, 'textarea');
    return html;
  }

  function getVal(name) {
    var f = form.querySelector('[name="' + name + '"]');
    return f ? f.value : '';
  }

  function collect() {
    var obj = {
      id: currentId || undefined,
      type: getVal('type'),
      title: getVal('title'),
      dateStart: getVal('dateStart'),
      dateEnd: getVal('dateEnd'),
      city: getVal('city'),
      country: getVal('country'),
      format: getVal('format') || 'offline',
      language: getVal('language'),
      links: { site: getVal('links.site'), reg: getVal('links.reg'), stream: getVal('links.stream'), rec: getVal('links.rec') },
      program: getVal('program'),
      notes: getVal('notes'),
      descRu: getVal('descRu'),
      attendance: getVal('attendance') || 'not_visited',
      authors: getVal('authors'),
      journal: getVal('journal'),
      year: getVal('year'),
      doi: getVal('doi'),
      abstract: getVal('abstract'),
      nct: getVal('nct'),
      phase: getVal('phase'),
      sponsor: getVal('sponsor'),
      studyStatus: getVal('studyStatus'),
      dateCompletion: getVal('dateCompletion'),
      tags: getVal('tags').split(',').map(function (t) { return t.trim(); }).filter(Boolean)
    };
    return obj;
  }

  function ensureRoot() {
    root = document.getElementById('modal');
  }

  function wireTypeChange() {
    var typeSel = form.querySelector('[name="type"]');
    if (!typeSel) return;
    typeSel.addEventListener('change', function () {
      var snapshot = collect();
      form.innerHTML = build(window.Store.normalize(snapshot));
      wireTypeChange();
    });
  }

  function open(id) {
    ensureRoot();
    currentId = id || null;
    var item = id ? window.Store.get(id) : null;
    document.getElementById('modal-title').textContent = item ? T('modal.editTitle') : T('modal.addTitle');
    form = document.getElementById('modal-form');
    form.innerHTML = build(item);
    wireTypeChange();
    root.removeAttribute('hidden');
  }

  function close() { ensureRoot(); root.setAttribute('hidden', 'hidden'); currentId = null; }

  function save() {
    var obj = collect();
    if (!obj.title) { return; }
    window.Store.save(obj);
    window.Toast && window.Toast(T('toast.saved'));
    close();
  }

  function del() {
    if (currentId) { window.Store.remove(currentId); window.Toast && window.Toast(T('toast.deleted')); }
    close();
  }

  window.Modal = { open: open, close: close, save: save, del: del };
})();
