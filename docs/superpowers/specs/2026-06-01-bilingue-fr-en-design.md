# Bilinguisation FR/EN du site RSN — Design spec

**Date** : 2026-06-01
**Auteur** : TessRSN
**Statut** : approuvé par utilisateur, prêt pour writing-plans

---

## 1. Objectif

Rendre l'ensemble du site `tessrsn.github.io/chantiers/` accessible en anglais — UI complète + données métier (descriptions d'actions, noms de projets, libellés de chantiers, rôles de gouvernance) — avec un toggle FR/EN persistant à côté du toggle dark/light existant.

## 2. Contexte technique

- React 18 + Tailwind CDN + Babel standalone (pas de build step)
- Fichiers globaux chargés via `index.html` avec cache busting par `VERSION`
- Sources de vérité : `data.csv` (110+ lignes, 16 colonnes), `membres.csv` (41 lignes), `js/config.js`
- Routing : hash-based avec deep linking (`#par-axe?entite=A2`)
- Pas de framework i18n existant — tout à construire

## 3. Décisions structurantes (validées avec l'utilisateur)

| Décision | Choix |
|---|---|
| Phasage | **Tout en une fois** (UI + CSV + config) |
| Méthode de traduction | **Traduction manuelle** par l'agent en une passe (pas d'API externe) |
| Forme du toggle | **Icône globe SVG + label langue active** (`🌐 FR` / `🌐 EN`, mais SVG monochrome — pas d'emoji) |
| Persistance | **localStorage + URL hash** (`#par-axe?entite=A2&lang=en`) |
| Convention colonnes CSV | Suffixe ` EN` (avec espace) — ex. `Action réécrite EN` |
| Convention config.js | Suffixe `_en` sur les champs FR — ex. `name_en`, `description_en` |
| Fallback | Retombe sur FR si EN vide / clé manquante (jamais de placeholder visible) |

## 4. Architecture

### 4.1. Nouveau fichier `js/i18n.js`

Chargé via `index.html` après `config.js`, avant les composants. Expose :

```js
window.I18N = {
  fr: { 'app.title': '...', 'tab.par-axe': 'Vue par axe', ... },
  en: { 'app.title': '...', 'tab.par-axe': 'By axis', ... },
};

window.LANG = 'fr';  // résolu au boot depuis URL hash + localStorage

// Helper UI : retourne la chaîne traduite, fallback FR puis clé brute
window.t = (key) => I18N[LANG]?.[key] ?? I18N.fr[key] ?? key;

// Helper CSV : retourne row[baseColName + ' EN'] si EN actif et non-vide, sinon row[baseColName]
window.tField = (row, baseColName) => {
  if (LANG === 'en') {
    const en = row[baseColName + ' EN'];
    if (en && en.trim()) return en;
  }
  return row[baseColName] || '';
};

// Helper config : retourne obj[field + '_en'] si EN actif et non-vide, sinon obj[field]
window.tConfig = (obj, field) => {
  if (LANG === 'en') {
    const en = obj[field + '_en'];
    if (en && (typeof en !== 'string' || en.trim())) return en;
  }
  return obj[field];
};
```

### 4.2. Hook React `useLang`

Défini en haut de `app.jsx` (composant racine — le state propagera naturellement aux enfants par re-render) :

```js
function useLang() {
  const [lang, setLangState] = React.useState(window.LANG);
  const setLang = React.useCallback((newLang) => {
    window.LANG = newLang;
    setLangState(newLang);
    localStorage.setItem('rsn-lang', newLang);
    // re-écrire le hash avec le nouveau lang
    updateHashLang(newLang);
  }, []);
  return [lang, setLang];
}
```

L'app top-level utilise ce hook ; le re-render propage automatiquement aux enfants via React (les helpers `t`/`tField`/`tConfig` lisent `window.LANG` à chaque appel).

### 4.3. Résolution de la langue au boot

Code synchrone exécuté avant le premier render :

```js
function resolveInitialLang() {
  // 1. URL hash
  const m = location.hash.match(/[?&]lang=(fr|en)/);
  if (m) return m[1];
  // 2. localStorage
  const stored = localStorage.getItem('rsn-lang');
  if (stored === 'fr' || stored === 'en') return stored;
  // 3. défaut
  return 'fr';
}
window.LANG = resolveInitialLang();
```

Garantit qu'il n'y a **pas de flash FR→EN** au load.

### 4.4. Intégration au routing existant

Dans `app.jsx` :
- `parseHash` : extraire `lang` au même titre que `entite`, `project` (retourne `lang: 'en' | 'fr' | null`)
- `buildHash` : prend désormais aussi `lang` en paramètre et inclut `&lang=en` **seulement si non-FR** (URL propre par défaut quand FR)
- Tous les appels actuels à `buildHash` doivent passer la langue courante pour préserver `lang` dans l'URL lors de la navigation interne (clic sur pill, switch d'onglet, deep link interne)

## 5. UI du toggle

Emplacement : dans `app.jsx`, **juste à gauche** du toggle dark/light actuel (autour ligne 212).

```jsx
<button
  onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
  aria-label={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
  title={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
  style={{ /* exactement le même style que le toggle dark/light */ }}
>
  <GlobeIcon size={14} />
  {lang.toUpperCase()}
</button>
```

Composant `GlobeIcon` : SVG inline monochrome (`currentColor`), méridiens + parallèle, ~20 lignes.

## 6. Structure des données traduites

### 6.1. `data.csv` — 3 nouvelles colonnes

| Colonne FR existante | Nouvelle colonne EN |
|---|---|
| `Action originale` | `Action originale EN` |
| `Action réécrite` | `Action réécrite EN` |
| `Description projet` | `Description projet EN` |

