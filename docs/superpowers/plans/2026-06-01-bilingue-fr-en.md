# Bilinguisation FR/EN — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Le site `tessrsn.github.io/chantiers/` est entièrement utilisable en FR ou en EN (UI + données métier), avec toggle persistant dans le header.

**Architecture:** Dictionnaire global `window.I18N` chargé par `js/i18n.js`. Helpers `t()` (clés UI), `tField()` (cellule CSV, suffixe ` EN`), `tConfig()` (champ config, suffixe `_en`). Résolution de la langue au boot via URL hash + localStorage, avant le premier render React. Toggle dans le header de `app.jsx`. Travail sur la branche `bilingue-fr-en` ; merge vers `main` après validation locale.

**Tech Stack:** React 18 (Babel standalone, pas de build), Tailwind via CDN, JS plain chargé via `<script>`, données CSV parsées au runtime.

**Pas de framework de test** : la vérification se fait manuellement dans le navigateur (`python3 -m http.server 8000` à la racine, puis Cmd+Shift+R pour bust le cache).

---

## Préambule — Préparer la branche

- [ ] **Vérifier que la branche `bilingue-fr-en` est active**

```bash
cd /Users/tessberthier/Documents/RSN/Chantiers
git branch --show-current
# attendu : bilingue-fr-en
```

- [ ] **Confirmer le compte GitHub actif**

```bash
gh auth status 2>&1 | grep "Active account"
# attendu : TessRSN active
```

Si ce n'est pas TessRSN : `gh auth switch -h github.com -u TessRSN`.

---

## Task 1 — Créer le squelette `js/i18n.js`

**Files:**
- Create: `js/i18n.js`

- [ ] **Step 1.1 : Écrire le fichier complet**

```js
// js/i18n.js
// Système i18n minimaliste : dictionnaire global + 3 helpers
// Chargé après config.js dans index.html.

(function () {
  // ── Résolution de la langue au boot ──
  function resolveInitialLang() {
    try {
      const m = location.hash.match(/[?&]lang=(fr|en)/);
      if (m) return m[1];
      const stored = localStorage.getItem('rsn-lang');
      if (stored === 'fr' || stored === 'en') return stored;
    } catch (_) {}
    return 'fr';
  }

  window.LANG = resolveInitialLang();

  // ── Dictionnaire — sera enrichi au fur et à mesure des tâches ──
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
```

- [ ] **Step 1.2 : Vérifier syntaxe — pas d'erreur Node**

```bash
node -c js/i18n.js
# attendu : pas d'output (OK)
```

- [ ] **Step 1.3 : Commit**

```bash
git add js/i18n.js
git commit -m "i18n : helpers t/tField/tConfig et résolution langue au boot"
```

---

## Task 2 — Charger `i18n.js` depuis `index.html`

**Files:**
- Modify: `index.html` (ligne avec `var modules = [...]`)

- [ ] **Step 2.1 : Lire la section modules**

```bash
grep -n "modules = \|js/config\|js/components" index.html | head -10
```

- [ ] **Step 2.2 : Ajouter `'js/i18n.js'` juste après `'js/config.js'`**

Pattern à substituer dans `index.html` :

```js
var modules = [
  'js/config.js',
  'js/i18n.js',
  'js/components/shared.jsx',
  // ... reste inchangé
];
```

- [ ] **Step 2.3 : Tester localement**

```bash
python3 -m http.server 8000 &
SERVER_PID=$!
sleep 1
curl -s "http://localhost:8000/js/i18n.js" | head -3
kill $SERVER_PID
```

Ouvre `http://localhost:8000` dans Chrome → Console → tape `window.LANG`, `window.t`, `window.tField`, `window.tConfig` → tous doivent exister.

- [ ] **Step 2.4 : Commit**

```bash
git add index.html
git commit -m "i18n : charger i18n.js après config.js dans index.html"
```

---

## Task 3 — Hook `useLang` + extension `parseHash`/`buildHash`

**Files:**
- Modify: `js/app.jsx` (ajouter hook + étendre routing)

- [ ] **Step 3.1 : Identifier les fonctions actuelles**

```bash
grep -n "parseHash\|buildHash\|setActiveTab\|useState" js/app.jsx | head -20
```

- [ ] **Step 3.2 : Ajouter le hook `useLang` en haut du composant racine**

Dans `js/app.jsx`, juste avant la déclaration de `useState(darkMode)` :

