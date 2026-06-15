/* app.js — controller: tabs, theme, language, search, filters, boot(). */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var state = { tab: 'future', query: '', pastFormat: '', pastTag: '', pastAtt: '', sort: 'date' };

  /* ---------- toast ---------- */
  function toast(msg) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    host.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 3000);
  }
  window.Toast = toast;

  /* ---------- search ---------- */
  function matches(c) {
    if (!state.query) return true;
    var q = state.query.toLowerCase();
    var hay = [c.title, c.city, c.country, c.authors, c.journal, c.sponsor, (c.tags || []).join(' ')].join(' ').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  /* ---------- sorting ---------- */
  function sortItems(arr) {
    var a = arr.slice();
    if (state.sort === 'rating') a.sort(function (x, y) { return (y.rating || 0) - (x.rating || 0); });
    else if (state.sort === 'title') a.sort(function (x, y) { return (x.title || '').localeCompare(y.title || ''); });
    else a.sort(function (x, y) { return (x.dateStart || '').localeCompare(y.dateStart || ''); });
    return a;
  }

  /* ---------- past filters ---------- */
  function filteredPast() {
    return window.Store.past().filter(function (c) {
      if (!matches(c)) return false;
      if (state.pastFormat && c.format !== state.pastFormat) return false;
      if (state.pastAtt && c.attendance !== state.pastAtt) return false;
      if (state.pastTag && (c.tags || []).indexOf(state.pastTag) === -1) return false;
      return true;
    });
  }

  function buildFilters() {
    var fmtSel = document.getElementById('pastFormat');
    var tagSel = document.getElementById('pastTag');
    var attSel = document.getElementById('pastAtt');
    if (!fmtSel) return;
    fmtSel.innerHTML = '<option value="">' + T('filter.allFormats') + '</option>' +
      ['offline', 'online', 'hybrid'].map(function (f) { return '<option value="' + f + '">' + T('format.' + f) + '</option>'; }).join('');
    fmtSel.value = state.pastFormat;

    attSel.innerHTML = '<option value="">' + T('attendance.all') + '</option>' +
      ['not_visited', 'visited', 'online'].map(function (a) { return '<option value="' + a + '">' + T('attendance.' + a) + '</option>'; }).join('');
    attSel.value = state.pastAtt;

    var tags = {};
    window.Store.past().forEach(function (c) { (c.tags || []).forEach(function (t) { tags[t] = 1; }); });
    tagSel.innerHTML = '<option value="">' + T('filter.allTags') + '</option>' +
      Object.keys(tags).sort().map(function (t) { return '<option value="' + t + '">' + t + '</option>'; }).join('');
    tagSel.value = state.pastTag;
  }

  /* ---------- render tabs ---------- */
  function renderInto(id, nodes) {
    var host = document.getElementById(id);
    host.innerHTML = '';
    nodes.forEach(function (n) { if (n) host.appendChild(n); });
  }

  function refreshAll() {
    var R = window.Render;

    // future
    var fut = sortItems(window.Store.future().filter(matches));
    renderInto('tab-future', fut.length ? [R.grid(fut.map(R.card))] : [R.empty(T('empty.future'))]);

    // now: live conferences + active studies
    var liveConf = sortItems(window.Store.now().filter(matches));
    var liveStudies = window.Store.activeStudies().filter(matches);
    var nowNodes = [];
    if (liveConf.length) nowNodes.push(R.grid(liveConf.map(R.card)));
    if (liveStudies.length) {
      nowNodes.push(R.subhead(T('now.studies')));
      nowNodes.push(R.grid(liveStudies.map(R.studyCard)));
    }
    if (!nowNodes.length) nowNodes.push(R.empty(T('empty.now')));
    renderInto('tab-now', nowNodes);

    // past (table)
    buildFilters();
    var past = sortItems(filteredPast());
    renderInto('tab-past', past.length ? [R.table(past)] : [R.empty(T('empty.past'))]);

    // papers
    var papers = sortItems(window.Store.papers().filter(matches));
    renderInto('tab-papers', papers.length ? [R.grid(papers.map(R.paperCard))] : [R.empty(T('empty.papers'))]);

    // calendar
    if (state.tab === 'calendar') window.Calendar.render(document.getElementById('tab-calendar'));
  }

  /* ---------- tabs ---------- */
  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.getAttribute('data-tab') === tab); });
    document.querySelectorAll('.tab-panel').forEach(function (p) {
      if (p.id === 'tab-' + tab) p.removeAttribute('hidden'); else p.setAttribute('hidden', 'hidden');
    });
    document.getElementById('pastFilters').toggleAttribute('hidden', tab !== 'past');
    if (tab === 'calendar') window.Calendar.render(document.getElementById('tab-calendar'));
  }

  /* ---------- theme ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('ct_theme', t);
  }
  function cycleTheme() {
    var order = ['auto', 'light', 'dark'];
    var cur = localStorage.getItem('ct_theme') || 'auto';
    applyTheme(order[(order.indexOf(cur) + 1) % 3]);
  }

  /* ---------- i18n labels ---------- */
  function applyLabels() {
    document.querySelectorAll('[data-i18n]').forEach(function (n) { n.textContent = T(n.getAttribute('data-i18n')); });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (n) { n.setAttribute('placeholder', T(n.getAttribute('data-i18n-ph'))); });
    var lb = document.getElementById('langBtn'); if (lb) lb.textContent = T('btn.lang');
    document.title = T('app.title');
  }

  /* ---------- sync panel ---------- */
  function openSync() {
    var p = document.getElementById('syncPanel');
    var c = window.Sync.cfg();
    p.querySelector('[name="token"]').value = c.token;
    p.querySelector('[name="gistId"]').value = c.gistId;
    p.querySelector('[name="owner"]').value = c.owner;
    p.querySelector('[name="repo"]').value = c.repo;
    p.querySelector('[name="auto"]').checked = c.auto;
    p.removeAttribute('hidden');
  }
  function saveSync() {
    var p = document.getElementById('syncPanel');
    window.Sync.setCfg({
      token: p.querySelector('[name="token"]').value.trim(),
      gistId: p.querySelector('[name="gistId"]').value.trim(),
      owner: p.querySelector('[name="owner"]').value.trim(),
      repo: p.querySelector('[name="repo"]').value.trim(),
      auto: p.querySelector('[name="auto"]').checked
    });
  }

  /* ---------- boot ---------- */
  function boot() {
    applyTheme(localStorage.getItem('ct_theme') || 'auto');
    applyLabels();

    // merge import data (add/upsert)
    if (window.Importer) {
      var res = window.Importer.apply();
      if (res && (res.added || res.updated)) toast(T('toast.imported'));
    }

    // wire tabs
    document.querySelectorAll('.tab-btn').forEach(function (b) {
      b.addEventListener('click', function () { setTab(b.getAttribute('data-tab')); refreshAll(); });
    });

    // header buttons
    document.getElementById('addBtn').addEventListener('click', function () { window.Modal.open(); });
    document.getElementById('themeBtn').addEventListener('click', cycleTheme);
    document.getElementById('langBtn').addEventListener('click', function () { window.I18N.toggle(); });
    document.getElementById('syncBtn').addEventListener('click', openSync);
    document.getElementById('updateBtn').addEventListener('click', function () { window.Updater.trigger(); });

    // search
    var search = document.getElementById('search');
    search.addEventListener('input', function () { state.query = search.value; refreshAll(); });

    // past filters
    document.getElementById('pastFormat').addEventListener('change', function (e) { state.pastFormat = e.target.value; refreshAll(); });
    document.getElementById('pastTag').addEventListener('change', function (e) { state.pastTag = e.target.value; refreshAll(); });
    document.getElementById('pastAtt').addEventListener('change', function (e) { state.pastAtt = e.target.value; refreshAll(); });
    document.getElementById('pastSort').addEventListener('change', function (e) { state.sort = e.target.value; refreshAll(); });

    // modal buttons
    document.getElementById('modalSave').addEventListener('click', function () { window.Modal.save(); });
    document.getElementById('modalCancel').addEventListener('click', function () { window.Modal.close(); });
    document.getElementById('modalDelete').addEventListener('click', function () { window.Modal.del(); });

    // sync panel
    document.getElementById('syncClose').addEventListener('click', function () { saveSync(); document.getElementById('syncPanel').setAttribute('hidden', 'hidden'); });
    document.getElementById('syncPush').addEventListener('click', function () { saveSync(); window.Sync.push().then(function () { toast(T('toast.syncPush')); }).catch(function () { toast(T('toast.syncErr')); }); });
    document.getElementById('syncPull').addEventListener('click', function () { saveSync(); window.Sync.pull().then(function () { toast(T('toast.syncPull')); refreshAll(); }).catch(function () { toast(T('toast.syncErr')); }); });

    // re-render on store changes
    window.Store.subscribe(refreshAll);
    // re-render on language change
    window.addEventListener('i18n:change', function () { applyLabels(); buildFilters(); refreshAll(); });

    setTab('future');
    refreshAll();

    // recompute phases once a minute
    setInterval(refreshAll, 60000);
  }

  window.App = { openSync: openSync, refresh: refreshAll };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
