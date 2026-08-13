const React = { createElement: () => null };
function Test() {
  return (
    <div className="flex h-screen bg-surface-950 text-[13px] text-gray-300 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface-950 border-r border-surface-800 flex flex-col">
        <div className="px-3 py-3 border-b border-surface-800 flex items-center space-x-2">
          <div className="w-7 h-7 rounded bg-surface-900 flex items-center justify-center overflow-hidden">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-white truncate font-medium">{t('admin.panelAdmin')}</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 mb-4">
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wider mb-1.5">{t('admin.management')}</p>
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[12px] transition-colors ${
                  activeTab === item.id
                    ? 'bg-surface-900 text-white'
                    : 'text-gray-400 hover:bg-surface-900 hover:text-white'
                }`}>
                {getIcon(item.icon)}
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="ml-auto bg-red-500/20 text-red-400 text-[9px] px-1.5 py-0.5 rounded">{item.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="px-3 mb-4">
            <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wider mb-1.5">{t('admin.planDashboards')}</p>
            {[
              { id: 'plan-k8s', label: t('admin.k8sDashboard'), icon: 'k8s2' },
              { id: 'plan-invisia', label: t('admin.invisiaDashboard'), icon: 'invisia2' },
              { id: 'plan-compliance', label: t('admin.complianceDashboard'), icon: 'compliance' },
              { id: 'plan-enterprise', label: t('admin.enterpriseDashboard'), icon: 'enterprise' },
            ].map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-2 px-2 py-1.5 rounded text-[12px] transition-colors ${
                  activeTab === item.id
                    ? 'bg-surface-900 text-white'
                    : 'text-gray-400 hover:bg-surface-900 hover:text-white'
                }`}>
                {getIcon(item.icon)}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-surface-800">
          <button onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-center space-x-2 px-2 py-1.5 rounded text-[12px] text-gray-400 hover:bg-surface-900 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span>{t('admin.backToDashboard')}</span>
          </button>
          <button onClick={toggleLang}
            className="w-full flex items-center justify-center px-2 py-1.5 mt-1.5 rounded text-[11px] bg-surface-900 border border-surface-700 text-gray-400 hover:text-white transition-colors">
            {lang === 'es' ? t('admin.switchToEnglish') : t('admin.switchToSpanish')}
          </button>
          <div className="relative mt-1.5 group">
            <div className="flex items-center justify-between px-2 py-1.5 rounded text-[11px] bg-surface-900 border border-surface-700 text-gray-400 cursor-pointer">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full border border-surface-600" style={{ backgroundColor: currentPreset.colors['--primary-500'] }}></div>
                <span>{currentPreset.label}</span>
              </div>
              <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
            <div className="absolute bottom-full left-0 right-0 mb-1 hidden group-hover:block z-50">
              <div className="bg-surface-900 border border-surface-700 rounded-lg p-1.5 shadow-xl max-h-48 overflow-y-auto">
                {presets.map(p => (
                  <button key={p.name} onClick={() => setPreset(p.name)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors ${
                      currentPreset.name === p.name ? 'bg-surface-800 text-white' : 'text-gray-400 hover:bg-surface-800 hover:text-white'
                    }`}>
                    <div className="w-2.5 h-2.5 rounded-full border border-surface-600 flex-shrink-0" style={{ backgroundColor: p.colors['--primary-500'] }}></div>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <>
    <div>
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-white">{t('admin.controlPanel')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Stats Cards */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('admin.registeredUsers'), value: users.length, change: '+2', sub: t('admin.thisMonth') },
                  { label: t('admin.onlineAgents'), value: mockAgents.filter(a => a.status === 'online').length, total: mockAgents.length, sub: t('admin.ofTotal', { count: mockAgents.length }) },
                  { label: t('admin.openTickets'), value: allTickets.filter(t => t.status === 'open').length, change: allTickets.length > 0 ? '+' + allTickets.filter(t => t.status === 'open').length : '0', sub: t('admin.requireAttention') },
                  { label: t('admin.threatsToday'), value: '0', change: '-3', sub: t('admin.vsYesterday'), danger: false },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] text-gray-500 tracking-wide">{stat.label}</span>
                      {stat.total !== undefined && (
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="text-[9px] text-green-400">{stat.value} {t('admin.agentsOnline')}</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[22px] font-semibold text-white tracking-tight">
                      {stat.total ? `${stat.value}/${stat.total}` : stat.value}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`text-[10px] font-medium ${stat.change?.startsWith('-') ? 'text-green-400' : idx === 2 && stat.value > 0 ? 'text-yellow-400' : 'text-green-400'}`}>{stat.change}</span>
                      <span className="text-[9px] text-gray-600">{stat.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Two-column: Network Topology + Compliance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Network Topology Map */}
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">
                      {t('admin.networkTopology')}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[9px] text-green-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        {mockAgents.filter(a => a.status === 'online').length} {t('admin.agentsOnline')}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                        {mockAgents.filter(a => a.status !== 'online').length} {t('admin.agentsOffline')}
                      </span>
                    </div>
                  </div>
                  <div className="relative bg-surface-950/40 border border-surface-700/20 rounded-lg h-[200px] overflow-hidden mb-3">
                    <svg className="w-full h-full" viewBox="0 0 500 180" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <radialGradient id="hub-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                        </radialGradient>
                      </defs>
                      <circle cx="250" cy="90" r="60" fill="url(#hub-glow)"/>
                      <circle cx="250" cy="90" r="12" className="text-primary-500" fill="currentColor" opacity="0.3"/>
                      <circle cx="250" cy="90" r="6" className="text-primary-400" fill="currentColor"/>
                      <text x="250" y="95" textAnchor="middle" fill="#94a3b8" fontSize="7" fontWeight="600">HUB</text>
                      {[
                        { x: 80, y: 50, color: '#22c55e' },
                        { x: 140, y: 130, color: '#22c55e' },
                        { x: 360, y: 45, color: '#22c55e' },
                        { x: 380, y: 120, color: '#eab308' },
                        { x: 440, y: 70, color: '#6b7280' },
                      ].map((node, i) => (
                        <g key={i}>
                          <line x1="250" y1="90" x2={node.x} y2={node.y} className="text-surface-700" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3"/>
                          <circle cx={node.x} cy={node.y} r="5" fill={node.color} opacity="0.8"></circle>
                          <text x={node.x} y={node.y + 14} textAnchor="middle" fill="#6b7280" fontSize="6">{mockAgents[i]?.name || `Node ${i+1}`}</text>
                        </g>
                      ))}
                    </svg>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {mockAgents.map(agent => (
                      <div key={agent.id} className="flex items-center justify-between bg-surface-950/30 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${agent.status === 'online' ? 'bg-green-400' : agent.status === 'idle' ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                          <span className="text-[10px] text-gray-300">{agent.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-600">{agent.os}</span>
                          <span className={`text-[8px] ${agent.status === 'online' ? 'text-green-400' : agent.status === 'idle' ? 'text-yellow-400' : 'text-gray-500'}`}>{agent.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Compliance Ley 21.719 */}
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">
                      {t('admin.regulatoryCompliance')}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[18px] font-bold text-primary-400">{complianceProgress}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-surface-950 rounded-full h-1.5 mb-3">
                    <div className="bg-primary-400 h-1.5 rounded-full transition-all duration-500" style={{ width: complianceProgress + '%' }}></div>
                  </div>
                  <p className="text-[9px] text-gray-600 mb-4">
                    {t('admin.complianceLaw')}
                  </p>
                  <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto">
                    {complianceItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2 bg-surface-950/30 rounded px-2.5 py-1.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-primary-500/15 text-primary-400' : 'bg-surface-800 text-gray-600'}`}>
                          {item.done ? (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          )}
                        </div>
                        <span className={`text-[10px] ${item.done ? 'text-gray-300' : 'text-gray-600'}`}>
                          {t(item.labelKey)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row: Quick Actions + Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Acciones Rápidas */}
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-5">
                  <h3 className="text-[11px] font-semibold text-white tracking-wide mb-4">
                    {t('admin.quickActions')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: t('admin.newUser'), icon: 'userPlus', action: () => { setActiveTab('users'); setShowUserModal(true); }, badge: 'primary' },
                      { label: t('admin.viewAudit'), icon: 'fileText', action: () => { setActiveTab('logs'); loadLogs(); }, badge: 'blue' },
                      { label: t('admin.settings'), icon: 'settings', action: () => { setActiveTab('settings'); loadSettings(); }, badge: 'yellow' },
                      { label: t('admin.goToDashboard'), icon: 'external', action: () => navigate('/dashboard'), badge: 'green' },
                    ].map((act, idx) => (
                      <button key={idx} onClick={act.action}
                        className={`flex items-center gap-2.5 px-3 py-3 rounded-lg border transition-all text-[11px] ${
                          act.badge === 'primary' ? 'border-primary-500/30 bg-primary-500/5 hover:bg-primary-500/15 text-primary-400' :
                          act.badge === 'blue' ? 'border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/15 text-blue-400' :
                          act.badge === 'yellow' ? 'border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/15 text-yellow-400' :
                          'border-green-500/30 bg-green-500/5 hover:bg-green-500/15 text-green-400'
                        }`}>
                        {act.icon === 'userPlus' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
                        ) : act.icon === 'fileText' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        ) : act.icon === 'settings' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                        )}
                        <span className="font-medium">{act.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actividad Reciente */}
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] font-semibold text-white tracking-wide">
                      {t('admin.recentActivity')}
                    </h3>
                    <button onClick={() => { loadLogs(); setActiveTab('logs'); }} className="text-[9px] text-primary-500 hover:text-primary-400 font-medium">
                      {t('admin.viewAll')} →
                    </button>
                  </div>
                  {logs.length === 0 ? (
                    <button onClick={loadLogs} disabled={logsLoading}
                      className="w-full text-center py-7 text-[11px] text-gray-600 hover:text-gray-400 transition-colors bg-surface-950/20 rounded-lg border border-dashed border-surface-700/30">
                      {logsLoading ? (
                        <svg className="w-4 h-4 animate-spin mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      ) : t('admin.loadRecentActivity')}
                    </button>
                  ) : (
                    <div className="space-y-1">
                      {logs.slice(0, 6).map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 px-2 py-1.5 rounded bg-surface-950/20 border-b border-surface-800/40 last:border-0">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            log.action === 'login' ? 'bg-green-400' :
                            log.action === 'delete' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 truncate">
                              <span className="text-gray-500">{log.userId?.email || 'System'}</span>
                              <span className="text-gray-600"> — </span>
                              <span>{log.action}</span>
                            </p>
                          </div>
                          <span className="text-[8px] text-gray-600 font-mono">{formatDateTime(log.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[11px] font-semibold text-white tracking-wide">
                    {t('admin.systemHealth')}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-green-400 font-medium">{t('admin.allSystemsOperational')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { name: 'MongoDB', status: 'Operational', latency: '12ms', uptime: '99.9%' },
                    { name: 'WebSocket Server', status: 'Operational', latency: '2ms', uptime: '99.99%' },
                    { name: 'Ollama AI Engine', status: 'Operational', latency: '45ms', uptime: '98.5%' },
                    { name: 'REST API', status: 'Operational', latency: '8ms', uptime: '99.95%' },
                  ].map((svc, idx) => (
                    <div key={idx} className="bg-surface-950/40 border border-surface-700/20 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-300">{svc.name}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-gray-600 font-mono">{svc.latency}</span>
                        <span className="text-[8px] text-green-400/70">{svc.uptime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (() => {
          const filteredUsers = users.filter(u =>
            !userSearch || 
            (u.companyName || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
            (u.domain || '').toLowerCase().includes(userSearch.toLowerCase())
          );
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-white">{t('admin.userManagement')}</h2>
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder={t('admin.searchUsers')}
                    className="w-52 bg-surface-950 border border-surface-800 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => exportCSV(filteredUsers, [
                  'companyName', 'email', 'domain',
                  (u) => u.planType || 'Free',
                  (u) => u.isActive ? t('admin.active') : t('admin.inactive')
                ], 'users.csv')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-gray-300 text-[11px] rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <span>CSV</span>
                </button>
                <button onClick={() => { setShowUserModal(true); setEditingUser(null); setUserForm({ companyName: '', email: '', domain: '', password: '', planType: 'Free', isActive: true, aiRetention: 'never' }); }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  <span>{t('admin.addUser')}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-surface-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-950/60 border-b border-surface-700/50">
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.company')}</th>
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">Email</th>
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">Domain</th>
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.plan')}</th>
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.status')}</th>
                      <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-surface-700/40 hover:bg-surface-950/60 transition-colors">
                        <td className="px-4 py-2.5 text-[12px] text-white">{u.companyName}</td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-400">{u.email}</td>
                        <td className="px-4 py-2.5 text-[12px] text-gray-400 font-mono">{u.domain}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] px-2 py-0.5 rounded bg-primary-900/40 text-primary-400">{u.planType || 'Free'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-[11px] ${u.isActive ? 'text-green-400' : 'text-red-400'}`}>{u.isActive ? t('admin.active') : t('admin.inactive')}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-[11px] text-gray-400">{u.aiRetention === 'never' ? t('admin.retentionNever') : u.aiRetention === 'weekly' ? t('admin.retentionWeekly') : u.aiRetention === 'monthly' ? t('admin.retentionMonthly') : t('admin.retentionYearly')}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center space-x-2">
                            <button onClick={() => editUser(u)} className="text-gray-400 hover:text-white" title={t('admin.edit')}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                              </svg>
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="text-gray-400 hover:text-red-400" title={t('admin.deleteUser')}>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                              </svg>
                            </button>
                            {u.aiRetention !== 'never' && (
                              <button onClick={() => purgeAiData(u)} className="text-gray-400 hover:text-cyan-400" title={t('admin.purgeAiData')}>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-[12px] text-gray-500">
                        {userSearch ? t('admin.noResultsFor') + userSearch + '"' : t('admin.noUsers')}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          );
        })()}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (() => {
          const filteredTickets = allTickets.filter(t => {
            if (ticketFilter !== 'all' && t.status !== ticketFilter) return false;
            if (ticketPriorityFilter !== 'all' && (t.priority || 'medium') !== ticketPriorityFilter) return false;
            return true;
          });
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-white">{t('admin.supportTickets')}</h2>
                <div className="flex items-center gap-2">
                  <select value={ticketFilter} onChange={e => setTicketFilter(e.target.value)}
                    className="bg-surface-950 border border-surface-800 text-[11px] text-gray-400 rounded px-2 py-1.5 focus:outline-none focus:border-primary-500">
                    <option value="all">{t('admin.allStatuses')}</option>
                    <option value="open">{t('admin.open')}</option>
                    <option value="in_progress">{t('admin.inProgress')}</option>
                    <option value="resolved">{t('admin.resolved')}</option>
                    <option value="closed">{t('admin.closed')}</option>
                  </select>
                  <select value={ticketPriorityFilter} onChange={e => setTicketPriorityFilter(e.target.value)}
                    className="bg-surface-950 border border-surface-800 text-[11px] text-gray-400 rounded px-2 py-1.5 focus:outline-none focus:border-primary-500">
                    <option value="all">{t('admin.allPriorities')}</option>
                    <option value="low">{t('admin.low')}</option>
                    <option value="medium">{t('admin.medium')}</option>
                    <option value="high">{t('admin.highPriority')}</option>
                    <option value="urgent">{t('admin.urgent')}</option>
                  </select>
                  <button onClick={() => exportCSV(filteredTickets, [
                    'subject', 'description', 'email', 'priority', 'status',
                    (t) => formatDate(t.createdAt)
                  ], 'tickets.csv')}
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-gray-300 text-[11px] rounded transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                    <span>CSV</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-3 mb-4 px-1">
                {[
                  { label: t('admin.total'), value: allTickets.length, color: 'text-gray-400', bg: 'bg-surface-800/30' },
                  { label: t('admin.openTicketsBadge'), value: allTickets.filter(t => t.status === 'open').length, color: 'text-blue-400', bg: 'bg-blue-900/10' },
                  { label: t('admin.inProgressBadge'), value: allTickets.filter(t => t.status === 'in_progress').length, color: 'text-yellow-400', bg: 'bg-yellow-900/10' },
                  { label: t('admin.resolvedBadge'), value: allTickets.filter(t => t.status === 'resolved').length, color: 'text-green-400', bg: 'bg-green-900/10' },
                  { label: t('admin.closedBadge'), value: allTickets.filter(t => t.status === 'closed').length, color: 'text-gray-500', bg: 'bg-surface-800/20' },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${s.bg} border border-surface-700/20`}>
                    <span className="text-[10px] text-gray-500">{s.label}</span>
                    <span className={`text-[13px] font-semibold ${s.color}`}>{s.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {filteredTickets.map(ticket => (
                  <div key={ticket.id} className="bg-surface-900 border border-surface-800 rounded p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-[12px] text-white font-medium">{ticket.subject}</h4>
                          <select value={ticket.status} onChange={e => updateTicketStatus(ticket.id, e.target.value)}
                            className="bg-surface-950 border border-surface-800 text-[10px] text-white rounded px-1.5 py-0.5 focus:outline-none focus:border-primary-500">
                            <option value="open">{t('admin.open')}</option>
                            <option value="in_progress">{t('admin.inProgress')}</option>
                            <option value="resolved">{t('admin.resolved')}</option>
                            <option value="closed">{t('admin.closed')}</option>
                          </select>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">{ticket.description}</p>
                        <p className="text-[9px] text-gray-600 mt-1">{ticket.email} - {formatDate(ticket.createdAt)}</p>
                      </div>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase ${getTicketPriorityClass(ticket.priority)}`}>{ticket.priority}</span>
                    </div>

                    {ticket.responses && ticket.responses.length > 0 && (
                      <div className="mt-3 mb-3 space-y-2">
                        {ticket.responses.map((r, idx) => (
                          <div key={idx} className="p-2 bg-surface-950/60 rounded-lg border border-surface-700/30">
                            <p className="text-[10px] text-gray-400 mb-1">{r.role === 'admin' ? t('admin.adminResponse') : t('admin.userMessage')}</p>
                            <p className="text-[11px] text-white">{r.message}</p>
                            <p className="text-[9px] text-gray-600 mt-1">{formatDate(r.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-3">
                      <div className="flex space-x-2">
                        <input value={ticketResponses[ticket.id] || ''} onChange={e => setTicketResponses({...ticketResponses, [ticket.id]: e.target.value})}
                          placeholder={t('admin.typeResponse')}
                          className="flex-1 bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                        <button onClick={() => handleTicketResponse(ticket.id)}
                          disabled={!ticketResponses[ticket.id]?.trim()}
                          className="px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors disabled:opacity-50">
                          {t('admin.send')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="text-center py-8 text-[12px] text-gray-500">
                    {(ticketFilter !== 'all' || ticketPriorityFilter !== 'all') ? t('admin.noTicketsFiltered') : t('admin.noTickets')}
                  </div>
                )}
              </div>
            </div>
          </div>
          );
        })()}

        {/* PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-white">{t('admin.plansPricing')}</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {editingPlan && (
                <div className="mb-6 bg-surface-900 border border-surface-800 rounded-lg p-5">
                  <h3 className="text-[13px] font-semibold text-white mb-4">
                    {t('admin.editing')}{editingPlan}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                        {t('admin.price')}
                      </label>
                      <input type="number" value={planForm.price} onChange={e => setPlanForm({...planForm, price: parseInt(e.target.value) || 0})}
                        className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                        {t('admin.scans')}
                      </label>
                      <input type="number" value={planForm.scans} onChange={e => setPlanForm({...planForm, scans: parseInt(e.target.value) || 0})}
                        className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                        {t('admin.agents')}
                      </label>
                      <input type="number" value={planForm.agents} onChange={e => setPlanForm({...planForm, agents: parseInt(e.target.value) || 0})}
                        className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                        {t('admin.support')}
                      </label>
                      <input value={planForm.support} onChange={e => setPlanForm({...planForm, support: e.target.value})}
                        className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                      {t('admin.features')}
                    </label>
                    <div className="flex space-x-2 mb-2">
                      <input value={featureInput} onChange={e => setFeatureInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                        placeholder={t('admin.addFeature')}
                        className="flex-1 bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                      <button onClick={addFeature}
                        className="px-3 py-2 bg-surface-800 hover:bg-surface-700 text-white text-[12px] rounded transition-colors">
                        +
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {planForm.features.map((f, idx) => (
                        <span key={idx} className="flex items-center space-x-1 bg-surface-950/60 border border-surface-700/30 rounded-lg px-2 py-1 text-[10px] text-gray-300">
                          <span>{f}</span>
                          <button onClick={() => removeFeature(idx)} className="text-gray-500 hover:text-red-400 ml-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditingPlan(null)}
                      className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-white text-[12px] rounded transition-colors">
                      {t('admin.cancel')}
                    </button>
                    <button onClick={handleSavePlan}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                      {t('admin.save')}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(plans).map(([key, plan]) => (
                  <div key={key} className={`bg-gradient-to-br from-surface-900/80 to-surface-950/80 border ${key === 'Advanced' ? 'border-primary-500/60' : 'border-surface-700/50'} rounded-xl backdrop-blur-sm overflow-hidden`}>
                    {key === 'Advanced' && (
                      <div className="bg-primary-500 text-[9px] text-white text-center py-1 uppercase tracking-wider font-semibold">
                        {t('admin.recommended')}
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-[14px] font-bold text-white mb-1">{plan.name}</h3>
                      <p className="text-[24px] font-bold text-white mb-3">
                        ${plan.price}<span className="text-[12px] text-gray-500 font-normal">{plan.price > 0 ? '/mo' : ''}</span>
                      </p>
                      <div className="space-y-1.5 mb-4">
                        <p className="text-[11px] text-gray-400">
                          {plan.scans === -1 ? 'Unlimited' : plan.scans} {t('admin.scansMo')}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {plan.agents === -1 ? 'Unlimited' : plan.agents} {t('admin.agentsCount')}
                        </p>
                        <p className="text-[11px] text-gray-400">{plan.support}</p>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        {plan.features.map((f, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-[11px] text-gray-300">
                            <svg className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => handleEditPlan(key)}
                        className="w-full px-3 py-2 bg-surface-800 hover:bg-surface-700 text-white text-[12px] rounded transition-colors">
                        {t('admin.edit')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (() => {
          const filteredLogs = logs.filter(log =>
            !logSearch || 
            (log.userId?.email || '').toLowerCase().includes(logSearch.toLowerCase()) ||
            (log.userId?.companyName || '').toLowerCase().includes(logSearch.toLowerCase()) ||
            (log.action || '').toLowerCase().includes(logSearch.toLowerCase()) ||
            (log.detail || '').toLowerCase().includes(logSearch.toLowerCase()) ||
            (log.ip || '').toLowerCase().includes(logSearch.toLowerCase())
          );
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <h2 className="text-[14px] font-semibold text-white">{t('admin.auditLogs')}</h2>
                <div className="relative">
                  <svg className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input value={logSearch} onChange={e => setLogSearch(e.target.value)}
                    placeholder={t('admin.searchLogs')}
                    className="w-52 bg-surface-950 border border-surface-800 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                </div>
                <button onClick={() => exportCSV(filteredLogs, [
                  (l) => formatDateTime(l.createdAt),
                  (l) => l.userId?.email || l.userId?.companyName || 'System',
                  'action', 'detail', 'ip'
                ], 'audit-logs.csv')}
                  className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-surface-800 hover:bg-surface-700 text-gray-300 text-[11px] rounded transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  <span>CSV</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={loadLogs} disabled={logsLoading}
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-800 hover:bg-surface-700 text-white text-[12px] rounded transition-colors disabled:opacity-50">
                  <svg className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                  <span>{t('admin.reload')}</span>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {logs.length > 0 && !logsLoading && (() => {
                const actionCounts = logs.reduce((acc, l) => {
                  const a = l.action || 'unknown';
                  acc[a] = (acc[a] || 0) + 1;
                  return acc;
                }, {});
                const topActions = Object.entries(actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
                return (
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    {topActions.map(([action, count]) => (
                      <div key={action} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-800/30 border border-surface-700/20">
                        <span className="text-[10px] text-gray-500 capitalize">{action.replace(/_/g, ' ')}</span>
                        <span className="text-[12px] font-semibold text-gray-300">{count}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
              {logsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-surface-700/50 rounded-xl backdrop-blur-sm overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-950/60 border-b border-surface-700/50">
                        <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.date')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.user')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.action')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">{t('admin.detail')}</th>
                        <th className="text-[10px] uppercase tracking-wider text-gray-500 text-left px-4 py-2">IP</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log, idx) => (
                        <tr key={log._id || idx} className="border-b border-surface-700/40 hover:bg-surface-950/60 transition-colors">
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                          <td className="px-4 py-2.5 text-[12px] text-white">{log.userId?.email || log.userId?.companyName || t('admin.system')}</td>
                          <td className="px-4 py-2.5">
                            <Tag label={log.action} color={log.action === 'login' ? 'text-green-400 bg-green-900/20' : log.action === 'delete' ? 'text-red-400 bg-red-900/20' : 'text-blue-400 bg-blue-900/20'} />
                          </td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-400 max-w-xs truncate">{log.detail || '-'}</td>
                          <td className="px-4 py-2.5 text-[11px] text-gray-500 font-mono">{log.ip || '-'}</td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr><td colSpan="5" className="px-4 py-8 text-center text-[12px] text-gray-500">
                          {logSearch ? t('admin.noResultsFor') + logSearch + '"' : t('admin.noLogs')}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <h2 className="text-[14px] font-semibold text-white">
                {t('admin.systemSettings')}
              </h2>
              {settingsMsg && (
                <span className={`text-[11px] ${settingsMsg.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{settingsMsg}</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {settingsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <svg className="w-6 h-6 text-primary-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                  </svg>
                </div>
              ) : (
                <div className="max-w-2xl space-y-6">
                  {/* Contact Info */}
              <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-surface-700/50 rounded-xl backdrop-blur-sm p-5">
                <h3 className="text-[13px] font-semibold text-white mb-4">
                  {t('admin.planEditor')}
                </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                          {t('admin.phone')}
                        </label>
                        <input value={settings.contactPhone} onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                          {t('admin.contactEmail')}
                        </label>
                        <input value={settings.contactEmail} onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                    </div>
                  </div>

                  {/* SMTP Config */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-surface-700/50 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">{t('admin.smtpConfig')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">SMTP Host</label>
                        <input value={settings.smtpHost} onChange={e => setSettings({...settings, smtpHost: e.target.value})}
                          placeholder="smtp.gmail.com"
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">SMTP Port</label>
                        <input value={settings.smtpPort} onChange={e => setSettings({...settings, smtpPort: e.target.value})}
                          placeholder="587"
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('admin.smtpUser')}</label>
                        <input value={settings.smtpUser} onChange={e => setSettings({...settings, smtpUser: e.target.value})}
                          placeholder="user@gmail.com"
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('admin.smtpPassword')}</label>
                        <input type="password" value={settings.smtpPassword} onChange={e => setSettings({...settings, smtpPassword: e.target.value})}
                          className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white focus:outline-none focus:border-primary-500" />
                      </div>
                    </div>
                  </div>

                  {/* PDF Email Notification */}
                  <div className="bg-gradient-to-br from-surface-900/80 to-surface-950/80 border border-surface-700/50 rounded-xl backdrop-blur-sm p-5">
                    <h3 className="text-[13px] font-semibold text-white mb-4">
                      {t('admin.pdfNotification')}
                    </h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <input type="checkbox" id="pdfNotify" checked={settings.enablePdfEmailNotification}
                        onChange={e => setSettings({...settings, enablePdfEmailNotification: e.target.checked})}
                        className="rounded border-surface-800 bg-surface-950 text-primary-500" />
                      <label htmlFor="pdfNotify" className="text-[12px] text-gray-300">
                        {t('admin.sendPdfAutomatically')}
                      </label>
                    </div>
                    {settings.enablePdfEmailNotification && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                            {t('admin.emailSubject')}
                          </label>
                          <input value={settings.pdfEmailSubject} onChange={e => setSettings({...settings, pdfEmailSubject: e.target.value})}
                            placeholder="Report - {domain}"
                            className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                        </div>
                        <div>
                          <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">
                            {t('admin.emailBody')}
                          </label>
                          <textarea value={settings.pdfEmailBody} onChange={e => setSettings({...settings, pdfEmailBody: e.target.value})}
                            rows={3}
                            placeholder="Attached is the PDF report for {domain}"
                            className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button onClick={handleSaveSettings} disabled={settingsSaving}
                      className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors disabled:opacity-50 flex items-center space-x-2">
                      {settingsSaving && (
                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                      )}
                      <span>{t('admin.saveSettings')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PLAN K8S DASHBOARD */}
        {activeTab === 'plan-k8s' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/></svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-white">{t('admin.k8sDashboard')}</h2>
                  <p className="text-[10px] text-gray-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedCompany ? selectedCompany.id : ''} onChange={e => setSelectedCompany(e.target.value ? users.find(u => u.id === e.target.value) : null)}
                  className="bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500/50 w-56">
                  <option value="">-- {t('admin.selectCompany')} --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{getCompanyDisplay(u)}</option>)}
                </select>
                {selectedCompany && (
                  <span className="text-blue-400 text-[10px] font-mono">{getCompanyDisplay(selectedCompany)}</span>
                )}
              </div>
            </div>
            {!selectedCompany ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <p className="text-[13px] text-gray-500">{t('admin.selectCompanyK8s')}</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('admin.k8sClusters'), value: '3', change: '+1', sub: t('admin.agentsOnline') },
                  { label: t('admin.k8sNodes'), value: '18', change: '98%', sub: t('admin.k8sUptime') },
                  { label: t('admin.k8sPods'), value: '47', change: '12', sub: t('admin.k8sRunning') },
                  { label: t('admin.k8sVulnerabilities'), value: '3', change: '-8', sub: t('admin.k8sCritical') },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[10px] text-gray-500 tracking-wide">{stat.label}</p>
                    <p className="text-[22px] font-semibold text-white mt-1 tracking-tight">{stat.value}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium ${i === 3 ? 'text-red-400' : 'text-green-400'}`}>{stat.change}</span>
                      <span className="text-[9px] text-gray-600">{stat.sub}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sResourceUsage')}</p>
                  {[
                    { label: 'CPU', used: 62, total: 100 },
                    { label: 'Memoria', used: 78, total: 100 },
                    { label: 'Almacenamiento', used: 43, total: 100 },
                  ].map((rsc, i) => (
                    <div key={i} className="mb-2.5 last:mb-0">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">{rsc.label}</span>
                        <span className="text-gray-500">{rsc.used}%</span>
                      </div>
                      <div className="h-1 bg-surface-950 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${rsc.used > 80 ? 'bg-red-400' : rsc.used > 60 ? 'bg-yellow-400' : 'bg-blue-400'}`} style={{width: rsc.used + '%'}}></div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sNodeStatus')}</p>
                  <div className="space-y-2">
                    {[
                      { name: 'node-1', status: 'Ready', cpu: '12%', mem: '34%', role: 'worker' },
                      { name: 'node-2', status: 'Ready', cpu: '45%', mem: '67%', role: 'worker' },
                      { name: 'node-3', status: 'Ready', cpu: '8%', mem: '22%', role: 'master' },
                    ].map((node, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="text-[11px] text-gray-300">{node.name}</span>
                          <span className="text-[8px] text-gray-600 bg-surface-800 px-1 rounded">{node.role}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[9px] text-gray-500 font-mono">
                          <span>CPU {node.cpu}</span>
                          <span>MEM {node.mem}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sRecentEvents')}</p>
                  <div className="space-y-2">
                    {[
                      { type: 'Normal', msg: 'Pod security-pod-7 created', time: '2m ago' },
                      { type: 'Warning', msg: 'Node node-2 CPU threshold', time: '5m ago' },
                      { type: 'Normal', msg: 'Security scan completed', time: '12m ago' },
                      { type: 'Normal', msg: 'RBAC policy updated', time: '18m ago' },
                    ].map((evt, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${evt.type === 'Warning' ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 truncate">{evt.msg}</p>
                          <p className="text-gray-600">{evt.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sPodStatus')}</p>
                  <div className="flex items-center gap-4 mb-3">
                    {[
                      { label: t('admin.k8sRunningPods'), value: 38, color: 'bg-green-400' },
                      { label: t('admin.k8sPending'), value: 6, color: 'bg-yellow-400' },
                      { label: t('admin.k8sFailed'), value: 3, color: 'bg-red-400' },
                    ].map((pod, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${pod.color}`}></div>
                        <div>
                          <span className="text-[11px] text-white font-semibold">{pod.value}</span>
                          <span className="text-[8px] text-gray-600 ml-1">{pod.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="h-2 bg-surface-950 rounded-full overflow-hidden flex">
                    <div className="h-full bg-green-400 transition-all" style={{width: '60%'}}></div>
                    <div className="h-full bg-yellow-400 transition-all" style={{width: '25%'}}></div>
                    <div className="h-full bg-red-400 transition-all" style={{width: '15%'}}></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-600 mt-1">
                    <span>47 total pods</span>
                    <span>81% {t('admin.k8sHealthy')}</span>
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sDeployments')}</p>
                  <div className="space-y-2">
                    {[
                      { name: 'api-gateway', replicas: '3/3', status: t('admin.k8sStable'), cpu: '24%' },
                      { name: 'auth-service', replicas: '2/2', status: t('admin.k8sStable'), cpu: '18%' },
                      { name: 'worker-pool', replicas: '5/5', status: t('admin.k8sStable'), cpu: '67%' },
                      { name: 'monitoring', replicas: '1/1', status: t('admin.k8sStable'), cpu: '8%' },
                      { name: 'ai-engine', replicas: '0/1', status: t('admin.k8sFailed'), cpu: '0%' },
                    ].map((dep, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-950/30 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${dep.status === 'Stable' || dep.status === 'Estable' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                          <span className="text-[10px] text-gray-300">{dep.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[8px] text-gray-500 font-mono">
                          <span>{dep.replicas}</span>
                          <span>CPU {dep.cpu}</span>
                          <span className={`${dep.status === 'Stable' || dep.status === 'Estable' ? 'text-green-400' : 'text-red-400'}`}>{dep.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
            </div>
          )} {/* end selectedCompany ternary */}
        </div> {/* end h-full flex-col */}
      )} {/* end activeTab check */}
        {/* PLAN INVISIA DASHBOARD */}
        {activeTab === 'plan-invisia' && (() => {
          const agents = liveAgents.length > 0 ? liveAgents : [];
          const alerts = liveAlerts.length > 0 ? liveAlerts : [];
          const rules = liveRules.length > 0 ? liveRules : [];
          const onlineAgents = agents.filter(a => a.status === 'online' || a.online === true).length;
          const criticalAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
          const displayAgents = agents.length > 0 ? agents : mockAgents;
          const displayAlerts = alerts.length > 0 ? alerts : [];
          const hasLiveData = agents.length > 0;
          return (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-white flex items-center gap-2">
                    {t('admin.invisiaDashboard')}
                    <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] ${hasLiveData ? 'bg-green-900/20 text-green-400' : 'bg-surface-800 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${hasLiveData ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                      {hasLiveData ? t('admin.live') : 'Demo'}
                    </span>
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={loadInvisiaData} title={t('admin.refreshData')}
                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-surface-800 hover:bg-surface-700 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                </button>
                <select value={selectedCompany ? selectedCompany.id : ''} onChange={e => setSelectedCompany(e.target.value ? users.find(u => u.id === e.target.value) : null)}
                  className="bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500/50 w-56">
                  <option value="">-- {t('admin.selectCompany')} --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{getCompanyDisplay(u)}</option>)}
                </select>
                {selectedCompany && (
                  <span className="text-primary-400 text-[10px] font-mono">{getCompanyDisplay(selectedCompany)}</span>
                )}
              </div>
            </div>
            {!selectedCompany ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <p className="text-[13px] text-gray-500">{t('admin.selectCompanyInvisia')}</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('admin.agents'), value: String(displayAgents.length), sub: t('admin.registered') },
                  { label: t('admin.criticalAlerts'), value: String(criticalAlerts), sub: t('admin.unresolved'), danger: criticalAlerts > 0 },
                  { label: t('admin.blockedUsers'), value: '7', sub: t('admin.thisMonth') },
                  { label: t('admin.firewallRules'), value: String(rules.length || 12), sub: t('admin.activeRules') },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[10px] text-gray-500 tracking-wide">{stat.label}</p>
                    <p className={`text-[22px] font-semibold mt-1 tracking-tight ${stat.danger ? 'text-red-400' : 'text-white'}`}>{stat.value}</p>
                    <p className="text-[9px] text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.invisiaAgentStatus')}</p>
                  <div className="space-y-2">
                    {displayAgents.length > 0 ? displayAgents.slice(0, 8).map((ag, i) => (
                      <div key={ag._id || ag.id || i} className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${ag.status === 'online' || ag.online ? 'bg-green-400' : ag.status === 'idle' ? 'bg-yellow-400' : 'bg-gray-600'}`}></span>
                          <span className="text-[11px] text-gray-300">{ag.name || ag.hostname || `Agent ${i+1}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-600">{ag.ip || ag.ipAddress || '-'}</span>
                          {ag.firewall === true && <span className="text-[8px] text-blue-400 bg-blue-900/20 px-1 rounded">FW</span>}
                        </div>
                      </div>
                    )) : (
                      <>
                        <div className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span><span className="text-[11px] text-gray-300">SRV-WIN-01</span></div>
                          <div className="flex items-center gap-2"><span className="text-[8px] text-gray-600">192.168.1.42</span><span className="text-[8px] text-blue-400 bg-blue-900/20 px-1 rounded">FW</span></div>
                        </div>
                        <div className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span><span className="text-[11px] text-gray-300">MAC-DEV-01</span></div>
                          <div className="flex items-center gap-2"><span className="text-[8px] text-gray-600">192.168.1.77</span><span className="text-[8px] text-blue-400 bg-blue-900/20 px-1 rounded">FW</span></div>
                        </div>
                        <div className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400"></span><span className="text-[11px] text-gray-300">UBT-PROD-01</span></div>
                          <div className="flex items-center gap-2"><span className="text-[8px] text-gray-600">10.0.0.15</span></div>
                        </div>
                        <div className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span><span className="text-[11px] text-gray-300">TRMX-DROID</span></div>
                          <div className="flex items-center gap-2"><span className="text-[8px] text-gray-600">192.168.1.105</span><span className="text-[8px] text-blue-400 bg-blue-900/20 px-1 rounded">FW</span></div>
                        </div>
                        <div className="flex items-center justify-between bg-surface-950/40 rounded px-2.5 py-1.5">
                          <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span><span className="text-[11px] text-gray-300">DEB-STAG</span></div>
                          <div className="flex items-center gap-2"><span className="text-[8px] text-gray-600">10.0.0.22</span></div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.invisiaRealTimeAlerts')}</p>
                  <div className="space-y-2">
                    {displayAlerts.length > 0 ? displayAlerts.slice(0, 6).map((al, i) => (
                      <div key={al._id || i} className="flex items-start gap-2.5 text-[10px] bg-surface-950/30 rounded p-2">
                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                          al.severity === 'critical' ? 'bg-red-400' : al.severity === 'high' ? 'bg-orange-400' : al.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 truncate">{al.message || al.description || 'Alert'}</p>
                          <p className="text-gray-600 mt-0.5">{al.createdAt ? formatDateTime(al.createdAt) : `Hace ${(i+1)*3} min`}</p>
                        </div>
                      </div>
                    )) : (
                      <>
                        {[
                          { sev: 'critical', msg: 'Intento de intrusión detectado — SRV-WIN-01', time: '2 min' },
                          { sev: 'high', msg: 'Puerto 445 escaneado desde IP externa', time: '8 min' },
                          { sev: 'medium', msg: 'Firewall desactivado en DEB-STAG', time: '15 min' },
                          { sev: 'low', msg: 'Nuevo dispositivo conectado a la red', time: '32 min' },
                        ].map((al, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-[10px] bg-surface-950/30 rounded p-2">
                            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              al.sev === 'critical' ? 'bg-red-400' : al.sev === 'high' ? 'bg-orange-400' : al.sev === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-400 truncate">{al.msg}</p>
                              <p className="text-gray-600 mt-0.5">Hace {al.time}</p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.invisiaSecuritySummary')}</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">{t('admin.protection')}</span>
                        <span className="text-green-400">94%</span>
                      </div>
                      <div className="h-1.5 bg-surface-950 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full" style={{width: '94%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">Endpoint Coverage</span>
                        <span className="text-blue-400">80%</span>
                      </div>
                      <div className="h-1.5 bg-surface-950 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-400 rounded-full" style={{width: '80%'}}></div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-surface-700/40">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-gray-400">{t('admin.blockedAttacks24h')}</span>
                        <span className="text-white font-mono">143</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{t('admin.trafficAnalyzed')}</span>
                        <span className="text-white font-mono">2.4 GB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {hasLiveData && agents.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.osDistribution')}</p>
                  {(() => {
                    const osCounts = {};
                    agents.forEach(a => { const os = a.os || a.platform || 'Unknown'; osCounts[os] = (osCounts[os] || 0) + 1; });
                    const total = agents.length;
                    const osColors = { Windows: 'bg-blue-400', Linux: 'bg-yellow-400', macOS: 'bg-purple-400', Android: 'bg-green-400', Darwin: 'bg-purple-400', Unknown: 'bg-gray-400' };
                    return Object.entries(osCounts).map(([os, count], i) => {
                      const pct = Math.round(count / total * 100);
                      const color = Object.entries(osColors).find(([k]) => os.toLowerCase().includes(k.toLowerCase()))?.[1] || 'bg-gray-400';
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-400">{os}</span>
                            <span className="text-gray-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1 bg-surface-950 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{width: pct + '%'}}></div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.threatsByType24h')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Malware', value: 47, max: 60, color: 'text-red-400', bar: 'bg-red-400' },
                      { label: t('admin.intrusions'), value: 23, max: 60, color: 'text-orange-400', bar: 'bg-orange-400' },
                      { label: 'Phishing', value: 38, max: 60, color: 'text-yellow-400', bar: 'bg-yellow-400' },
                      { label: 'DDoS', value: 12, max: 60, color: 'text-blue-400', bar: 'bg-blue-400' },
                      { label: t('admin.portScan'), value: 19, max: 60, color: 'text-purple-400', bar: 'bg-purple-400' },
                      { label: t('admin.others'), value: 4, max: 60, color: 'text-gray-400', bar: 'bg-gray-400' },
                    ].map((th, i) => (
                      <div key={i} className="bg-surface-950/30 rounded p-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] text-gray-400">{th.label}</span>
                          <span className={`text-[10px] font-mono font-semibold ${th.color}`}>{th.value}</span>
                        </div>
                        <div className="h-1 bg-surface-950 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${th.bar}`} style={{width: (th.value/th.max*100) + '%'}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          )}
          </div>
          );
        })()}

        {/* PLAN COMPLIANCE DASHBOARD */}
        {activeTab === 'plan-compliance' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-white">Chile Compliance</h2>
                  <p className="text-[10px] text-gray-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedCompany ? selectedCompany.id : ''} onChange={e => setSelectedCompany(e.target.value ? users.find(u => u.id === e.target.value) : null)}
                  className="bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500/50 w-56">
                  <option value="">-- {t('admin.selectCompany')} --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{getCompanyDisplay(u)}</option>)}
                </select>
                {selectedCompany && (
                  <span className="text-emerald-400 text-[10px] font-mono">{getCompanyDisplay(selectedCompany)}</span>
                )}
              </div>
            </div>
            {!selectedCompany ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <p className="text-[13px] text-gray-500">{t('admin.selectCompanyCompliance')}</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('admin.compliance'), value: '68%', sub: t('admin.overallProgress') },
                  { label: t('admin.requirements'), value: '17/25', sub: t('admin.completed') },
                  { label: t('admin.findings'), value: '3', sub: t('admin.pending') },
                  { label: t('admin.lastAudit'), value: '12', sub: t('admin.daysAgo') },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[10px] text-gray-500 tracking-wide">{stat.label}</p>
                    <p className="text-[22px] font-semibold text-white mt-1 tracking-tight">{stat.value}</p>
                    <p className="text-[9px] text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.complianceByArea')}</p>
                  <div className="space-y-3">
                    {[
                      { area: t('admin.governance'), pct: 80 },
                      { area: t('admin.arcoRights'), pct: 45 },
                      { area: t('admin.dataSecurity'), pct: 75 },
                      { area: t('admin.breachNotification'), pct: 90 },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-400">{item.area}</span>
                          <span className="text-gray-500">{item.pct}%</span>
                        </div>
                        <div className="h-1 bg-surface-950 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.pct >= 80 ? 'bg-emerald-400' : item.pct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{width: item.pct + '%'}}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.keyRequirements')}</p>
                  <div className="space-y-1.5">
                    {[
                      { label: t('admin.dpoDesignated'), ok: true },
                      { label: t('admin.databaseRegistry'), ok: true },
                      { label: t('admin.privacyPolicy'), ok: true },
                      { label: t('admin.consentMechanism'), ok: true },
                      { label: t('admin.notification72h'), ok: true },
                      { label: t('admin.dpiaAssessment'), ok: false },
                      { label: t('admin.arcoPortal'), ok: false },
                    ].map((req, i) => (
                      <div key={i} className="flex items-center gap-2 bg-surface-950/30 rounded px-2 py-1.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-surface-800 text-gray-600'}`}>
                          {req.ok ? (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                          )}
                        </div>
                        <span className={`text-[10px] ${req.ok ? 'text-gray-300' : 'text-gray-600'}`}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.requiredActions')}</p>
                  <div className="space-y-2">
                    {[
                      { action: t('admin.completeDpia'), prioridad: 'alta', date: '2026-07-15' },
                      { action: t('admin.implementArcoPortal'), prioridad: 'alta', date: '2026-08-01' },
                      { action: t('admin.updateConsentForms'), prioridad: 'media', date: '2026-07-30' },
                    ].map((act, i) => (
                      <div key={i} className="bg-surface-950/40 rounded-lg p-2.5 border border-surface-700/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${act.prioridad === 'alta' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                          <span className="text-[10px] text-gray-300">{act.action}</span>
                        </div>
                        <p className="text-[8px] text-gray-600 ml-3.5">{t('admin.due')}: {act.date}</p>
                      </div>
                    ))}
                    <div className="pt-1">
                      <p className="text-[10px] text-gray-500">{t('admin.nextAudit')}: <span className="text-white">2026-08-15</span></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.riskAssessment')}</p>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-surface-800"/>
                        <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="29.2" className="text-yellow-400" strokeLinecap="round"/>
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-yellow-400">MED</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{t('admin.likelihood')}</span>
                        <span className="text-yellow-400">{t('admin.medium')}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{t('admin.impact')}</span>
                        <span className="text-yellow-400">{t('admin.high')}</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400">{t('admin.priority')}</span>
                        <span className="text-red-400">{t('admin.reviewRequired')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-surface-950/30 rounded p-2.5 border border-surface-700/20">
                    <p className="text-[9px] text-gray-500 mb-1">{t('admin.criticalFindings')}</p>
                    <div className="space-y-1">
                      {[
                        { f: t('admin.missingDpia'), sev: 'critical' },
                        { f: t('admin.arcoPortalNotImplemented'), sev: 'high' },
                      ].map((finding, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full ${finding.sev === 'critical' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                          <span className="text-[8px] text-gray-400">{finding.f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.dpiaStatus')}</p>
                  <div className="space-y-2.5">
                    {[
                      { name: t('admin.hrSystem'), status: t('admin.hrSystemComplete'), date: '2026-05-12', color: 'bg-emerald-400' },
                      { name: t('admin.customerPlatform'), status: t('admin.hrSystemComplete'), date: '2026-05-28', color: 'bg-emerald-400' },
                      { name: t('admin.videoSurveillance'), status: t('admin.inProgressDpia'), date: '2026-07-20', color: 'bg-yellow-400' },
                      { name: t('admin.biometricData'), status: t('admin.pendingDpia'), date: '2026-08-01', color: 'bg-red-400' },
                      { name: t('admin.thirdPartyProcessors'), status: t('admin.pendingDpia'), date: '2026-08-15', color: 'bg-red-400' },
                    ].map((dpi, i) => (
                      <div key={i} className="flex items-center justify-between bg-surface-950/30 rounded px-2.5 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${dpi.color}`}></span>
                          <span className="text-[10px] text-gray-300">{dpi.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] ${dpi.color === 'bg-emerald-400' ? 'text-emerald-400' : dpi.color === 'bg-yellow-400' ? 'text-yellow-400' : 'text-red-400'}`}>{dpi.status}</span>
                          <span className="text-[8px] text-gray-600">{dpi.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        )}

        {/* PLAN ENTERPRISE DASHBOARD */}
        {activeTab === 'plan-enterprise' && (
          <div className="h-full flex flex-col">
            <div className="px-6 py-4 border-b border-surface-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-white">Enterprise</h2>
                  <p className="text-[10px] text-gray-500" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={selectedCompany ? selectedCompany.id : ''} onChange={e => setSelectedCompany(e.target.value ? users.find(u => u.id === e.target.value) : null)}
                  className="bg-surface-900 border border-surface-700/50 rounded-lg px-3 py-1.5 text-[11px] text-white focus:outline-none focus:border-primary-500/50 w-56">
                  <option value="">-- {t('admin.selectCompany')} --</option>
                  {users.map(u => <option key={u.id} value={u.id}>{getCompanyDisplay(u)}</option>)}
                </select>
                {selectedCompany && (
                  <span className="text-purple-400 text-[10px] font-mono">{getCompanyDisplay(selectedCompany)}</span>
                )}
              </div>
            </div>
            {!selectedCompany ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-10 h-10 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <p className="text-[13px] text-gray-500">{t('admin.selectCompanyEnterprise')}</p>
                </div>
              </div>
            ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('admin.agents'), value: '∞', sub: t('admin.unlimited') },
                  { label: t('admin.k8sClusters'), value: '∞', sub: t('admin.unlimited') },
                  { label: t('admin.compliance'), value: '100%', sub: t('admin.fullCoverage') },
                  { label: t('admin.support'), value: '24/7', sub: t('admin.dedicated') },
                ].map((stat, i) => (
                  <div key={i} className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[10px] text-gray-500 tracking-wide">{stat.label}</p>
                    <p className="text-[22px] font-semibold text-white mt-1 tracking-tight">{stat.value}</p>
                    <p className="text-[9px] text-gray-600 mt-1">{stat.sub}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.k8sOverview')}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.k8sClusters')}</span>
                    <span className="text-white text-[12px] font-semibold">3</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.k8sNodes')}</span>
                    <span className="text-white text-[12px] font-semibold">18</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{t('admin.k8sPods')}</span>
                    <span className="text-white text-[12px] font-semibold">47</span>
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.invisiaOverview')}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.agents')}</span>
                    <span className="text-white text-[12px] font-semibold">5</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.alerts')}</span>
                    <span className="text-white text-[12px] font-semibold">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{t('admin.fwRules')}</span>
                    <span className="text-white text-[12px] font-semibold">12</span>
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.complianceOverview')}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.progress')}</span>
                    <span className="text-emerald-400 text-[12px] font-semibold">68%</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.requirements')}</span>
                    <span className="text-white text-[12px] font-semibold">17/25</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">{t('admin.findings')}</span>
                    <span className="text-yellow-400 text-[12px] font-semibold">3</span>
                  </div>
                </div>
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.system')}</p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.status')}</span>
                    <span className="text-green-400 text-[10px]">{t('admin.operational')}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-gray-400">{t('admin.uptimeLabel')}</span>
                    <span className="text-white text-[12px] font-semibold">99.97%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400">SLA</span>
                    <span className="text-white text-[12px] font-semibold">99.99%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                  <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.unifiedActivityFeed')}</p>
                  <div className="space-y-2">
                    {[
                      { source: 'K8s', msg: 'Deployment api-gateway escalado a 3 réplicas', time: '2 min ago', color: 'bg-blue-400' },
                      { source: 'Invisia', msg: 'Intento de intrusión bloqueado en SRV-WIN-01', time: '5 min ago', color: 'bg-primary-400' },
                      { source: 'Compliance', msg: 'DPIA para RR.HH. marcado como completado', time: '12 min ago', color: 'bg-emerald-400' },
                      { source: 'K8s', msg: 'Node node-2 health check superado', time: '18 min ago', color: 'bg-blue-400' },
                      { source: 'Invisia', msg: 'Nuevo dispositivo conectado: 192.168.1.112', time: '25 min ago', color: 'bg-primary-400' },
                      { source: 'System', msg: 'Backup automatizado completado (1.2 GB)', time: '45 min ago', color: 'bg-purple-400' },
                      { source: 'Compliance', msg: 'Recordatorio: Evaluación DPIA vence 2026-08-15', time: '1h ago', color: 'bg-emerald-400' },
                    ].map((act, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[10px] bg-surface-950/30 rounded p-2">
                        <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${act.color}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-400 truncate">
                            <span className="text-gray-500 font-mono text-[8px]">[{act.source}]</span> {act.msg}
                          </p>
                          <p className="text-gray-600">{act.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">{t('admin.resourceConsumption')}</p>
                    <div className="space-y-2.5">
                      {[
                        { label: 'CPU', used: 45, platform: t('admin.totalClusters') },
                        { label: 'Memoria', used: 62, platform: t('admin.totalAgents') },
                        { label: 'Ancho de Banda', used: 28, platform: t('admin.networkTraffic') },
                        { label: 'Almacenamiento', used: 71, platform: t('admin.logsAndBackups') },
                      ].map((rsc, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-gray-400">{rsc.label}</span>
                            <span className="text-gray-500">{rsc.used}%</span>
                          </div>
                          <div className="h-1.5 bg-surface-950 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${rsc.used > 70 ? 'bg-red-400' : rsc.used > 50 ? 'bg-yellow-400' : 'bg-purple-400'}`} style={{width: rsc.used + '%'}}></div>
                          </div>
                          <p className="text-[8px] text-gray-600 mt-0.5">{rsc.platform}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface-900/60 border border-surface-700/30 rounded-lg p-4">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-2">{t('admin.slaCompliance')}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">{t('admin.target')}</span>
                      <span className="text-[10px] text-gray-400">{t('admin.current')}</span>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { metric: t('admin.availability'), target: '99.99%', current: '99.97%', ok: true },
                        { metric: t('admin.responseTime'), target: '<200ms', current: '145ms', ok: true },
                        { metric: t('admin.resolutionTime'), target: '<4h', current: '3.2h', ok: true },
                        { metric: t('admin.throughput'), target: '10K rpm', current: '8.7K rpm', ok: true },
                      ].map((sla, i) => (
                        <div key={i} className="flex items-center justify-between text-[9px]">
                          <span className="text-gray-400">{sla.metric}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">{sla.target}</span>
                            <span className={`${sla.ok ? 'text-green-400' : 'text-red-400'} font-mono`}>{sla.current}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>
        )}

      {showUserModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-950 border border-surface-800 rounded-lg w-full max-w-md">
            <div className="px-5 py-4 border-b border-surface-800 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-white">{editingUser ? t('admin.editUser') : t('admin.addUser')}</h3>
              <button onClick={() => setShowUserModal(false)} className="text-gray-500 hover:text-white">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('admin.company')}</label>
                  <input required value={userForm.companyName} onChange={e => setUserForm({...userForm, companyName: e.target.value})}
                    readOnly={!!editingUser}
                    className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2.5 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input required value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} type="email"
                    readOnly={!!editingUser}
                    className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2.5 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Domain</label>
                  <input required value={userForm.domain} onChange={e => setUserForm({...userForm, domain: e.target.value})}
                    readOnly={!!editingUser}
                    className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2.5 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 read-only:opacity-60 read-only:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('admin.plan')}</label>
                  <select value={userForm.planType} onChange={e => setUserForm({...userForm, planType: e.target.value})}
                    className="w-full bg-surface-950 border border-surface-800 text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                    <option>Free</option>
                    <option>Basic</option>
                    <option>Advanced</option>
                    <option>Expert</option>
                  </select>
                </div>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                  <input value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} type="password"
                    className="w-full bg-surface-950 border border-surface-800 rounded px-3 py-2.5 text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-primary-500" />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isActive" checked={userForm.isActive} onChange={e => setUserForm({...userForm, isActive: e.target.checked})}
                  className="rounded border-surface-800 bg-surface-950 text-primary-500" />
                <label htmlFor="isActive" className="text-[12px] text-gray-300">{t('admin.active')}</label>
              </div>
              <div>
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">{t('admin.aiDataRetention')}</label>
                <select value={userForm.aiRetention} onChange={e => setUserForm({...userForm, aiRetention: e.target.value})}
                  className="w-full bg-surface-950 border border-surface-800 text-[12px] text-white rounded px-3 py-2.5 focus:outline-none focus:border-primary-500">
                  <option value="never">{t('admin.retentionNeverPurge')}</option>
                  <option value="weekly">{t('admin.retentionWeekly')}</option>
                  <option value="monthly">{t('admin.retentionMonthly')}</option>
                  <option value="yearly">{t('admin.retentionYearly')}</option>
                </select>
                <p className="text-[10px] text-gray-600 mt-1">{t('admin.autoPurgeDesc')}</p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 bg-surface-900 hover:bg-surface-800 text-white text-[12px] rounded transition-colors">
                  {t('admin.cancel')}
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-[12px] rounded transition-colors">
                  {editingUser ? t('admin.save') : t('admin.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </>
    </div>
  );
  );
}
