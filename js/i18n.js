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
    fr: {},
    en: {},
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
