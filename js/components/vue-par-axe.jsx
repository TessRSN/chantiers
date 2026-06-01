// ── Vue « Par axe / PD / champ » — sélecteur + Sankey 3 colonnes + liste par OS ──

// Liste des entités (4 axes + 5 PD + 3 champs) issues de la config statique
function getEntities() {
  return AXES_CONFIG.map(a => ({
    id: a.id, name: a.name, fullName: a.fullName, type: a.type, color: a.color,
  }));
}

// Détecte si une action appartient à une entité donnée — gère les actions
// dont la colonne Axe pointe vers plusieurs entités (ex. "Axe 2 / Formation interdisciplinaire")
function actionBelongsToEntity(action, entity) {
  // Match direct sur l'ID (axe déjà mappé via AXE_NAME_TO_ID dans csvRowsToAllData)
  if (action.axe === entity.id) return true;
  // Match fuzzy sur le texte original de la colonne Axe (utile pour EXT-*)
  const axeText = (action.axeFullName || '').toLowerCase();
  if (!axeText) return false;
  if (entity.type === 'axe') {
    const axeNum = entity.id.replace('A', '');
    return axeText.startsWith(`axe ${axeNum}`);
  }
  if (entity.type === 'champ') {
    const champMap = {
      'CA-FORM': 'formation interdisciplinaire',
      'CA-MOB': 'mobilisation des connaissances',
      'CA-RENF': 'renforcement des capacités',
    };
    const needle = champMap[entity.id];
    return needle ? axeText.includes(needle) : false;
  }
  if (entity.type === 'principe') {
    const principeMap = {
      'PD-EDIA': 'edia',
      'PD-CONF': 'numérique de confiance',
      'PD-ENG': 'engagement citoyen',
      'PD-DUR': 'santé durable',
      'PD-SCI': 'science ouverte',
    };
    const needle = principeMap[entity.id];
    return needle ? axeText.includes(needle) : false;
  }
  return false;
}

// Extrait l'OS depuis l'ID action (ex: "A2-OS1-a" -> "OS1", "PD-CONF-OS2-a" -> "OS2")
function extractOS(actionId) {
  if (!actionId) return null;
  const match = actionId.match(/-OS(\d+)/);
  return match ? `OS${match[1]}` : null;
}

// Construit la structure de données pour une entité :
//   { osList: [{id, label, actions: []}], projectList: [{id, name, chantierId, actions: []}], flows: [{os, projet, count}], extActions: [], orphans: [] }
function buildEntityData(entity, allActions) {
  if (!entity || !allActions) return null;
  // Toutes les actions de l'entité (incluant EXT-* non approuvées)
  const matched = allActions.filter(a => actionBelongsToEntity(a, entity));

  // EXT-* = réalisations hors feuille de route officielle
  const extActions = matched.filter(a => (a.id || '').startsWith('EXT-'));
  // Actions de la feuille de route (avec un OS)
  const fdrActions = matched.filter(a => !(a.id || '').startsWith('EXT-') && extractOS(a.id));

  // Groupes OS
  const osMap = {};
  fdrActions.forEach(a => {
    const os = extractOS(a.id);
    if (!osMap[os]) osMap[os] = { id: os, label: a.objectif || '', actions: [] };
    osMap[os].actions.push(a);
    // Si label vide jusqu'ici, prendre celui-ci
    if (!osMap[os].label && a.objectif) osMap[os].label = a.objectif;
  });
  const osList = Object.values(osMap).sort((a, b) => a.id.localeCompare(b.id));

  // Pré-calcul des totaux par projet : pour chaque projet, combien d'actions au TOTAL (toutes entités)
  // et la liste détaillée (utile pour le panneau « tout le chantier »).
  // On inclut toutes les actions approuvées, y compris celles d'autres axes.
  const allByProject = {};
  allActions.forEach(a => {
    if (a.approuve === 'non') return;
    if ((a.id || '').startsWith('EXT-') || (a.id || '').startsWith('GAP-')) return;
    const pid = a.projet || '—';
    if (!allByProject[pid]) allByProject[pid] = [];
    allByProject[pid].push(a);
  });

  // Groupes Projet (G1, R1, C3-3, etc.) — pour l'entité courante
  const projectMap = {};
  fdrActions.forEach(a => {
    const pid = a.projet || '—';
    if (!projectMap[pid]) {
      projectMap[pid] = {
        id: pid,
        name: a.nomProjet || (pid === '—' ? 'Sans projet' : pid),
        description: a.descriptionProjet || '',
        chantierId: a.chantier || '',
        actions: [],
        totalCount: (allByProject[pid] || []).length,   // total tous axes confondus
        allActions: allByProject[pid] || [],            // toutes les actions du projet
      };
    }
    projectMap[pid].actions.push(a);
  });
  const projectList = Object.values(projectMap).sort((a, b) => {
    // Trier par chantier (C1<C2<...<C7), puis par numéro projet (G1<G2<...)
    const ca = a.chantierId || 'Z';
    const cb = b.chantierId || 'Z';
    if (ca !== cb) return ca.localeCompare(cb);
    return a.id.localeCompare(b.id);
  });

  // Flux OS → Projet (agrégé)
  const flowMap = {};
  fdrActions.forEach(a => {
    const os = extractOS(a.id);
    const pid = a.projet || '—';
    const key = `${os}::${pid}`;
    if (!flowMap[key]) flowMap[key] = { os, projet: pid, count: 0, actions: [] };
    flowMap[key].count += 1;
    flowMap[key].actions.push(a);
  });
  const flows = Object.values(flowMap);

  // Sous-objectifs : une entrée par action de feuille de route, dans l'ordre OS puis ID action
  // Chaque entrée porte une référence à son OS source et son projet/chantier de destination.
  const sousObjList = fdrActions
    .map(a => ({
      id: a.id,
      title: a.action,
      os: extractOS(a.id),
      projet: a.projet || '—',
      chantierId: a.chantier || '',
      statut: a.statutObjectif || 'non démarré',
      action: a, // référence complète pour le détail
    }))
    .sort((a, b) => {
      if (a.os !== b.os) return (a.os || '').localeCompare(b.os || '');
      return a.id.localeCompare(b.id);
    });

  return { osList, projectList, flows, extActions, sousObjList };
}

