// js/i18n.js
// Système i18n minimaliste : dictionnaire global + 3 helpers.
// Chargé après config.js dans index.html.

(function () {
  // ── Résolution de la langue au boot ──
  function resolveInitialLang() {
    try {
      const m = (location.hash || '').match(/[?&]lang=(fr|en)/);
      if (m) return m[1];
      const stored = localStorage.getItem('rsn-lang');
      if (stored === 'fr' || stored === 'en') return stored;
    } catch (_) {}
    return 'fr';
  }

  window.LANG = resolveInitialLang();

  // ── Dictionnaire — enrichi au fur et à mesure des tâches ──
  window.I18N = {
    fr: {
      // ── App / header / onglets ──
      'app.header': 'RSN — Tableau de bord',
      'tab.structure': 'Structure & Gouvernance',
      'tab.vue-globale': 'Vue globale',
      'tab.par-axe': 'Vue par axe',
      'tab.analyse': 'Vue par chantier',
      'tab.suivi': 'Suivi des objectifs',
      'toggle.light': 'Mode clair',
      'toggle.dark': 'Mode sombre',
      'app.loading': 'Chargement des données…',
      'app.error': 'Erreur',
      'app.error.help': 'Vérifiez que data.csv et membres.csv sont présents à côté de index.html',
    },
    en: {
      // ── App / header / tabs ──
      'app.header': 'RSN — Dashboard',
      'tab.structure': 'Structure & Governance',
      'tab.vue-globale': 'Overview',
      'tab.par-axe': 'By axis',
      'tab.analyse': 'By workstream',
      'tab.suivi': 'Objective tracker',
      'toggle.light': 'Light mode',
      'toggle.dark': 'Dark mode',
      'app.loading': 'Loading data…',
      'app.error': 'Error',
      'app.error.help': 'Make sure data.csv and membres.csv are next to index.html',
    },
  };

  // ── Helpers ──
  // UI : retourne la chaîne traduite. Fallback : FR puis clé brute.
  window.t = function (key) {
    const lang = window.LANG;
    if (window.I18N[lang] && window.I18N[lang][key] != null) return window.I18N[lang][key];
    if (window.I18N.fr[key] != null) return window.I18N.fr[key];
    return key;
  };

  // CSV : retourne row[baseColName + ' EN'] si EN actif et non-vide, sinon row[baseColName].
  window.tField = function (row, baseColName) {
    if (!row) return '';
    if (window.LANG === 'en') {
      const en = row[baseColName + ' EN'];
      if (en && String(en).trim()) return en;
    }
    return row[baseColName] || '';
  };

  // Config : retourne obj[field + '_en'] si EN actif et non-vide, sinon obj[field].
  window.tConfig = function (obj, field) {
    if (!obj) return '';
    if (window.LANG === 'en') {
      const en = obj[field + '_en'];
      if (en != null && (typeof en !== 'string' || en.trim())) return en;
    }
    return obj[field];
  };
})();