**Non traduit** : `ID Action`, `Projet`, `Statut analyse`, `Approuvé`, `Confiance`, `Destination`, `Notes analyse`, `Raison` (métadonnées internes ou non affichées). Les colonnes `Axe`, `Chantier suggéré`, `Objectif stratégique`, `Statut objectif`, `Nom projet` sont des clés de jointure — la traduction vit dans `config.js`.

### 6.2. `membres.csv` — 1 nouvelle colonne

| Colonne FR | Nouvelle colonne EN |
|---|---|
| `Role` | `Role EN` |

`Nom`, `Initiales`, `Affiliation` inchangés (noms propres).

### 6.3. `config.js` — champs `_en` ajoutés

Pour chaque entrée qui contient du texte affiché :

```js
// Exemple : CHANTIERS_CONFIG (sous-projets)
{
  id: 'G1',
  name: 'Harmonisation des bonnes pratiques méthodologiques',
  name_en: 'Harmonization of methodological best practices',
  description: '...',
  description_en: '...',
}
```

S'applique à :
- `AXES_CONFIG` (12 entités : axes, PDs, CAs) — noms complets + descriptions
- `CHANTIERS_CONFIG` (7 chantiers transversaux) — noms + descriptions
- Sous-projets (~30) — noms + descriptions
- Objectifs stratégiques par axe (OS1/OS2/OS3) — libellés + descriptions
- `PROGRESS` (labels statuts : « Terminé » / « En cours » / « Non démarré »)
- Toute autre constante affichée

## 7. Terminologie fixée

Pour la cohérence de toute la traduction :

| FR | EN |
|---|---|
| Axe | Axis |
| Principe directeur | Guiding principle |
| Champ d'action | Field of action |
| Chantier transversal | Cross-cutting workstream |
| Objectif stratégique (OS) | Strategic objective (SO) |
| Sous-objectif | Sub-objective |
| Feuille de route | Roadmap |
| Coresponsable / Colead | Co-lead |
| Codirecteur / Codirectrice | Co-director |
| Maillage et concertation | Networking and consultation |
| Guides & outils | Guides & tools |
| Répertoires & cartographie | Directories & mapping |
| Formation | Training |
| Écoute et consultation | Listening and consultation |
| Influence | Advocacy |
| Événements | Events |

**Codes non traduits** : `OS1/OS2/OS3` (codes), `G1`, `R1`, `M1`, `F1`, `É1`, `É2`, `É3`, `I1`, `I2`, `Év1`, `Év2`, `Év3` (codes projets — préfixes lettrés FR conservés universellement).

## 8. Scope de traduction (volume)

| Source | Volume estimé |
|---|---|
| Composants JSX (`*.jsx`) | ~120 chaînes |
| `config.js` (chantiers, sous-projets, entités, OS, statuts) | ~80 chaînes |
| `data.csv` colonne `Action réécrite EN` | ~110 lignes |
| `data.csv` colonne `Description projet EN` | ~30 lignes (souvent dérivée de config) |
| `data.csv` colonne `Action originale EN` | ~10-20 lignes (la plupart vides — utilisé seulement en fallback de « réécrite ») |
| `membres.csv` colonne `Role EN` | 41 lignes (peu d'uniques : ~5 patterns répétés) |

**Total** : ~400 chaînes traduites.

**Hors scope** : mails du comité (`mails-comite-12juin/`, gitignored — restent FR + EN figés tels quels), PPTX rempli (livrable séparé).

## 9. Comportement de fallback

| Cas | Comportement |
|---|---|
| `t('clé.inconnue')` | Retourne la clé brute |
| `tField(row, 'Action réécrite')` avec EN vide | Retombe sur le FR |
| `tConfig(obj, 'name')` avec `name_en` absent ou vide | Retombe sur `obj.name` |
| URL avec `lang=fr` mais utilisateur a `en` en localStorage | URL gagne → switch sur FR + persistence FR |

Garantie : **le site reste toujours utilisable** même avec traductions partielles.

## 10. Tests / vérification manuelle

- [ ] Cliquer le toggle → tous les onglets se traduisent
- [ ] Naviguer vers `#par-axe?entite=A2&lang=en` direct → s'ouvre en EN
- [ ] Switch FR→EN sur `#par-axe?entite=A2` → URL devient `#par-axe?entite=A2&lang=en`
- [ ] Switch EN→FR → URL redevient `#par-axe?entite=A2` (param `lang` retiré)
- [ ] Recharger la page → langue préservée (via localStorage)
- [ ] Vue par axe en EN : sigle « A2 », nom traduit, OS traduits, chantiers traduits, actions traduites
- [ ] Vue par chantier en EN : noms + descriptions + sous-projets traduits
- [ ] Suivi en EN : badges + pills traduits
- [ ] Structure en EN : descriptions + gouvernance traduits
- [ ] Légende du Sankey en EN (« completed / in progress / not started »)
- [ ] Dark mode fonctionne en EN

## 11. Déploiement & versioning

- Bump `VERSION` dans `index.html` à `7.0` (changement structurel majeur)
- Commits TessRSN (pas de Co-Authored-By Claude)
- Push direct sur `main` (pas de PR)
- Mails et PPTX restent gitignored

## 12. Hors scope explicite

- Traduction automatique runtime (Claude API au moment du clic)
- Détection automatique de la langue navigateur (`navigator.language`)
- Sélecteur de langue mémorisé par profil utilisateur (pas de notion de user account)
- Support d'autres langues que FR/EN
- Traduction des mails comité
- Traduction du PPTX comité