```js
// Hook bilingue — synchronise window.LANG, localStorage et URL hash.
function useLang() {
  const [lang, setLangState] = React.useState(window.LANG);

  const setLang = React.useCallback((newLang) => {
    if (newLang !== 'fr' && newLang !== 'en') return;
    window.LANG = newLang;
    setLangState(newLang);
    try { localStorage.setItem('rsn-lang', newLang); } catch (_) {}
    // mettre à jour le hash : ajouter ou retirer &lang=en
    const h = location.hash || '';
    let next = h.replace(/([?&])lang=(fr|en)/, '$1').replace(/[?&]$/, '').replace(/&&+/g, '&');
    if (newLang === 'en') {
      next += (next.includes('?') ? '&' : '?') + 'lang=en';
    }
    if (next !== h) history.replaceState(null, '', location.pathname + location.search + (next.startsWith('#') ? next : '#' + next.replace(/^#/, '')));
  }, []);

  return [lang, setLang];
}
```

- [ ] **Step 3.3 : Utiliser le hook dans le composant `App`**

À côté de `const [darkMode, setDarkMode] = useState(true);` :

```js
const [lang, setLang] = useLang();
```

- [ ] **Step 3.4 : Étendre `parseHash` pour extraire `lang`**

Repérer la fonction `parseHash` actuelle (ou la créer si elle est inline) et ajouter :

```js
function parseHash() {
  const h = (location.hash || '').replace(/^#/, '');
  const [path, qs = ''] = h.split('?');
  const params = new URLSearchParams(qs);
  return {
    tab: path || 'par-axe',
    entite: params.get('entite') || null,
    project: params.get('project') || null,
    lang: params.get('lang') === 'en' ? 'en' : (params.get('lang') === 'fr' ? 'fr' : null),
  };
}
```

- [ ] **Step 3.5 : Étendre `buildHash` pour ajouter `lang` si non-FR**

```js
function buildHash({ tab, entite, project, lang }) {
  const params = new URLSearchParams();
  if (entite) params.set('entite', entite);
  if (project) params.set('project', project);
  if (lang === 'en') params.set('lang', 'en');
  const qs = params.toString();
  return '#' + (tab || 'par-axe') + (qs ? '?' + qs : '');
}
```

- [ ] **Step 3.6 : Mettre à jour tous les appels à `buildHash` pour passer `lang`**

```bash
grep -n "buildHash" js/app.jsx
```

Pour chaque appel : ajouter `lang: window.LANG` dans l'objet passé. Exemple :

```js
// avant
location.hash = buildHash({ tab: 'par-axe', entite: id });
// après
location.hash = buildHash({ tab: 'par-axe', entite: id, lang: window.LANG });
```

- [ ] **Step 3.7 : Test manuel dans la console navigateur**

```js
setLang('en')   // hash devient #...?lang=en, localStorage.rsn-lang = 'en'
setLang('fr')   // hash perd ?lang=en, localStorage = 'fr'
location.reload()  // langue préservée
```

- [ ] **Step 3.8 : Commit**

```bash
git add js/app.jsx
git commit -m "i18n : hook useLang + extension parseHash/buildHash pour le param lang"
```

---

## Task 4 — Toggle UI dans le header

**Files:**
- Modify: `js/app.jsx` (header, à gauche du toggle dark/light, ligne ~210)

- [ ] **Step 4.1 : Définir le composant `GlobeIcon`**

En haut de `app.jsx`, à côté des autres composants utilitaires :

```jsx
function GlobeIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 010 18" />
      <path d="M12 3a14 14 0 000 18" />
    </svg>
  );
}
```

- [ ] **Step 4.2 : Insérer le bouton AVANT le toggle dark/light**

Dans `app.jsx`, juste avant `{/* Dark mode toggle */}` :

```jsx
{/* Language toggle */}
<button
  onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
  aria-label={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
  title={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: 20,
    border: `1px solid ${darkMode ? '#334155' : '#d1d5db'}`,
    backgroundColor: darkMode ? '#1e293b' : '#f9fafb',
    color: darkMode ? '#94a3b8' : '#6b7280',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
    marginRight: 8,
  }}
>
  <GlobeIcon size={14} />
  {lang.toUpperCase()}
</button>
```

- [ ] **Step 4.3 : Tester dans le navigateur**

Hard refresh. Le toggle « 🌐 FR » apparaît à gauche du dark toggle. Clic → bascule sur « 🌐 EN ». URL gagne `?lang=en`. Refresh → reste en EN.

- [ ] **Step 4.4 : Commit**

```bash
git add js/app.jsx
git commit -m "i18n : toggle FR/EN dans le header (globe SVG + label)"
```

---

## Task 5 — Migrer les chaînes UI de `app.jsx`

**Files:**
- Modify: `js/app.jsx` (chaînes en dur)
- Modify: `js/i18n.js` (ajouter les clés)

- [ ] **Step 5.1 : Lister les chaînes FR dans `app.jsx`**

```bash
grep -nE '"[A-ZÀ-ÿ][^"]*"' js/app.jsx | grep -v "//\|style\|color\|background\|border\|http\|fontSize\|padding" | head -50
```

