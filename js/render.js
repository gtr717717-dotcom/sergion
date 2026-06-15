/* render.js — utilities (window.U) + card/table renderers (window.Render). */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'class') n.className = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'text') n.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on' && typeof attrs[k] === 'function') n.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null && attrs[k] !== false) n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return s;
    var lang = window.I18N.getLang();
    try { return d.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (e) { return s; }
  }
  function fmtRange(a, b) {
    if (!a) return '';
    if (!b || b === a) return fmtDate(a);
    return fmtDate(a) + ' – ' + fmtDate(b);
  }

  function stopAll(e) { e.stopPropagation(); }

  window.U = { t: T, esc: esc, el: el, fmtDate: fmtDate, fmtRange: fmtRange };

  /* ---------- inline controls (shared) ---------- */

  function ratingStars(c) {
    var wrap = el('div', { class: 'stars', title: T('field.rating') });
    function paint() {
      Array.prototype.forEach.call(wrap.children, function (s, i) {
        s.classList.toggle('on', i < c.rating);
      });
    }
    for (var i = 1; i <= 5; i++) {
      (function (val) {
        var star = el('span', { class: 'star', text: '★' });
        star.addEventListener('click', function (e) {
          e.stopPropagation();
          c.rating = (c.rating === val) ? 0 : val;
          window.Store.save({ id: c.id, rating: c.rating });
          paint();
        });
        wrap.appendChild(star);
      })(i);
    }
    paint();
    return wrap;
  }

  function notesEditor(c) {
    var ta = el('textarea', { class: 'notes-edit', placeholder: T('field.notes'), rows: 3 });
    ta.value = c.notes || '';
    ta.addEventListener('click', stopAll);
    ta.addEventListener('blur', function () {
      if (ta.value !== c.notes) {
        c.notes = ta.value;
        window.Store.save({ id: c.id, notes: ta.value });
        window.Toast && window.Toast(T('toast.saved'));
      }
    });
    return el('div', { class: 'field-block' }, [el('label', { text: T('field.notes') }), ta]);
  }

  function attendanceToggle(c) {
    var opts = ['not_visited', 'visited', 'online'];
    var wrap = el('div', { class: 'seg attendance', title: T('field.attendance') });
    opts.forEach(function (v) {
      var b = el('button', { type: 'button', class: 'seg-btn att-' + v, 'data-v': v, text: T('attendance.' + v) });
      if (c.attendance === v) b.classList.add('active');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        c.attendance = v;
        window.Store.save({ id: c.id, attendance: v });
        Array.prototype.forEach.call(wrap.children, function (x) { x.classList.toggle('active', x.getAttribute('data-v') === v); });
      });
      wrap.appendChild(b);
    });
    return wrap;
  }

  function myCalendarToggle(c) {
    var b = el('button', { type: 'button', class: 'btn-mini mycal' });
    function paint() {
      b.textContent = c.inMyCalendar ? T('action.inMyCalendar') : T('action.addMyCalendar');
      b.classList.toggle('active', !!c.inMyCalendar);
    }
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      c.inMyCalendar = !c.inMyCalendar;
      window.Store.save({ id: c.id, inMyCalendar: c.inMyCalendar });
      paint();
    });
    paint();
    return b;
  }

  function calendarActions(c) {
    var ics = el('button', { type: 'button', class: 'btn-mini', text: T('action.ics') });
    ics.addEventListener('click', function (e) { e.stopPropagation(); window.CalExport && window.CalExport.download(c); });
    var g = el('a', { class: 'btn-mini', target: '_blank', rel: 'noopener', text: T('action.google'),
      href: window.CalExport ? window.CalExport.googleUrl(c) : '#' });
    g.addEventListener('click', stopAll);
    return el('div', { class: 'cal-actions' }, [
      el('span', { class: 'cal-actions-label', text: T('action.calendar') + ':' }),
      ics, g, myCalendarToggle(c)
    ]);
  }

  function briefButton(c, host) {
    if (!c.descRu) return null;
    var box = el('div', { class: 'brief-box', hidden: 'hidden', text: c.descRu });
    var b = el('button', { type: 'button', class: 'btn-mini brief-btn', text: 'ℹ ' + T('action.brief') });
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      if (box.hasAttribute('hidden')) box.removeAttribute('hidden'); else box.setAttribute('hidden', 'hidden');
    });
    host._briefBox = box;
    return b;
  }

  function linkRow(c) {
    var L = c.links || {};
    var defs = [['site', 'field.site'], ['reg', 'field.reg'], ['stream', 'field.stream'], ['rec', 'field.rec']];
    var kids = [];
    defs.forEach(function (d) {
      if (L[d[0]]) {
        var a = el('a', { class: 'lnk', href: L[d[0]], target: '_blank', rel: 'noopener', text: T(d[1]) });
        a.addEventListener('click', stopAll);
        kids.push(a);
      }
    });
    return kids.length ? el('div', { class: 'links' }, kids) : null;
  }

  function actionButtons(c) {
    var edit = el('button', { type: 'button', class: 'btn-mini', text: T('action.edit') });
    edit.addEventListener('click', function (e) { e.stopPropagation(); window.Modal && window.Modal.open(c.id); });
    var del = el('button', { type: 'button', class: 'btn-mini danger', text: T('btn.delete') });
    del.addEventListener('click', function (e) {
      e.stopPropagation();
      window.Store.remove(c.id);
      window.Toast && window.Toast(T('toast.deleted'));
    });
    return el('div', { class: 'card-actions' }, [edit, del]);
  }

  /* ---------- expand body ---------- */

  function expandBody(c) {
    var body = el('div', { class: 'card-body' });
    var bb = briefButton(c, body);
    var topRow = el('div', { class: 'mini-row' }, [bb].filter(Boolean));
    if (bb) { body.appendChild(topRow); body.appendChild(body._briefBox); }

    if (c.type === 'conference' || c.type === 'study') {
      if (c.type === 'conference') body.appendChild(attendanceToggle(c));
      body.appendChild(calendarActions(c));
    }
    if (c.program) body.appendChild(el('div', { class: 'field-block' }, [el('label', { text: T('field.program') }), el('div', { class: 'ro', text: c.program })]));
    if (c.abstract) body.appendChild(el('div', { class: 'field-block' }, [el('label', { text: T('field.abstract') }), el('div', { class: 'ro', text: c.abstract })]));

    body.appendChild(el('div', { class: 'field-block' }, [el('label', { text: T('field.rating') }), ratingStars(c)]));
    body.appendChild(notesEditor(c));

    var lr = linkRow(c);
    if (lr) body.appendChild(lr);
    body.appendChild(actionButtons(c));
    return body;
  }

  function makeCard(c, opts) {
    opts = opts || {};
    var card = el('div', { class: 'card', 'data-format': opts.format || c.format || 'offline', 'data-id': c.id });
    var header = el('div', { class: 'card-head' });
    var badge = el('span', { class: 'badge badge-' + c.type, text: T('badge.' + c.type) });
    var ph = window.Store.phase(c);
    var meta = el('div', { class: 'card-meta' }, opts.metaLines.map(function (line) {
      return el('div', { class: 'meta-line', text: line });
    }));
    var titleEl = el('h3', { class: 'card-title', text: c.title });
    var top = el('div', { class: 'card-top' }, [badge, el('span', { class: 'phase phase-' + ph, text: T('phase.' + ph) })]);
    header.appendChild(top);
    header.appendChild(titleEl);
    header.appendChild(meta);
    // quick attendance preview on conference header (collapsed)
    header.addEventListener('click', function () { card.classList.toggle('open'); });
    card.appendChild(header);
    card.appendChild(expandBody(c));
    return card;
  }

  function card(c) {
    var lines = [];
    if (c.dateStart) lines.push(fmtRange(c.dateStart, c.dateEnd));
    var loc = [c.city, c.country].filter(Boolean).join(', ');
    if (loc) lines.push(loc);
    lines.push(T('format.' + c.format) + (c.language ? ' · ' + c.language : ''));
    return makeCard(c, { metaLines: lines });
  }

  function paperCard(c) {
    var lines = [];
    if (c.authors) lines.push(c.authors);
    var jl = [c.journal, c.year].filter(Boolean).join(' · ');
    if (jl) lines.push(jl);
    if (c.doi) lines.push('DOI: ' + c.doi);
    return makeCard(c, { metaLines: lines, format: 'paper' });
  }

  function studyCard(c) {
    var lines = [];
    if (c.sponsor) lines.push(T('field.sponsor') + ': ' + c.sponsor);
    var pf = [c.phase, c.studyStatus ? T('field.studyStatus') + ': ' + c.studyStatus : ''].filter(Boolean).join(' · ');
    if (pf) lines.push(pf);
    var dr = fmtRange(c.dateStart, c.dateCompletion);
    if (dr) lines.push(dr);
    if (c.nct) lines.push(c.nct);
    return makeCard(c, { metaLines: lines, format: 'study' });
  }

  function grid(cards) {
    return el('div', { class: 'grid' }, cards);
  }

  /* ---------- table (past) ---------- */

  function table(rows) {
    var thead = el('thead', {}, [el('tr', {}, [
      el('th', { text: T('field.title') }),
      el('th', { text: T('field.dateStart') }),
      el('th', { text: T('field.city') }),
      el('th', { text: T('field.format') }),
      el('th', { text: T('field.rating') }),
      el('th', { text: T('field.attendance') })
    ])]);
    var body = el('tbody', {}, rows.map(function (c) {
      var att = el('span', { class: 'pill att-' + c.attendance, text: T('attendance.' + c.attendance) });
      var tr = el('tr', { 'data-id': c.id }, [
        el('td', { text: c.title }),
        el('td', { text: fmtRange(c.dateStart, c.dateEnd) }),
        el('td', { text: [c.city, c.country].filter(Boolean).join(', ') }),
        el('td', { text: T('format.' + c.format) }),
        el('td', { text: c.rating ? '★'.repeat(c.rating) : '—' }),
        el('td', {}, [att])
      ]);
      tr.addEventListener('click', function () { window.Modal && window.Modal.open(c.id); });
      return tr;
    }));
    return el('table', { class: 'tbl' }, [thead, body]);
  }

  function banner(text) {
    return el('div', { class: 'banner', text: text });
  }
  function empty(text) {
    return el('div', { class: 'empty', text: text });
  }
  function subhead(text) {
    return el('h2', { class: 'subhead', text: text });
  }

  window.Render = {
    card: card, paperCard: paperCard, studyCard: studyCard,
    grid: grid, table: table, banner: banner, empty: empty, subhead: subhead
  };
})();
