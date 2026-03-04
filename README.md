# RSN — Tableau de bord des chantiers transversaux

Application web interactive pour le **Réseau en santé numérique (RSN)** — visualisation et analyse des 97 actions stratégiques réparties sur 7 chantiers transversaux, 4 axes thématiques, 3 champs d'action et 5 principes directeurs.

**[Voir l'application en ligne](https://tessrsn.github.io/chantiers/)**

---

## Fonctionnalités

### Vue globale (graphe radial)

Visualisation SVG interactive des connexions entre axes, chantiers et effets stratégiques. Recherche par mot-clé, sélection de nœuds avec panneau de détail contextuel.

### Analyse des chantiers

Outil d'analyse chantier par chantier permettant d'évaluer chaque action du fichier source selon quatre statuts :

| Statut | Signification |
|--------|---------------|
| ✅ À garder | Action bien formulée, bien placée |
| ✏️ À réécrire | Action pertinente mais à reformuler |
| 🔴 Gap — À créer | Action manquante identifiée par l'analyse |
| 🔀 À déplacer | Action mal classée, à rediriger vers un autre chantier |

Chaque chantier regroupe ses actions en **projets thématiques** avec un **parking lot** pour les actions à rediriger.

#### Progression de l'analyse

| # | Chantier | Verbe | Actions | Statut |
|---|----------|-------|---------|--------|
| 1 | Guides & Outils | PRODUIRE | 22 | ✅ Complété |
| 2 | Répertoires & Cartographie | RECENSER | 20 | ○ En attente |
| 3 | Concertation & Maillage | CONNECTER | 20 | ○ En attente |
| 4 | Formation & Relève | FORMER | 2 | ○ En attente |
| 5 | Consultation & Écoute | ÉCOUTER | 16 | ○ En attente |
| 6 | Influence & Représentation | CONVAINCRE | 6 | ○ En attente |
| 7 | Événements & Rayonnement | ANIMER | 11 | ○ En attente |

## Stack technique

Fichier HTML unique, sans build ni bundler :

- **React 18** (CDN) + **Babel standalone** pour JSX en navigateur
- **Tailwind CSS** (CDN) pour le styling utilitaire
- **SVG natif** pour le graphe radial
- Dark mode intégré (défaut : sombre)

## Déploiement

Le site est servi automatiquement via **GitHub Pages** depuis la branche `main`. Tout push sur `main` met à jour le site en ligne.

## Structure

```
index.html    ← Application complète (React + données + styles)
README.md     ← Ce fichier
```

---

*Réseau en santé numérique — RIMUHC*
