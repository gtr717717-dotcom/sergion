/* ics.js — calendar export. Exposes window.CalExport { icsForConf, download, googleUrl }. */
(function () {
  'use strict';

  function escText(s) {
    // RFC 5545 escaping for TEXT values
    return String(s == null ? '' : s)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }

  function ymd(s) {
    if (!s) return null;
    var d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return null;
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return '' + d.getFullYear() + m + day;
  }
  function nextDay(s) {
    var d = new Date(s + (s.length === 10 ? 'T00:00:00' : ''));
    if (isNaN(d.getTime())) return ymd(s);
    d.setDate(d.getDate() + 1);
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return '' + d.getFullYear() + m + day;
  }
  function stamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, '0'); }
    return '' + d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + 'T' +
      p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + 'Z';
  }

  function loc(c) { return [c.city, c.country].filter(Boolean).join(', '); }
  function desc(c) {
    var parts = [];
    if (c.descRu) parts.push(c.descRu);
    if (c.links && c.links.site) parts.push(c.links.site);
    return parts.join('\n');
  }

  function fold(line) {
    // fold lines longer than 75 octets (approximate by chars)
    if (line.length <= 75) return line;
    var out = line.slice(0, 75);
    var rest = line.slice(75);
    while (rest.length > 74) { out += '\r\n ' + rest.slice(0, 74); rest = rest.slice(74); }
    out += '\r\n ' + rest;
    return out;
  }

  function icsForConf(c) {
    var start = ymd(c.dateStart);
    var endSrc = c.dateEnd || c.dateCompletion || c.dateStart;
    var end = nextDay(endSrc); // DTEND is exclusive for all-day events
    var uid = (c.importId || c.id) + '@conference-tracker';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//conference-tracker//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + stamp(),
      'SUMMARY:' + escText(c.title)
    ];
    if (start) lines.push('DTSTART;VALUE=DATE:' + start);
    if (end) lines.push('DTEND;VALUE=DATE:' + end);
    if (loc(c)) lines.push('LOCATION:' + escText(loc(c)));
    if (desc(c)) lines.push('DESCRIPTION:' + escText(desc(c)));
    if (c.links && c.links.site) lines.push('URL:' + escText(c.links.site));
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return lines.map(fold).join('\r\n');
  }

  function download(c) {
    var blob = new Blob([icsForConf(c)], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var name = (c.title || 'event').replace(/[^\w\-а-яё ]+/gi, '').slice(0, 60).trim() || 'event';
    var a = document.createElement('a');
    a.href = url; a.download = name + '.ics';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function googleUrl(c) {
    var start = ymd(c.dateStart);
    var end = nextDay(c.dateEnd || c.dateCompletion || c.dateStart);
    var params = [
      'action=TEMPLATE',
      'text=' + encodeURIComponent(c.title || '')
    ];
    if (start && end) params.push('dates=' + start + '/' + end);
    if (loc(c)) params.push('location=' + encodeURIComponent(loc(c)));
    if (desc(c)) params.push('details=' + encodeURIComponent(desc(c)));
    return 'https://calendar.google.com/calendar/render?' + params.join('&');
  }

  window.CalExport = { icsForConf: icsForConf, download: download, googleUrl: googleUrl };
})();
