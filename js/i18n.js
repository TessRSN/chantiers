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

      // ── Vue par axe ──
      'parax.entity.label.axe': 'Axe thématique',
      'parax.entity.label.champ': "Champ d'action",
      'parax.entity.label.principe': 'Principe directeur',
      'parax.entity.col.AXE': 'AXE',
      'parax.entity.col.CHAMP': 'CHAMP',
      'parax.entity.col.PRINCIPE': 'PRINCIPE',
      'parax.change-entity': "Changer d'entité",
      'parax.optgroup.axes': 'Axes thématiques',
      'parax.optgroup.principes': 'Principes directeurs',
      'parax.optgroup.champs': "Champs d'action",
      'parax.coresponsable': 'Coresponsable',
      'parax.coresponsables': 'Coresponsables',
      'sankey.col.os': 'OBJECTIFS STRATÉGIQUES',
      'sankey.col.actions': 'SOUS-OBJECTIFS (ACTIONS)',
      'sankey.col.chantiers': 'CHANTIERS TRANSVERSAUX',
      'sankey.caption': 'Diagramme — Survolez ou cliquez sur un chantier pour voir son contenu complet',
      'sankey.legend.label': 'Légende —',
      'sankey.ouvert': '▾ ouvert',
      'sankey.detail': '▸ détail',
      'parax.aucune-action': 'Aucune action de feuille de route pour cette entité.',
      'parax.detail-actions': 'Détail des actions — groupées par objectif stratégique',
      'parax.realisations-associees': 'Réalisations associées (hors feuille de route officielle)',
      'parax.fermer': 'Fermer',
      'parax.chantier-transversal': 'CHANTIER TRANSVERSAL',
      'parax.action': 'action',
      'parax.actions': 'actions',
      'parax.au-total': 'au total',
      'parax.portee': 'portée',
      'parax.portees': 'portées',
      'parax.par-cet-axe': 'par cet axe',
      'parax.de-cet-axe': 'de cet axe',
      'parax.toutes-de-cet-axe': 'toutes de cet axe',
      'parax.voir-tout': 'Voir tout le chantier',
      'parax.sans-projet': 'Sans projet',

      // ── Vue par chantier ──
      'chantiers.aller-a': 'Aller à',
      'chantiers.contributeurs': 'Contributeurs',
      'chantiers.actions': 'Actions',
      'chantiers.aucun-sous-projet': 'Aucun sous-projet',
      'chantiers.aller-vue-axe': 'Aller à la vue par axe de',
      'chantiers.projet': 'projet',
      'chantiers.projets': 'projets',
      'chantiers.projets-court': 'projets',

      // ── Suivi ──
      'suivi.title': 'Suivi des objectifs',
      'suivi.search-placeholder': 'Rechercher un objectif…',
      'suivi.found': 'trouvée',
      'suivi.found.plural': 'trouvées',
      'suivi.section.en-cours': 'En cours',
      'suivi.section.termines': 'Terminés',
      'suivi.section.non-demarres': 'Non démarrés',
      'suivi.link.voir-axe': 'Voir la vue par axe :',
      'suivi.link.aller-projet': 'Aller au projet',
      'suivi.stats.en-cours': 'en cours',
      'suivi.stats.terminees': 'terminées',
      'suivi.stats.non-demarrees': 'non démarrées',

      // ── Structure & Gouvernance ──
      'structure.title': 'Structure scientifique du RSN',
      'structure.subtitle': 'Cliquez sur un élément pour voir ses responsables',
      'structure.gouvernance': 'Gouvernance',
      'structure.direction': 'Direction',
      'structure.membres': 'Membres',
      'structure.membres-a-venir': 'Membres à venir',
      'structure.a-venir': 'À venir',
      'structure.membre': 'membre',
      'structure.membres-count': 'membres',
      'structure.resp-abbr': 'resp.',
      'structure.responsable': 'Responsable',
      'structure.responsables': 'Responsables',

      // ── Vue globale ──
      'vueglobale.title': 'Réseau des Actions RSN',
      'vueglobale.subtitle.intro': 'Cliquez sur un nœud pour voir ses connexions',
      'vueglobale.search-placeholder': 'Rechercher une action…',
      'vueglobale.axes': 'axes',
      'vueglobale.chantiers': 'chantiers',
      'vueglobale.result': 'résultat',
      'vueglobale.results': 'résultats',
      'vueglobale.axe-prefix': 'Axe ',

      // ── Partagé ──
      'shared.details': 'Détails',
      'shared.original-action': 'Action originale :',
      'shared.os-label': 'Objectif stratégique :',
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

      // ── By axis ──
      'parax.entity.label.axe': 'Thematic axis',
      'parax.entity.label.champ': 'Field of action',
      'parax.entity.label.principe': 'Guiding principle',
      'parax.entity.col.AXE': 'AXIS',
      'parax.entity.col.CHAMP': 'FIELD',
      'parax.entity.col.PRINCIPE': 'PRINCIPLE',
      'parax.change-entity': 'Switch entity',
      'parax.optgroup.axes': 'Thematic axes',
      'parax.optgroup.principes': 'Guiding principles',
      'parax.optgroup.champs': 'Fields of action',
      'parax.coresponsable': 'Co-lead',
      'parax.coresponsables': 'Co-leads',
      'sankey.col.os': 'STRATEGIC OBJECTIVES',
      'sankey.col.actions': 'SUB-OBJECTIVES (ACTIONS)',
      'sankey.col.chantiers': 'CROSS-CUTTING WORKSTREAMS',
      'sankey.caption': 'Diagram — Hover or click a workstream to see its full content',
      'sankey.legend.label': 'Legend —',
      'sankey.ouvert': '▾ open',
      'sankey.detail': '▸ detail',
      'parax.aucune-action': 'No roadmap action for this entity.',
      'parax.detail-actions': 'Action details — grouped by strategic objective',
      'parax.realisations-associees': 'Associated achievements (outside the official roadmap)',
      'parax.fermer': 'Close',
      'parax.chantier-transversal': 'CROSS-CUTTING WORKSTREAM',
      'parax.action': 'action',
      'parax.actions': 'actions',
      'parax.au-total': 'in total',
      'parax.portee': 'led',
      'parax.portees': 'led',
      'parax.par-cet-axe': 'by this axis',
      'parax.de-cet-axe': 'from this axis',
      'parax.toutes-de-cet-axe': 'all from this axis',
      'parax.voir-tout': 'See the full workstream',
      'parax.sans-projet': 'No project',

      // ── By workstream ──
      'chantiers.aller-a': 'Jump to',
      'chantiers.contributeurs': 'Contributors',
      'chantiers.actions': 'Actions',
      'chantiers.aucun-sous-projet': 'No sub-project',
      'chantiers.aller-vue-axe': 'Open the axis view of',
      'chantiers.projet': 'project',
      'chantiers.projets': 'projects',
      'chantiers.projets-court': 'projects',

      // ── Tracker ──
      'suivi.title': 'Objective tracker',
      'suivi.search-placeholder': 'Search an objective…',
      'suivi.found': 'found',
      'suivi.found.plural': 'found',
      'suivi.section.en-cours': 'In progress',
      'suivi.section.termines': 'Completed',
      'suivi.section.non-demarres': 'Not started',
      'suivi.link.voir-axe': 'Open the axis view:',
      'suivi.link.aller-projet': 'Open project',
      'suivi.stats.en-cours': 'in progress',
      'suivi.stats.terminees': 'completed',
      'suivi.stats.non-demarrees': 'not started',

      // ── Structure & Governance ──
      'structure.title': 'RSN scientific structure',
      'structure.subtitle': 'Click on an element to see its leads',
      'structure.gouvernance': 'Governance',
      'structure.direction': 'Direction',
      'structure.membres': 'Members',
      'structure.membres-a-venir': 'Members to come',
      'structure.a-venir': 'To come',
      'structure.membre': 'member',
      'structure.membres-count': 'members',
      'structure.resp-abbr': 'leads',
      'structure.responsable': 'Lead',
      'structure.responsables': 'Leads',

      // ── Overview ──
      'vueglobale.title': 'RSN Actions network',
      'vueglobale.subtitle.intro': 'Click a node to see its connections',
      'vueglobale.search-placeholder': 'Search an action…',
      'vueglobale.axes': 'axes',
      'vueglobale.chantiers': 'workstreams',
      'vueglobale.result': 'result',
      'vueglobale.results': 'results',
      'vueglobale.axe-prefix': 'Axis ',

      // ── Shared ──
      'shared.details': 'Details',
      'shared.original-action': 'Original action:',
      'shared.os-label': 'Strategic objective:',
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
