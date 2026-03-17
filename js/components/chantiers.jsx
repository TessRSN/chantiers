function ActionRow({ action, darkMode }) {
  const [expanded, setExpanded] = useState(false);
  const s = getS(action.status, darkMode);
  const metaText  = darkMode ? 'text-slate-400' : 'text-gray-500';
  const metaBold  = darkMode ? 'text-slate-300' : 'text-gray-600';
  const noteBorder = darkMode ? 'border-slate-600' : 'border-gray-200';
  const noteText   = darkMode ? 'text-slate-400' : 'text-gray-600';
  const btnText    = darkMode ? 'text-slate-500 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600';
  return (
    <div className={`rounded-lg border ${s.border} ${s.bg} p-3 mb-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`font-mono text-xs font-bold ${metaText} shrink-0`}>{action.id}</span>
            <span className={`text-xs ${metaText} italic truncate`}>{action.axe}</span>
          </div>
          {action.objectif !== "—" && (
            <p className={`text-xs ${metaText} mb-1.5 leading-relaxed`}>
              <span className={`font-medium ${metaBold}`}>Objectif :</span> {action.objectif}
            </p>
          )}
          <p className={`text-sm font-medium ${s.text} leading-snug`}>{action.action}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <ProgressBadge statut={action.statutObjectif} darkMode={darkMode} size="xs" />
          <StatusBadge status={action.status} darkMode={darkMode} />
          {action.notes && (
            <button
              onClick={() => setExpanded(!expanded)}
              className={`text-xs ${btnText} underline underline-offset-2`}
            >
              {expanded ? "Masquer note ▲" : "Note ▼"}
            </button>
          )}
        </div>
      </div>
      {expanded && action.notes && (
        <div className={`mt-2 pt-2 border-t ${noteBorder} text-xs ${noteText} italic leading-relaxed`}>
          💬 {action.notes}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project, darkMode }) {
  const [open, setOpen] = useState(true);
  const counts = project.actions.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  const cardBg     = darkMode ? 'bg-slate-800'   : 'bg-white';
  const cardBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const hoverBg    = darkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-50';
  const chevron    = darkMode ? 'text-slate-500'  : 'text-gray-400';
  const titleColor = darkMode ? 'text-slate-100'  : 'text-gray-900';
  const descColor  = darkMode ? 'text-slate-400'  : 'text-gray-500';
  const countColor = darkMode ? 'text-slate-500'  : 'text-gray-400';
  const divider    = darkMode ? 'border-slate-700' : 'border-gray-100';

  return (
    <div className={`${cardBg} rounded-xl border ${cardBorder} shadow-sm mb-4 overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-start justify-between p-4 text-left ${hoverBg} transition-colors`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`${chevron} mt-0.5 shrink-0`}>{open ? "▼" : "▶"}</span>
          <div className="min-w-0">
            <h3 className={`font-semibold ${titleColor} leading-snug`}>{project.name}</h3>
            {project.description && (
              <p className={`text-xs ${descColor} mt-1 leading-relaxed pr-4`}>{project.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {Object.entries(counts).map(([status, count]) => {
                const s = getS(status, darkMode);
                return (
                  <span key={status} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
                    {count} {s.label.toLowerCase()}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
        <span className={`text-xs ${countColor} shrink-0 mt-1 ml-2`}>
          {project.actions.length} action{project.actions.length > 1 ? "s" : ""}
        </span>
      </button>
      {open && (
        <div className={`px-4 pb-4 pt-1 border-t ${divider}`}>
          {project.actions.map((a) => (
            <ActionRow key={a.id} action={a} darkMode={darkMode} />
          ))}
        </div>
      )}
    </div>
  );
}

function ParkingLot({ items, darkMode }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  const byDest = items.reduce((acc, item) => {
    const d = item.destination;
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const containerBg     = darkMode ? 'bg-sky-950'   : 'bg-sky-50';
  const containerBorder = darkMode ? 'border-sky-800' : 'border-sky-200';
  const hoverBg         = darkMode ? 'hover:bg-sky-900' : 'hover:bg-sky-100';
  const titleColor      = darkMode ? 'text-sky-200'  : 'text-sky-900';
  const subtitleColor   = darkMode ? 'text-sky-400'  : 'text-sky-600';
  const chevronColor    = darkMode ? 'text-sky-600'  : 'text-sky-400';
  const destLabel       = darkMode ? 'text-sky-400'  : 'text-sky-700';
  const itemBg          = darkMode ? 'bg-slate-800'  : 'bg-white';
  const itemBorder      = darkMode ? 'border-sky-800' : 'border-sky-200';
  const idColor         = darkMode ? 'text-slate-400' : 'text-gray-500';
  const objColor        = darkMode ? 'text-slate-400' : 'text-gray-500';
  const objBold         = darkMode ? 'text-slate-300' : '';
  const actionColor     = darkMode ? 'text-slate-200' : 'text-gray-800';
  const noteColor       = darkMode ? 'text-sky-400'   : 'text-sky-700';

  return (
    <div className={`mt-6 rounded-xl border ${containerBorder} ${containerBg} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-4 text-left ${hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🅿️</span>
          <div>
            <h3 className={`font-semibold ${titleColor}`}>Parking lot — Actions à rediriger</h3>
            <p className={`text-xs ${subtitleColor} mt-0.5`}>
              {items.length} action{items.length > 1 ? "s" : ""} identifiée{items.length > 1 ? "s" : ""} comme mal placée{items.length > 1 ? "s" : ""} dans ce chantier
            </p>
          </div>
        </div>
        <span className={`${chevronColor} text-sm`}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4">
          {Object.entries(byDest).map(([dest, destItems]) => (
            <div key={dest}>
              <p className={`text-xs font-semibold ${destLabel} mb-2 flex items-center gap-1.5`}>
                <span>→</span> {dest}
              </p>
              <div className="space-y-2">
                {destItems.map((item) => (
                  <div key={item.id} className={`${itemBg} rounded-lg border ${itemBorder} p-3`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`font-mono text-xs font-bold ${idColor}`}>{item.id}</span>
                      <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded-full font-medium shrink-0">→ {item.destination}</span>
                    </div>
                    <p className={`text-xs ${objColor} italic mb-1`}>
                      <span className={`font-medium ${objBold}`}>Objectif :</span> {item.objectif}
                    </p>
                    <p className={`text-sm ${actionColor} mb-1.5 font-medium`}>{item.action}</p>
                    {item.notes && (
                      <p className={`text-xs ${noteColor} italic leading-relaxed`}>💬 {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrphanActions({ items, darkMode }) {
  const [open, setOpen] = useState(false);
  if (!items || items.length === 0) return null;

  const containerBg     = darkMode ? 'bg-amber-950'   : 'bg-amber-50';
  const containerBorder = darkMode ? 'border-amber-800' : 'border-amber-200';
  const hoverBg         = darkMode ? 'hover:bg-amber-900' : 'hover:bg-amber-100';
  const titleColor      = darkMode ? 'text-amber-200'  : 'text-amber-900';
  const subtitleColor   = darkMode ? 'text-amber-400'  : 'text-amber-600';
  const chevronColor    = darkMode ? 'text-amber-600'  : 'text-amber-400';
  const itemBg          = darkMode ? 'bg-slate-800'    : 'bg-white';
  const itemBorder      = darkMode ? 'border-amber-800' : 'border-amber-200';
  const idColor         = darkMode ? 'text-slate-400'  : 'text-gray-500';
  const objColor        = darkMode ? 'text-slate-400'  : 'text-gray-500';
  const objBold         = darkMode ? 'text-slate-300'  : '';
  const actionColor     = darkMode ? 'text-slate-200'  : 'text-gray-800';
  const noteColor       = darkMode ? 'text-amber-400'  : 'text-amber-700';

  return (
    <div className={`mt-6 rounded-xl border ${containerBorder} ${containerBg} overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-4 text-left ${hoverBg} transition-colors`}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">✏️</span>
          <div>
            <h3 className={`font-semibold ${titleColor}`}>Actions à réécrire</h3>
            <p className={`text-xs ${subtitleColor} mt-0.5`}>
              {items.length} action{items.length > 1 ? "s" : ""} nécessitant une reformulation avant assignation à un projet
            </p>
          </div>
        </div>
        <span className={`${chevronColor} text-sm`}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2">
          {items.map((item) => (
            <div key={item.id} className={`${itemBg} rounded-lg border ${itemBorder} p-3`}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`font-mono text-xs font-bold ${idColor}`}>{item.id}</span>
                <span className="text-xs bg-amber-600 text-white px-2 py-0.5 rounded-full font-medium shrink-0">À réécrire</span>
              </div>
              <p className={`text-xs ${objColor} italic mb-1`}>
                <span className={`font-medium ${objBold}`}>Objectif :</span> {item.objectif}
              </p>
              <p className={`text-sm ${actionColor} mb-1.5 font-medium`}>{item.action}</p>
              {item.notes && (
                <p className={`text-xs ${noteColor} italic leading-relaxed`}>💬 {item.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsBar({ projects, parkingLot, orphans, darkMode }) {
  const counts = { keep: 0, rewrite: 0, gap: 0, move: 0 };
  projects.forEach((p) => p.actions.forEach((a) => { counts[a.status]++; }));
  if (orphans) orphans.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1; });
  const sourceTotal = counts.keep + counts.rewrite + counts.move;
  const gapTotal = counts.gap;

  const summaryBg     = darkMode ? 'bg-slate-800'   : 'bg-gray-50';
  const summaryBorder = darkMode ? 'border-slate-700' : 'border-gray-200';
  const summaryCount  = darkMode ? 'text-slate-300'  : 'text-gray-700';
  const summaryLabel  = darkMode ? 'text-slate-500'  : 'text-gray-500';
  const summaryDiv    = darkMode ? 'text-slate-600'  : 'text-gray-300';
  const gapBadgeBg    = darkMode ? 'bg-red-950'      : 'bg-red-50';
  const gapBadgeBd    = darkMode ? 'border-red-800'  : 'border-red-200';
  const gapBadgeTxt   = darkMode ? 'text-red-300'    : 'text-red-800';
  const gapBadgeSub   = darkMode ? 'text-red-400'    : 'text-red-700';
  const pkBadgeBg     = darkMode ? 'bg-sky-950'      : 'bg-sky-50';
  const pkBadgeBd     = darkMode ? 'border-sky-800'  : 'border-sky-200';
  const pkBadgeTxt    = darkMode ? 'text-sky-300'    : 'text-sky-800';
  const pkBadgeSub    = darkMode ? 'text-sky-400'    : 'text-sky-700';

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {["keep", "rewrite", "move"].map((status) => {
        const s = getS(status, darkMode);
        return (
          <div key={status} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${s.bg} ${s.border}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot} shrink-0`}></span>
            <span className={`text-sm font-bold ${s.text}`}>{counts[status]}</span>
            <span className={`text-xs ${s.text}`}>{s.label}</span>
          </div>
        );
      })}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${gapBadgeBd} ${gapBadgeBg}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${getS('gap', darkMode).dot} shrink-0`}></span>
        <span className={`text-sm font-bold ${gapBadgeTxt}`}>{gapTotal}</span>
        <span className={`text-xs ${gapBadgeSub}`}>Gap — À créer</span>
      </div>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${pkBadgeBd} ${pkBadgeBg}`}>
        <span className="text-sm">🅿️</span>
        <span className={`text-sm font-bold ${pkBadgeTxt}`}>{parkingLot?.length || 0}</span>
        <span className={`text-xs ${pkBadgeSub}`}>À rediriger</span>
      </div>
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${summaryBorder} ${summaryBg} ml-auto`}>
        <span className={`text-sm font-bold ${summaryCount}`}>{sourceTotal}</span>
        <span className={`text-xs ${summaryLabel}`}>actions source</span>
        <span className={`${summaryDiv} text-xs`}>·</span>
        <span className="text-sm font-bold text-red-400">{gapTotal}</span>
        <span className={`text-xs ${summaryLabel}`}>gaps</span>
      </div>
    </div>
  );
}

function AnalyseLegend({ darkMode }) {
  const textColor = darkMode ? '#94a3b8' : '#9ca3af';
  const labelColor = darkMode ? '#cbd5e1' : '#6b7280';
  const borderColor = darkMode ? '#334155' : '#f3f4f6';
  return (
    <div style={{ padding: "12px 16px", borderTop: `1px solid ${borderColor}` }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: textColor, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, margin: '0 0 8px 0' }}>Analyse</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.values(STATUS).map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10 }}>{s.icon}</span>
            <span style={{ fontSize: 12, color: labelColor }}>{s.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10 }}>🅿️</span>
          <span style={{ fontSize: 12, color: labelColor }}>À rediriger</span>
        </div>
      </div>
      <p style={{ fontSize: 11, fontWeight: 600, color: textColor, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '12px 0 8px 0' }}>Progression</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {Object.entries(PROGRESS).map(([key, p]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: p.color }}>{p.icon}</span>
            <span style={{ fontSize: 12, color: labelColor }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyseChantiers({ darkMode, analyseData, chantiersMeta }) {
  const saved = localStorage.getItem('rsn-selected-chantier');
  const [selectedId, _setSelectedId] = useState(saved === 'orphans' ? 'orphans' : (parseInt(saved) || 1));
  const setSelectedId = (id) => { localStorage.setItem('rsn-selected-chantier', id); _setSelectedId(id); };

  // Collect all orphans from analyzed chantiers
  const allOrphans = useMemo(() => {
    const result = [];
    chantiersMeta.forEach(c => {
      const data = analyseData[c.id];
      if (data && data.orphans && data.orphans.length > 0) {
        result.push({ chantierId: c.id, chantierName: c.name, orphans: data.orphans });
      }
    });
    return result;
  }, [analyseData, chantiersMeta]);
  const totalOrphans = allOrphans.reduce((s, g) => s + g.orphans.length, 0);

  const meta = selectedId === 'orphans'
    ? { id: '✏️', name: 'Actions sans projet', verb: 'À CLARIFIER', totalActions: totalOrphans, analyzed: true }
    : (chantiersMeta.find((c) => c.id === selectedId) || { id: selectedId, name: '...', verb: '...', totalActions: 0, analyzed: false });
  const chantierData = selectedId === 'orphans' ? null : analyseData[selectedId];

  const sidebarBg = darkMode ? '#1e293b' : 'white';
  const sidebarBorder = darkMode ? '#334155' : '#e5e7eb';
  const headerBorder = darkMode ? '#334155' : '#f3f4f6';
  const titleColor = darkMode ? '#f1f5f9' : '#1f2937';
  const subtitleColor = darkMode ? '#94a3b8' : '#9ca3af';
  const mainBg = darkMode ? '#0f172a' : '#f3f4f6';

  return (
    <div style={{ display: "flex", height: "calc(100vh - 70px)", fontFamily: "system-ui, sans-serif", backgroundColor: mainBg }}>
      {/* ── SIDEBAR ── */}
      <div style={{ width: 256, backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}`, display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 }}>
        <div style={{ padding: "16px", borderBottom: `1px solid ${headerBorder}` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: titleColor }}>Chantiers RSN</div>
          <div style={{ fontSize: 11, color: subtitleColor, marginTop: 2 }}>Analyse transversale</div>
        </div>

        <nav style={{ flex: 1, padding: "8px" }}>
          {chantiersMeta.map((c) => {
            const active = selectedId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  border: active ? "1px solid #c7d2fe" : "1px solid transparent",
                  backgroundColor: active ? (darkMode ? '#1e3a5f' : '#eef2ff') : 'transparent',
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f9fafb'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? (darkMode ? '#818cf8' : '#3730a3') : (darkMode ? '#cbd5e1' : '#374151') }}>
                    {c.id}. {c.name}
                  </span>
                  {c.analyzed ? (
                    <span style={{ fontSize: 12, color: "#10b981" }}>✓</span>
                  ) : (
                    <span style={{ fontSize: 12, color: darkMode ? '#475569' : '#d1d5db' }}>○</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 4, fontFamily: "monospace", backgroundColor: active ? (darkMode ? '#312e81' : '#e0e7ff') : (darkMode ? '#334155' : '#f3f4f6'), color: active ? (darkMode ? '#a5b4fc' : '#4338ca') : (darkMode ? '#94a3b8' : '#6b7280') }}>
                    {c.verb}
                  </span>
                  <span style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af' }}>{c.totalActions} actions</span>
                </div>
                {(() => {
                  const stats = getProgressStats(analyseData, c.id);
                  if (!stats) return null;
                  const total = Object.values(stats).reduce((s, v) => s + v, 0);
                  if (total === 0) return null;
                  return (
                    <div style={{ display: 'flex', borderRadius: 4, overflow: 'hidden', height: 3, marginTop: 6, backgroundColor: darkMode ? '#334155' : '#e5e7eb' }}>
                      {Object.entries(PROGRESS).map(([key, p]) => {
                        const pct = (stats[key] / total) * 100;
                        if (pct === 0) return null;
                        return <div key={key} style={{ width: `${pct}%`, backgroundColor: p.color }} />;
                      })}
                    </div>
                  );
                })()}
              </button>
            );
          })}
          {totalOrphans > 0 && (
            <div style={{ borderTop: `1px solid ${headerBorder}`, marginTop: 4, paddingTop: 8 }}>
              <button
                onClick={() => setSelectedId('orphans')}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: 8,
                  marginBottom: 4,
                  border: selectedId === 'orphans' ? "1px solid #fbbf24" : "1px solid transparent",
                  backgroundColor: selectedId === 'orphans' ? (darkMode ? '#451a03' : '#fffbeb') : 'transparent',
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (selectedId !== 'orphans') e.currentTarget.style.backgroundColor = darkMode ? '#334155' : '#f9fafb'; }}
                onMouseLeave={(e) => { if (selectedId !== 'orphans') e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: selectedId === 'orphans' ? '#f59e0b' : (darkMode ? '#cbd5e1' : '#374151') }}>
                    ✏️ Actions sans projet
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', backgroundColor: darkMode ? '#451a03' : '#fef3c7', padding: '1px 8px', borderRadius: 10 }}>
                    {totalOrphans}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af', marginTop: 4 }}>
                  À réécrire ou réassigner
                </div>
              </button>
            </div>
          )}
        </nav>

        <AnalyseLegend darkMode={darkMode} />
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <span style={{ backgroundColor: "#4f46e5", color: "white", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 6, fontFamily: "monospace", letterSpacing: 1 }}>
                {meta.verb}
              </span>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: darkMode ? '#f1f5f9' : '#111827', margin: 0 }}>
                {meta.id}. {meta.name}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: darkMode ? '#64748b' : '#9ca3af', margin: 0 }}>
              {meta.totalActions} actions dans le fichier source
              {meta.analyzed ? " · Analyse complète" : " · En attente d'analyse"}
            </p>
          </div>

          {/* Content */}
          {selectedId === 'orphans' ? (
            <>
              <p style={{ fontSize: 13, color: darkMode ? '#94a3b8' : '#6b7280', marginBottom: 24 }}>
                Actions nécessitant une reformulation ou une réassignation à un projet, regroupées par chantier d'origine.
              </p>
              {allOrphans.map(group => (
                <div key={group.chantierId} style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: darkMode ? '#f59e0b' : '#d97706', marginBottom: 8 }}>
                    {group.chantierId}. {group.chantierName}
                    <span style={{ fontWeight: 400, fontSize: 12, color: darkMode ? '#64748b' : '#9ca3af', marginLeft: 8 }}>
                      {group.orphans.length} action{group.orphans.length > 1 ? 's' : ''}
                    </span>
                  </h3>
                  {group.orphans.map(item => (
                    <div key={item.id} className={`${darkMode ? 'bg-slate-800 border-amber-800' : 'bg-white border-amber-200'} rounded-lg border p-3 mb-2`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className={`font-mono text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-gray-500'}`}>{item.id}</span>
                        <StatusBadge status={item.status} darkMode={darkMode} />
                      </div>
                      {item.objectif !== "—" && (
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-gray-500'} italic mb-1`}>
                          <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-gray-600'}`}>Objectif :</span> {item.objectif}
                        </p>
                      )}
                      <p className={`text-sm font-medium ${darkMode ? 'text-slate-200' : 'text-gray-800'} mb-1`}>{item.action}</p>
                      {item.notes && (
                        <p className={`text-xs ${darkMode ? 'text-amber-400' : 'text-amber-700'} italic leading-relaxed`}>💬 {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : chantierData ? (
            <>
              {/* Progress bar */}
              {(() => {
                const allActions = chantierData.projects.flatMap(p => p.actions).concat(chantierData.orphans || []);
                const progressCounts = {};
                Object.keys(PROGRESS).forEach(k => { progressCounts[k] = 0; });
                allActions.forEach(a => { const s = a.statutObjectif || 'non démarré'; progressCounts[s] = (progressCounts[s] || 0) + 1; });
                const total = allActions.length;
                if (total === 0) return null;
                return (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 8, backgroundColor: darkMode ? '#1e293b' : '#e5e7eb' }}>
                      {Object.entries(PROGRESS).map(([key, p]) => {
                        const pct = (progressCounts[key] / total) * 100;
                        if (pct === 0) return null;
                        return <div key={key} style={{ width: `${pct}%`, backgroundColor: p.color, transition: 'width 0.3s' }} />;
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                      {Object.entries(PROGRESS).map(([key, p]) => (
                        progressCounts[key] > 0 && (
                          <span key={key} style={{ fontSize: 11, color: p.color, fontWeight: 500 }}>
                            {p.icon} {progressCounts[key]} {p.label.toLowerCase()}
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                );
              })()}
              <StatsBar projects={chantierData.projects} parkingLot={chantierData.parkingLot} orphans={chantierData.orphans} darkMode={darkMode} />
              {chantierData.projects.map((p) => (
                <ProjectCard key={p.id} project={p} darkMode={darkMode} />
              ))}
              <OrphanActions items={chantierData.orphans} darkMode={darkMode} />
              <ParkingLot items={chantierData.parkingLot} darkMode={darkMode} />
            </>
          ) : (
            <div style={{ backgroundColor: darkMode ? '#1e293b' : 'white', borderRadius: 16, border: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: darkMode ? '#e2e8f0' : '#374151', marginBottom: 8 }}>
                Ce chantier n'a pas encore été analysé
              </h3>
              <p style={{ fontSize: 14, color: darkMode ? '#64748b' : '#9ca3af' }}>
                Poursuivez l'analyse pour remplir ce tableau chantier par chantier.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
