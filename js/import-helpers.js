/* import-helpers.js — builders for import-data.js records.
   Exposes window.CT { conf, paper, study }. */
(function () {
  'use strict';

  function slug(s) {
    return String(s || '').toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  // conf(title, start, end, city, country, format, language, site, descRu, tags, extra)
  function conf(title, start, end, city, country, format, language, site, descRu, tags, extra) {
    extra = extra || {};
    var id = extra.importId || ('conf:' + slug(title + '-' + (start || '')));
    return Object.assign({
      type: 'conference',
      importId: id,
      title: title || '',
      dateStart: start || '',
      dateEnd: end || start || '',
      city: city || '',
      country: country || '',
      format: format || 'offline',
      language: language || '',
      links: { site: site || '', reg: (extra.reg || ''), stream: (extra.stream || ''), rec: (extra.rec || '') },
      descRu: descRu || '',
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(function (t) { return t.trim(); }) : [])
    }, extra.fields || {});
  }

  // paper(pmid, title, authors, journal, year, doi, abstract, descRu, tags)
  function paper(pmid, title, authors, journal, year, doi, abstract, descRu, tags) {
    return {
      type: 'paper',
      importId: 'pubmed:' + pmid,
      title: title || '',
      authors: authors || '',
      journal: journal || '',
      year: year || '',
      doi: doi || '',
      abstract: abstract || '',
      descRu: descRu || '',
      links: { site: doi ? ('https://doi.org/' + doi) : ('https://pubmed.ncbi.nlm.nih.gov/' + pmid + '/'), reg: '', stream: '', rec: '' },
      tags: Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(function (t) { return t.trim(); }) : [])
    };
  }

  // study(nct, title, status, start, completion, sponsor, phase, condition, link, descRu, tags)
  function study(nct, title, status, start, completion, sponsor, phase, condition, link, descRu, tags) {
    var t = Array.isArray(tags) ? tags.slice() : (tags ? String(tags).split(',').map(function (x) { return x.trim(); }) : []);
    if (condition) {
      (Array.isArray(condition) ? condition : [condition]).forEach(function (c) {
        if (c && t.indexOf(c) === -1) t.push(c);
      });
    }
    return {
      type: 'study',
      importId: 'nct:' + nct,
      nct: nct,
      title: title || '',
      studyStatus: (status || '').toLowerCase(),
      dateStart: start || '',
      dateCompletion: completion || '',
      sponsor: sponsor || '',
      phase: phase || '',
      descRu: descRu || '',
      links: { site: link || ('https://clinicaltrials.gov/study/' + nct), reg: '', stream: '', rec: '' },
      tags: t
    };
  }

  window.CT = { conf: conf, paper: paper, study: study, slug: slug };
})();