- [ ] **Step 5.2 : Ajouter les clés `app.*` dans `i18n.js`**

Dans `js/i18n.js`, remplacer `I18N = { fr: {}, en: {} }` par :

```js
window.I18N = {
  fr: {
    // ── App ──
    'app.title': 'Réseau en santé numérique',
    'app.subtitle': 'Chantiers transversaux',
    'tab.structure': 'Structure',
    'tab.vue-globale': "Vue d'ensemble",
    'tab.par-axe': 'Vue par axe',
    'tab.analyse': 'Vue par chantier',
    'tab.suivi': 'Suivi',
  },
  en: {
    // ── App ──
    'app.title': 'Digital Health Network',
    'app.subtitle': 'Cross-cutting workstreams',
    'tab.structure': 'Structure',
    'tab.vue-globale': 'Overview',
    'tab.par-axe': 'By axis',
    'tab.analyse': 'By workstream',
    'tab.suivi': 'Tracker',
  },
};
```

- [ ] **Step 5.3 : Remplacer dans `app.jsx`**

Pour chaque chaîne en dur identifiée à 5.1, substituer par `{t('...')}`.

Exemple — la définition des onglets :

```js
// avant
const TABS = [
  { id: 'structure', label: 'Structure' },
  { id: 'vue-globale', label: "Vue d'ensemble" },
  { id: 'par-axe', label: 'Vue par axe' },
  { id: 'analyse', label: 'Vue par chantier' },
  { id: 'suivi', label: 'Suivi' },
];
// après — déplacer la déclaration À L'INTÉRIEUR du composant App (pour relire à chaque render)
function App() {
  const [lang, setLang] = useLang();
  // ...
  const TABS = [
    { id: 'structure', label: t('tab.structure') },
    { id: 'vue-globale', label: t('tab.vue-globale') },
    { id: 'par-axe', label: t('tab.par-axe') },
    { id: 'analyse', label: t('tab.analyse') },
    { id: 'suivi', label: t('tab.suivi') },
  ];
  // ...
}
```

Idem pour le titre/sous-titre du header.

- [ ] **Step 5.4 : Tester**

Hard refresh → FR par défaut OK. Click toggle → onglets passent en EN. Click → reviennent en FR.

- [ ] **Step 5.5 : Commit**

```bash
git add js/app.jsx js/i18n.js
git commit -m "i18n : migration des chaînes UI de app.jsx (titre, onglets)"
```

---

## Task 6 — Migrer `vue-par-axe.jsx`

**Files:**
- Modify: `js/components/vue-par-axe.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 6.1 : Audit des chaînes FR dans le fichier**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/vue-par-axe.jsx | head -60
```

Liste à anticiper (basé sur lecture précédente) :
- « Diagramme — Survolez ou cliquez sur un chantier pour voir son contenu complet »
- « Légende — »
- « Réalisations et travaux en cours »
- « Objectifs stratégiques », « Sous-objectifs », « Chantiers transversaux »
- « Feuille de route »
- « Aucune action en cours ou terminée à ce jour. »
- « de cet axe », « au total », « détail »
- « OS1 », « OS2 », « OS3 » (codes — NE PAS traduire)
- Statuts : « terminé », « en cours », « non démarré » (depuis PROGRESS.label — traduits via tConfig en Task 12)

- [ ] **Step 6.2 : Ajouter au dictionnaire**

Dans `i18n.js`, ajouter dans la section FR :

```js
// ── Vue par axe ──
'sankey.caption': 'Diagramme — Survolez ou cliquez sur un chantier pour voir son contenu complet',
'sankey.legend': 'Légende —',
'sankey.col.axe': 'Axe',
'sankey.col.os': 'Objectifs stratégiques',
'sankey.col.actions': 'Sous-objectifs (actions)',
'sankey.col.chantiers': 'Chantiers transversaux',
'parax.realisations': 'Réalisations et travaux en cours',
'parax.feuille-route': 'Feuille de route',
'parax.aucune-action': 'Aucune action en cours ou terminée à ce jour.',
'parax.de-cet-axe': 'de cet axe',
'parax.au-total': 'au total',
'parax.detail': 'détail',
'parax.representant': 'Représentant·e au comité',
'parax.actions': 'actions',
'parax.action': 'action',
```

Et en EN :

```js
'sankey.caption': 'Diagram — Hover or click a workstream to see its full content',
'sankey.legend': 'Legend —',
'sankey.col.axe': 'Axis',
'sankey.col.os': 'Strategic objectives',
'sankey.col.actions': 'Sub-objectives (actions)',
'sankey.col.chantiers': 'Cross-cutting workstreams',
'parax.realisations': 'Achievements and ongoing work',
'parax.feuille-route': 'Roadmap',
'parax.aucune-action': 'No action in progress or completed yet.',
'parax.de-cet-axe': 'from this axis',
'parax.au-total': 'overall',
'parax.detail': 'detail',
'parax.representant': 'Committee representative',
'parax.actions': 'actions',
'parax.action': 'action',
```