// Helper : découpe un texte en N lignes max avec une longueur max par ligne (en caractères)
function wrapText(text, maxCharsPerLine, maxLines) {
  if (!text) return [];
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? line + ' ' + word : word;
    if (candidate.length <= maxCharsPerLine) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines) {
    const total = words.join(' ').length;
    const used = lines.join(' ').length;
    if (used < total) {
      const last = lines[maxLines - 1];
      const slice = last.length > maxCharsPerLine - 2 ? last.slice(0, maxCharsPerLine - 2) : last;
      lines[maxLines - 1] = slice + '…';
    }
  }
  return lines.slice(0, maxLines);
}

// ── Sankey 4 colonnes : Entité → OS → Sous-objectifs (actions) → Chantiers ──
function SankeyDiagram({ entity, data, darkMode, onNodeClick, hoveredKey, setHoveredKey, expandedProjectId }) {
  if (!entity || !data) return null;

  const VIEW_W = 1340;
  const PADDING_TOP = 40;
  const PADDING_BOTTOM = 20;
  const COL_GAP = 32;
  const COL1_W = 100;   // Entité — slim
  const COL2_W = 230;   // OS (un poil plus large pour l'intitulé)
  const COL3_W = 460;   // Sous-objectifs (max d'espace pour titres action)
  const COL4_W = 400;   // Chantiers (large pour nom complet sur 2-3 lignes)
  const COL1_X = 20;
  const COL2_X = COL1_X + COL1_W + COL_GAP;
  const COL3_X = COL2_X + COL2_W + COL_GAP;
  const COL4_X = COL3_X + COL3_W + COL_GAP;

  // Unité de hauteur = hauteur d'un sous-objectif. Tout s'aligne sur cette base.
  const UNIT_H = 70;
  const SUB_GAP = 8;   // espace entre sous-objectifs
  const OS_GAP = 12;   // espace entre OS
  const CHANT_MIN_H = 170; // hauteur min d'un chantier (nom + description + ratio)
  const CHANT_GAP = 14;

  // Sous-objectifs : un bloc par action, dans l'ordre OS puis ID
  const sousObjs = (data.sousObjList || []).map(s => ({ ...s, h: UNIT_H }));

  // OS : la hauteur d'un OS = somme des sous-objectifs qu'il contient
  const osWithLayout = data.osList.map(os => {
    const childSubs = sousObjs.filter(s => s.os === os.id);
    const h = childSubs.length * UNIT_H + Math.max(0, childSubs.length - 1) * SUB_GAP;
    return { ...os, h, childCount: childSubs.length };
  });
  const totalOSHeight = osWithLayout.reduce((sum, o) => sum + o.h + OS_GAP, -OS_GAP);

  // Chantiers : hauteur = max(MIN, nb actions de cet axe * UNIT_H)
  const projWithLayout = data.projectList.map(p => ({
    ...p,
    h: Math.max(CHANT_MIN_H, p.actions.length * UNIT_H),
  }));
  const totalProjHeight = projWithLayout.reduce((sum, p) => sum + p.h + CHANT_GAP, -CHANT_GAP);

  // Total sous-obj column height (aligné avec OS)
  const totalSubHeight = sousObjs.length * UNIT_H + Math.max(0, sousObjs.length - 1) * SUB_GAP
    + Math.max(0, data.osList.length - 1) * (OS_GAP - SUB_GAP); // décalage entre OS

  const maxColHeight = Math.max(totalOSHeight, totalProjHeight, totalSubHeight, 200);
  const VIEW_H = maxColHeight + PADDING_TOP + PADDING_BOTTOM;

  // Position Y : OS et Sous-obj alignés. On parcourt les OS et place les sous-obj dedans.
  const osStartY = PADDING_TOP + (maxColHeight - totalOSHeight) / 2;
  let osY = osStartY;
  const subPositions = {};
  osWithLayout.forEach(o => {
    o.y = osY;
    let subY = osY;
    const childSubs = sousObjs.filter(s => s.os === o.id);
    childSubs.forEach(s => {
      subPositions[s.id] = subY;
      subY += UNIT_H + SUB_GAP;
    });
    osY += o.h + OS_GAP;
  });
  sousObjs.forEach(s => { s.y = subPositions[s.id]; });

  // Chantiers : centrés verticalement
  const projStartY = PADDING_TOP + (maxColHeight - totalProjHeight) / 2;
  let pY = projStartY;
  projWithLayout.forEach(p => { p.y = pY; pY += p.h + CHANT_GAP; });

  // Entité : bloc slim, centré sur la colonne OS
  const entityH = Math.max(100, totalOSHeight);
  const entityY = PADDING_TOP + (maxColHeight - entityH) / 2;
  const entityTotal = sousObjs.length;

  // Flux : Entity → OS (1 par OS), OS → SubObj (1 par sub), SubObj → Chantier (1 par sub)
  const flowsByOS = {};
  sousObjs.forEach(s => { (flowsByOS[s.os] = flowsByOS[s.os] || []).push(s); });

  const flowsByProj = {};
  sousObjs.forEach(s => { (flowsByProj[s.projet] = flowsByProj[s.projet] || []).push(s); });
  // Trier les sous-obj entrants d'un projet par leur ordre vertical (= y)
  Object.values(flowsByProj).forEach(arr => arr.sort((a, b) => a.y - b.y));

  // Position Y de l'extrémité de chaque flux entrant dans un projet (réparti uniformément)
  const projInFlowY = {};
  projWithLayout.forEach(p => {
    const arr = flowsByProj[p.id] || [];
    arr.forEach((s, i) => {
      projInFlowY[s.id] = p.y + ((i + 0.5) / arr.length) * p.h;
    });
  });

  // Thème
  const bg = darkMode ? '#0f172a' : '#ffffff';
  const textPrimary = darkMode ? '#e2e8f0' : '#1f2937';
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280';
  const subBg = darkMode ? '#1e293b' : '#f3f4f6';
  const subText = darkMode ? '#cbd5e1' : '#334155';
  const subBorder = darkMode ? '#334155' : '#d1d5db';

  const osColor = entity.color;
  const chantierColor = (cId) => {
    const ch = CHANTIERS_CONFIG.find(c => c.id === cId);
    return ch ? ch.color : '#6b7280';
  };
  const chantierIcon = (cId) => {
    const ch = CHANTIERS_CONFIG.find(c => c.id === cId);
    return ch ? ch.icon : '';
  };
  // Nom court du chantier (sans le code), avec fallback
  const chantierName = (p) => p.name || p.id;

  const flowPath = (x1, y1, x2, y2) => {
    const cx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
  };

  const PROGRESS_COLOR = (statut) => (PROGRESS[statut] || PROGRESS['non démarré']).color;
  const PROGRESS_ICON = (statut) => (PROGRESS[statut] || PROGRESS['non démarré']).icon;

  // États de surlignage
  const isSubHighlighted = (s) => !hoveredKey
    || hoveredKey === `sub:${s.id}`
    || hoveredKey === `os:${s.os}`
    || hoveredKey === `proj:${s.projet}`;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="auto" style={{ background: bg, borderRadius: 8 }}>
      {/* En-têtes de colonnes */}
      <text x={COL1_X + COL1_W / 2} y={20} fontSize={11} fontWeight={600} fill={textSecondary} textAnchor="middle">
        {entity.type === 'axe' ? t('parax.entity.col.AXE') : entity.type === 'champ' ? t('parax.entity.col.CHAMP') : t('parax.entity.col.PRINCIPE')}
      </text>
      <text x={COL2_X + COL2_W / 2} y={20} fontSize={11} fontWeight={600} fill={textSecondary} textAnchor="middle">
        {t('sankey.col.os')}
      </text>
      <text x={COL3_X + COL3_W / 2} y={20} fontSize={11} fontWeight={600} fill={textSecondary} textAnchor="middle">
        {t('sankey.col.actions')}
      </text>
      <text x={COL4_X + COL4_W / 2} y={20} fontSize={11} fontWeight={600} fill={textSecondary} textAnchor="middle">
        {t('sankey.col.chantiers')}
      </text>

      {/* Flux OS → SubObj — courbe fine du bord droit de l'OS vers le bord gauche du sous-obj */}
      {sousObjs.map(s => {
        const os = osWithLayout.find(o => o.id === s.os);
        if (!os) return null;
        const x1 = COL2_X + COL2_W;
        const y1 = os.y + os.h / 2;
        const x2 = COL3_X;
        const y2 = s.y + UNIT_H / 2;
        const hl = isSubHighlighted(s);
        return (
          <path
            key={`os-sub-${s.id}`}
            d={flowPath(x1, y1, x2, y2)}
            fill="none" stroke={osColor} strokeWidth={4}
            opacity={hl ? 0.45 : 0.08}
            style={{ transition: 'opacity 0.2s' }}
          />
        );
      })}

      {/* Flux SubObj → Chantier */}
      {sousObjs.map(s => {
        const proj = projWithLayout.find(p => p.id === s.projet);
        if (!proj) return null;
        const x1 = COL3_X + COL3_W;
        const y1 = s.y + UNIT_H / 2;
        const x2 = COL4_X;
        const y2 = projInFlowY[s.id] || (proj.y + proj.h / 2);
        const hl = isSubHighlighted(s);
        const color = chantierColor(proj.chantierId);
        return (
          <path
            key={`sub-proj-${s.id}`}
            d={flowPath(x1, y1, x2, y2)}
            fill="none" stroke={color} strokeWidth={4}
            opacity={hl ? 0.5 : 0.08}
            style={{ transition: 'opacity 0.2s' }}
          />
        );
      })}

      {/* Colonne 1 : Entité — slim, étiquette courte sans préfixe CA-/PD- */}
      {(() => {
        // Pour CA-* et PD-* on enlève le préfixe — la colonne « CHAMP » / « PRINCIPE »
        // au-dessus fournit déjà le contexte. Évite que « CA-FORM » casse sur 2 lignes.
        const shortLabel = (entity.id.startsWith('CA-') || entity.id.startsWith('PD-'))
          ? entity.id.slice(3)
          : entity.id;
        // Taille de police adaptative pour les labels plus longs (EDIA, FORM, RENF, CONF, SCI…)
        const labelFontSize = shortLabel.length <= 2 ? 26 : shortLabel.length <= 4 ? 22 : 18;
        return (
          <g style={{ cursor: 'pointer' }} onClick={() => onNodeClick && onNodeClick({ type: 'entity' })}>
            <rect x={COL1_X} y={entityY} width={COL1_W} height={entityH} rx={8} fill={entity.color} />
            <text x={COL1_X + COL1_W / 2} y={entityY + entityH / 2 - 4} fontSize={labelFontSize} fontWeight={700} fill="white" textAnchor="middle">
              {shortLabel}
            </text>
            <text x={COL1_X + COL1_W / 2} y={entityY + entityH / 2 + 18} fontSize={12} fill="white" textAnchor="middle" opacity={0.85}>
              {entityTotal} action{entityTotal > 1 ? 's' : ''}
            </text>
          </g>
        );
      })()}

      {/* Colonne 2 : OS — ID + intitulé multi-lignes */}
      {osWithLayout.map(os => {
        const dimmed = hoveredKey && !hoveredKey.startsWith(`os:${os.id}`)
          && !(hoveredKey.startsWith('sub:') && sousObjs.find(s => s.id === hoveredKey.slice(4))?.os === os.id);
        const maxNameLines = Math.max(1, Math.floor((os.h - 50) / 16));
        const nameLines = wrapText(os.label, 28, maxNameLines);
        return (
          <g
            key={`os-${os.id}`}
            onClick={() => onNodeClick && onNodeClick({ type: 'os', id: os.id })}
            onMouseEnter={() => setHoveredKey(`os:${os.id}`)}
            onMouseLeave={() => setHoveredKey(null)}
            opacity={dimmed ? 0.4 : 1}
            style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
          >
            <rect x={COL2_X} y={os.y} width={COL2_W} height={os.h} rx={6} fill={osColor} opacity={0.92} />
            <text x={COL2_X + 14} y={os.y + 24} fontSize={15} fontWeight={700} fill="white">{os.id}</text>
            <text x={COL2_X + COL2_W - 14} y={os.y + 24} fontSize={12} fill="white" opacity={0.85} textAnchor="end">
              {os.childCount} action{os.childCount > 1 ? 's' : ''}
            </text>
            {nameLines.map((line, i) => (
              <text key={i} x={COL2_X + 14} y={os.y + 46 + i * 16} fontSize={12.5} fill="white" opacity={0.95}>
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Colonne 3 : Sous-objectifs (actions) — un bloc par action */}
      {sousObjs.map(s => {
        const dimmed = hoveredKey && !hoveredKey.startsWith(`sub:${s.id}`)
          && hoveredKey !== `os:${s.os}` && hoveredKey !== `proj:${s.projet}`;
        const titleLines = wrapText(s.title, 64, 2);
        return (
          <g
            key={`sub-${s.id}`}
            onClick={() => onNodeClick && onNodeClick({ type: 'sub', id: s.id })}
            onMouseEnter={() => setHoveredKey(`sub:${s.id}`)}
            onMouseLeave={() => setHoveredKey(null)}
            opacity={dimmed ? 0.5 : 1}
            style={{ transition: 'opacity 0.2s', cursor: 'pointer' }}
          >
            <rect
              x={COL3_X} y={s.y} width={COL3_W} height={UNIT_H} rx={5}
              fill={subBg} stroke={subBorder} strokeWidth={1}
            />
            {/* Bandeau gauche couleur du statut */}
            <rect x={COL3_X} y={s.y} width={5} height={UNIT_H} fill={PROGRESS_COLOR(s.statut)} />
            {/* ID action + statut icon */}
            <text x={COL3_X + 14} y={s.y + 18} fontSize={11.5} fill={textSecondary} fontFamily="ui-monospace, monospace">
              {s.id}
            </text>
            <text x={COL3_X + COL3_W - 14} y={s.y + 18} fontSize={14} fill={PROGRESS_COLOR(s.statut)} textAnchor="end">
              {PROGRESS_ICON(s.statut)}
            </text>
            {titleLines.map((line, i) => (
              <text key={i} x={COL3_X + 14} y={s.y + 38 + i * 16} fontSize={13} fill={subText}>
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Colonne 4 : Chantiers — nom + description + ratio + indice */}
      {projWithLayout.map(p => {
        const color = chantierColor(p.chantierId);
        const icon = chantierIcon(p.chantierId);
        const dimmed = hoveredKey && !hoveredKey.startsWith(`proj:${p.id}`)
          && !(hoveredKey.startsWith('sub:') && sousObjs.find(s => s.id === hoveredKey.slice(4))?.projet === p.id);
        const isExpanded = expandedProjectId === p.id;
        // Layout vertical : header (40) + name + description + ratio (22) + padding
        const nameLines = wrapText(chantierName(p), 36, 2);
        const nameHeight = nameLines.length * 17;
        const descStartY = 24 + nameHeight + 14;  // 14px de gap après le titre
        const descAvailH = p.h - descStartY - 36; // 36 = ratio bottom area
        const maxDescLines = Math.max(0, Math.floor(descAvailH / 14));
        const descLines = maxDescLines > 0 && p.description
          ? wrapText(p.description, 42, maxDescLines)
          : [];
        const ratioText = p.totalCount > p.actions.length
          ? `${p.actions.length} ${t('parax.de-cet-axe')} · ${p.totalCount} ${t('parax.au-total')}`
          : `${p.actions.length} ${p.actions.length > 1 ? t('parax.actions') : t('parax.action')} (${t('parax.toutes-de-cet-axe')})`;
        return (
          <g
            key={`proj-${p.id}`}
            style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            onClick={() => onNodeClick && onNodeClick({ type: 'projet', id: p.id })}
            onMouseEnter={() => setHoveredKey(`proj:${p.id}`)}
            onMouseLeave={() => setHoveredKey(null)}
            opacity={dimmed ? 0.4 : 1}
          >
            <rect
              x={COL4_X} y={p.y} width={COL4_W} height={p.h} rx={6} fill={color}
              stroke={isExpanded ? 'white' : 'transparent'} strokeWidth={isExpanded ? 2.5 : 0}
            />
            {/* Code chantier en petit en haut à droite */}
            <text x={COL4_X + COL4_W - 14} y={p.y + 20} fontSize={11.5} fill="white" opacity={0.7} textAnchor="end">
              {p.id}
            </text>
            {/* Icône à gauche */}
            <text x={COL4_X + 14} y={p.y + 26} fontSize={18} fontWeight={700} fill="white">{icon}</text>
            {/* Titre = NOM du chantier */}
            {nameLines.map((line, i) => (
              <text
                key={i}
                x={COL4_X + 40}
                y={p.y + 24 + i * 17}
                fontSize={14}
                fontWeight={700}
                fill="white"
              >
                {line}
              </text>
            ))}
            {/* Description (entre nom et ratio) */}
            {descLines.map((line, i) => (
              <text
                key={`d-${i}`}
                x={COL4_X + 14}
                y={p.y + descStartY + i * 14}
                fontSize={11.5}
                fill="white"
                opacity={0.78}
              >
                {line}
              </text>
            ))}
            {/* Ratio en bas */}
            <text x={COL4_X + 14} y={p.y + p.h - 22} fontSize={12} fontWeight={500} fill="white" opacity={0.92}>
              {ratioText}
            </text>
            <text x={COL4_X + COL4_W - 14} y={p.y + p.h - 22} fontSize={12} fill="white" opacity={0.7} textAnchor="end">
              {isExpanded ? t('sankey.ouvert') : t('sankey.detail')}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Panneau « Tout le chantier » : montre toutes les actions d'un projet, groupées par axe,
//    avec les actions de l'entité courante surlignées ──
function ChantierDetailPanel({ projectId, entityId, data, darkMode, onClose }) {
  if (!projectId || !data) return null;
  const project = data.projectList.find(p => p.id === projectId);
  if (!project) return null;

  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const cardBorder = darkMode ? '#334155' : '#e5e7eb';
  const chunkBg = darkMode ? '#0f172a' : '#f9fafb';
  const textPrimary = darkMode ? '#e2e8f0' : '#1f2937';
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280';
  const textTertiary = darkMode ? '#64748b' : '#9ca3af';
  const highlightBg = darkMode ? '#1e3a8a30' : '#dbeafe';
  const highlightBorder = darkMode ? '#3b82f6' : '#60a5fa';

  // Grouper toutes les actions du chantier par axe (en utilisant axeFullName pour avoir le nom lisible)
  const byAxe = {};
  (project.allActions || []).forEach(a => {
    const key = a.axe || 'inconnu';
    if (!byAxe[key]) byAxe[key] = { id: key, fullName: a.axeFullName || key, actions: [] };
    byAxe[key].actions.push(a);
  });
  // Trier : axe courant en premier, puis le reste alphabétique
  const groupes = Object.values(byAxe).sort((a, b) => {
    if (a.id === entityId) return -1;
    if (b.id === entityId) return 1;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const chantierConfig = CHANTIERS_CONFIG.find(c => c.id === project.chantierId);
  const chantierColor = chantierConfig ? chantierConfig.color : '#6b7280';
  const chantierIcon = chantierConfig ? chantierConfig.icon : '';

  return (
    <div style={{
      background: cardBg, border: `2px solid ${chantierColor}`,
      borderRadius: 10, padding: 16, marginTop: 16,
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div style={{
          background: chantierColor, color: 'white',
          width: 44, height: 44, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{chantierIcon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: textSecondary, fontWeight: 600, letterSpacing: '0.05em' }}>
            {t('parax.chantier-transversal')} · {project.id}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginTop: 2 }}>
            {project.name}
          </div>
          {project.description && (
            <div style={{ fontSize: 12, color: textSecondary, marginTop: 4, lineHeight: 1.4 }}>
              {project.description}
            </div>
          )}
          <div style={{ fontSize: 12, color: textTertiary, marginTop: 6 }}>
            <strong>{project.totalCount}</strong> {project.totalCount > 1 ? t('parax.actions') : t('parax.action')} {t('parax.au-total')} ·{' '}
            <strong>{project.actions.length}</strong> {project.actions.length > 1 ? t('parax.portees') : t('parax.portee')} {t('parax.par-cet-axe')}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: `1px solid ${cardBorder}`,
            color: textSecondary, padding: '4px 10px', borderRadius: 6,
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
          }}
          title={t('parax.fermer')}
        >✕</button>
      </div>

      {/* Actions groupées par axe */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groupes.map(g => {
          const isCurrent = g.id === entityId;
          const entityConfig = AXES_CONFIG.find(a => a.id === g.id);
          const entColor = entityConfig ? entityConfig.color : '#6b7280';
          return (
            <div key={g.id} style={{
              background: isCurrent ? highlightBg : chunkBg,
              border: `1px solid ${isCurrent ? highlightBorder : cardBorder}`,
              borderRadius: 8, padding: 12,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 8, paddingBottom: 8,
                borderBottom: `1px solid ${cardBorder}`,
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: 5, background: entColor,
                }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: textPrimary }}>
                  {g.fullName}
                </span>
                {isCurrent && (
                  <span style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 10,
                    background: entColor, color: 'white', fontWeight: 600,
                  }}>cet axe</span>
                )}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: textTertiary }}>
                  {g.actions.length} action{g.actions.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {g.actions.map(a => {
                  const statusObj = PROGRESS[a.statutObjectif || 'non démarré'];
                  return (
                    <div key={a.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '6px 10px', borderRadius: 4,
                      background: darkMode ? '#0f172a80' : '#ffffff',
                      borderLeft: `3px solid ${statusObj.color}`,
                    }}>
                      <div style={{ fontSize: 14, paddingTop: 1, color: statusObj.color, lineHeight: 1 }}>{statusObj.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <code style={{ fontSize: 10, color: textTertiary, fontFamily: 'ui-monospace, monospace' }}>{a.id}</code>
                          <span style={{ fontSize: 10, color: statusObj.color, fontWeight: 600 }}>{statusObj.label}</span>
                        </div>
                        <div style={{ fontSize: 12, color: textPrimary, lineHeight: 1.45, marginTop: 2 }}>
                          {a.action}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Liste des actions groupée par OS ──
function ActionsParOS({ entity, data, darkMode, highlightedKey, scrollTargetId, onProjectClick }) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!scrollTargetId || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-section="${scrollTargetId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollTargetId]);

  if (!data || data.osList.length === 0) {
    return (
      <div style={{ color: darkMode ? '#94a3b8' : '#6b7280', textAlign: 'center', padding: 32, fontSize: 13 }}>
        {t('parax.aucune-action')}
      </div>
    );
  }

  // sectionBg laissé transparent : on hérite du fond de la carte parente
  const cardBg = darkMode ? '#0f172a' : '#f9fafb';      // un cran plus sombre que la carte parente pour différencier les items
  const cardBorder = darkMode ? '#334155' : '#e5e7eb';
  const textPrimary = darkMode ? '#e2e8f0' : '#1f2937';
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280';
  const textTertiary = darkMode ? '#64748b' : '#9ca3af';

  const isHighlighted = (osId, projId, actionId) => {
    if (!highlightedKey) return false;
    if (highlightedKey.startsWith('os:')) return highlightedKey === `os:${osId}`;
    if (highlightedKey.startsWith('proj:')) return highlightedKey === `proj:${projId}`;
    if (highlightedKey.startsWith('flow:')) return highlightedKey === `flow:${osId}::${projId}`;
    return false;
  };

  return (
    <div ref={listRef}>
      {data.osList.map(os => (
        <div key={os.id} data-section={`os:${os.id}`} style={{ marginBottom: 24 }}>
          <div style={{
            background: entity.color, color: 'white',
            padding: '8px 14px', borderRadius: 6, fontWeight: 600, fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
            outline: highlightedKey === `os:${os.id}` ? `3px solid ${entity.color}88` : 'none',
            outlineOffset: 2, transition: 'outline 0.2s',
          }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: 4,
              fontSize: 11, fontWeight: 700,
            }}>{os.id}</span>
            <span style={{ flex: 1 }}>{os.label || 'Sans intitulé'}</span>
            <span style={{ fontSize: 11, opacity: 0.85 }}>{os.actions.length} action{os.actions.length > 1 ? 's' : ''}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {os.actions.map(a => {
              const chantier = CHANTIERS_CONFIG.find(c => c.id === a.chantier);
              const projet = a.projet || '—';
              const hl = isHighlighted(os.id, projet, a.id);
              const statusObj = PROGRESS[a.statutObjectif || 'non démarré'];

              // Récupérer le nom complet du projet pour la pastille
              const projectInfo = data.projectList.find(p => p.id === projet);
              const projectShortName = projectInfo
                ? (projectInfo.name || projet)
                : projet;
              return (
                <div
                  key={a.id}
                  style={{
                    background: cardBg,
                    borderTop:    `1px solid ${hl ? entity.color : cardBorder}`,
                    borderRight:  `1px solid ${hl ? entity.color : cardBorder}`,
                    borderBottom: `1px solid ${hl ? entity.color : cardBorder}`,
                    borderLeft:   `3px solid ${statusObj.color}`,
                    borderRadius: 6, padding: '8px 12px',
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    transition: 'border-color 0.2s, transform 0.15s',
                    transform: hl ? 'translateX(4px)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 16, lineHeight: 1, paddingTop: 1, color: statusObj.color }}>{statusObj.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      <code style={{ fontSize: 10, color: textTertiary, fontFamily: 'ui-monospace, monospace' }}>{a.id}</code>
                      <span style={{
                        fontSize: 10, color: statusObj.color, fontWeight: 600,
                      }}>{statusObj.label}</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: textPrimary, lineHeight: 1.45 }}>{a.action}</div>
                  </div>
                  {chantier && projectInfo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onProjectClick && onProjectClick(projet); }}
                      title={`${t('parax.voir-tout')} « ${projectShortName} »`}
                      style={{
                        background: chantier.color, color: 'white', fontSize: 11, fontWeight: 600,
                        padding: '6px 12px', borderRadius: 12, whiteSpace: 'normal',
                        flexShrink: 0, maxWidth: 220, textAlign: 'left',
                        border: 'none', cursor: 'pointer', lineHeight: 1.3,
                        display: 'flex', alignItems: 'flex-start', gap: 6,
                      }}
                    >
                      <span style={{ flexShrink: 0 }}>{chantier.icon}</span>
                      <span>{projectShortName}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Réalisations hors feuille de route (EXT-*) */}
      {data.extActions && data.extActions.length > 0 && (
        <div data-section="ext" style={{ marginTop: 32, paddingTop: 20, borderTop: `1px dashed ${cardBorder}` }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: textSecondary,
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
          }}>
            {t('parax.realisations-associees')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.extActions.map(a => {
              const statusObj = PROGRESS[a.statutObjectif || 'non démarré'];
              return (
                <div key={a.id} style={{
                  background: cardBg,
                  borderTop:    `1px solid ${cardBorder}`,
                  borderRight:  `1px solid ${cardBorder}`,
                  borderBottom: `1px solid ${cardBorder}`,
                  borderLeft:   `3px solid ${statusObj.color}`,
                  borderRadius: 6, padding: '8px 12px',
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                }}>
                  <div style={{ fontSize: 16, lineHeight: 1, paddingTop: 1, color: statusObj.color }}>{statusObj.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: textTertiary, marginBottom: 3, fontFamily: 'ui-monospace, monospace' }}>{a.id}</div>
                    <div style={{ fontSize: 12.5, color: textPrimary, lineHeight: 1.45 }}>{a.action}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Petit avatar de coresponsable (image circulaire avec fallback initiales) ──
function CoResponsableAvatar({ person, color, darkMode }) {
  const base = (person.initials || '').toLowerCase();
  const [imgSrc, setImgSrc] = useState(`photos/${base}.jpg`);
  const [imgOk, setImgOk] = useState(true);
  const handleError = () => {
    if (imgSrc.endsWith('.jpg')) setImgSrc(`photos/${base}.png`);
    else setImgOk(false);
  };
  return (
    <div
      title={`${person.name}${person.affiliation ? ' — ' + person.affiliation : ''}${person.role ? ' (' + person.role + ')' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '4px 10px 4px 4px', borderRadius: 18,
        background: darkMode ? '#1e293b' : '#f9fafb',
        border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
      }}
    >
      <div style={{
        width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, fontSize: 11, backgroundColor: color + '25', color: color,
      }}>
        {imgOk ? (
          <img src={imgSrc} alt={person.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={handleError} />
        ) : (person.initials || '?')}
      </div>
      <span style={{ fontSize: 12, color: darkMode ? '#e2e8f0' : '#1f2937', fontWeight: 500 }}>
        {person.name}
      </span>
    </div>
  );
}

// ── Récupère les coresponsables d'une entité dans gouvernanceData ──
function getEntityResponsables(entity, gouvernanceData) {
  if (!entity || !gouvernanceData) return [];
  if (entity.type === 'axe') {
    const a = (gouvernanceData.axes || []).find(x => x.id === entity.id);
    return a ? a.responsables : [];
  }
  if (entity.type === 'champ') {
    const c = (gouvernanceData.champs || []).find(x => x.id === entity.id);
    return c ? c.responsables : [];
  }
  if (entity.type === 'principe') {
    const p = (gouvernanceData.principes || []).find(x => x.id === entity.id);
    return p ? p.responsables : [];
  }
  return [];
}

// ── Composant principal Vue Par Axe ──
function VueParAxe({ darkMode, allActions, gouvernanceData, selectedEntityId, onEntityChange }) {
  const entities = useMemo(() => getEntities(), []);
  const entity = useMemo(
    () => entities.find(e => e.id === selectedEntityId) || entities[0],
    [entities, selectedEntityId]
  );
  const responsables = useMemo(
    () => getEntityResponsables(entity, gouvernanceData),
    [entity, gouvernanceData]
  );

  const data = useMemo(
    () => buildEntityData(entity, allActions || []),
    [entity, allActions]
  );

  const [hoveredKey, setHoveredKey] = useState(null);
  const [scrollTargetId, setScrollTargetId] = useState(null);
  const [expandedProjectId, setExpandedProjectId] = useState(null);

  // Reset l'expansion quand on change d'entité
  useEffect(() => { setExpandedProjectId(null); }, [entity?.id]);

  const handleNodeClick = (node) => {
    if (!node) return;
    if (node.type === 'os') {
      setScrollTargetId(`os:${node.id}`);
      setHoveredKey(`os:${node.id}`);
      setExpandedProjectId(null);
    } else if (node.type === 'sub') {
      // Clic sur un sous-objectif → on scrolle vers son OS dans la liste en bas
      const sub = (data.sousObjList || []).find(s => s.id === node.id);
      if (sub) setScrollTargetId(`os:${sub.os}`);
      setHoveredKey(`sub:${node.id}`);
    } else if (node.type === 'projet') {
      // Toggle : si déjà ouvert, on ferme. Sinon on ouvre + highlight.
      setExpandedProjectId(prev => prev === node.id ? null : node.id);
      setHoveredKey(`proj:${node.id}`);
    }
    setTimeout(() => setScrollTargetId(null), 100);
  };

  const handleProjectClickFromList = (projectId) => {
    setExpandedProjectId(prev => prev === projectId ? null : projectId);
    // Scroller vers le diagramme/panneau pour que le panneau soit visible
    setTimeout(() => {
      const card = document.querySelector('[data-section="sankey-card"]');
      if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const bg = darkMode ? '#0f172a' : '#f8fafc';
  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const cardBorder = darkMode ? '#334155' : '#e5e7eb';
  const textPrimary = darkMode ? '#e2e8f0' : '#1f2937';
  const textSecondary = darkMode ? '#94a3b8' : '#6b7280';
  const textTertiary = darkMode ? '#64748b' : '#9ca3af';

  // Regroupement du sélecteur
  const axes = entities.filter(e => e.type === 'axe');
  const principes = entities.filter(e => e.type === 'principe');
  const champs = entities.filter(e => e.type === 'champ');

  return (
    <div style={{
      background: bg, minHeight: 'calc(100vh - 100px)',
      padding: '20px 24px', overflowY: 'auto',
    }}>
      <div style={{ maxWidth: 1320, margin: '0 auto' }}>

        {/* En-tête + sélecteur + barre de progression */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 10, padding: 16, marginBottom: 20,
          display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Ligne 1 : ID + nom + sélecteur */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{
            minWidth: 44, height: 44, borderRadius: 8,
            padding: '0 14px',
            background: entity.color, color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 14, flexShrink: 0,
            whiteSpace: 'nowrap', letterSpacing: '0.02em',
          }}>
            {entity.id}
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, lineHeight: 1.3 }}>
              {entity.fullName || entity.name}
            </div>
            <div style={{ fontSize: 11, color: textSecondary, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {entity.type === 'axe' ? t('parax.entity.label.axe') : entity.type === 'champ' ? t('parax.entity.label.champ') : t('parax.entity.label.principe')}
            </div>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start',
          }}>
            <label htmlFor="entity-select" style={{
              fontSize: 10, fontWeight: 700, color: '#6366f1',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ fontSize: 13, lineHeight: 1 }}>▾</span> {t('parax.change-entity')}
            </label>
            <select
              id="entity-select"
              value={entity.id}
              onChange={(e) => onEntityChange && onEntityChange(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 8,
                background: darkMode ? '#1e1b4b' : '#eef2ff',
                color: textPrimary,
                border: `2px solid ${darkMode ? '#6366f1' : '#818cf8'}`,
                fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', minWidth: 240,
                boxShadow: darkMode ? '0 0 0 1px rgba(99,102,241,0.3)' : '0 1px 3px rgba(99,102,241,0.18)',
                outline: 'none',
                appearance: 'menulist',
              }}
            >
              <optgroup label={t('parax.optgroup.axes')}>
                {axes.map(a => <option key={a.id} value={a.id}>{a.fullName || a.name}</option>)}
              </optgroup>
              <optgroup label={t('parax.optgroup.principes')}>
                {principes.map(p => <option key={p.id} value={p.id}>{p.fullName || p.name}</option>)}
              </optgroup>
              <optgroup label={t('parax.optgroup.champs')}>
                {champs.map(c => <option key={c.id} value={c.id}>{c.fullName || c.name}</option>)}
              </optgroup>
            </select>
          </div>
          </div>
          {/* Ligne 2 : coresponsables de l'entité */}
          {responsables && responsables.length > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
              paddingTop: 12,
              borderTop: `1px dashed ${cardBorder}`,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: textSecondary,
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginRight: 4,
              }}>
                {responsables.length > 1 ? t('parax.coresponsables') : t('parax.coresponsable')} :
              </span>
              {responsables.map((p, i) => (
                <CoResponsableAvatar key={p.name + i} person={p} color={entity.color} darkMode={darkMode} />
              ))}
            </div>
          )}
          {/* Ligne 3 : barre de progression des actions de l'entité */}
          {(() => {
            const allEntityActions = [...((data && data.sousObjList) || []), ...((data && data.extActions) || [])];
            const counts = { 'terminé': 0, 'en cours': 0, 'non démarré': 0 };
            allEntityActions.forEach(a => {
              const s = (a.statut || a.statutObjectif || 'non démarré');
              if (counts[s] !== undefined) counts[s] += 1;
            });
            const total = allEntityActions.length;
            if (total === 0) return null;
            const segments = [
              { key: 'terminé',     label: 'terminé',     count: counts['terminé'],     color: '#22c55e' },
              { key: 'en cours',    label: 'en cours',    count: counts['en cours'],    color: '#f59e0b' },
              { key: 'non démarré', label: 'non démarré', count: counts['non démarré'], color: darkMode ? '#334155' : '#d1d5db' },
            ];
            return (
              <div>
                <div style={{
                  display: 'flex', borderRadius: 8, overflow: 'hidden', height: 10,
                  background: darkMode ? '#1e293b' : '#f3f4f6',
                }}>
                  {segments.map(s => s.count > 0 && (
                    <div key={s.key} style={{
                      width: `${(s.count / total) * 100}%`,
                      backgroundColor: s.color,
                      transition: 'width 0.3s ease',
                    }} title={`${s.label} : ${s.count}`} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 18, marginTop: 8, flexWrap: 'wrap' }}>
                  {segments.map(s => (
                    <span key={s.key} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, color: s.count > 0 ? s.color : (darkMode ? '#64748b' : '#9ca3af'),
                      fontWeight: 600,
                    }}>
                      <span style={{
                        width: 9, height: 9, borderRadius: '50%',
                        backgroundColor: s.color, display: 'inline-block',
                        opacity: s.count > 0 ? 1 : 0.5,
                      }} />
                      {s.count} {s.label}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Diagramme Sankey */}
        <div data-section="sankey-card" style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 10, padding: 16, marginBottom: 20,
        }}>
          <div style={{ fontSize: 11, color: textSecondary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('sankey.caption')}
          </div>
          <SankeyDiagram
            entity={entity}
            data={data}
            darkMode={darkMode}
            onNodeClick={handleNodeClick}
            hoveredKey={hoveredKey}
            setHoveredKey={setHoveredKey}
            expandedProjectId={expandedProjectId}
          />
          {/* Légende des statuts */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 18, fontSize: 11, color: textSecondary, marginTop: 12,
            paddingTop: 12, borderTop: `1px solid ${cardBorder}`,
          }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: 4 }}>
              {t('sankey.legend.label')}
            </span>
            {['terminé', 'en cours', 'non démarré'].map(key => {
              const p = PROGRESS[key];
              return (
                <span key={key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <span style={{
                    fontSize: 14, lineHeight: 1, color: p.color, fontWeight: 700,
                  }}>{p.icon}</span>
                  <span>{p.label.toLowerCase()}</span>
                </span>
              );
            })}
          </div>
          {/* Panneau détail du chantier sélectionné */}
          {expandedProjectId && (
            <ChantierDetailPanel
              projectId={expandedProjectId}
              entityId={entity.id}
              data={data}
              darkMode={darkMode}
              onClose={() => setExpandedProjectId(null)}
            />
          )}
        </div>

        {/* Liste */}
        <div style={{
          background: cardBg, border: `1px solid ${cardBorder}`,
          borderRadius: 10, padding: 16,
        }}>
          <div style={{ fontSize: 11, color: textSecondary, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('parax.detail-actions')}
          </div>
          <ActionsParOS
            entity={entity}
            data={data}
            darkMode={darkMode}
            highlightedKey={hoveredKey}
            scrollTargetId={scrollTargetId}
            onProjectClick={handleProjectClickFromList}
          />
        </div>

      </div>
    </div>
  );
}
