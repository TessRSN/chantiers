// ── Analyse des chantiers (refonte) ──
// Vue chantier-first : pour chaque chantier transversal, on liste ses sous-projets
// (G1, R1, C3-1, etc.). Chaque sous-projet est dépliable et montre :
//  - les entités contributrices (axes/PD/champs) sous forme de pills colorées
//  - les actions, color-codées par entité, avec leur statut de progression
// On a retiré : parking lots, orphelins, statuts d'analyse (keep/rewrite/gap/move)
// qui n'ont plus d'intérêt en lecture publique.

// ── Helper : retrouver l'entité (axe/PD/champ) à partir de l'ID d'une action ──
function getEntityFromActionId(actionId) {
  if (!actionId) return null;
  // A1, A2, A3, A4
  const axeMatch = actionId.match(/^(A[1-4])-/);
  if (axeMatch) {
    return AXES_CONFIG.find(e => e.id === axeMatch[1]) || null;
  }
  // PD-XXX-...
  const pdMatch = actionId.match(/^(PD-[A-Z]+)-/);
  if (pdMatch) {
    return AXES_CONFIG.find(e => e.id === pdMatch[1]) || null;
  }
  // CA-XXX-...
  const caMatch = actionId.match(/^(CA-[A-Z]+)-/);
  if (caMatch) {
    return AXES_CONFIG.find(e => e.id === caMatch[1]) || null;
  }
  return null;
}

// ── Helper : extraire les contributeurs uniques d'un sous-projet ──
function getProjectContributors(actions) {
  const map = new Map();
  actions.forEach(a => {
    const entity = getEntityFromActionId(a.id);
    if (entity) {
      if (!map.has(entity.id)) map.set(entity.id, { entity, count: 0 });
      map.get(entity.id).count++;
    }
  });
  // Tri : par nombre décroissant puis par ID
  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.entity.id.localeCompare(b.entity.id);
  });
}

// ── Helper : compter les statuts de progression ──
function countProgressStatuses(actions) {
  const counts = { 'terminé': 0, 'en cours': 0, 'non démarré': 0 };
  actions.forEach(a => {
    const s = a.statutObjectif || 'non démarré';
    if (counts[s] !== undefined) counts[s]++;
  });
  return counts;
}