- [ ] **Step 6.3 : Remplacer les chaînes dans `vue-par-axe.jsx`**

Pour chaque chaîne en dur, substituer par `{t('clé')}`.

Exemple :

```jsx
// avant
Diagramme — Survolez ou cliquez sur un chantier pour voir son contenu complet
// après
{t('sankey.caption')}
```

Garder les codes (OS1/OS2/OS3, G1, R1…) inchangés.

- [ ] **Step 6.4 : Tester chaque vue**

Pour `A1`, `A2`, `PD-CONF`, `CA-FORM` :
- FR : tous les labels en français
- EN : tous les labels en anglais

- [ ] **Step 6.5 : Commit**

```bash
git add js/components/vue-par-axe.jsx js/i18n.js
git commit -m "i18n : migration de vue-par-axe.jsx (labels UI)"
```

---

## Task 7 — Migrer `chantiers.jsx`

**Files:**
- Modify: `js/components/chantiers.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 7.1 : Audit des chaînes FR**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/chantiers.jsx | head -50
```

- [ ] **Step 7.2 : Ajouter au dictionnaire** (clés `chantiers.*`)

FR :
```js
'chantiers.title': 'Vue par chantier',
'chantiers.subtitle': 'Les 7 chantiers transversaux et leurs sous-projets',
'chantiers.sidebar.aller-a': 'Aller à',
'chantiers.actions': 'Actions associées',
'chantiers.contributeurs': 'Contributeurs',
'chantiers.aucun-contributeur': 'Aucune contribution recensée à ce jour.',
'chantiers.de-cet-axe': 'de cet axe',
'chantiers.progress.complete': 'complété',
```

EN :
```js
'chantiers.title': 'By workstream',
'chantiers.subtitle': 'The 7 cross-cutting workstreams and their sub-projects',
'chantiers.sidebar.aller-a': 'Jump to',
'chantiers.actions': 'Associated actions',
'chantiers.contributeurs': 'Contributors',
'chantiers.aucun-contributeur': 'No contributions recorded yet.',
'chantiers.de-cet-axe': 'from this axis',
'chantiers.progress.complete': 'complete',
```

- [ ] **Step 7.3 : Remplacer les chaînes dans le fichier**

Substituer chaque chaîne FR en dur par `{t('clé')}`.

- [ ] **Step 7.4 : Tester dans le navigateur (FR puis EN)**

- [ ] **Step 7.5 : Commit**

```bash
git add js/components/chantiers.jsx js/i18n.js
git commit -m "i18n : migration de chantiers.jsx (labels UI)"
```

---

## Task 8 — Migrer `suivi.jsx`

**Files:**
- Modify: `js/components/suivi.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 8.1 : Audit**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/suivi.jsx | head -40
```

- [ ] **Step 8.2 : Ajouter clés `suivi.*` au dictionnaire**

FR :
```js
'suivi.title': 'Suivi',
'suivi.subtitle': 'Filtrer et lire les actions une par une',
'suivi.filter.axe': 'Axe',
'suivi.filter.chantier': 'Chantier',
'suivi.filter.statut': 'Statut',
'suivi.filter.tous': 'Tous',
'suivi.filter.toutes': 'Toutes',
'suivi.nb-actions': 'actions',
'suivi.aucune-correspondance': 'Aucune action ne correspond aux filtres.',
'suivi.reset-filters': 'Réinitialiser les filtres',
```

EN :
```js
'suivi.title': 'Tracker',
'suivi.subtitle': 'Filter and read actions one by one',
'suivi.filter.axe': 'Axis',
'suivi.filter.chantier': 'Workstream',
'suivi.filter.statut': 'Status',
'suivi.filter.tous': 'All',
'suivi.filter.toutes': 'All',
'suivi.nb-actions': 'actions',
'suivi.aucune-correspondance': 'No action matches the filters.',
'suivi.reset-filters': 'Reset filters',
```

- [ ] **Step 8.3 : Remplacer les chaînes**

- [ ] **Step 8.4 : Tester**

- [ ] **Step 8.5 : Commit**

```bash
git add js/components/suivi.jsx js/i18n.js
git commit -m "i18n : migration de suivi.jsx (labels UI)"
```

---

## Task 9 — Migrer `structure.jsx`

**Files:**
- Modify: `js/components/structure.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 9.1 : Audit**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/structure.jsx | head -60
```

- [ ] **Step 9.2 : Ajouter clés `structure.*`**

