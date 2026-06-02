// ── Petite icône chain-link monocolor (currentColor) — pour les badges Coordination ──
function LinkIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ── Helper : retrouver une action par son ID dans le tableau d'actions complet ──
function findActionById(allActions, id) {
  return allActions ? allActions.find(a => a.id === id) : null;
}

// ── Helper : déduire l'entité (axe/PD/champ) à partir d'un ID action ──
function entityIdFromActionId(actionId) {
  if (!actionId) return null;
  const ax = actionId.match(/^(A[1-4])-/);            if (ax) return ax[1];
  const pd = actionId.match(/^(PD-[A-Z]+)-/);         if (pd) return pd[1];
  const ca = actionId.match(/^(CA-[A-Z]+)-/);         if (ca) return ca[1];
  return null;
}

// ── Pastille « Coordonné avec : … » — affiche des badges cliquables qui ouvrent la vue
//    par axe de l'entité ciblée. n'affiche rien si la liste est vide. ──
function CoordinationBadges({ ids, allActions, darkMode }) {
  if (!ids || ids.length === 0) return null;
  const accentBg = darkMode ? '#1e293b' : '#eef2ff';
  const accentBorder = darkMode ? '#6366f1' : '#c7d2fe';
  const accentText = darkMode ? '#a5b4fc' : '#4f46e5';
  return (
    <div style={{
      marginTop: 6,
      display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
      fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280',
    }}>
      <span style={{ fontStyle: 'italic', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <LinkIcon size={12} />
        {t('shared.coord-label')}
      </span>
      {ids.map(id => {
        const linkedAction = findActionById(allActions, id);
        const entityId = entityIdFromActionId(id);
        const title = linkedAction ? tConfig(linkedAction, 'action') : id;
        return (
          <a
            key={id}
            href={entityId ? `#par-axe?entite=${entityId}${window.LANG === 'en' ? '&lang=en' : ''}` : '#'}
            title={title}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 10,
              background: accentBg,
              border: `1px solid ${accentBorder}`,
              color: accentText,
              fontWeight: 600, fontFamily: 'ui-monospace, monospace',
              textDecoration: 'none', fontSize: 10.5,
              cursor: entityId ? 'pointer' : 'default',
            }}
          >
            {id}
          </a>
        );
      })}
    </div>
  );
}

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
      <span style={{ fontSize: fontSize + 2 }}>{p.icon}</span> {tConfig(p, 'label')}
    </span>
  );
}

function StatusBadge({ status, darkMode }) {
  const s = getS(status, darkMode);
  if (s.hidden) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.border} ${s.text}`}>
      {s.icon} {s.label}
    </span>
  );
}

function getProgressStats(analyseData, chantierId) {
  const data = analyseData[chantierId];
  if (!data) return null;
  const allActions = data.projects.flatMap(p => p.actions);
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
          <span className={`text-xs ${theme.textLight}`}>{tConfig(axe, 'name')}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`font-mono ${theme.textLight}`} style={{ fontSize: 10 }}>{action.id}</span>
            <ProgressBadge statut={action.statutObjectif} darkMode={darkMode} size="xs" />
          </div>
          <p className={`${darkMode ? 'text-slate-200' : 'text-gray-800'} mt-0.5 leading-relaxed`}>{tConfig(action, 'action')}</p>
          <CoordinationBadges ids={action.coordination} allActions={vueGlobaleData.actions} darkMode={darkMode} />
        </div>
        {hasExtra && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={`${theme.textLight} hover:${theme.text} shrink-0 mt-0.5`}
            style={{ fontSize: 10 }}
            title={t('shared.details')}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>
      {expanded && (
        <div className={`mt-1.5 pt-1.5 space-y-1`} style={{ borderTop: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}` }}>
          {action.objectif && (
            <p className={theme.textLight} style={{ fontSize: 10, lineHeight: '1.4' }}>
              <span className={`font-semibold ${theme.textMuted}`}>{t('shared.os-label')}</span> {action.objectif}
            </p>
          )}
          {action.actionOriginale && action.actionOriginale !== action.action && (
            <p className={theme.textLight} style={{ fontSize: 10, lineHeight: '1.4', fontStyle: 'italic' }}>
              <span className={`font-semibold ${theme.textMuted}`}>{t('shared.original-action')}</span> {tConfig(action, 'actionOriginale')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
