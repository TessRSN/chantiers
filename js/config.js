const { useState, useMemo, useEffect, useRef, useCallback } = React;

// ── Configuration statique des axes et chantiers (graphe radial) ──
const AXES_CONFIG = [
  { id: 'A1', name: 'Plateformes numériques',  name_en: 'Digital platforms',          fullName: 'Axe 1 : Plateformes numériques et gouvernance',  fullName_en: 'Axis 1: Digital platforms and governance',          type: 'axe', color: '#3B82F6' },
  { id: 'A2', name: 'Modélisation et méthodes', name_en: 'Modelling and methods',     fullName: 'Axe 2 : Modélisation et méthodes numériques',     fullName_en: 'Axis 2: Modelling and numerical methods',           type: 'axe', color: '#8B5CF6' },
  { id: 'A3', name: 'Interventions numériques', name_en: 'Digital interventions',     fullName: 'Axe 3 : Interventions numériques',                fullName_en: 'Axis 3: Digital interventions',                     type: 'axe', color: '#EC4899' },
  { id: 'A4', name: 'Transformation numérique', name_en: 'Digital transformation',    fullName: 'Axe 4 : Transformation numérique',                fullName_en: 'Axis 4: Digital transformation',                    type: 'axe', color: '#F59E0B' },
  { id: 'CA-FORM',  name: 'Formation',     name_en: 'Training',                  fullName: "Champ d'action : Formation interdisciplinaire",       fullName_en: 'Field of action: Interdisciplinary training',           type: 'champ',    color: '#10B981' },
  { id: 'CA-MOB',   name: 'Mobilisation',  name_en: 'Knowledge mobilization',    fullName: "Champ d'action : Mobilisation des connaissances",     fullName_en: 'Field of action: Knowledge mobilization',               type: 'champ',    color: '#14B8A6' },
  { id: 'CA-RENF',  name: 'Renforcement',  name_en: 'Capacity building',         fullName: "Champ d'action : Renforcement des capacités",         fullName_en: 'Field of action: Capacity building',                    type: 'champ',    color: '#06B6D4' },
  { id: 'PD-ENG',   name: 'Engagement citoyen',     name_en: 'Citizen engagement',         fullName: 'Principe directeur : Engagement citoyen',     fullName_en: 'Guiding principle: Citizen engagement',          type: 'principe', color: '#6366F1' },
  { id: 'PD-CONF',  name: 'Numérique de confiance', name_en: 'Trustworthy digital',        fullName: 'Principe directeur : Numérique de confiance', fullName_en: 'Guiding principle: Trustworthy digital',         type: 'principe', color: '#A855F7' },
  { id: 'PD-DUR',   name: 'Santé durable',          name_en: 'Sustainable health',         fullName: 'Principe directeur : Santé durable',          fullName_en: 'Guiding principle: Sustainable health',          type: 'principe', color: '#22C55E' },
  { id: 'PD-SCI',   name: 'Science ouverte',        name_en: 'Open science',               fullName: 'Principe directeur : Science ouverte',        fullName_en: 'Guiding principle: Open science',                type: 'principe', color: '#EAB308' },
  { id: 'PD-EDIA',  name: 'EDIA',                   name_en: 'EDIA',                       fullName: 'Principe directeur : EDIA',                   fullName_en: 'Guiding principle: EDIA (equity, diversity, inclusion, accessibility)', type: 'principe', color: '#EF4444' },
];