// ── Helper : barre de progression compacte (mini) ──
function MiniProgressBar({ counts, total, darkMode, showLegend = true }) {
  if (total === 0) return null;
  const segments = [
    { key: 'terminé',     color: '#22c55e' },
    { key: 'en cours',    color: '#f59e0b' },
    { key: 'non démarré', color: darkMode ? '#334155' : '#d1d5db' },
  ];
  return (
    <div>
      <div style={{
        display: 'flex', borderRadius: 6, overflow: 'hidden', height: 6,
        background: darkMode ? '#1e293b' : '#f3f4f6',
      }}>
        {segments.map(s => counts[s.key] > 0 && (
          <div
            key={s.key}
            style={{
              width: `${(counts[s.key] / total) * 100}%`,
              backgroundColor: s.color,
              transition: 'width 0.3s',
            }}
            title={`${s.key} : ${counts[s.key]}`}
          />
        ))}
      </div>
      {showLegend && (
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontSize: 10, flexWrap: 'wrap' }}>
          {segments.map(s => counts[s.key] > 0 && (
            <span key={s.key} style={{ color: s.color, fontWeight: 600 }}>
              {counts[s.key]} {s.key}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pill d'entité contributrice ──
function EntityPill({ entity, count, darkMode, onClick }) {
  const isLight = !darkMode;
  return (
    <button
      onClick={onClick}
      title={`${t('chantiers.aller-vue-axe')} ${tConfig(entity, 'fullName') || tConfig(entity, 'name')}`}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 4px',
        borderRadius: 14,
        background: isLight ? entity.color + '15' : entity.color + '25',
        border: `1px solid ${entity.color}55`,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        font: 'inherit',
      }}
      onMouseEnter={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = `0 2px 8px ${entity.color}40`;
        }
      }}
      onMouseLeave={e => {
        if (onClick) {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      <span style={{
        background: entity.color, color: 'white',
        padding: '2px 7px', borderRadius: 9,
        fontSize: 10, fontWeight: 700, letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}>
        {entity.id}
      </span>
      <span style={{
        fontSize: 11.5, fontWeight: 500,
        color: entity.color,
      }}>
        {tConfig(entity, 'name')}
      </span>
      <span style={{
        fontSize: 10, fontWeight: 700,
        color: entity.color, opacity: 0.65,
        marginLeft: 2,
      }}>
        · {count}
      </span>
    </button>
  );
}

// ── Ligne d'action (color-codée par entité) ──
function ActionRowAnalyse({ action, darkMode, allActions }) {
  const entity = getEntityFromActionId(action.id);
  const color = entity ? entity.color : (darkMode ? '#475569' : '#9ca3af');
  const statusObj = PROGRESS[action.statutObjectif || 'non démarré'];
  return (
    <div style={{
      padding: '8px 12px',
      background: darkMode ? '#0f172a' : '#ffffff',
      borderTop:    `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
      borderRight:  `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
      borderBottom: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`,
      borderLeft:   `3px solid ${color}`,
      borderRadius: 4,
      marginBottom: 4,
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ fontSize: 14, color: statusObj.color, paddingTop: 1, lineHeight: 1 }}>
        {statusObj.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
          <code style={{
            fontSize: 10, color: darkMode ? '#94a3b8' : '#6b7280',
            fontFamily: 'ui-monospace, monospace',
          }}>{action.id}</code>
          {entity && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              padding: '1px 6px', borderRadius: 3,
              background: color + '20', color: color,
              letterSpacing: '0.02em',
            }}>{entity.id}</span>
          )}
          <span style={{ fontSize: 10, color: statusObj.color, fontWeight: 600 }}>
            {tConfig(statusObj, 'label')}
          </span>
        </div>
        <div style={{
          fontSize: 12.5,
          color: darkMode ? '#e2e8f0' : '#1f2937',
          lineHeight: 1.45,
        }}>
          {tConfig(action, 'action')}
        </div>
        <CoordinationBadges ids={action.coordination} allActions={allActions} darkMode={darkMode} />
      </div>
    </div>
  );
}

// ── Carte de sous-projet (collapsible) ──
function ProjectCardAnalyse({ project, darkMode, chantier, onContributorClick, forceOpen, allActions }) {
  const [open, setOpen] = useState(false);
  // Auto-ouvre + scroll quand le projet est ciblé par URL
  const rootRef = useRef(null);
  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      setTimeout(() => {
        if (rootRef.current) rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
  }, [forceOpen]);
  const contributors = useMemo(() => getProjectContributors(project.actions), [project.actions]);
  const counts = useMemo(() => countProgressStatuses(project.actions), [project.actions]);
  const total = project.actions.length;

  const cardBg = darkMode ? '#1e293b' : '#ffffff';
  const cardBorder = darkMode ? '#334155' : '#e5e7eb';
  const hoverBg = darkMode ? '#293548' : '#f9fafb';
  const titleColor = darkMode ? '#f1f5f9' : '#111827';
  const idBg = darkMode ? '#334155' : '#f3f4f6';
  const idText = darkMode ? '#cbd5e1' : '#475569';
  const descColor = darkMode ? '#94a3b8' : '#6b7280';
  const chevronColor = darkMode ? '#64748b' : '#9ca3af';

  return (
    <div ref={rootRef} id={`projet-${project.id}`} style={{
      background: cardBg, border: `1px solid ${forceOpen ? chantier.color : cardBorder}`,
      borderRadius: 10, marginBottom: 12, overflow: 'hidden',
      transition: 'border-color 0.15s',
      scrollMarginTop: 100,
      boxShadow: forceOpen ? `0 0 0 2px ${chantier.color}30` : 'none',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', textAlign: 'left',
          padding: '12px 16px', border: 'none',
          background: 'transparent', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = hoverBg; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <span style={{ color: chevronColor, fontSize: 12, flexShrink: 0 }}>
          {open ? '▼' : '▶'}
        </span>
        <span style={{
          background: idBg, color: idText,
          padding: '3px 8px', borderRadius: 4,
          fontSize: 11, fontWeight: 700, fontFamily: 'ui-monospace, monospace',
          flexShrink: 0, letterSpacing: '0.02em',
        }}>
          {project.id}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: titleColor,
            lineHeight: 1.35,
          }}>
            {tConfig(project, 'name')}
          </div>
          {!open && tConfig(project, 'description') && (
            <div style={{
              fontSize: 11.5, color: descColor, lineHeight: 1.4,
              marginTop: 2,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tConfig(project, 'description')}
            </div>
          )}
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ minWidth: 110 }}>
            <MiniProgressBar counts={counts} total={total} darkMode={darkMode} showLegend={false} />
          </div>
          <span style={{
            fontSize: 11, color: descColor,
            background: idBg, padding: '3px 8px', borderRadius: 10,
            fontWeight: 600, whiteSpace: 'nowrap',
          }}>
            {total} {total > 1 ? t('parax.actions') : t('parax.action')}
          </span>
        </div>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 16px',
          borderTop: `1px solid ${cardBorder}`,
        }}>
          {tConfig(project, 'description') && (
            <p style={{
              fontSize: 12.5, color: descColor,
              lineHeight: 1.5, margin: '12px 0',
            }}>
              {tConfig(project, 'description')}
            </p>
          )}

          {/* Contributeurs */}
          {contributors.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: descColor, textTransform: 'uppercase',
                letterSpacing: '0.08em', marginBottom: 8,
              }}>
                {t('chantiers.contributeurs')} ({contributors.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {contributors.map(({ entity, count }) => (
                  <EntityPill
                    key={entity.id}
                    entity={entity}
                    count={count}
                    darkMode={darkMode}
                    onClick={() => onContributorClick && onContributorClick(entity.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: descColor, textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: 8,
            }}>
              {t('chantiers.actions')} ({total})
            </div>
            <div>
              {project.actions
                .slice()
                .sort((a, b) => a.id.localeCompare(b.id))
                .map(action => (
                  <ActionRowAnalyse key={action.id} action={action} darkMode={darkMode} allActions={allActions} />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Section d'un chantier (carte avec contour, header + projets dedans) ──
function ChantierSection({ chantierMeta, chantierData, darkMode, onContributorClick, targetProject, allActions }) {
  const chantierConfig = CHANTIERS_CONFIG.find(c => c.id === `C${chantierMeta.id}`);
  if (!chantierConfig) return null;

  const projects = (chantierData && chantierData.projects) || [];
  const chantierActions = projects.flatMap(p => p.actions);
  const counts = countProgressStatuses(chantierActions);
  const total = chantierActions.length;

  const subtitleColor = darkMode ? '#94a3b8' : '#6b7280';
  const innerBg = darkMode ? '#0f172a' : '#f8fafc';
  const color = chantierConfig.color;

  return (
    <section
      id={`chantier-${chantierConfig.id}`}
      style={{
        scrollMarginTop: 24,
        border: `2px solid ${color}`,
        borderRadius: 14,
        background: darkMode ? '#1e293b' : '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* En-tête du chantier */}
      <div style={{
        background: color, padding: '12px 16px',
        color: 'white',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {chantierConfig.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              fontFamily: 'ui-monospace, monospace',
            }}>
              {chantierConfig.id} · {tConfig(chantierConfig, 'verb')}
            </div>
            <h2 style={{
              fontSize: 17, fontWeight: 800,
              margin: '2px 0 0 0', lineHeight: 1.2,
            }}>
              {tConfig(chantierMeta, 'name')}
            </h2>
          </div>
          <div style={{ flexShrink: 0, textAlign: 'right' }}>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 600 }}>
              {projects.length} projet{projects.length > 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              {total} {total > 1 ? t('parax.actions') : t('parax.action')}
            </div>
          </div>
        </div>

        {/* Barre de progression compacte */}
        {total > 0 && (() => {
          const segments = [
            { key: 'terminé',     color: '#ffffff' },
            { key: 'en cours',    color: 'rgba(255,255,255,0.65)' },
            { key: 'non démarré', color: 'rgba(255,255,255,0.22)' },
          ];
          return (
            <div style={{ marginTop: 10 }}>
              <div style={{
                display: 'flex', borderRadius: 5, overflow: 'hidden', height: 6,
                background: 'rgba(0,0,0,0.18)',
              }}>
                {segments.map(s => counts[s.key] > 0 && (
                  <div
                    key={s.key}
                    style={{
                      width: `${(counts[s.key] / total) * 100}%`,
                      background: s.color, transition: 'width 0.3s',
                    }}
                    title={`${s.key} : ${counts[s.key]}`}
                  />
                ))}
              </div>
              <div style={{
                display: 'flex', gap: 10, marginTop: 5,
                fontSize: 10, color: 'rgba(255,255,255,0.92)',
                flexWrap: 'wrap', fontWeight: 600,
              }}>
                {segments.map(s => counts[s.key] > 0 && (
                  <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: s.color, display: 'inline-block',
                    }} />
                    {counts[s.key]}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Liste des sous-projets — à l'intérieur du contour */}
      <div style={{ padding: 12, background: innerBg }}>
        {projects.length > 0 ? (
          projects
            .slice()
            .sort((a, b) => a.id.localeCompare(b.id))
            .map(project => (
              <ProjectCardAnalyse
                key={project.id}
                project={project}
                darkMode={darkMode}
                chantier={chantierConfig}
                onContributorClick={onContributorClick}
                forceOpen={targetProject === project.id}
                allActions={allActions}
              />
            ))
        ) : (
          <div style={{
            padding: '20px', textAlign: 'center',
            color: subtitleColor, fontSize: 12,
          }}>
            {t('chantiers.aucun-sous-projet')}
          </div>
        )}
      </div>
    </section>
  );
}

// ── Composant principal Analyse des chantiers ──
function AnalyseChantiers({ darkMode, analyseData, chantiersMeta, targetProject, onTargetProjectConsumed, allActions }) {
  // Quand un projet est ciblé via URL, on consomme le paramètre après le scroll
  useEffect(() => {
    if (targetProject && onTargetProjectConsumed) {
      const t = setTimeout(() => onTargetProjectConsumed(), 1500);
      return () => clearTimeout(t);
    }
  }, [targetProject, onTargetProjectConsumed]);
  // Filtrer les actions non-approuvées (EXT-*, GAP-*) pour cette vue opérationnelle
  const filteredData = useMemo(() => {
    const result = {};
    Object.entries(analyseData).forEach(([k, data]) => {
      if (!data || !data.projects) { result[k] = data; return; }
      result[k] = {
        ...data,
        projects: data.projects
          .map(p => ({
            ...p,
            actions: p.actions.filter(a => {
              const id = a.id || '';
              return !id.startsWith('EXT-') && !id.startsWith('GAP-');
            }),
          }))
          .filter(p => p.actions.length > 0),
      };
    });
    return result;
  }, [analyseData]);

  const mainBg = darkMode ? '#0f172a' : '#f8fafc';
  const navBg = darkMode ? '#1e293b' : '#ffffff';
  const navBorder = darkMode ? '#334155' : '#e5e7eb';
  const navText = darkMode ? '#94a3b8' : '#6b7280';

  // Navigation vers Vue par axe au clic sur un contributeur
  const handleContributorClick = (entityId) => {
    window.location.hash = `par-axe?entite=${entityId}`;
  };

  // Saut vers une section
  const scrollToChantier = (cid) => {
    const el = document.getElementById(`chantier-${cid}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 70px)',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: mainBg,
    }}>
      {/* ── SIDEBAR gauche : « Aller à » vertical ── */}
      <div style={{
        width: 240, flexShrink: 0,
        background: navBg, borderRight: `1px solid ${navBorder}`,
        overflowY: 'auto',
        padding: '16px 12px',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: navText,
          textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '0 8px', marginBottom: 10,
        }}>
          {t('chantiers.aller-a')}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {chantiersMeta.map(c => {
            const cfg = CHANTIERS_CONFIG.find(x => x.id === `C${c.id}`);
            if (!cfg) return null;
            const data = filteredData[c.id];
            const projCount = data && data.projects ? data.projects.length : 0;
            const actionCount = data && data.projects
              ? data.projects.reduce((s, p) => s + p.actions.length, 0)
              : 0;
            const chantierActions = data && data.projects ? data.projects.flatMap(p => p.actions) : [];
            const counts = countProgressStatuses(chantierActions);
            return (
              <button
                key={c.id}
                onClick={() => scrollToChantier(cfg.id)}
                title={`${cfg.id} · ${tConfig(c, 'name')} — ${projCount} ${t('chantiers.projets-court')}, ${actionCount} ${t('parax.actions')}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch',
                  padding: '8px 10px', borderRadius: 8,
                  background: darkMode ? cfg.color + '18' : cfg.color + '10',
                  border: `1px solid ${cfg.color}55`,
                  cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
                  font: 'inherit', textAlign: 'left',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateX(2px)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${cfg.color}30`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{cfg.icon}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: cfg.color,
                    flex: 1, minWidth: 0,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {tConfig(c, 'name')}
                  </span>
                </div>
                <div style={{
                  fontSize: 10, color: cfg.color, opacity: 0.75,
                  marginBottom: 4,
                }}>
                  {projCount} {projCount > 1 ? t('chantiers.projets') : t('chantiers.projet')} · {actionCount} {actionCount > 1 ? t('parax.actions') : t('parax.action')}
                </div>
                {actionCount > 0 && (
                  <MiniProgressBar
                    counts={counts}
                    total={actionCount}
                    darkMode={darkMode}
                    showLegend={false}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Contenu : 2 colonnes en masonry (CSS columns évite les trous) ── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '20px 20px 60px',
          columnCount: 2,
          columnGap: 16,
        }}>
          {chantiersMeta.map(c => (
            <div key={c.id} style={{
              breakInside: 'avoid',
              WebkitColumnBreakInside: 'avoid',
              pageBreakInside: 'avoid',
              marginBottom: 16,
            }}>
              <ChantierSection
                chantierMeta={c}
                chantierData={filteredData[c.id]}
                darkMode={darkMode}
                onContributorClick={handleContributorClick}
                targetProject={targetProject}
                allActions={allActions}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
