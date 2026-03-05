function SuiviObjectifs({ darkMode, actions }) {
  const [searchTerm, setSearchTerm] = useState('');

  const theme = {
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-gray-500',
    textLight: darkMode ? 'text-slate-500' : 'text-gray-400',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    cardBorder: darkMode ? '#334155' : '#e5e7eb',
    sectionBg: darkMode ? '#0f172a' : '#f9fafb',
  };

  // One card per action
  const objectifs = useMemo(() => {
    return actions.map(a => {
      const axeConfig = vueGlobaleData.axes.find(ax => ax.id === a.axe);
      const chantierConfig = vueGlobaleData.chantiers.find(ch => ch.id === a.chantier);
      return {
        id: a.id,
        texte: a.action,
        objectif: a.objectif,
        statut: a.statutObjectif || 'non démarré',
        axe: axeConfig?.name || a.axe,
        axeColor: axeConfig?.color || '#6b7280',
        chantier: chantierConfig?.name || a.chantier,
        chantierIcon: chantierConfig?.icon || '',
      };
    });
  }, [actions]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return objectifs;
    const term = searchTerm.toLowerCase();
    return objectifs.filter(o =>
      o.texte.toLowerCase().includes(term) ||
      o.objectif.toLowerCase().includes(term) ||
      o.id.toLowerCase().includes(term) ||
      o.axe.toLowerCase().includes(term) ||
      o.chantier.toLowerCase().includes(term)
    );
  }, [objectifs, searchTerm]);

  // Group by status
  const groups = useMemo(() => ({
    'en cours': filtered.filter(o => o.statut === 'en cours'),
    'terminé': filtered.filter(o => o.statut === 'terminé'),
    'non démarré': filtered.filter(o => o.statut === 'non démarré'),
  }), [filtered]);

  const sectionConfig = {
    'en cours':    { title: 'En cours',    color: '#f59e0b', icon: '◐' },
    'terminé':     { title: 'Terminés',    color: '#22c55e', icon: '●' },
    'non démarré': { title: 'Non démarrés', color: '#6b7280', icon: '○' },
  };

  return (
    <div className={`${darkMode ? 'bg-slate-950' : 'bg-gray-100'} px-4 pt-2 pb-4 transition-colors duration-300`} style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-3">
          <h1 className={`text-2xl font-bold ${darkMode ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent`}>
            Suivi des objectifs
          </h1>
          <p className={`${theme.textMuted} text-xs mt-1`}>
            {objectifs.length} actions • {groups['en cours'].length} en cours · {groups['terminé'].length} terminées · {groups['non démarré'].length} non démarrées
          </p>
        </div>

        {/* Search bar */}
        <div className="max-w-md mx-auto mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un objectif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 pl-10 rounded-full text-sm ${darkMode ? 'bg-slate-800 text-white placeholder-slate-400 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
            <svg className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>✕</button>
            )}
          </div>
          {searchTerm && (
            <div className={`mt-1 text-xs ${theme.textMuted} text-center`}>
              {filtered.length} action{filtered.length !== 1 ? 's' : ''} trouvée{filtered.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-5">
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 10 }}>
            {objectifs.length > 0 && [
              { key: 'terminé', count: groups['terminé'].length, color: '#22c55e' },
              { key: 'en cours', count: groups['en cours'].length, color: '#f59e0b' },
              { key: 'non démarré', count: groups['non démarré'].length, color: darkMode ? '#334155' : '#d1d5db' },
            ].map(s => s.count > 0 && (
              <div key={s.key} style={{
                width: `${(s.count / objectifs.length) * 100}%`,
                backgroundColor: s.color,
                transition: 'width 0.3s ease',
              }} title={`${s.key}: ${s.count}`} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 6 }}>
            {[
              { label: 'Terminé', count: groups['terminé'].length, color: '#22c55e' },
              { label: 'En cours', count: groups['en cours'].length, color: '#f59e0b' },
              { label: 'Non démarré', count: groups['non démarré'].length, color: darkMode ? '#64748b' : '#9ca3af' },
            ].map(s => (
              <span key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: s.color, fontWeight: 500 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: s.color, display: 'inline-block' }} />
                {s.count} {s.label.toLowerCase()}
              </span>
            ))}
          </div>
        </div>

        {/* Sections by status */}
        {['en cours', 'terminé', 'non démarré'].map(statut => {
          const items = groups[statut];
          const cfg = sectionConfig[statut];
          if (items.length === 0) return null;
          return (
            <div key={statut} className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
                <span style={{ color: cfg.color, fontWeight: 700, fontSize: 14 }}>{cfg.title}</span>
                <span className={`text-xs ${theme.textMuted}`}>({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(obj => (
                  <div key={obj.id} style={{
                    backgroundColor: theme.cardBg,
                    borderTop: `1px solid ${theme.cardBorder}`,
                    borderRight: `1px solid ${theme.cardBorder}`,
                    borderBottom: `1px solid ${theme.cardBorder}`,
                    borderLeft: `4px solid ${obj.axeColor}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: obj.axeColor, fontFamily: 'monospace' }}>{obj.id}</span>
                      <ProgressBadge statut={obj.statut} darkMode={darkMode} size="xs" />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: darkMode ? '#e2e8f0' : '#1f2937', lineHeight: 1.4 }}>
                      {obj.texte}
                    </div>
                    {obj.objectif && (
                      <div style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af', lineHeight: 1.3, fontStyle: 'italic' }}>
                        {obj.objectif}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        backgroundColor: obj.axeColor + '20', color: obj.axeColor, fontWeight: 600,
                      }}>{obj.axe}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 10,
                        backgroundColor: darkMode ? '#334155' : '#f3f4f6',
                        color: darkMode ? '#94a3b8' : '#6b7280', fontWeight: 500,
                      }}>{obj.chantierIcon} {obj.chantier}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
