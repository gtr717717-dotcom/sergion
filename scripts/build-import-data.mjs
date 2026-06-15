#!/usr/bin/env node
/* build-import-data.mjs — collect papers (PubMed), studies (ClinicalTrials.gov)
   and conferences (curated seed), then regenerate js/import-data.js.
   Node 20+ (native fetch). ESM. Runs in CI; not loaded by the browser. */

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

/* ---- Topic (narrow): microvascular decompression / neurovascular conflict ---- */
const TOPIC = {
  // PubMed query
  pubmed: '("microvascular decompression"[Title/Abstract] OR "trigeminal neuralgia"[Title/Abstract] OR "hemifacial spasm"[Title/Abstract] OR "glossopharyngeal neuralgia"[Title/Abstract] OR "neurovascular conflict"[Title/Abstract])',
  // ClinicalTrials.gov term
  ctgov: 'microvascular decompression OR trigeminal neuralgia OR hemifacial spasm OR glossopharyngeal neuralgia',
  years: 3
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- JS string escaping for the generated file ---------- */
function jsStr(s) {
  return "'" + String(s == null ? '' : s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() + "'";
}
function jsArr(arr) {
  return '[' + (arr || []).map(jsStr).join(', ') + ']';
}

/* ---------- PubMed (E-utilities) ---------- */
async function fetchPapers() {
  const base = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
  const minYear = new Date().getFullYear() - TOPIC.years;
  const term = encodeURIComponent(`${TOPIC.pubmed} AND ("${minYear}"[PDAT] : "3000"[PDAT])`);
  const esearchUrl = `${base}/esearch.fcgi?db=pubmed&retmax=1000&retmode=json&term=${term}`;
  let ids = [];
  try {
    const r = await fetch(esearchUrl);
    const j = await r.json();
    ids = (j.esearchresult && j.esearchresult.idlist) || [];
  } catch (e) {
    console.error('PubMed esearch failed:', e.message);
    return [];
  }
  if (!ids.length) return [];
  console.log(`PubMed: ${ids.length} PMIDs`);

  const papers = [];
  // esummary in batches of 200 for structured metadata
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const url = `${base}/esummary.fcgi?db=pubmed&retmode=json&id=${batch.join(',')}`;
    try {
      const r = await fetch(url);
      const j = await r.json();
      const res = j.result || {};
      (res.uids || []).forEach((pmid) => {
        const d = res[pmid];
        if (!d) return;
        const authors = (d.authors || []).map((a) => a.name).slice(0, 6).join(', ');
        let doi = '';
        (d.articleids || []).forEach((a) => { if (a.idtype === 'doi') doi = a.value; });
        const year = (d.pubdate || '').slice(0, 4);
        papers.push({
          pmid,
          title: d.title || '',
          authors,
          journal: d.fulljournalname || d.source || '',
          year,
          doi,
          abstract: '',
          tags: ['MVD']
        });
      });
    } catch (e) {
      console.error('esummary batch failed:', e.message);
    }
    await sleep(350); // respect NCBI rate limit (~3/s)
  }
  return papers;
}

/* ---------- ClinicalTrials.gov API v2 ---------- */
async function fetchStudies() {
  const out = [];
  let pageToken = '';
  const fields = 'NCTId,BriefTitle,OverallStatus,StartDate,PrimaryCompletionDate,CompletionDate,LeadSponsorName,Phase,Condition';
  for (let page = 0; page < 10; page++) {
    const params = new URLSearchParams({
      'query.term': TOPIC.ctgov,
      'filter.overallStatus': 'RECRUITING,ACTIVE_NOT_RECRUITING',
      pageSize: '200',
      fields
    });
    if (pageToken) params.set('pageToken', pageToken);
    let j;
    try {
      const r = await fetch('https://clinicaltrials.gov/api/v2/studies?' + params.toString());
      j = await r.json();
    } catch (e) {
      console.error('ClinicalTrials fetch failed:', e.message);
      break;
    }
    (j.studies || []).forEach((s) => {
      const p = s.protocolSection || {};
      const id = p.identificationModule || {};
      const st = p.statusModule || {};
      const sp = p.sponsorCollaboratorsModule || {};
      const dz = p.designModule || {};
      const cz = p.conditionsModule || {};
      const nct = id.nctId;
      if (!nct) return;
      const status = (st.overallStatus || '').toLowerCase().includes('recruit') ? 'recruiting' : 'active';
      out.push({
        nct,
        title: id.briefTitle || '',
        status,
        start: (st.startDateStruct && st.startDateStruct.date) || '',
        completion: (st.completionDateStruct && st.completionDateStruct.date) ||
                    (st.primaryCompletionDateStruct && st.primaryCompletionDateStruct.date) || '',
        sponsor: (sp.leadSponsor && sp.leadSponsor.name) || '',
        phase: (dz.phases || []).join('/'),
        conditions: (cz.conditions || []).slice(0, 3),
        link: `https://clinicaltrials.gov/study/${nct}`
      });
    });
    pageToken = j.nextPageToken || '';
    if (!pageToken) break;
    await sleep(200);
  }
  console.log(`ClinicalTrials: ${out.length} studies`);
  return out;
}

/* ---------- Conferences (curated seed) ---------- */
async function fetchConferences() {
  let seed = [];
  try {
    seed = JSON.parse(await readFile(join(__dirname, 'conferences.seed.json'), 'utf8'));
  } catch (e) {
    console.error('conferences.seed.json missing:', e.message);
    return [];
  }
  const now = new Date();
  const out = seed.map((c) => {
    let year = now.getFullYear();
    let start = new Date(year, (c.month || 1) - 1, c.day || 1);
    if (start < now) { year += 1; start = new Date(year, (c.month || 1) - 1, c.day || 1); }
    const end = new Date(start); end.setDate(end.getDate() + (Math.max(1, c.days || 1) - 1));
    const fmt = (d) => d.toISOString().slice(0, 10);
    return {
      importId: 'conf:' + c.slug,
      title: c.title,
      start: fmt(start),
      end: fmt(end),
      city: c.city || '',
      country: c.country || '',
      format: c.format || 'offline',
      language: c.language || 'en',
      site: c.site || '',
      descRu: c.descRu || '',
      tags: c.tags || []
    };
  });
  console.log(`Conferences: ${out.length}`);
  return out;
}

/* ---------- Optional RU descriptions via Anthropic ---------- */
async function addRuDescriptions(records) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.log('No ANTHROPIC_API_KEY — skipping RU descriptions.'); return; }
  const targets = records.filter((r) => !r.descRu && r.title);
  for (let i = 0; i < targets.length; i += 20) {
    const batch = targets.slice(i, i + 20);
    const list = batch.map((r, idx) => `${idx + 1}. ${r.title}`).join('\n');
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5',
          max_tokens: 1500,
          messages: [{
            role: 'user',
            content: 'Дай по-русски 1–2 предложения краткого описания для каждого пункта (нейрохирургия, ' +
              'микроваскулярная декомпрессия). Ответь строго JSON-массивом строк в том же порядке, без пояснений.\n\n' + list
          }]
        })
      });
      const j = await r.json();
      const text = (j.content && j.content[0] && j.content[0].text) || '[]';
      const arr = JSON.parse(text.slice(text.indexOf('['), text.lastIndexOf(']') + 1));
      batch.forEach((rec, idx) => { if (arr[idx]) rec.descRu = String(arr[idx]); });
    } catch (e) {
      console.error('Anthropic batch failed:', e.message);
    }
  }
}

