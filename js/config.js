const { useState, useMemo, useEffect, useRef, useCallback } = React;

// ── Configuration statique des axes et chantiers (graphe radial) ──
const AXES_CONFIG = [
  { id: 'A1', name: 'Plateformes numériques', fullName: 'Axe 1 : Plateformes numériques et gouvernance', type: 'axe', color: '#3B82F6' },
  { id: 'A2', name: 'Modélisation et méthodes', fullName: 'Axe 2 : Modélisation et méthodes numériques', type: 'axe', color: '#8B5CF6' },
  { id: 'A3', name: 'Interventions numériques', fullName: 'Axe 3 : Interventions numériques', type: 'axe', color: '#EC4899' },
  { id: 'A4', name: 'Transformation numérique', fullName: 'Axe 4 : Transformation numérique', type: 'axe', color: '#F59E0B' },
  { id: 'CA-FORM', name: 'Formation', fullName: "Champ d'action : Formation interdisciplinaire", type: 'champ', color: '#10B981' },
  { id: 'CA-MOB', name: 'Mobilisation', fullName: "Champ d'action : Mobilisation des connaissances", type: 'champ', color: '#14B8A6' },
  { id: 'CA-RENF', name: 'Renforcement', fullName: "Champ d'action : Renforcement des capacités", type: 'champ', color: '#06B6D4' },
  { id: 'PD-ENG', name: 'Engagement citoyen', fullName: 'Principe directeur : Engagement citoyen', type: 'principe', color: '#6366F1' },
  { id: 'PD-CONF', name: 'Numérique de confiance', fullName: 'Principe directeur : Numérique de confiance', type: 'principe', color: '#A855F7' },
  { id: 'PD-DUR', name: 'Santé durable', fullName: 'Principe directeur : Santé durable', type: 'principe', color: '#22C55E' },
  { id: 'PD-SCI', name: 'Science ouverte', fullName: 'Principe directeur : Science ouverte', type: 'principe', color: '#EAB308' },
  { id: 'PD-EDIA', name: 'EDIA', fullName: 'Principe directeur : EDIA', type: 'principe', color: '#EF4444' },
];

const CHANTIERS_CONFIG = [
  { id: 'C1', name: 'Guides & Outils', verb: 'PRODUIRE', color: '#2563EB', icon: '📘' },
  { id: 'C2', name: 'Répertoires', verb: 'RECENSER', color: '#7C3AED', icon: '🗺️' },
  { id: 'C3', name: 'Concertation', verb: 'CONNECTER', color: '#DB2777', icon: '🤝' },
  { id: 'C4', name: 'Formation', verb: 'FORMER', color: '#059669', icon: '🎓' },
  { id: 'C5', name: 'Consultation', verb: 'ÉCOUTER', color: '#0891B2', icon: '👂' },
  { id: 'C6', name: 'Influence', verb: 'CONVAINCRE', color: '#DC2626', icon: '📢' },
  { id: 'C7', name: 'Événements', verb: 'ANIMER', color: '#D97706', icon: '🎪' },
];

// ── Tables de correspondance CSV → IDs internes ──
const AXE_NAME_TO_ID = {};
AXES_CONFIG.forEach(a => { AXE_NAME_TO_ID[a.fullName] = a.id; });

const CHANTIER_NAME_TO_ID = {
  'Guides & Outils': 'C1',
  'Répertoires & Cartographie': 'C2',
  'Concertation & Maillage': 'C3',
  'Formation & Relève': 'C4',
  'Consultation & Écoute': 'C5',
  'Influence & Représentation': 'C6',
  'Événements & Rayonnement': 'C7',
};

// ── Objet vueGlobaleData — axes et chantiers statiques, actions chargées dynamiquement ──
const vueGlobaleData = {
  axes: AXES_CONFIG,
  chantiers: CHANTIERS_CONFIG,
  actions: [],   // sera rempli par le CSV au démarrage (actions approuvées uniquement)
};

// ── Statuts d'analyse ──
const STATUS = {
  keep:    { label: "Action source",  bg: "bg-gray-50",     border: "border-gray-200",    text: "text-gray-600",    dot: "bg-gray-400",    icon: "·",  hidden: true },
  rewrite: { label: "À réécrire",     bg: "bg-amber-50",    border: "border-amber-300",   text: "text-amber-800",   dot: "bg-amber-500",   icon: "✏️", hidden: false },
  gap:     { label: "Gap — À créer",  bg: "bg-red-50",      border: "border-red-300",     text: "text-red-800",     dot: "bg-red-500",     icon: "🔴", hidden: false },
  move:    { label: "À déplacer",     bg: "bg-sky-50",      border: "border-sky-300",     text: "text-sky-800",     dot: "bg-sky-500",     icon: "🔀", hidden: false },
};

const STATUS_DARK = {
  keep:    { label: "Action source",  bg: "bg-slate-800",   border: "border-slate-700",   text: "text-slate-400",   dot: "bg-slate-500",   icon: "·",  hidden: true },
  rewrite: { label: "À réécrire",     bg: "bg-amber-950",   border: "border-amber-700",   text: "text-amber-300",  dot: "bg-amber-400",   icon: "✏️", hidden: false },
  gap:     { label: "Gap — À créer",  bg: "bg-red-950",     border: "border-red-800",     text: "text-red-300",    dot: "bg-red-400",     icon: "🔴", hidden: false },
  move:    { label: "À déplacer",     bg: "bg-sky-950",     border: "border-sky-700",     text: "text-sky-300",    dot: "bg-sky-400",     icon: "🔀", hidden: false },
};

const getS = (status, darkMode) => darkMode ? STATUS_DARK[status] : STATUS[status];

// ── Statut de progression des objectifs ──
const PROGRESS = {
  'non démarré': { label: 'Non démarré', color: '#6b7280', bgLight: '#f3f4f6', bgDark: '#1e293b', borderLight: '#d1d5db', borderDark: '#475569', icon: '○' },
  'en cours':    { label: 'En cours',    color: '#f59e0b', bgLight: '#fffbeb', bgDark: '#451a03', borderLight: '#fcd34d', borderDark: '#92400e', icon: '◐' },
  'terminé':     { label: 'Terminé',     color: '#22c55e', bgLight: '#f0fdf4', bgDark: '#052e16', borderLight: '#86efac', borderDark: '#166534', icon: '●' },
};