FR :
```js
'structure.title': 'Structure',
'structure.subtitle': 'Axes, principes directeurs et champs d\'action',
'structure.section.axes': 'Axes thématiques',
'structure.section.pds': 'Principes directeurs',
'structure.section.cas': 'Champs d\'action',
'structure.gouvernance': 'Gouvernance',
'structure.coresponsables': 'Co-responsables',
'structure.affiliation': 'Affiliation',
'structure.role': 'Rôle',
```

EN :
```js
'structure.title': 'Structure',
'structure.subtitle': 'Axes, guiding principles and fields of action',
'structure.section.axes': 'Thematic axes',
'structure.section.pds': 'Guiding principles',
'structure.section.cas': 'Fields of action',
'structure.gouvernance': 'Governance',
'structure.coresponsables': 'Co-leads',
'structure.affiliation': 'Affiliation',
'structure.role': 'Role',
```

- [ ] **Step 9.3 : Remplacer les chaînes**

- [ ] **Step 9.4 : Tester**

- [ ] **Step 9.5 : Commit**

```bash
git add js/components/structure.jsx js/i18n.js
git commit -m "i18n : migration de structure.jsx (labels UI + gouvernance)"
```

---

## Task 10 — Migrer `vue-globale.jsx`

**Files:**
- Modify: `js/components/vue-globale.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 10.1 : Audit**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/vue-globale.jsx | head -40
```

- [ ] **Step 10.2 : Ajouter clés `vueglobale.*`**

FR :
```js
'vueglobale.title': "Vue d'ensemble",
'vueglobale.subtitle': 'Toutes les entités et leurs actions',
'vueglobale.legend.terminé': 'terminé',
'vueglobale.legend.en cours': 'en cours',
'vueglobale.legend.non démarré': 'non démarré',
'vueglobale.entité.actions': 'actions',
```

EN :
```js
'vueglobale.title': 'Overview',
'vueglobale.subtitle': 'All entities and their actions',
'vueglobale.legend.terminé': 'completed',
'vueglobale.legend.en cours': 'in progress',
'vueglobale.legend.non démarré': 'not started',
'vueglobale.entité.actions': 'actions',
```

- [ ] **Step 10.3 : Remplacer**

- [ ] **Step 10.4 : Tester**

- [ ] **Step 10.5 : Commit**

```bash
git add js/components/vue-globale.jsx js/i18n.js
git commit -m "i18n : migration de vue-globale.jsx (labels UI)"
```

---

## Task 11 — Migrer `shared.jsx`

**Files:**
- Modify: `js/components/shared.jsx`
- Modify: `js/i18n.js`

- [ ] **Step 11.1 : Audit**

```bash
grep -nE "'[A-ZÀ-ÿ][^']{3,}'|\"[A-ZÀ-ÿ][^\"]{3,}\"" js/components/shared.jsx | head -30
```

- [ ] **Step 11.2 : Ajouter clés `shared.*`**

Audit a montré que `shared.jsx` contient une seule chaîne FR à traduire :
- `title="Détails"` → clé `shared.details`

FR :
```js
'shared.details': 'Détails',
```

EN :
```js
'shared.details': 'Details',
```

Si d'autres chaînes apparaissent à l'audit (étape 11.1), les ajouter selon le même pattern.

- [ ] **Step 11.3 : Remplacer**

- [ ] **Step 11.4 : Tester**

- [ ] **Step 11.5 : Commit**

```bash
git add js/components/shared.jsx js/i18n.js
git commit -m "i18n : migration de shared.jsx (labels UI partagés)"
```

---

## Task 12 — Ajouter `_en` à `config.js` (chantiers, sous-projets, OS, AXES, PROGRESS)

**Files:**
- Modify: `js/config.js`

- [ ] **Step 12.1 : Lire la structure actuelle**

```bash
wc -l js/config.js
grep -n "AXES_CONFIG\|CHANTIERS_CONFIG\|PROGRESS\|name:\|description:" js/config.js | head -40
```

- [ ] **Step 12.2 : Ajouter `name_en` / `description_en` à chaque entrée de `CHANTIERS_CONFIG`**

Les 7 chantiers (terminologie validée dans la spec § 7) :

```js
// G — Guides & outils → Guides & tools
// R — Répertoires & cartographie → Directories & mapping
// M — Maillage et concertation → Networking and consultation
// F — Formation → Training
// É — Écoute et consultation → Listening and consultation
// I — Influence → Advocacy
// Év — Événements → Events
```

Pour chaque, ajouter à côté du `name` / `description` existant :
- `name_en: 'Guides & tools'` etc.
- `description_en: '...'` (à composer en restant fidèle au FR)

- [ ] **Step 12.3 : Ajouter `name_en` / `description_en` à chaque sous-projet**

