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

// ── Chargement CSV → toutes les lignes enrichies ──
function csvRowsToAllData(rows) {
  return rows.map(row => ({
    id: row['ID Action'],
    axe: AXE_NAME_TO_ID[row['Axe']] || row['Axe'],
    chantier: CHANTIER_NAME_TO_ID[row['Chantier suggéré']] || row['Chantier suggéré'],
    action: row['Action réécrite'] || row['Action originale'],
    actionOriginale: row['Action originale'],
    objectif: row['Objectif stratégique'],
    axeFullName: row['Axe'],
    chantierFullName: row['Chantier suggéré'],
    // Champs analyse
    statusAnalyse: row['Statut analyse'] || '',
    projet: row['Projet'] || '',
    nomProjet: row['Nom projet'] || '',
    descriptionProjet: row['Description projet'] || '',
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
      { id: 'comite-sci', name: 'Comité scientifique', responsables: [] },
      { id: 'comite-avis', name: 'Comité aviseur', responsables: [] },
      { id: 'comite-etud', name: 'Comité étudiants', responsables: [] },
      { id: 'comite-cit', name: 'Comité citoyen', responsables: [] },
      { id: 'patients-part', name: 'Patients partenaires', responsables: [] },
    ],
    axes: [
      { id: 'A1', shortName: 'Axe 1', name: 'Plateformes numériques et gouvernance informationnelle', label: 'Plateformes', description: 'Générer et gérer des données de qualité et de confiance', color: '#3B82F6', responsables: [] },
      { id: 'A2', shortName: 'Axe 2', name: 'Modélisation et méthodes numériques', label: 'Modélisation', description: "Création et validation d'algorithmes, incluant la modélisation mathématique, les méthodes statistiques et l'IA", color: '#8B5CF6', responsables: [] },
      { id: 'A3', shortName: 'Axe 3', name: 'Interventions numériques', label: 'Interventions', description: "Cycle de vie des interventions numériques, synthèses des évidences, de la conception à l'implantation, incluant l'adoption et la mise à l'échelle", color: '#EC4899', responsables: [] },
      { id: 'A4', shortName: 'Axe 4', name: 'Transformation numérique', label: 'Transformation', description: 'Transformation des organisations, du système et des politiques soutenant le cycle de vie des interventions numériques', color: '#F59E0B', responsables: [] },
    ],
    champs: [
      { id: 'CA-RENF', name: 'Renforcement', fullName: 'Renforcement des capacités', label: 'Renforcement', color: '#10B981', responsables: [] },
      { id: 'CA-FORM', name: 'Formation', fullName: 'Formation interdisciplinaire', label: 'Formation', color: '#14B8A6', responsables: [] },
      { id: 'CA-MOB', name: 'Mobilisation', fullName: 'Mobilisation des connaissances', label: 'Mobilisation', color: '#06B6D4', responsables: [] },
    ],
    principes: [
      { id: 'PD-EDIA', name: 'EDIA', fullName: 'Équité, Diversité, Inclusion, Accessibilité', label: 'EDIA', color: '#EF4444', responsables: [] },
      { id: 'PD-CONF', name: 'Num. confiance', fullName: 'Numérique de confiance', label: 'Confiance', color: '#A855F7', responsables: [] },
      { id: 'PD-ENG', name: 'Engagement', fullName: 'Engagement citoyen', label: 'Engagement', color: '#6366F1', responsables: [] },
      { id: 'PD-DUR', name: 'Santé durable', fullName: 'Santé durable', label: 'Santé durable', color: '#22C55E', responsables: [] },
      { id: 'PD-SCI', name: 'Science ouverte', fullName: 'Science ouverte', label: 'Science ouv.', color: '#EAB308', responsables: [] },
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
    if (row['Role']) person.role = row['Role'];

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
    if (!byChantier[chantierId]) byChantier[chantierId] = { projets: {}, parking: [] };

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
          id: row.projet, name: row.nomProjet, description: row.descriptionProjet, actions: [],
        };
      }
      byChantier[chantierId].projets[row.projet].actions.push({
        id: row.id, axe: row.axeFullName, objectif: row.objectif,
        action: row.action, status: row.statusAnalyse || 'keep',
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
    if (projects.length === 0 && data.parking.length === 0) return;
    result[num] = { projects, parkingLot: data.parking };
  });

  return result;
}

// ── Construire CHANTIERS_META dynamiquement ──
function buildChantiersMeta(allRows, analyseData) {
  const verbMap = { C1: 'PRODUIRE', C2: 'RECENSER', C3: 'CONNECTER', C4: 'FORMER', C5: 'ÉCOUTER', C6: 'CONVAINCRE', C7: 'ANIMER' };
  const nameMap = { C1: 'Guides & Outils', C2: 'Répertoires & Cartographie', C3: 'Concertation & Maillage', C4: 'Formation & Relève', C5: 'Consultation & Écoute', C6: 'Influence & Représentation', C7: 'Événements & Rayonnement' };
  const chantierIdToNum = { C1: 1, C2: 2, C3: 3, C4: 4, C5: 5, C6: 6, C7: 7 };

  return CHANTIERS_CONFIG.map(c => {
    const num = chantierIdToNum[c.id];
    const totalActions = allRows.filter(r => r.chantier === c.id && r.approuve !== 'non').length;
    const analyzed = !!analyseData[num];
    return { id: num, name: nameMap[c.id], verb: verbMap[c.id], totalActions, analyzed };
  });
}
