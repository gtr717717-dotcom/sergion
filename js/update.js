/* update.js — trigger the update-data workflow via repository_dispatch and poll.
   Exposes window.Updater { trigger }. Requires owner/repo/token from Sync.cfg. */
(function () {
  'use strict';

  var T = function (k) { return window.I18N.t(k); };
  var POLL_MS = 10000;
  var TIMEOUT_MS = 5 * 60 * 1000;
  var polling = false;

  function toast(k, raw) { if (window.Toast) window.Toast(raw || T(k)); }

  function cfg() { return window.Sync ? window.Sync.cfg() : {}; }
  function configured() { var c = cfg(); return !!(c.token && c.owner && c.repo); }

  function api(path) { return 'https://api.github.com/repos/' + cfg().owner + '/' + cfg().repo + path; }
  function headers() {
    return { 'Authorization': 'Bearer ' + cfg().token, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
  }

  function trigger() {
    if (!configured()) {
      toast('toast.updateNeedCfg');
      if (window.App && window.App.openSync) window.App.openSync();
      return;
    }
    if (polling) return;
    toast('toast.updateStart');
    var startedAt = Date.now();
    fetch(api('/dispatches'), {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ event_type: 'update-data' })
    }).then(function (r) {
      if (r.status !== 204 && !r.ok) throw new Error('HTTP ' + r.status);
      polling = true;
      setTimeout(function () { poll(startedAt); }, POLL_MS);
    }).catch(function (e) {
      toast('toast.updateFail', T('toast.updateFail') + ': ' + e.message);
    });
  }

  function poll(startedAt) {
    if (Date.now() - startedAt > TIMEOUT_MS) { polling = false; toast('toast.updateTimeout'); return; }
    fetch(api('/actions/runs?event=repository_dispatch&per_page=1'), { headers: headers() })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var run = (j.workflow_runs || [])[0];
        if (!run) { setTimeout(function () { poll(startedAt); }, POLL_MS); return; }
        if (run.status === 'completed') {
          polling = false;
          if (run.conclusion === 'success') {
            toast('toast.updateDone');
            setTimeout(function () { location.reload(); }, 2000);
          } else {
            toast('toast.updateFail', T('toast.updateFail') + ' (' + run.conclusion + ')');
          }
        } else {
          toast('toast.updateProgress');
          setTimeout(function () { poll(startedAt); }, POLL_MS);
        }
      })
      .catch(function () { setTimeout(function () { poll(startedAt); }, POLL_MS); });
  }

  window.Updater = { trigger: trigger, configured: configured };
})();