~30 sous-projets (G1, G2, R1, R2, R3, M1..M4, F1, É1..É3, I1, I2, Év1..Év3). Pour chacun : traduire `name` et `description`.

Exemple — G1 :

```js
{
  id: 'G1',
  name: 'Harmonisation des bonnes pratiques méthodologiques',
  name_en: 'Harmonization of methodological best practices',
  description: 'Produire un cadre commun de bonnes pratiques pour la communauté de recherche, accessible en français.',
  description_en: 'Produce a common framework of best practices for the research community, accessible in French.',
}
```

- [ ] **Step 12.4 : Ajouter `name_en` à chaque entité de `AXES_CONFIG` (12 entités)**

```js
// A1 : 'Plateformes numériques et gouvernance' → 'Digital platforms and governance'
// A2 : 'Modélisation et méthodes numériques' → 'Modelling and numerical methods'
// A3 : 'Interventions numériques' → 'Digital interventions'
// A4 : 'Transformation numérique' → 'Digital transformation'
// PD-CONF : 'Numérique de confiance' → 'Trustworthy digital'
// PD-DUR : 'Santé durable' → 'Sustainable health'
// PD-EDIA : 'Équité, diversité, inclusion et accessibilité' → 'Equity, diversity, inclusion and accessibility'
// PD-ENG : 'Engagement citoyen' → 'Citizen engagement'
// PD-SCI : 'Science ouverte' → 'Open science'
// CA-FORM : 'Formation interdisciplinaire' → 'Interdisciplinary training'
// CA-MOB : 'Mobilisation des connaissances' → 'Knowledge mobilization'
// CA-RENF : 'Renforcement des capacités' → 'Capacity building'
```

- [ ] **Step 12.5 : Ajouter labels EN pour les OS (objectifs stratégiques) par entité**

Pour chaque axe / PD / CA, les OS portent un libellé court FR (« Faciliter le maillage entre les méthodologistes... »). Ajouter `label_en` à côté de `label`.

(Le nombre exact d'OS varie selon l'entité — repérer dans `AXES_CONFIG` la structure imbriquée.)

- [ ] **Step 12.6 : Ajouter `label_en` au `PROGRESS`**

```js
const PROGRESS = {
  'non démarré': { label: 'Non démarré', label_en: 'Not started', color: '#6b7280', /* ... */ icon: '○' },
  'en cours':    { label: 'En cours',    label_en: 'In progress', color: '#f59e0b', /* ... */ icon: '◐' },
  'terminé':     { label: 'Terminé',     label_en: 'Completed',   color: '#22c55e', /* ... */ icon: '●' },
};
```

- [ ] **Step 12.7 : Vérifier syntaxe**

```bash
node -c js/config.js
```

- [ ] **Step 12.8 : Commit**

```bash
git add js/config.js
git commit -m "i18n : champs _en pour AXES_CONFIG, CHANTIERS_CONFIG, sous-projets, OS, PROGRESS"
```

---

## Task 13 — Wirer `tConfig` dans les composants

**Files:**
- Modify: tous les composants qui lisent `.name`, `.description`, `.label` depuis `AXES_CONFIG`, `CHANTIERS_CONFIG`, `PROGRESS`, sous-projets.

- [ ] **Step 13.1 : Repérer les usages**

```bash
grep -rn "\.name\b\|\.description\b\|\.label\b" js/components/ | grep -v "//" | head -40
```

- [ ] **Step 13.2 : Remplacer chaque lecture par `tConfig()`**

Exemple :

```jsx
// avant
<h2>{chantier.name}</h2>
<p>{chantier.description}</p>
// après
<h2>{tConfig(chantier, 'name')}</h2>
<p>{tConfig(chantier, 'description')}</p>
```

Idem pour `statusObj.label` :

```jsx
{tConfig(statusObj, 'label')}
```

Idem pour `entity.name`, sous-projets, OS.

- [ ] **Step 13.3 : Tester chaque vue (FR puis EN)**

- A2 en EN : « Modelling and numerical methods », OS en EN, chantiers en EN (« Networking and consultation »), statuts en EN.
- Sankey légende : « completed / in progress / not started »

- [ ] **Step 13.4 : Commit**

```bash
git add js/components/
git commit -m "i18n : tConfig() dans tous les composants pour lire les champs config en EN"
```

---

## Task 14 — Ajouter colonnes EN à `data.csv`

**Files:**
- Modify: `data.csv`

- [ ] **Step 14.1 : Backup**

```bash
cp data.csv data.csv.backup-pre-en
```

- [ ] **Step 14.2 : Ajouter les 3 colonnes à l'en-tête**

L'en-tête actuel :
```
ID Action,Axe,Objectif stratégique,Action originale,Chantier suggéré,Confiance,Raison,Action réécrite,Statut analyse,Projet,Nom projet,Description projet,Notes analyse,Destination,Approuvé,Statut objectif
```

