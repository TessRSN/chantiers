// Hash routing avec sous-mode (legacy) et query params
//   #structure                           →  { tab: 'structure' }
//   #vue-globale                         →  { tab: 'vue-globale' }
//   #par-axe?entite=A2                   →  { tab: 'par-axe', params: {entite: 'A2'} }
//   #vue-globale/par-axe?entite=A2 (legacy) →  migré vers #par-axe?entite=A2
function parseHash(rawHash) {
  const cleaned = (rawHash || '').replace(/^#/, '');
  const [pathPart, queryPart] = cleaned.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const params = {};
  if (queryPart) {
    queryPart.split('&').forEach(kv => {
      const [k, ...rest] = kv.split('=');
      if (k) params[k] = decodeURIComponent(rest.join('=') || '');
    });
  }
  return { tab: segments[0] || '', subMode: segments[1] || null, params };
}

function buildHash(tab, params) {
  let hash = tab;
  if (params) {
    const qs = Object.entries(params)
      .filter(([_, v]) => v != null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) hash += '?' + qs;
  }
  return hash;
}

// Backward compat : ancien lien #vue-globale/par-axe?entite=X → nouveau #par-axe?entite=X
function migrateLegacyHash(p) {
  if (p.tab === 'vue-globale' && p.subMode === 'par-axe') {
    return { tab: 'par-axe', subMode: null, params: p.params };
  }
  return p;
}

// Petit globe SVG monochrome (suit currentColor pour s'adapter aux thèmes).
function GlobeIcon({ size = 14 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 010 18" />
      <path d="M12 3a14 14 0 000 18" />
    </svg>
  );
}

// Hook bilingue — synchronise window.LANG, localStorage.
// L'URL hash sera mis à jour via le useEffect de routing principal (qui inclut lang dans les params).
function useLang() {
  const [lang, setLangState] = React.useState(window.LANG);

  const setLang = React.useCallback((newLang) => {
    if (newLang !== 'fr' && newLang !== 'en') return;
    window.LANG = newLang;
    setLangState(newLang);
    try { localStorage.setItem('rsn-lang', newLang); } catch (_) {}
  }, []);

  return [lang, setLang];
}

function MainApp() {
  const [darkMode, setDarkMode] = useState(true);
  const [lang, setLang] = useLang();
  const validTabs = ['structure', 'vue-globale', 'par-axe', 'analyse', 'suivi'];

  const initialRaw = parseHash(window.location.hash);
  const initial = migrateLegacyHash(initialRaw);
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(initial.tab) ? initial.tab : 'structure'
  );
  // Entité sélectionnée pour l'onglet « Par axe »
  const [vueEntityId, setVueEntityId] = useState(initial.params.entite || 'A1');
  // Projet ciblé pour l'onglet « Analyse » (depuis un lien externe)
  const [targetProject, setTargetProject] = useState(initial.params.project || null);

  // Sync state → URL hash
  useEffect(() => {
    let params = {};
    if (activeTab === 'par-axe') {
      params = { entite: vueEntityId };
    } else if (activeTab === 'analyse' && targetProject) {
      params = { project: targetProject };
    }
    // Préserver la langue dans l'URL si non-FR
    if (lang === 'en') params.lang = 'en';
    const newHash = buildHash(activeTab, params);
    if (newHash !== window.location.hash.replace(/^#/, '')) {
      window.location.hash = newHash;
    }
  }, [activeTab, vueEntityId, targetProject, lang]);

  // Sync URL hash → state (back/forward navigation + ancien lien migré)
  useEffect(() => {
    const onHash = () => {
      const p = migrateLegacyHash(parseHash(window.location.hash));
      if (validTabs.includes(p.tab)) setActiveTab(p.tab);
      if (p.tab === 'par-axe' && p.params.entite) setVueEntityId(p.params.entite);
      if (p.tab === 'analyse') setTargetProject(p.params.project || null);
      // Langue depuis URL — l'URL gagne sur le state local
      if (p.params.lang === 'fr' || p.params.lang === 'en') {
        if (p.params.lang !== lang) setLang(p.params.lang);
      }
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [lang, setLang]);

  const [csvLoading, setCsvLoading] = useState(true);
  const [csvError, setCsvError] = useState(null);
  const [analyseData, setAnalyseData] = useState({});
  const [chantiersMeta, setChantiersMeta] = useState([]);
  const [gouvernanceData, setGouvernanceData] = useState(null);
  // Toutes les lignes brutes (incluant EXT-* et GAP-* non approuvées) — pour le mode "Par axe"
  const [allActions, setAllActions] = useState([]);

  useEffect(() => {
    Promise.all([
      fetch('data.csv?v=' + VERSION).then(r => { if (!r.ok) throw new Error('data.csv introuvable'); return r.text(); }),
      fetch('membres.csv?v=' + VERSION).then(r => { if (!r.ok) throw new Error('membres.csv introuvable'); return r.text(); }),
    ]).then(([dataText, membresText]) => {
        const rows = parseCSV(dataText);
        const allRows = csvRowsToAllData(rows);

        // Vue globale (radial) : seulement les actions approuvées
        const approvedActions = allRows.filter(r => r.approuve !== 'non');
        vueGlobaleData.actions = approvedActions;

        // Vue "Par axe" : on garde toutes les lignes pour pouvoir afficher EXT-*
        setAllActions(allRows);

        // Analyse : toutes les lignes (y compris GAPs non approuvés)
        const ad = buildAnalyseData(allRows);
        setAnalyseData(ad);
        setChantiersMeta(buildChantiersMeta(allRows, ad));

        // Gouvernance : depuis membres.csv
        const membresRows = parseCSV(membresText);
        setGouvernanceData(buildGouvernanceFromCSV(membresRows));

        setCsvLoading(false);
      })
      .catch(err => { setCsvError(err.message); setCsvLoading(false); });
  }, []);

  const tabs = [
    { id: 'structure',   label: t('tab.structure'),   icon: 'structure' },
    { id: 'vue-globale', label: t('tab.vue-globale'), icon: 'vue-globale' },
    { id: 'par-axe',     label: t('tab.par-axe'),     icon: 'par-axe' },
    { id: 'analyse',     label: t('tab.analyse'),     icon: 'analyse' },
    { id: 'suivi',       label: t('tab.suivi'),       icon: 'suivi' },
  ];

  const tabBarBg = darkMode ? '#0f172a' : '#ffffff';
  const tabBarBorder = darkMode ? '#1e293b' : '#e5e7eb';
  const tabActiveText = darkMode ? '#e2e8f0' : '#111827';
  const tabInactiveText = darkMode ? '#64748b' : '#6b7280';
  const tabActiveBg = darkMode ? '#1e293b' : '#f3f4f6';
  const tabHoverBg = darkMode ? '#1e293b' : '#f9fafb';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: darkMode ? '#0f172a' : '#f3f4f6' }}>
      {/* ── TAB BAR ── */}
      <div style={{ backgroundColor: tabBarBg, borderBottom: `1px solid ${tabBarBorder}`, position: 'sticky', top: 0, zIndex: 100 }}>
        {/* Title row */}
        <div style={{ textAlign: 'center', padding: '8px 16px 2px', fontSize: 13, fontWeight: 600, color: darkMode ? '#94a3b8' : '#6b7280', letterSpacing: '0.02em' }}>
          {t('app.header')}
        </div>
        {/* Tabs + toggle row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 40 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? tabActiveText : tabInactiveText,
                  backgroundColor: active ? tabActiveBg : 'transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = tabHoverBg; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {tab.icon === 'structure' && (<>
                    <circle cx="8" cy="8" r="6.5" /><circle cx="8" cy="8" r="3" />
                    <circle cx="8" cy="4" r="1" fill="currentColor" stroke="none" />
                    <circle cx="11.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
                    <circle cx="4.5" cy="9.5" r="1" fill="currentColor" stroke="none" />
                  </>)}
                  {tab.icon === 'vue-globale' && (<>
                    <circle cx="8" cy="8" r="2" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="2" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="13" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="13" cy="11" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="8" cy="14" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="3" cy="11" r="1.2" fill="currentColor" stroke="none" />
                    <circle cx="3" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
                    <line x1="8" y1="8" x2="8" y2="2" /><line x1="8" y1="8" x2="13" y2="5.5" />
                    <line x1="8" y1="8" x2="13" y2="11" /><line x1="8" y1="8" x2="8" y2="14" />
                    <line x1="8" y1="8" x2="3" y2="11" /><line x1="8" y1="8" x2="3" y2="5.5" />
                  </>)}
                  {tab.icon === 'par-axe' && (<>
                    {/* Sankey-ish : noeud à gauche → 3 blocs à droite */}
                    <circle cx="2.5" cy="8" r="1.6" fill="currentColor" stroke="none" />
                    <rect x="10" y="2"  width="4.5" height="3" rx="0.5" fill="currentColor" stroke="none" />
                    <rect x="10" y="6.5" width="4.5" height="3" rx="0.5" fill="currentColor" stroke="none" />
                    <rect x="10" y="11"  width="4.5" height="3" rx="0.5" fill="currentColor" stroke="none" />
                    <path d="M4 8 Q 7 3.5, 10 3.5" />
                    <path d="M4 8 L 10 8" />
                    <path d="M4 8 Q 7 12.5, 10 12.5" />
                  </>)}
                  {tab.icon === 'analyse' && (<>
                    <rect x="2" y="7" width="3" height="7" rx="0.5" fill="currentColor" stroke="none" />
                    <rect x="6.5" y="4" width="3" height="10" rx="0.5" fill="currentColor" stroke="none" />
                    <rect x="11" y="2" width="3" height="12" rx="0.5" fill="currentColor" stroke="none" />
                  </>)}
                  {tab.icon === 'suivi' && (<>
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M5 8.5l2 2 4-4.5" strokeWidth="2" />
                  </>)}
                </svg>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right-side toggles (langue + thème) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Language toggle */}
        <button
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          aria-label={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
          title={lang === 'fr' ? 'Switch to English' : 'Passer au français'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            border: `1px solid ${darkMode ? '#334155' : '#d1d5db'}`,
            backgroundColor: darkMode ? '#1e293b' : '#f9fafb',
            color: darkMode ? '#94a3b8' : '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.15s',
          }}
        >
          <GlobeIcon size={14} />
          {lang.toUpperCase()}
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 20,
            border: `1px solid ${darkMode ? '#334155' : '#d1d5db'}`,
            backgroundColor: darkMode ? '#1e293b' : '#f9fafb',
            color: darkMode ? '#94a3b8' : '#6b7280',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
        >
          {darkMode ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {t('toggle.light')}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {t('toggle.dark')}
            </>
          )}
        </button>
        </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      {csvLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 70px)', color: darkMode ? '#94a3b8' : '#6b7280' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p>{t('app.loading')}</p>
          </div>
        </div>
      )}
      {csvError && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 70px)', color: '#ef4444' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <p>{t('app.error')} : {csvError}</p>
            <p style={{ fontSize: 12, color: darkMode ? '#64748b' : '#9ca3af', marginTop: 8 }}>{t('app.error.help')}</p>
          </div>
        </div>
      )}
      {!csvLoading && !csvError && activeTab === 'structure' && gouvernanceData && <StructureGouvernance darkMode={darkMode} gouvernanceData={gouvernanceData} />}
      {!csvLoading && !csvError && activeTab === 'vue-globale' && <RSNRadialGraph darkMode={darkMode} />}
      {!csvLoading && !csvError && activeTab === 'par-axe' && (
        <VueParAxe
          darkMode={darkMode}
          allActions={allActions}
          gouvernanceData={gouvernanceData}
          selectedEntityId={vueEntityId}
          onEntityChange={setVueEntityId}
        />
      )}
      {!csvLoading && !csvError && activeTab === 'analyse' && (
        <AnalyseChantiers
          darkMode={darkMode}
          analyseData={analyseData}
          chantiersMeta={chantiersMeta}
          targetProject={targetProject}
          onTargetProjectConsumed={() => setTargetProject(null)}
        />
      )}
      {!csvLoading && !csvError && activeTab === 'suivi' && <SuiviObjectifs darkMode={darkMode} actions={vueGlobaleData.actions} />}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MainApp />);
