// ── Parseur CSV minimal (gère les virgules dans les guillemets) ──
function parseCSV(text) {
  const lines = text.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

// ── Traductions des noms de sous-projets (clé : Nom projet FR) ──
const NOM_PROJET_EN = {
  'Harmonisation des bonnes pratiques méthodologiques': 'Harmonization of methodological best practices',
  'Lexique RSN — Définitions communes': 'RSN Lexicon — Shared definitions',
  'Grilles de référence par principe directeur': 'Reference grids per guiding principle',
  'Infrastructure Science ouverte': 'Open Science infrastructure',
  'Guides de gouvernance': 'Governance guides',
  'Baromètre numérique': 'Digital barometer',
  'Répertoire des expertises, actifs et infrastructures RSN': 'Directory of RSN expertise, assets and infrastructure',
  'Inventaire des formations en santé numérique': 'Inventory of digital health training programs',
  'Répertoire des outils et ressources thématiques': 'Directory of thematic tools and resources',
  'Tables de concertation thématiques': 'Thematic consultation tables',
  'Comités et structures participatives': 'Committees and participatory structures',
  'Communautés de pratique et réseaux collaboratifs': 'Communities of practice and collaborative networks',
  'Partenariats externes et maillage inter-sectoriel': 'External partnerships and cross-sectoral networking',
  'Formations et ressources éducatives': 'Training and educational resources',
  'Événements et programmes de formation': 'Training events and programs',
  'Consultations des besoins par public cible': 'Needs consultations by target audience',
  'Engagement citoyen et coconstruction': 'Citizen engagement and co-construction',
  'Sondages et outils de collecte': 'Surveys and data-collection tools',
  'Plaidoyers et prises de position': 'Advocacy and position statements',
  'Représentation dans les instances': 'Representation in governance bodies',
  'Événements organisés par le RSN': 'Events hosted by the RSN',
  'Participations et interventions externes': 'External participations and engagements',
  'Communications et contenus de diffusion': 'Communications and outreach content',
};

// ── Chargement CSV → toutes les lignes enrichies (avec versions EN si présentes) ──
function csvRowsToAllData(rows) {
  return rows.map(row => ({
    id: row['ID Action'],
    axe: AXE_NAME_TO_ID[row['Axe']] || row['Axe'],
    chantier: CHANTIER_NAME_TO_ID[row['Chantier suggéré']] || row['Chantier suggéré'],
    action:          row['Action réécrite']    || row['Action originale']    || '',
    action_en:       row['Action réécrite EN'] || row['Action originale EN'] || '',
    actionOriginale:    row['Action originale']    || '',
    actionOriginale_en: row['Action originale EN'] || '',
    objectif: row['Objectif stratégique'],
    axeFullName: row['Axe'],
    chantierFullName: row['Chantier suggéré'],
    // Champs analyse
    statusAnalyse: row['Statut analyse'] || '',
    projet: row['Projet'] || '',
    nomProjet:    row['Nom projet'] || '',
    nomProjet_en: NOM_PROJET_EN[(row['Nom projet'] || '').trim()] || row['Nom projet'] || '',
    descriptionProjet:    row['Description projet']    || '',
    descriptionProjet_en: row['Description projet EN'] || '',
    notesAnalyse: row['Notes analyse'] || '',
    destination: row['Destination'] || '',
    approuve: (row['Approuvé'] || 'oui').toLowerCase(),
    statutObjectif: row['Statut objectif'] || 'non démarré',
  }));
}

// ── Construire GOUVERNANCE_DATA depuis membres.csv ──
function buildGouvernanceFromCSV(rows) {
  const result = {
    direction: [],
    comites: [
      { id: 'comite-sci',  name: 'Comité scientifique', name_en: 'Scientific Committee',  responsables: [] },
      { id: 'comite-avis', name: 'Comité aviseur',      name_en: 'Advisory Committee',    responsables: [] },
      { id: 'comite-etud', name: 'Comité étudiants',    name_en: 'Student Committee',     responsables: [] },
      { id: 'comite-cit',  name: 'Comité citoyen',      name_en: 'Citizen Committee',     responsables: [] },
      { id: 'patients-part', name: 'Patients partenaires', name_en: 'Patient partners', responsables: [] },
    ],
    axes: [
      { id: 'A1', shortName: 'Axe 1', shortName_en: 'Axis 1', name: 'Plateformes numériques et gouvernance informationnelle', name_en: 'Digital platforms and information governance', label: 'Plateformes', label_en: 'Platforms', description: 'Générer et gérer des données de qualité et de confiance', description_en: 'Generate and manage high-quality, trustworthy data', color: '#3B82F6', responsables: [] },
      { id: 'A2', shortName: 'Axe 2', shortName_en: 'Axis 2', name: 'Modélisation et méthodes numériques', name_en: 'Modelling and numerical methods', label: 'Modélisation', label_en: 'Modelling', description: "Création et validation d'algorithmes, incluant la modélisation mathématique, les méthodes statistiques et l'IA", description_en: "Creation and validation of algorithms, including mathematical modelling, statistical methods and AI", color: '#8B5CF6', responsables: [] },
      { id: 'A3', shortName: 'Axe 3', shortName_en: 'Axis 3', name: 'Interventions numériques', name_en: 'Digital interventions', label: 'Interventions', label_en: 'Interventions', description: "Cycle de vie des interventions numériques, synthèses des évidences, de la conception à l'implantation, incluant l'adoption et la mise à l'échelle", description_en: "Life cycle of digital interventions, evidence synthesis, from design to implementation, including adoption and scaling", color: '#EC4899', responsables: [] },
      { id: 'A4', shortName: 'Axe 4', shortName_en: 'Axis 4', name: 'Transformation numérique', name_en: 'Digital transformation', label: 'Transformation', label_en: 'Transformation', description: 'Transformation des organisations, du système et des politiques soutenant le cycle de vie des interventions numériques', description_en: 'Transformation of organizations, the system and policies supporting the digital intervention life cycle', color: '#F59E0B', responsables: [] },
    ],
    champs: [
      { id: 'CA-RENF', name: 'Renforcement', name_en: 'Capacity building',     fullName: 'Renforcement des capacités',    fullName_en: 'Capacity building',          label: 'Renforcement',  label_en: 'Capacity',     color: '#10B981', responsables: [] },
      { id: 'CA-FORM', name: 'Formation',    name_en: 'Training',              fullName: 'Formation interdisciplinaire',  fullName_en: 'Interdisciplinary training', label: 'Formation',     label_en: 'Training',     color: '#14B8A6', responsables: [] },
      { id: 'CA-MOB',  name: 'Mobilisation', name_en: 'Knowledge mobilization',fullName: 'Mobilisation des connaissances',fullName_en: 'Knowledge mobilization',     label: 'Mobilisation',  label_en: 'Mobilization', color: '#06B6D4', responsables: [] },
    ],
    principes: [
      { id: 'PD-EDIA', name: 'EDIA',            name_en: 'EDIA',                  fullName: 'Équité, Diversité, Inclusion, Accessibilité', fullName_en: 'Equity, Diversity, Inclusion, Accessibility', label: 'EDIA',         label_en: 'EDIA',         color: '#EF4444', responsables: [] },
      { id: 'PD-CONF', name: 'Num. confiance',  name_en: 'Trust',                 fullName: 'Numérique de confiance',                       fullName_en: 'Trustworthy digital',                        label: 'Confiance',     label_en: 'Trust',        color: '#A855F7', responsables: [] },
      { id: 'PD-ENG',  name: 'Engagement',      name_en: 'Engagement',            fullName: 'Engagement citoyen',                           fullName_en: 'Citizen engagement',                         label: 'Engagement',    label_en: 'Engagement',   color: '#6366F1', responsables: [] },
      { id: 'PD-DUR',  name: 'Santé durable',   name_en: 'Sustainable health',    fullName: 'Santé durable',                                fullName_en: 'Sustainable health',                         label: 'Santé durable', label_en: 'Sustainable',  color: '#22C55E', responsables: [] },
      { id: 'PD-SCI',  name: 'Science ouverte', name_en: 'Open science',          fullName: 'Science ouverte',                              fullName_en: 'Open science',                               label: 'Science ouv.',  label_en: 'Open science', color: '#EAB308', responsables: [] },
    ],
  };

  const comiteMap = {
    'Comité scientifique': 'comite-sci',
    'Comité aviseur': 'comite-avis',
    'Comité étudiants': 'comite-etud',
    'Comité citoyen': 'comite-cit',
    'Patients partenaires': 'patients-part',
  };

  rows.forEach(row => {
    const person = { name: row['Nom'], initials: row['Initiales'], affiliation: row['Affiliation'] || '' };
    if (row['Role']) {
      person.role = row['Role'];
      person.role_en = row['Role EN'] || '';
    }

    const groupes = (row['Groupes'] || '').split(';').map(g => g.trim()).filter(Boolean);
    groupes.forEach(g => {
      if (g === 'Direction') { result.direction.push({ ...person }); return; }
      const comiteId = comiteMap[g];
      if (comiteId) { result.comites.find(c => c.id === comiteId).responsables.push({ ...person }); return; }
      const axe = result.axes.find(a => a.id === g);
      if (axe) { axe.responsables.push({ ...person }); return; }
      const champ = result.champs.find(c => c.id === g);
      if (champ) { champ.responsables.push({ ...person }); return; }
      const principe = result.principes.find(p => p.id === g);
      if (principe) { principe.responsables.push({ ...person }); return; }
    });
  });

  return result;
}

// ── Construire ANALYSE_DATA dynamiquement depuis les lignes CSV ──
function buildAnalyseData(allRows) {
  const byChantier = {};

  allRows.forEach(row => {
    const chantierId = row.chantier;
    if (!byChantier[chantierId]) byChantier[chantierId] = { projets: {}, parking: [], orphans: [] };

    // Parking lot : actions avec une destination (status = move)
    if (row.destination) {
      byChantier[chantierId].parking.push({
        id: row.id, axe: row.axeFullName, objectif: row.objectif,
        action: row.action, destination: row.destination,
        notes: row.notesAnalyse, status: 'move',
        statutObjectif: row.statutObjectif,
      });
      return;
    }

    // Actions assignées à un projet
    if (row.projet) {
      if (!byChantier[chantierId].projets[row.projet]) {
        byChantier[chantierId].projets[row.projet] = {
          id: row.projet,
          name:    row.nomProjet,
          name_en: row.nomProjet_en,
          description:    row.descriptionProjet,
          description_en: row.descriptionProjet_en,
          actions: [],
        };
      }
      byChantier[chantierId].projets[row.projet].actions.push({
        id: row.id, axe: row.axeFullName, objectif: row.objectif,
        action:    row.action,
        action_en: row.action_en,
        status: row.statusAnalyse || 'keep',
        notes: row.notesAnalyse,
        statutObjectif: row.statutObjectif,
      });
    } else {
      // Actions sans projet ni destination (ex: à réécrire)
      byChantier[chantierId].orphans.push({
        id: row.id, axe: row.axeFullName, objectif: row.objectif,
        action:    row.action,
        action_en: row.action_en,
        status: row.statusAnalyse || 'keep',
        notes: row.notesAnalyse,
        statutObjectif: row.statutObjectif,
      });
    }
  });

  // Convertir en format attendu par les composants (clé numérique = id chantier)
  const result = {};
  const chantierIdToNum = { C1: 1, C2: 2, C3: 3, C4: 4, C5: 5, C6: 6, C7: 7 };
  Object.entries(byChantier).forEach(([cId, data]) => {
    const num = chantierIdToNum[cId];
    if (!num) return;
    const projects = Object.values(data.projets);
    if (projects.length === 0 && data.parking.length === 0 && data.orphans.length === 0) return;
    result[num] = { projects, parkingLot: data.parking, orphans: data.orphans };
  });

  return result;
}

// ── Construire CHANTIERS_META dynamiquement ──
function buildChantiersMeta(allRows, analyseData) {
  const verbMap   = { C1: 'PRODUIRE',           C2: 'RECENSER',                  C3: 'CONNECTER',                C4: 'FORMER',           C5: 'ÉCOUTER',                  C6: 'CONVAINCRE',                C7: 'ANIMER' };
  const verbMapEn = { C1: 'PRODUCE',            C2: 'MAP',                       C3: 'CONNECT',                  C4: 'TRAIN',            C5: 'LISTEN',                   C6: 'ADVOCATE',                  C7: 'ENGAGE' };
  const nameMap   = { C1: 'Guides & Outils',    C2: 'Répertoires & Cartographie',C3: 'Maillage et Concertation', C4: 'Formation & Relève', C5: 'Écoute et Consultation',   C6: 'Influence & Représentation',C7: 'Événements & Rayonnement' };
  const nameMapEn = { C1: 'Guides & Tools',     C2: 'Directories & Mapping',     C3: 'Networking & Consultation',C4: 'Training & Next-gen', C5: 'Listening & Consultation', C6: 'Advocacy & Representation', C7: 'Events & Outreach' };
  const chantierIdToNum = { C1: 1, C2: 2, C3: 3, C4: 4, C5: 5, C6: 6, C7: 7 };

  return CHANTIERS_CONFIG.map(c => {
    const num = chantierIdToNum[c.id];
    const totalActions = allRows.filter(r => r.chantier === c.id && r.approuve !== 'non').length;
    const analyzed = !!analyseData[num];
    return {
      id: num,
      name:     nameMap[c.id],   name_en: nameMapEn[c.id],
      verb:     verbMap[c.id],   verb_en: verbMapEn[c.id],
      totalActions, analyzed,
    };
  });
}
