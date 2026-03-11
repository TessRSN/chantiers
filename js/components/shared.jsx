function ProgressBadge({ statut, darkMode, size = 'sm' }) {
  const p = PROGRESS[statut] || PROGRESS['non démarré'];
  const bg = darkMode ? p.bgDark : p.bgLight;
  const border = darkMode ? p.borderDark : p.borderLight;
  const fontSize = size === 'xs' ? 10 : 11;
  const padding = size === 'xs' ? '1px 6px' : '2px 8px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize, padding, borderRadius: 12,
      backgroundColor: bg, border: `1px solid ${border}`, color: p.color,
      fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: fontSize + 2 }}>{p.icon}</span> {p.label}
    </span>
  );
}

function StatusBadge({ status, darkMode }) {
  const s = getS(status, darkMode);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.border} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

function getProgressStats(analyseData, chantierId) {
  const data = analyseData[chantierId];
  if (!data) return null;
  const allActions = data.projects.flatMap(p => p.actions).concat(data.orphans || []);
  const counts = {};
  Object.keys(PROGRESS).forEach(k => { counts[k] = 0; });
  allActions.forEach(a => { const s = a.statutObjectif || 'non démarré'; counts[s] = (counts[s] || 0) + 1; });
  return counts;
}

function ActionDetail({ action, darkMode, theme, borderColor, showAxeLabel }) {
  const [expanded, setExpanded] = useState(false);
  const axe = showAxeLabel ? vueGlobaleData.axes.find(a => a.id === action.axe) : null;
  const hasExtra = action.objectif || (action.actionOriginale && action.actionOriginale !== action.action);

  return (
    <div
      className={`text-xs ${theme.textMuted} py-2 pl-3 border-l-2 ml-1 mb-1`}
      style={{ borderColor: borderColor || (darkMode ? '#334155' : '#d1d5db') }}
    >
      {axe && (
        <div className="flex items-center gap-1 mb-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: axe.color }}></div>
          <span className={`text-xs ${theme.textLight}`}>{axe.name}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-mono ${theme.textLight}`} style={{ fontSize: 10 }}>{action.id}</span>
            <ProgressBadge statut={action.statutObjectif} darkMode={darkMode} size="xs" />
          </div>
          <p className={`${darkMode ? 'text-slate-200' : 'text-gray-800'} mt-0.5 leading-relaxed`}>{action.action}</p>
        </div>
        {hasExtra && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`${theme.textLight} hover:${theme.text} shrink-0 mt-0.5`}
            style={{ fontSize: 10 }}
            title="Détails"
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {expanded && (
        <div className={`mt-1.5 pt-1.5 space-y-1`} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}` }}>
          {action.objectif && (
            <p className={theme.textLight} style={{ fontSize: 10, lineHeight: '1.4' }}>
              <span className={`font-semibold ${theme.textMuted}`}>Objectif stratégique :</span> {action.objectif}
            </p>
          )}
          {action.actionOriginale && action.actionOriginale !== action.action && (
            <p className={theme.textLight} style={{ fontSize: 10, lineHeight: '1.4', fontStyle: 'italic' }}>
              <span className={`font-semibold ${theme.textMuted}`}>Action originale :</span> {action.actionOriginale}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