Doit devenir :
```
ID Action,Axe,Objectif stratégique,Action originale,Action originale EN,Chantier suggéré,Confiance,Raison,Action réécrite,Action réécrite EN,Statut analyse,Projet,Nom projet,Description projet,Description projet EN,Notes analyse,Destination,Approuvé,Statut objectif
```

- [ ] **Step 14.3 : Pour chaque ligne, remplir `Action réécrite EN`**

Traduire chaque action réécrite en anglais en respectant la terminologie de la spec § 7. Style : impératif court, fidèle au FR.

Exemples :
- « Lancer une table de concertation entre les plateformes (Symposium des plateformes) » → « Launch a consultation table between platforms (Platforms Symposium) »
- « Rédiger un manifeste en faveur de l'accès aux données » → « Draft a manifesto in favour of data access »
- « Effectuer une cartographie des différents champs d'expertise » → « Map the various fields of expertise »
- « Organiser des activités avec des partenaires (ex. IVADO et son axe Santé) » → « Organize joint activities with partners (e.g. IVADO Health track) »

- [ ] **Step 14.4 : Pour chaque ligne, remplir `Description projet EN` si la cellule FR est non-vide**

(La plupart sont vides, dérivées de `config.js`. Ne remplir que celles qui ont du contenu propre dans la ligne.)

- [ ] **Step 14.5 : `Action originale EN`** — laisser vide sauf si la cellule FR est utilisée comme affichage final (rare ; généralement `réécrite` prend le dessus). Remplir uniquement si nécessaire.

- [ ] **Step 14.6 : Vérifier l'intégrité du CSV**

```bash
python3 -c "import csv; rows = list(csv.DictReader(open('data.csv'))); print(f'{len(rows)} lignes, {len(rows[0])} colonnes'); print(list(rows[0].keys()))"
```

Attendu : 110+ lignes, 19 colonnes, en-tête contient les 3 nouvelles colonnes.

- [ ] **Step 14.7 : Supprimer le backup**

```bash
rm data.csv.backup-pre-en
```

- [ ] **Step 14.8 : Commit**

```bash
git add data.csv
git commit -m "i18n : colonnes EN dans data.csv (Action réécrite EN, Description projet EN, Action originale EN)"
```

---

## Task 15 — Wirer `tField` pour les champs CSV affichés

**Files:**
- Modify: composants qui affichent `Action réécrite`, `Action originale`, `Description projet`

- [ ] **Step 15.1 : Repérer les usages**

```bash
grep -rn "'Action réécrite'\|'Action originale'\|'Description projet'\|action\.actionReecrite\|action\.actionOriginale\|action\.descriptionProjet" js/ | head -40
```

(Note : selon comment le CSV est parsé, les clés peuvent être les noms FR bruts ou des keys camelCase. Adapter le wrapper en conséquence.)

- [ ] **Step 15.2 : Remplacer**

Si le parsing préserve les noms FR :

```jsx
// avant
{action['Action réécrite'] || action['Action originale']}
// après
{tField(action, 'Action réécrite') || tField(action, 'Action originale')}
```

Si le parsing produit des keys camelCase (ex. `actionReecrite`), adapter le helper `tField` ou le parser pour préserver les noms FR. Inspecter d'abord le code de parsing dans `app.jsx` ou un loader.

- [ ] **Step 15.3 : Tester en EN**

Sur `#par-axe?entite=A1&lang=en` : les actions s'affichent en anglais.

- [ ] **Step 15.4 : Commit**

```bash
git add js/
git commit -m "i18n : tField() pour Action réécrite/originale/Description projet"
```

---

## Task 16 — Ajouter `Role EN` à `membres.csv`

**Files:**
- Modify: `membres.csv`

- [ ] **Step 16.1 : Backup**

```bash
cp membres.csv membres.csv.backup
```

- [ ] **Step 16.2 : Ajouter la colonne**

Header actuel :
```
Nom,Initiales,Affiliation,Role,Groupes
```

Devient :
```
Nom,Initiales,Affiliation,Role,Role EN,Groupes
```

- [ ] **Step 16.3 : Remplir `Role EN`**

Patterns observés (à traduire en remplaçant) :
- « Directrice » → « Director »
- « Codirecteur » / « Codirectrice » → « Co-director »
- « Colead A2 » → « Co-lead Axis 2 »
- « Colead A3 » → « Co-lead Axis 3 »
- « Colead PD-CONF » → « Co-lead Trustworthy digital » (ou simplement « Co-lead PD-CONF »)
- « Colead CA-FORM » → « Co-lead Interdisciplinary training »

**Choix structurel** : pour `Colead X`, préférer la forme courte « Co-lead [Code] » (`Co-lead A2`, `Co-lead PD-CONF`) — plus stable que d'embarquer le nom complet.

