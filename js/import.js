/* import.js — merge window.CT_IMPORT into the Store on load.
   Block 1: run all records through Store.importItems (add or upsert),
   skipping only importIds the user has manually deleted (ct_deleted_ids). */
(function () {
  'use strict';

  function collect(imp) {
    if (!imp) return [];
    var out = [];
    (imp.conferences || []).forEach(function (c) { out.push(Object.assign({ type: 'conference' }, c)); });
    (imp.studies || []).forEach(function (s) { out.push(Object.assign({ type: 'study' }, s)); });
    (imp.papers || []).forEach(function (p) { out.push(Object.assign({ type: 'paper' }, p)); });
    return out;
  }

  function apply() {
    if (!window.CT_IMPORT || !window.Store) return { added: 0, updated: 0 };
    var deleted = Store.deletedSet();
    var records = collect(window.CT_IMPORT).filter(function (r) {
      return r.importId && !deleted.has(r.importId);
    });
    var res = Store.importItems(records);

    // keep ct_imported_ids in sync for backward compatibility
    try {
      var known = JSON.parse(localStorage.getItem('ct_imported_ids') || '[]');
      var set = new Set(known);
      records.forEach(function (r) { set.add(r.importId); });
      localStorage.setItem('ct_imported_ids', JSON.stringify(Array.from(set)));
    } catch (e) {}

    return res;
  }

  window.Importer = { apply: apply, collect: collect };
})();
