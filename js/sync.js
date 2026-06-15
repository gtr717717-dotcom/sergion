/* sync.js — GitHub Gist backup + repo config. Exposes window.Sync. */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var FILE = 'conference-tracker.json';

  function cfg() {
    return {
      token: localStorage.getItem('ct_gh_token') || '',
      gistId: localStorage.getItem('ct_gist_id') || '',
      owner: localStorage.getItem('ct_repo_owner') || '',
      repo: localStorage.getItem('ct_repo_name') || '',
      auto: localStorage.getItem('ct_sync_auto') === '1'
    };
  }
  function setCfg(c) {
    if ('token' in c) localStorage.setItem('ct_gh_token', c.token || '');
    if ('gistId' in c) localStorage.setItem('ct_gist_id', c.gistId || '');
    if ('owner' in c) localStorage.setItem('ct_repo_owner', c.owner || '');
    if ('repo' in c) localStorage.setItem('ct_repo_name', c.repo || '');
    if ('auto' in c) localStorage.setItem('ct_sync_auto', c.auto ? '1' : '0');
  }

  function headers() {
    return {
      'Authorization': 'Bearer ' + cfg().token,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    };
  }

  function payload() {
    return JSON.stringify({ version: 1, exportedAt: Date.now(), items: window.Store.all() }, null, 0);
  }

  function push() {
    var c = cfg();
    if (!c.token) return Promise.reject(new Error('no token'));
    var body = { description: 'Conference Tracker backup', files: {} };
    body.files[FILE] = { content: payload() };
    var url = c.gistId ? ('https://api.github.com/gists/' + c.gistId) : 'https://api.github.com/gists';
    if (!c.gistId) body.public = false;
    return fetch(url, { method: c.gistId ? 'PATCH' : 'POST', headers: headers(), body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (j.id && !c.gistId) setCfg({ gistId: j.id }); return j; });
  }

  function pull() {
    var c = cfg();
    if (!c.token || !c.gistId) return Promise.reject(new Error('no gist'));
    return fetch('https://api.github.com/gists/' + c.gistId, { headers: headers() })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        var f = j.files && j.files[FILE];
        if (!f) throw new Error('no file');
        var data = JSON.parse(f.content);
        if (Array.isArray(data.items)) {
          // overwrite local with remote (remote already carries USER_FIELDS)
          localStorage.setItem('ct_items', JSON.stringify(data.items));
          window.Store.reload();
          window.Store.emit();
        }
        return data;
      });
  }

  function autoPushDebounced() {
    if (!cfg().auto) return;
    clearTimeout(autoPushDebounced._t);
    autoPushDebounced._t = setTimeout(function () {
      push().catch(function () {});
    }, 4000);
  }

  window.Sync = { cfg: cfg, setCfg: setCfg, push: push, pull: pull, autoPush: autoPushDebounced };

  // auto-push on changes when enabled
  if (window.Store) window.Store.subscribe(autoPushDebounced);
})();