- [ ] **Step 16.4 : Vérifier**

```bash
python3 -c "import csv; rows = list(csv.DictReader(open('membres.csv'))); print(f'{len(rows)} lignes, {len(rows[0])} colonnes'); print(list(rows[0].keys()))"
```

- [ ] **Step 16.5 : Cleanup**

```bash
rm membres.csv.backup
```

- [ ] **Step 16.6 : Commit**

```bash
git add membres.csv
git commit -m "i18n : colonne Role EN dans membres.csv"
```

---

## Task 17 — Wirer `tField` pour le Role gouvernance

**Files:**
- Modify: composants qui affichent `Role` (structure.jsx pour la gouvernance, vue-par-axe.jsx pour les coresponsables si applicable)

- [ ] **Step 17.1 : Repérer**

```bash
grep -rn "'Role'\|membre\.role\|m\.Role" js/ | head -20
```

- [ ] **Step 17.2 : Remplacer**

```jsx
// avant
{membre.Role}
// après
{tField(membre, 'Role')}
```

- [ ] **Step 17.3 : Tester**

`#structure&lang=en` : les rôles s'affichent en anglais.

- [ ] **Step 17.4 : Commit**

```bash
git add js/
git commit -m "i18n : tField() pour Role dans la gouvernance"
```

---

## Task 18 — Bump VERSION + QA visuelle complète

**Files:**
- Modify: `index.html`

- [ ] **Step 18.1 : Bump VERSION**

```bash
sed -i '' "s/var VERSION = '6.2';/var VERSION = '7.0';/" index.html
grep "VERSION = " index.html
```

- [ ] **Step 18.2 : Servir en local et hard refresh**

```bash
python3 -m http.server 8000 &
SERVER_PID=$!
```

Dans Chrome : `http://localhost:8000` → Cmd+Shift+R.

- [ ] **Step 18.3 : Checklist QA (depuis spec § 10)**

- [ ] Clic toggle : tous les onglets se traduisent
- [ ] Navigation vers `http://localhost:8000/#par-axe?entite=A2&lang=en` direct → s'ouvre en EN
- [ ] Switch FR→EN sur `#par-axe?entite=A2` → URL devient `#par-axe?entite=A2?lang=en`
- [ ] Switch EN→FR → URL redevient `#par-axe?entite=A2` (param `lang` retiré)
- [ ] Reload page → langue préservée (via localStorage)
- [ ] Vue par axe en EN — A2 : sigle `A2`, nom « Modelling and numerical methods », OS en EN, chantiers en EN (« Networking and consultation »), actions en EN
- [ ] Vue par chantier en EN : noms + descriptions + sous-projets traduits
- [ ] Suivi en EN : badges + pills + filtres traduits
- [ ] Structure en EN : descriptions + gouvernance (rôles) traduits
- [ ] Légende du Sankey en EN : « completed / in progress / not started »
- [ ] Dark mode fonctionne en EN

- [ ] **Step 18.4 : Stopper le serveur**

```bash
kill $SERVER_PID
```

- [ ] **Step 18.5 : Commit + push**

```bash
git add index.html
git commit -m "i18n : VERSION 7.0 + QA visuelle bilingue OK"
git push origin bilingue-fr-en
```

---

## Task 19 — Demander à Tess de tester localement

- [ ] **Step 19.1 : Lui envoyer les commandes de test**

> « Branche `bilingue-fr-en` poussée. Pour tester en local :
> ```
> git fetch origin && git checkout bilingue-fr-en && git pull
> python3 -m http.server 8000
> ```
> Puis ouvrir `http://localhost:8000` et faire le tour des vues en FR puis en EN. Dis-moi si tu vois des points à corriger. »

- [ ] **Step 19.2 : Itérer sur les retours**

Pour chaque point soulevé : créer un commit ciblé sur la branche.

- [ ] **Step 19.3 : Merge vers main (quand validé)**

```bash
git checkout main
git pull origin main
git merge bilingue-fr-en --no-ff -m "Bilinguisation FR/EN du site (toggle + UI + données)"
git push origin main
```

- [ ] **Step 19.4 : Supprimer la branche feature (optionnel)**

```bash
git branch -d bilingue-fr-en
git push origin --delete bilingue-fr-en
```

---

## Convention de commit

Tous les commits sur cette branche :
- Auteur : **TessRSN**
- Co-Authored-By : **AUCUN** (ne jamais ajouter)
- Messages : en français, préfixés `i18n : ` quand applicable

Avant chaque push, vérifier l'auth GitHub active :

```bash
gh auth status 2>&1 | grep "Active account"
# attendu : TessRSN active
```

Si ce n'est pas le cas : `gh auth switch -h github.com -u TessRSN`.
