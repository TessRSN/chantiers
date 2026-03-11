// Arc path for curved text: creates an arc from startAngle to endAngle (degrees)
const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const toRad = d => (d * Math.PI) / 180;
  const x1 = cx + Math.cos(toRad(startDeg)) * r;
  const y1 = cy + Math.sin(toRad(startDeg)) * r;
  const x2 = cx + Math.cos(toRad(endDeg)) * r;
  const y2 = cy + Math.sin(toRad(endDeg)) * r;
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
};

function StructureGouvernance({ darkMode, gouvernanceData }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [expandedGov, setExpandedGov] = useState(null); // id of expanded gov box
  const panelRef = useRef(null);

  const theme = {
    text: darkMode ? 'text-white' : 'text-gray-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-gray-500',
    textLight: darkMode ? 'text-slate-500' : 'text-gray-400',
    cardBg: darkMode ? 'bg-slate-900' : 'bg-white',
    cardBorder: darkMode ? 'border-slate-800' : 'border-gray-200',
    svgStroke: darkMode ? '#334155' : '#CBD5E1',
    svgNodeBg: darkMode ? '#1E293B' : '#F3F4F6',
    svgLabelFill: darkMode ? '#E2E8F0' : '#1F2937',
    svgLabelMuted: darkMode ? '#94A3B8' : '#6B7280',
    svgLabelDim: darkMode ? '#64748B' : '#9CA3AF',
  };

  // Click outside panel to close
  useEffect(() => {
    const handler = (e) => {
      if (selectedNode && panelRef.current && !panelRef.current.contains(e.target)) {
        setSelectedNode(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedNode]);

  // SVG sized to fit — center shifted down slightly to avoid EDIA crop
  const width = 740, height = 760;
  const cx = width / 2, cy = height / 2 + 15;
  const axeR = 115, champR = 230, princR = 335;
  const axeNodeR = 42, champNodeR = 42, princNodeR = 42;

  const axePositions = useMemo(() => {
    return gouvernanceData.axes.map((ax, i) => {
      const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
      return { ...ax, type: 'axe', x: cx + Math.cos(angle) * axeR, y: cy + Math.sin(angle) * axeR, angle };
    });
  }, [gouvernanceData]);

  const champPositions = useMemo(() => {
    return gouvernanceData.champs.map((ch, i) => {
      const angle = (i / 3) * 2 * Math.PI - Math.PI / 2 + Math.PI / 6;
      return { ...ch, type: 'champ', x: cx + Math.cos(angle) * champR, y: cy + Math.sin(angle) * champR, angle };
    });
  }, [gouvernanceData]);

  const principePositions = useMemo(() => {
    return gouvernanceData.principes.map((pr, i) => {
      const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
      return { ...pr, type: 'principe', x: cx + Math.cos(angle) * princR, y: cy + Math.sin(angle) * princR, angle };
    });
  }, [gouvernanceData]);

  const handleClick = (node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  };

  // Toggle gov box expansion
  const toggleGov = (id) => {
    setExpandedGov(prev => prev === id ? null : id);
  };

  // Color for gov items
  const govColor = darkMode ? '#3b82f6' : '#2563eb';

  // Member card — circular photo with fallback to initials
  const MemberCard = ({ p, color }) => {
    const base = p.initials.toLowerCase();
    const [imgSrc, setImgSrc] = useState(`photos/${base}.jpg`);
    const [imgOk, setImgOk] = useState(true);
    const handleError = () => {
      if (imgSrc.endsWith('.jpg')) { setImgSrc(`photos/${base}.png`); }
      else { setImgOk(false); }
    };
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, backgroundColor: color + '25', color: color,
        }}>
          {imgOk ? (
            <img src={imgSrc} alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={handleError} />
          ) : p.initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: darkMode ? '#e2e8f0' : '#1f2937' }}>{p.name}</div>
          {p.affiliation && <div style={{ fontSize: 11, color: darkMode ? '#94a3b8' : '#6b7280' }}>{p.affiliation}</div>}
          {p.role && <div style={{ fontSize: 11, color: darkMode ? '#64748b' : '#9ca3af' }}>{p.role}</div>}
        </div>
      </div>
    );
  };

  // Governance box — expands inline on click
  const GovBox = ({ id, name, members, color }) => {
    const isExpanded = expandedGov === id;
    const count = members.length;
    return (
      <div
        style={{
          borderRadius: 14, cursor: 'pointer', overflow: 'hidden',
          border: `1.5px solid ${isExpanded ? color : (darkMode ? '#334155' : '#d1d5db')}`,
          backgroundColor: darkMode ? '#1e293b' : '#ffffff',
          transition: 'all 0.2s',
        }}
      >
        <div onClick={() => toggleGov(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 12, color: 'white', backgroundColor: color,
            flexShrink: 0,
          }}>{count || '—'}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? '#e2e8f0' : '#1f2937' }}>{name}</div>
            <div style={{ fontSize: 10, color: darkMode ? '#64748b' : '#9ca3af' }}>
              {count > 0 ? `${count} membre${count > 1 ? 's' : ''}` : 'À venir'}
            </div>
          </div>
          <div style={{ fontSize: 14, color: darkMode ? '#64748b' : '#9ca3af', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }}>▾</div>
        </div>
        {isExpanded && (
          <div style={{ padding: '4px 14px 16px', borderTop: `1px solid ${darkMode ? '#334155' : '#e5e7eb'}`, maxHeight: 'calc(100vh - 400px)', overflowY: 'auto' }}>
            {count > 0 ? (
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: darkMode ? '#64748b' : '#9ca3af', marginBottom: 6, marginTop: 6 }}>
                  Membres
                </div>
                {members.map(p => <MemberCard key={p.name} p={p} color={color} />)}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: darkMode ? '#64748b' : '#9ca3af', fontStyle: 'italic', padding: '8px 0' }}>
                Membres à venir
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`${darkMode ? 'bg-slate-950' : 'bg-gray-100'} p-4 transition-colors duration-300`} style={{ height: 'calc(100vh - 70px)', overflowY: 'auto' }}>
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-3">
          <h1 className={`text-3xl font-bold ${darkMode ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent mb-1`}>
            Structure scientifique du RSN
          </h1>
          <p className={`${theme.textMuted} text-sm`}>
            Cliquez sur un élément pour voir ses responsables
          </p>
        </div>

        <div className="relative">
          {/* ── Gouvernance boxes — top left, expand inline ── */}
          <div className="fixed z-20 flex flex-col gap-2" style={{ width: 260, left: 12, top: 110, maxHeight: 'calc(100vh - 130px)', overflowY: 'auto' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: darkMode ? '#64748b' : '#9ca3af', marginBottom: 2, paddingLeft: 4 }}>
              Gouvernance
            </div>
            <GovBox id="direction" name="Direction" members={gouvernanceData.direction} color={govColor} />
            {gouvernanceData.comites.map(c => (
              <GovBox key={c.id} id={c.id} name={c.name} members={c.responsables} color={darkMode ? '#6366f1' : '#4f46e5'} />
            ))}
          </div>

          {/* ── SVG radial diagram ── */}
          <div className="flex justify-center">
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full h-auto">
              {/* Guide circles */}
              <circle cx={cx} cy={cy} r={axeR} fill="none" stroke={theme.svgStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <circle cx={cx} cy={cy} r={champR} fill="none" stroke={theme.svgStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />
              <circle cx={cx} cy={cy} r={princR} fill="none" stroke={theme.svgStroke} strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

              {/* Ring labels — curved along dashed circles */}
              <defs>
                <path id="axeArc" d={arcPath(cx, cy, axeR + 12, 205, 260)} fill="none" />
                <path id="champArc" d={arcPath(cx, cy, champR + 12, 210, 275)} fill="none" />
                <path id="princArc" d={arcPath(cx, cy, princR + 12, 212, 268)} fill="none" />
              </defs>
              <text fill={theme.svgLabelDim} fontSize="8.5" fontWeight="600" letterSpacing="0.1em" opacity="0.55">
                <textPath href="#axeArc" startOffset="50%" textAnchor="middle">AXES</textPath>
              </text>
              <text fill={theme.svgLabelDim} fontSize="8.5" fontWeight="600" letterSpacing="0.1em" opacity="0.55">
                <textPath href="#champArc" startOffset="50%" textAnchor="middle">CHAMPS D'ACTION</textPath>
              </text>
              <text fill={theme.svgLabelDim} fontSize="8.5" fontWeight="600" letterSpacing="0.1em" opacity="0.55">
                <textPath href="#princArc" startOffset="50%" textAnchor="middle">PRINCIPES DIRECTEURS</textPath>
              </text>

              {/* Center — RSN */}
              <circle cx={cx} cy={cy} r={36} fill={theme.svgNodeBg}
                stroke={darkMode ? '#475569' : '#94a3b8'} strokeWidth="1.5" />
              <text x={cx} y={cy + 1} fill={theme.svgLabelFill} fontSize="14" fontWeight="700" textAnchor="middle" dominantBaseline="middle">RSN</text>

              {/* ── Axes (inner ring) ── */}
              {axePositions.map(ax => {
                const isSel = selectedNode?.id === ax.id;
                const dim = selectedNode && !isSel;
                return (
                  <g key={ax.id} onClick={(e) => { e.stopPropagation(); handleClick(ax); }} style={{ cursor: 'pointer' }}
                    opacity={dim ? 0.25 : 1} className="transition-opacity duration-300">
                    <circle cx={ax.x} cy={ax.y} r={isSel ? axeNodeR + 3 : axeNodeR}
                      fill={ax.color} opacity={0.9}
                      stroke={isSel ? 'white' : 'transparent'} strokeWidth={3} />
                    <text x={ax.x} y={ax.y - 10} fill="white" fontSize="9" fontWeight="700" textAnchor="middle">{ax.shortName}</text>
                    <text x={ax.x} y={ax.y + 3} fill="rgba(255,255,255,0.9)" fontSize="9.5" textAnchor="middle">{ax.label}</text>
                    <text x={ax.x} y={ax.y + 16} fill="rgba(255,255,255,0.5)" fontSize="7.5" textAnchor="middle">{ax.responsables.length} resp.</text>
                  </g>
                );
              })}

              {/* ── Champs d'action (middle ring) ── */}
              {champPositions.map(ch => {
                const isSel = selectedNode?.id === ch.id;
                const dim = selectedNode && !isSel;
                return (
                  <g key={ch.id} onClick={(e) => { e.stopPropagation(); handleClick(ch); }} style={{ cursor: 'pointer' }}
                    opacity={dim ? 0.25 : 1} className="transition-opacity duration-300">
                    <circle cx={ch.x} cy={ch.y} r={isSel ? champNodeR + 3 : champNodeR}
                      fill={theme.svgNodeBg} stroke={ch.color} strokeWidth={isSel ? 3.5 : 2} />
                    <text x={ch.x} y={ch.y - 5} fill={ch.color} fontSize="10" fontWeight="700" textAnchor="middle">{ch.label}</text>
                    <text x={ch.x} y={ch.y + 10} fill={theme.svgLabelMuted} fontSize="8" textAnchor="middle">{ch.responsables.length} resp.</text>
                  </g>
                );
              })}

              {/* ── Principes directeurs (outer ring) ── */}
              {principePositions.map(pr => {
                const isSel = selectedNode?.id === pr.id;
                const dim = selectedNode && !isSel;
                return (
                  <g key={pr.id} onClick={(e) => { e.stopPropagation(); handleClick(pr); }} style={{ cursor: 'pointer' }}
                    opacity={dim ? 0.25 : 1} className="transition-opacity duration-300">
                    <circle cx={pr.x} cy={pr.y} r={isSel ? princNodeR + 3 : princNodeR}
                      fill={pr.color} opacity={0.9}
                      stroke={isSel ? 'white' : 'transparent'} strokeWidth={3} />
                    <text x={pr.x} y={pr.y - 4} fill="white" fontSize="9.5" fontWeight="600" textAnchor="middle">{pr.label}</text>
                    <text x={pr.x} y={pr.y + 10} fill="rgba(255,255,255,0.55)" fontSize="7.5" textAnchor="middle">{pr.responsables.length} resp.</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* ── Detail panel — overlay right, X close, click-outside-close ── */}
          {selectedNode && (
            <div ref={panelRef} className={`absolute right-0 top-0 w-80 ${theme.cardBg} rounded-2xl p-5 max-h-[600px] overflow-y-auto border ${theme.cardBorder} shadow-xl z-30`}
              style={{ backdropFilter: 'blur(8px)' }}>
              {/* X close button */}
              <button onClick={() => setSelectedNode(null)}
                style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 18, color: darkMode ? '#64748b' : '#9ca3af', lineHeight: 1 }}>✕</button>

              <div className={`flex items-center gap-3 mb-4 pb-4 border-b ${theme.cardBorder} pr-6`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: selectedNode.color }}>
                  {selectedNode.type === 'axe' ? selectedNode.shortName?.replace('Axe ', '') : selectedNode.responsables?.length || '—'}
                </div>
                <div>
                  <h3 className={`font-bold ${theme.text} text-sm`}>{selectedNode.fullName || selectedNode.name}</h3>
                  <span className={`text-xs ${theme.textLight}`}>
                    {selectedNode.type === 'axe' ? 'Axe thématique' : selectedNode.type === 'champ' ? "Champ d'action" : 'Principe directeur'}
                  </span>
                </div>
              </div>

              {selectedNode.description && (
                <p className={`text-xs ${theme.textMuted} mb-4 leading-relaxed`}>{selectedNode.description}</p>
              )}

              <div className={`text-xs font-semibold ${theme.textLight} uppercase tracking-wider mb-3`}>
                Responsable{selectedNode.responsables?.length > 1 ? 's' : ''}
              </div>

              <div className="space-y-2">
                {selectedNode.responsables?.map(p => (
                  <MemberCard key={p.name} p={p} color={selectedNode.color} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
