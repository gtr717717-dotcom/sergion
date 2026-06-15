/* calendar.js — monthly calendar of conferences. Exposes window.Calendar. */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var view = new Date();
  view.setDate(1);
  var onlyMine = false;

  function parse(s) {
    if (!s) return null;
    var d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    return isNaN(d.getTime()) ? null : d;
  }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

  function eventsForDay(day) {
    return window.Store.conferences().filter(function (c) {
      if (onlyMine && !c.inMyCalendar) return false;
      var s = parse(c.dateStart), e = parse(c.dateEnd) || s;
      if (!s) return false;
      var d0 = new Date(day); d0.setHours(0, 0, 0, 0);
      var s0 = new Date(s); s0.setHours(0, 0, 0, 0);
      var e0 = new Date(e); e0.setHours(0, 0, 0, 0);
      return d0 >= s0 && d0 <= e0;
    });
  }

  function render(host) {
    host.innerHTML = '';
    var U = window.U, el = U.el;
    var months = window.I18N.months();
    var head = el('div', { class: 'cal-head' }, [
      el('button', { type: 'button', class: 'btn-mini', text: T('cal.prev'), onclick: function () { view.setMonth(view.getMonth() - 1); render(host); } }),
      el('div', { class: 'cal-title', text: months[view.getMonth()] + ' ' + view.getFullYear() }),
      el('button', { type: 'button', class: 'btn-mini', text: T('cal.next'), onclick: function () { view.setMonth(view.getMonth() + 1); render(host); } }),
      el('button', { type: 'button', class: 'btn-mini', text: T('cal.today'), onclick: function () { view = new Date(); view.setDate(1); render(host); } }),
      el('label', { class: 'cal-mine' }, [
        (function () {
          var cb = el('input', { type: 'checkbox' });
          if (onlyMine) cb.checked = true;
          cb.addEventListener('change', function () { onlyMine = cb.checked; render(host); });
          return cb;
        })(),
        el('span', { text: T('cal.onlyMine') })
      ])
    ]);
    host.appendChild(head);

    var wd = el('div', { class: 'cal-weekdays' }, window.I18N.weekdays().map(function (w) { return el('div', { text: w }); }));
    host.appendChild(wd);

    var grid = el('div', { class: 'cal-grid' });
    var first = new Date(view);
    var startDow = (first.getDay() + 6) % 7; // Monday = 0
    var daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    var today = new Date();

    for (var i = 0; i < startDow; i++) grid.appendChild(el('div', { class: 'cal-cell empty' }));
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(view.getFullYear(), view.getMonth(), d);
      var evs = eventsForDay(date);
      var cell = el('div', { class: 'cal-cell' + (sameDay(date, today) ? ' today' : '') });
      cell.appendChild(el('div', { class: 'cal-day', text: String(d) }));
      evs.forEach(function (c) {
        var ev = el('div', { class: 'cal-ev fmt-' + c.format + (c.inMyCalendar ? ' mine' : ''), title: c.title, text: c.title });
        ev.addEventListener('click', function () { window.Modal && window.Modal.open(c.id); });
        cell.appendChild(ev);
      });
      grid.appendChild(cell);
    }
    host.appendChild(grid);
  }

  window.Calendar = { render: render };
})();
