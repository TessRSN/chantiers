# RSN — Tableau de bord des chantiers transversaux

Application web interactive pour le **Réseau en santé numérique (RSN)** — visualisation et analyse des 97 actions stratégiques réparties sur 7 chantiers transversaux, 4 axes thématiques, 3 champs d'action et 5 principes directeurs.

**[Voir l'application en ligne](https://tessrsn.github.io/chantiers/)**

---

## Fonctionnalités

### Structure & Gouvernance

Visualisation SVG interactive de la structure scientifique du RSN : axes, champs d'action, principes directeurs. Panneaux dépliants pour la direction, les comités et les responsables par entité.

### Vue globale (graphe radial)

Graphe radial SVG des connexions entre axes, chantiers et effets stratégiques. Recherche par mot-clé, sélection de nœuds avec panneau de détail contextuel.

### Analyse des chantiers

Outil d'analyse chantier par chantier permettant d'évaluer chaque action du fichier source selon quatre statuts :

| Statut | Signification |
|--------|---------------|
| ✅ À garder | Action bien formulée, bien placée |
| ✏️ À réécrire | Action pertinente mais à reformuler |
| 🔴 Gap — À créer | Action manquante identifiée par l'analyse |
| 🔀 À déplacer | Action mal classée, à rediriger vers un autre chantier |

Chaque chantier regroupe ses actions en **projets thématiques** avec un **parking lot** pour les actions à rediriger.

### Suivi des objectifs

Vue par statut de progression (terminé / en cours / non démarré) avec barre de progression et recherche.

## Stack technique

Sans build ni bundler — tout tourne dans le navigateur :

- **React 18** (CDN) + **Babel standalone** pour JSX en navigateur
- **Tailwind CSS** (CDN) pour le styling utilitaire
- **SVG natif** pour les graphes radiaux
- Dark mode intégré (défaut : sombre)
- Loader dans `index.html` : fetch des fichiers JS/JSX, concaténation, Babel transform, eval

## Données

- **`data.csv`** — Actions stratégiques (ID, axe, objectif, chantier, statut, projet, progression...)
- **`membres.csv`** — Membres du réseau (nom, initiales, affiliation, rôle, groupes)

Les données sont chargées dynamiquement au démarrage via `fetch()`.

## Structure

```
index.html              ← Loader (~40 lignes : HTML + fetch-concat-transform)
js/
├── config.js           ← Constantes, configs axes/chantiers, hooks React
├── data.js             ← Parsing CSV, builders de données
├── components/
│   ├── shared.jsx      ← ProgressBadge, StatusBadge, ActionDetail
│   ├── analyse.jsx     ← ActionRow, ProjectCard, ParkingLot, AnalyseChantiers
│   ├── vue-globale.jsx ← RSNRadialGraph
│   ├── suivi.jsx       ← SuiviObjectifs
│   └── structure.jsx   ← StructureGouvernance, MemberCard, GovBox
└── app.jsx             ← MainApp (tabs, dark mode, CSV loading) + render
data.csv                ← Données des actions stratégiques
membres.csv             ← Données des membres du réseau
photos/                 ← Photos des membres (initiales.jpg ou .png)
```

## Développement

Pour tester localement (fetch ne marche pas en `file://`) :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Pour ajouter un composant : créer le fichier `.jsx` dans `js/components/`, puis l'ajouter au tableau `modules` dans `index.html`.

## Déploiement

Le site est servi automatiquement via **GitHub Pages** depuis la branche `main`. Tout push sur `main` met à jour le site en ligne.

---

*Réseau en santé numérique — RIMUHC*