/* ---------- Emit js/import-data.js ---------- */
function emit(conferences, studies, papers) {
  const confLines = conferences.map((c) =>
    `    CT.conf(${jsStr(c.title)}, ${jsStr(c.start)}, ${jsStr(c.end)}, ${jsStr(c.city)}, ${jsStr(c.country)}, ` +
    `${jsStr(c.format)}, ${jsStr(c.language)}, ${jsStr(c.site)}, ${jsStr(c.descRu)}, ${jsArr(c.tags)}, ` +
    `{ importId: ${jsStr(c.importId)} })`
  ).join(',\n');

  const studyLines = studies.map((s) =>
    `    CT.study(${jsStr(s.nct)}, ${jsStr(s.title)}, ${jsStr(s.status)}, ${jsStr(s.start)}, ${jsStr(s.completion)}, ` +
    `${jsStr(s.sponsor)}, ${jsStr(s.phase)}, ${jsArr(s.conditions)}, ${jsStr(s.link)}, ${jsStr(s.descRu || '')}, ${jsArr(s.tags || [])})`
  ).join(',\n');

  const paperLines = papers.map((p) =>
    `    CT.paper(${jsStr(p.pmid)}, ${jsStr(p.title)}, ${jsStr(p.authors)}, ${jsStr(p.journal)}, ${jsStr(p.year)}, ` +
    `${jsStr(p.doi)}, ${jsStr(p.abstract)}, ${jsStr(p.descRu || '')}, ${jsArr(p.tags || [])})`
  ).join(',\n');

  return `/* import-data.js — AUTO-GENERATED DATA (see scripts/build-import-data.mjs).
   Records are built via the CT.* helpers. importId values must stay stable:
   pubmed:<PMID>, nct:<NCT>, conf:<slug>. */
window.CT_IMPORT = {
  conferences: [
${confLines}
  ],
  studies: [
${studyLines}
  ],
  papers: [
${paperLines}
  ]
};
`;
}

async function main() {
  const [conferences, studies, papers] = await Promise.all([
    fetchConferences(), fetchStudies(), fetchPapers()
  ]);
  // RU descriptions only for conferences/studies (papers are numerous; keep cheap)
  await addRuDescriptions([...conferences, ...studies]);

  const content = emit(conferences, studies, papers);
  await writeFile(join(ROOT, 'js', 'import-data.js'), content, 'utf8');
  console.log(`Wrote js/import-data.js — ${conferences.length} conferences, ${studies.length} studies, ${papers.length} papers.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
