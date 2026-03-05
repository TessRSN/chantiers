function RSNRadialGraph({ darkMode }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredConnection, setHoveredConnection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const panelRef = useRef(null);
  const svgRef = useRef(null);

  // Click outside panel to close (but not when clicking SVG nodes)
  useEffect(() => {
    const handler = (e) => {
      if (selectedNode && panelRef.current && !panelRef.current.contains(e.target)
          && svgRef.current && !svgRef.current.contains(e.target)) {
        setSelectedNode(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedNode]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return vueGlobaleData.actions.filter(a =>
      a.action.toLowerCase().includes(term) ||
      a.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const highlightedAxes = useMemo(() => [...new Set(searchResults.map(a => a.axe))], [searchResults]);
  const highlightedChantiers = useMemo(() => [...new Set(searchResults.map(a => a.chantier))], [searchResults]);

  const theme = {
    bg: darkMode ? 'bg-slate-950' : 'bg-gray-100',
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-gray-500',
    textLight: darkMode ? 'text-slate-500' : 'text-gray-400',
    cardBg: darkMode ? 'bg-slate-900' : 'bg-white',
    cardBorder: darkMode ? 'border-slate-800' : 'border-gray-200',
    buttonBg: darkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300',
    svgBg: darkMode ? '#0F172A' : '#FFFFFF',
    svgStroke: darkMode ? '#334155' : '#CBD5E1',
    svgNodeBg: darkMode ? '#1E293B' : '#F3F4F6',
    svgLabelPrimary: darkMode ? '#E2E8F0' : '#1F2937',
    svgLabelSecondary: darkMode ? '#94A3B8' : '#6B7280',
    svgLabelTertiary: darkMode ? '#64748B' : '#9CA3AF',
  };

  const width = 900;
  const height = 900;
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = 70;
  const axeRadius = 320;
  const chantierRadius = 200;
  const effetRadius = 70;

  const effetsStrategiques = [
    { id: 'ES1', name: 'Consolidation écosystème', color: '#3B82F6', chantiers: ['C1', 'C2'] },
    { id: 'ES2', name: 'Maillage environnement', color: '#10B981', chantiers: ['C3', 'C4', 'C7'] },
    { id: 'ES3', name: 'Rapprochement preneurs/décideurs', color: '#F59E0B', chantiers: ['C5', 'C6'] },
  ];

  const effetPositions = useMemo(() => {
    return effetsStrategiques.map((effet, i) => {
      const angle = (i / effetsStrategiques.length) * 2 * Math.PI - Math.PI / 2;
      return { ...effet, x: centerX + Math.cos(angle) * effetRadius, y: centerY + Math.sin(angle) * effetRadius, angle };
    });
  }, []);

  const connections = useMemo(() => {
    const conn = [];
    vueGlobaleData.chantiers.forEach(chantier => {
      vueGlobaleData.axes.forEach(axe => {
        const actions = vueGlobaleData.actions.filter(a => a.axe === axe.id && a.chantier === chantier.id);
        if (actions.length > 0) conn.push({ axe: axe.id, chantier: chantier.id, count: actions.length, actions });
      });
    });
    return conn;
  }, []);

  const axePositions = useMemo(() => {
    return vueGlobaleData.axes.map((axe, i) => {
      const angle = (i / vueGlobaleData.axes.length) * 2 * Math.PI - Math.PI / 2;
      return { ...axe, x: centerX + Math.cos(angle) * axeRadius, y: centerY + Math.sin(angle) * axeRadius, angle };
    });
  }, []);

  const chantierPositions = useMemo(() => {
    return vueGlobaleData.chantiers.map((chantier, i) => {
      const angle = (i / vueGlobaleData.chantiers.length) * 2 * Math.PI - Math.PI / 2;
      return { ...chantier, x: centerX + Math.cos(angle) * chantierRadius, y: centerY + Math.sin(angle) * chantierRadius, angle };
    });
  }, []);

  const getAxePos = (id) => axePositions.find(a => a.id === id);
  const getChantierPos = (id) => chantierPositions.find(c => c.id === id);

  const isHighlighted = (conn) => {
    if (!selectedNode) return true;
    return conn.axe === selectedNode.id || conn.chantier === selectedNode.id;
  };

  const selectedActions = useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === 'chantier') return vueGlobaleData.actions.filter(a => a.chantier === selectedNode.id);
    return vueGlobaleData.actions.filter(a => a.axe === selectedNode.id);
  }, [selectedNode]);

  return (
    <div className={`${darkMode ? 'bg-slate-950' : 'bg-gray-100'} px-2 pt-2 pb-0 transition-colors duration-300`} style={{ height: 'calc(100vh - 70px)', overflow: 'hidden' }}>
      <div className="mx-auto">
        <div className="text-center mb-0">
          <h1 className={`text-3xl font-bold ${darkMode ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent mb-0`}>
            Réseau des Actions RSN
          </h1>
          <p className={`${theme.textMuted} text-sm mb-0`}>
            Cliquez sur un nœud pour voir ses connexions • {vueGlobaleData.actions.length} actions • {vueGlobaleData.axes.length} axes • {vueGlobaleData.chantiers.length} chantiers
          </p>
        </div>

        <div className="relative">
          {/* ── Left panel — search + cards ── */}
          <div className="fixed z-20 flex flex-col gap-2" style={{ width: 260, left: 12, top: 110 }}>
            {/* Search bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-3 py-2 pl-9 rounded-full text-xs ${darkMode ? 'bg-slate-800 text-white placeholder-slate-400 border-slate-700' : 'bg-white text-gray-900 placeholder-gray-400 border-gray-300'} border focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${darkMode ? 'text-slate-400' : 'text-gray-400'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? 'text-slate-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}>✕</button>
              )}
            </div>
            {searchTerm && (
              <div className={`text-xs ${theme.textMuted} px-1`}>
                {searchResults.length} action{searchResults.length !== 1 ? 's' : ''} trouvée{searchResults.length !== 1 ? 's' : ''}
              </div>
            )}

            {/* Search results panel */}
            {searchTerm && searchResults.length > 0 && !selectedNode && (
              <div ref={panelRef} className={`${theme.cardBg} rounded-xl p-3 overflow-y-auto border ${theme.cardBorder}`} style={{ maxHeight: 'calc(100vh - 180px)' }}>
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${theme.cardBorder}`}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs bg-purple-500">{searchResults.length}</div>
                  <div>
                    <div className={`font-bold ${theme.text} text-xs`}>Résultats</div>
                    <div className={`text-xs ${theme.textLight}`}>{searchResults.length} action{searchResults.length !== 1 ? 's' : ''}</div>
                  </div>
                </div>
                <div className="space-y-3">
                  {vueGlobaleData.chantiers.map(chantier => {
                    const chantierResults = searchResults.filter(a => a.chantier === chantier.id);
                    if (chantierResults.length === 0) return null;
                    return (
                      <div key={chantier.id} className={`${darkMode ? 'bg-slate-800/50' : 'bg-gray-100'} rounded-lg p-2`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="text-sm">{chantier.icon}</span>
                          <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{chantier.name}</span>
                          <span className={`text-xs ${theme.textLight}`}>({chantierResults.length})</span>
                        </div>
                        {chantierResults.map(action => {
                          const axe = vueGlobaleData.axes.find(a => a.id === action.axe);
                          return (
                            <ActionDetail key={action.id} action={action} darkMode={darkMode} theme={theme} borderColor={axe?.color} showAxeLabel={true} />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected node panel */}
            {selectedNode && (
              <div ref={panelRef} className={`${theme.cardBg} rounded-xl p-3 overflow-y-auto border ${theme.cardBorder}`} style={{ position: 'relative', maxHeight: 'calc(100vh - 180px)' }}>
                <button onClick={() => setSelectedNode(null)}
                  style={{ position: 'absolute', top: 8, right: 10, background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 16, color: darkMode ? '#64748b' : '#9ca3af', lineHeight: 1 }}>✕</button>
                <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${theme.cardBorder} pr-5`}>
                  {selectedNode.type === 'chantier' ? (
                    <>
                      <span className="text-2xl">{selectedNode.icon}</span>
                      <div>
                        <h3 className={`font-bold ${theme.text} text-xs`}>{selectedNode.name}</h3>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: selectedNode.color + '30', color: selectedNode.color, fontSize: 10 }}>{selectedNode.verb}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: selectedNode.color }}>
                        {vueGlobaleData.actions.filter(a => a.axe === selectedNode.id).length}
                      </div>
                      <div>
                        <h3 className={`font-bold ${theme.text} text-xs`}>{selectedNode.name}</h3>
                        <span className={`text-xs ${theme.textLight}`} style={{ fontSize: 10 }}>
                          {selectedNode.type === 'axe' ? 'Axe thématique' : selectedNode.type === 'champ' ? "Champ d'action" : 'Principe directeur'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <div className={`text-xs ${theme.textMuted} mb-1`}>{selectedActions.length} action{selectedActions.length > 1 ? 's' : ''}</div>
                  {selectedNode.type === 'chantier' ? (
                    vueGlobaleData.axes.map(axe => {
                      const axeActions = selectedActions.filter(a => a.axe === axe.id);
                      if (axeActions.length === 0) return null;
                      return (
                        <div key={axe.id} className={`${darkMode ? 'bg-slate-800/50' : 'bg-gray-100'} rounded-lg p-2`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: axe.color }} />
                            <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{axe.name}</span>
                            <span className={`text-xs ${theme.textLight}`}>({axeActions.length})</span>
                          </div>
                          {axeActions.map(action => (
                            <ActionDetail key={action.id} action={action} darkMode={darkMode} theme={theme} borderColor={axe.color} />
                          ))}
                        </div>
                      );
                    })
                  ) : (
                    vueGlobaleData.chantiers.map(chantier => {
                      const chantierActions = selectedActions.filter(a => a.chantier === chantier.id);
                      if (chantierActions.length === 0) return null;
                      return (
                        <div key={chantier.id} className={`${darkMode ? 'bg-slate-800/50' : 'bg-gray-100'} rounded-lg p-2`}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="text-sm">{chantier.icon}</span>
                            <span className={`text-xs font-medium ${darkMode ? 'text-slate-300' : 'text-gray-700'}`}>{chantier.name}</span>
                            <span className={`text-xs ${theme.textLight}`}>({chantierActions.length})</span>
                          </div>
                          {chantierActions.map(action => (
                            <ActionDetail key={action.id} action={action} darkMode={darkMode} theme={theme} />
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── SVG radial diagram — centered ── */}
          <div className="flex justify-center" style={{ height: 'calc(100vh - 140px)' }}>
            <svg ref={svgRef} viewBox="50 50 800 810" width="100%" height="100%" preserveAspectRatio="xMidYMin meet">
              <defs>
                <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#6366F1" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx={centerX} cy={centerY} r={chantierRadius} fill="none" stroke={theme.svgStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
              <circle cx={centerX} cy={centerY} r={axeRadius} fill="none" stroke={theme.svgStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

              {effetPositions.map((effet) => {
                const isEffetSelected = selectedNode?.id === effet.id && selectedNode?.type === 'effet';
                const anyEffetSelected = selectedNode?.type === 'effet';
                return effet.chantiers.map((chantierId) => {
                  const chantierPos = getChantierPos(chantierId);
                  if (!chantierPos) return null;
                  const highlighted = isEffetSelected || !anyEffetSelected;
                  return (
                    <line key={`${effet.id}-${chantierId}`} x1={effet.x} y1={effet.y} x2={chantierPos.x} y2={chantierPos.y}
                      stroke={effet.color} strokeWidth={isEffetSelected ? 4 : 3}
                      opacity={highlighted ? (isEffetSelected ? 0.8 : 0.4) : 0.1} className="transition-opacity duration-300" />
                  );
                });
              })}

              {connections.map((conn, i) => {
                const axePos = getAxePos(conn.axe);
                const chantierPos = getChantierPos(conn.chantier);
                const highlighted = isHighlighted(conn) && selectedNode?.type !== 'effet';
                const isHovered = hoveredConnection === `${conn.axe}-${conn.chantier}`;
                const midX = (axePos.x + chantierPos.x) / 2;
                const midY = (axePos.y + chantierPos.y) / 2;
                const ctrlX = centerX + (midX - centerX) * 0.3;
                const ctrlY = centerY + (midY - centerY) * 0.3;
                return (
                  <g key={i}>
                    <path d={`M ${chantierPos.x} ${chantierPos.y} Q ${ctrlX} ${ctrlY} ${axePos.x} ${axePos.y}`}
                      fill="none" stroke={axePos.color} strokeWidth={Math.max(1, conn.count * 1.5)}
                      opacity={highlighted ? (isHovered ? 0.9 : 0.5) : 0.08} className="transition-opacity duration-300"
                      onMouseEnter={() => setHoveredConnection(`${conn.axe}-${conn.chantier}`)}
                      onMouseLeave={() => setHoveredConnection(null)} style={{ cursor: 'pointer' }} />
                    {isHovered && selectedNode?.type !== 'effet' && (
                      <text x={ctrlX} y={ctrlY} fill={theme.svgLabelPrimary} fontSize="12" textAnchor="middle" className="pointer-events-none">
                        {conn.count} action{conn.count > 1 ? 's' : ''}
                      </text>
                    )}
                  </g>
                );
              })}

              {chantierPositions.map((chantier) => {
                const isSelected = selectedNode?.id === chantier.id;
                const isRelated = selectedNode && connections.some(c => c.chantier === chantier.id && c.axe === selectedNode.id);
                const isRelatedToEffet = selectedNode?.type === 'effet' && selectedNode?.chantiers?.includes(chantier.id);
                const isSearchHighlighted = searchTerm && highlightedChantiers.includes(chantier.id);
                const dimmed = (selectedNode && !isSelected && !isRelated && selectedNode.type !== 'chantier' && selectedNode.type !== 'effet') ||
                               (selectedNode?.type === 'effet' && !isRelatedToEffet) ||
                               (searchTerm && !isSearchHighlighted);
                const chantierActionCount = vueGlobaleData.actions.filter(a => a.chantier === chantier.id).length;
                const searchCount = searchResults.filter(a => a.chantier === chantier.id).length;
                const percentage = Math.round((chantierActionCount / vueGlobaleData.actions.length) * 100);
                return (
                  <g key={chantier.id} onClick={() => setSelectedNode(isSelected ? null : {...chantier, type: 'chantier'})}
                    style={{ cursor: 'pointer' }} opacity={dimmed ? 0.3 : 1} className="transition-opacity duration-300">
                    <circle cx={chantier.x} cy={chantier.y} r={isSelected || isSearchHighlighted ? 42 : 38}
                      fill={theme.svgNodeBg} stroke={isSearchHighlighted && !isSelected ? '#A855F7' : chantier.color}
                      strokeWidth={isSelected || isSearchHighlighted ? 4 : 2} />
                    <text x={chantier.x} y={chantier.y - 10} fill={theme.svgLabelPrimary} fontSize="18" textAnchor="middle">{chantier.icon}</text>
                    <text x={chantier.x} y={chantier.y + 6} fill={isSearchHighlighted ? '#A855F7' : chantier.color} fontSize="10" fontWeight="bold" textAnchor="middle">
                      {isSearchHighlighted ? searchCount : percentage + '%'}
                    </text>
                    <text x={chantier.x} y={chantier.y + 18} fill={theme.svgLabelSecondary} fontSize="7" textAnchor="middle">
                      {isSearchHighlighted ? 'résultat' + (searchCount > 1 ? 's' : '') : chantier.verb}
                    </text>
                    <text x={chantier.x} y={chantier.y + (chantier.y > centerY ? 58 : -48)}
                      fill={theme.svgLabelPrimary} fontSize="11" fontWeight="500" textAnchor="middle">{chantier.name}</text>
                  </g>
                );
              })}

              {axePositions.map((axe) => {
                const isSelected = selectedNode?.id === axe.id;
                const isRelated = selectedNode && connections.some(c => c.axe === axe.id && c.chantier === selectedNode.id);
                const isSearchHighlighted = searchTerm && highlightedAxes.includes(axe.id);
                const dimmed = (selectedNode && !isSelected && !isRelated && selectedNode.type === 'chantier') ||
                               (selectedNode?.type === 'effet') ||
                               (searchTerm && !isSearchHighlighted);
                const labelAngle = axe.angle;
                const labelRadius = axeRadius + 45;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;
                const actionCount = vueGlobaleData.actions.filter(a => a.axe === axe.id).length;
                const searchCount = searchResults.filter(a => a.axe === axe.id).length;
                return (
                  <g key={axe.id} onClick={() => setSelectedNode(isSelected ? null : axe)}
                    style={{ cursor: 'pointer' }} opacity={dimmed ? 0.3 : 1} className="transition-opacity duration-300">
                    <circle cx={axe.x} cy={axe.y} r={isSelected || isSearchHighlighted ? 28 : 24}
                      fill={axe.color} opacity={0.9}
                      stroke={isSelected ? 'white' : isSearchHighlighted ? '#A855F7' : 'transparent'} strokeWidth={3} />
                    <text x={axe.x} y={axe.y + 5} fill="white" fontSize="11" fontWeight="bold" textAnchor="middle">
                      {isSearchHighlighted ? searchCount : actionCount}
                    </text>
                    <text x={labelX} y={labelY} fill={theme.svgLabelPrimary} fontSize="10" fontWeight="500"
                      textAnchor={labelX > centerX ? "start" : "end"} dominantBaseline="middle">{axe.name}</text>
                    <text x={labelX} y={labelY + 12} fill={theme.svgLabelTertiary} fontSize="8"
                      textAnchor={labelX > centerX ? "start" : "end"}>
                      {axe.type === 'axe' ? `Axe ${axe.id.replace('A', '')}` : axe.type === 'champ' ? "Champ d'action" : 'Principe directeur'}
                    </text>
                  </g>
                );
              })}

              {effetPositions.map((effet) => {
                const effetActionCount = effet.chantiers.reduce((sum, cId) => sum + vueGlobaleData.actions.filter(a => a.chantier === cId).length, 0);
                const percentage = Math.round((effetActionCount / vueGlobaleData.actions.length) * 100);
                const isSelected = selectedNode?.id === effet.id;
                return (
                  <g key={effet.id} onClick={() => setSelectedNode(isSelected ? null : {...effet, type: 'effet'})} style={{ cursor: 'pointer' }}>
                    <circle cx={effet.x} cy={effet.y} r={isSelected ? 42 : 38}
                      fill={theme.svgBg} stroke={effet.color} strokeWidth={isSelected ? 4 : 3} />
                    <text x={effet.x} y={effet.y - 8} fill={effet.color} fontSize="12" fontWeight="bold" textAnchor="middle">{percentage}%</text>
                    <text x={effet.x} y={effet.y + 5} fill={theme.svgLabelPrimary} fontSize="7" fontWeight="500" textAnchor="middle">{effet.name.split(' ')[0]}</text>
                    <text x={effet.x} y={effet.y + 14} fill={theme.svgLabelSecondary} fontSize="6" textAnchor="middle">{effet.name.split(' ').slice(1).join(' ')}</text>
                  </g>
                );
              })}
            </svg>
          </div>

        </div>

      </div>
    </div>
  );
}