const CHANTIERS_CONFIG = [
  { id: 'C1', name: 'Guides & Outils',           name_en: 'Guides & Tools',                verb: 'PRODUIRE',   verb_en: 'PRODUCE',  color: '#2563EB', icon: '📘' },
  { id: 'C2', name: 'Répertoires',               name_en: 'Directories',                   verb: 'RECENSER',   verb_en: 'MAP',      color: '#7C3AED', icon: '🗺️' },
  { id: 'C3', name: 'Maillage et Concertation',  name_en: 'Networking & Consultation',     verb: 'CONNECTER',  verb_en: 'CONNECT',  color: '#DB2777', icon: '🤝' },
  { id: 'C4', name: 'Formation',                 name_en: 'Training',                      verb: 'FORMER',     verb_en: 'TRAIN',    color: '#059669', icon: '🎓' },
  { id: 'C5', name: 'Écoute et Consultation',    name_en: 'Listening & Consultation',      verb: 'ÉCOUTER',    verb_en: 'LISTEN',   color: '#0891B2', icon: '👂' },
  { id: 'C6', name: 'Influence',                 name_en: 'Advocacy',                      verb: 'CONVAINCRE', verb_en: 'ADVOCATE', color: '#DC2626', icon: '📢' },
  { id: 'C7', name: 'Événements',                name_en: 'Events',                        verb: 'ANIMER',     verb_en: 'ENGAGE',   color: '#D97706', icon: '🎪' },
];

// ── Tables de correspondance CSV → IDs internes ──
const AXE_NAME_TO_ID = {};
AXES_CONFIG.forEach(a => { AXE_NAME_TO_ID[a.fullName] = a.id; });

const CHANTIER_NAME_TO_ID = {
  'Guides & Outils': 'C1',
  'Répertoires & Cartographie': 'C2',
  'Maillage et Concertation': 'C3',
  'Concertation & Maillage': 'C3',  // backward compat
  'Formation & Relève': 'C4',
  'Écoute et Consultation': 'C5',
  'Consultation & Écoute': 'C5',  // backward compat
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
  keep:    { label: "Action source",  bg: "bg-indigo-50",   border: "border-indigo-200",  text: "text-indigo-600",  dot: "bg-indigo-400",  icon: "·",  hidden: true },
  rewrite: { label: "À réécrire",     bg: "bg-amber-50",    border: "border-amber-300",   text: "text-amber-800",   dot: "bg-amber-500",   icon: "✏️", hidden: false },
  gap:     { label: "Gap — À créer",  bg: "bg-red-50",      border: "border-red-300",     text: "text-red-800",     dot: "bg-red-500",     icon: "🔴", hidden: false },
  move:    { label: "À déplacer",     bg: "bg-sky-50",      border: "border-sky-300",     text: "text-sky-800",     dot: "bg-sky-500",     icon: "🔀", hidden: false },
};

const STATUS_DARK = {
  keep:    { label: "Action source",  bg: "bg-slate-700",   border: "border-slate-600",   text: "text-slate-100",   dot: "bg-slate-400",   icon: "·",  hidden: true },
  rewrite: { label: "À réécrire",     bg: "bg-amber-950",   border: "border-amber-700",   text: "text-amber-300",  dot: "bg-amber-400",   icon: "✏️", hidden: false },
  gap:     { label: "Gap — À créer",  bg: "bg-red-950",     border: "border-red-800",     text: "text-red-300",    dot: "bg-red-400",     icon: "🔴", hidden: false },
  move:    { label: "À déplacer",     bg: "bg-sky-950",     border: "border-sky-700",     text: "text-sky-300",    dot: "bg-sky-400",     icon: "🔀", hidden: false },
};

const getS = (status, darkMode) => darkMode ? STATUS_DARK[status] : STATUS[status];

// ── Statut de progression des objectifs ──
const PROGRESS = {
  'non démarré': { label: 'Non démarré', label_en: 'Not started', color: '#6b7280', bgLight: '#f3f4f6', bgDark: '#1e293b', borderLight: '#d1d5db', borderDark: '#475569', icon: '○' },
  'en cours':    { label: 'En cours',    label_en: 'In progress', color: '#f59e0b', bgLight: '#fffbeb', bgDark: '#451a03', borderLight: '#fcd34d', borderDark: '#92400e', icon: '◐' },
  'terminé':     { label: 'Terminé',     label_en: 'Completed',   color: '#22c55e', bgLight: '#f0fdf4', bgDark: '#052e16', borderLight: '#86efac', borderDark: '#166534', icon: '●' },
};
