// ============================
// UI 渲染系统 - 迷雾侦探
// ============================
const UI = {
  currentScreen: null,

  init() {
    this.renderMenu();
    this._bindGlobalEvents();
  },

  _el() { return document.getElementById('game-screen'); },
  _scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); },

  _clear() {
    const el = this._el();
    if (el) el.innerHTML = '';
    this.currentScreen = null;
  },

  _bindGlobalEvents() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === 'start-game') {
        if (!Monetization.canPlay()) { this.renderPaywall(); return; }
        Game.startNewGame(parseInt(btn.dataset.difficulty) || 1);
      }
      else if (action === 'visit-location') Game.visitLocation(btn.dataset.locationId);
      else if (action === 'interrogate') Game.interrogateSuspect(btn.dataset.suspectId);
      else if (action === 'accuse') Game.makeAccusation(btn.dataset.suspectId);
      else if (action === 'next-case') Game.nextCase();
      else if (action === 'back-menu') { Game.currentPhase = 'menu'; this.renderMenu(); }
      else if (action === 'back-investigation') UI.renderInvestigation(Game.currentCase, Game.foundEvidence, Game.visitedLocations);
      else if (action === 'show-redeem') Monetization.showRedeemModal();
      else if (action === 'show-donate') Monetization.showDonateModal();
      else if (action === 'show-custom') Monetization.showCustomServiceModal();
      else if (action === 'show-evidence') this._showEvidencePanel();
      else if (action === 'show-suspects') this._showSuspectsPanel();
      else if (action === 'select-evidence') this._selectEvidence(btn.dataset.evidenceId, btn.dataset.suspectId);
      else if (action === 'submit-accusation') this._submitAccusation(btn.dataset.suspectId);
    });
  },

  renderMenu() {
    this._clear();
    const el = this._el();
    el.innerHTML = `
      <div class="screen menu-screen">
        <div class="menu-bg-particles"></div>
        <div class="menu-content">
          <div class="menu-badge">AI 互动探案</div>
          <h1 class="menu-title">
            <span class="title-glow">迷雾侦探</span>
          </h1>
          <p class="menu-subtitle">每一局都是独一无二的案件<br>运用你的推理，找出真凶</p>
          <div class="menu-difficulty">
            <p class="diff-label">选择难度</p>
            <div class="diff-buttons">
              <button class="btn-diff" data-action="start-game" data-difficulty="1">
                <span class="diff-stars">★</span>
                <span class="diff-text">简单</span>
                <span class="diff-desc">4个嫌疑人，线索清晰</span>
              </button>
              <button class="btn-diff" data-action="start-game" data-difficulty="2">
                <span class="diff-stars">★★</span>
                <span class="diff-text">普通</span>
                <span class="diff-desc">5个嫌疑人，干扰线索</span>
              </button>
              <button class="btn-diff" data-action="start-game" data-difficulty="3">
                <span class="diff-stars">★★★</span>
                <span class="diff-text">困难</span>
                <span class="diff-desc">6个嫌疑人，错综复杂</span>
              </button>
            </div>
          </div>
          <div class="menu-footer">
            ${Monetization.renderMonetizationPanel()}
          </div>
        </div>
      </div>
    `;
    this.currentScreen = 'menu';
    this._scrollToTop();
  },

  renderBriefing(gameCase) {
    this._clear();
    const el = this._el();
    el.innerHTML = `
      <div class="screen briefing-screen">
        <div class="screen-header">
          <span class="header-badge">案件 ${gameCase.difficulty === 1 ? '★' : gameCase.difficulty === 2 ? '★★' : '★★★'}</span>
          <div class="header-info">
            <span>📋 ${gameCase.type}</span>
            <span>📍 ${gameCase.setting}</span>
            <span>🕐 ${gameCase.time}</span>
          </div>
        </div>
        <div class="briefing-content card-elevated">
          <div class="briefing-title">
            <h2>${gameCase.title}</h2>
            <p class="subtitle">${gameCase.subtitle}</p>
          </div>
          <div class="divider"></div>
          <div class="briefing-body">
            <p class="briefing-text">${gameCase.briefing}</p>
            <div class="victim-info">
              <span class="info-tag">👤 死者：${gameCase.victimName}</span>
              <span class="info-tag">💼 身份：${gameCase.victimOcc}</span>
              <span class="info-tag">🔍 嫌疑人：${gameCase.suspects.length}人</span>
            </div>
          </div>
          <div class="briefing-actions">
            <button class="btn-primary" data-action="back-investigation">开始调查</button>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${Math.round((Game.steps / Game.maxSteps) * 100)}%"></div>
          <span class="progress-text">调查进度 | 已用 ${Game.steps}/${Game.maxSteps} 步</span>
        </div>
      </div>
    `;
    this.currentScreen = 'briefing';
    this._scrollToTop();
  },

  renderInvestigation(gameCase, foundEvidence, visitedLocations) {
    this._clear();
    const el = this._el();
    
    const availableLocs = gameCase.locations.filter(l => !l.investigated);
    const doneLocs = gameCase.locations.filter(l => l.investigated);
    
    let locationsHtml = '';
    doneLocs.forEach(loc => {
      locationsHtml += `
        <div class="loc-card loc-done">
          <div class="loc-header">
            <span class="loc-name">✅ ${loc.name}</span>
            <span class="loc-evidence-count">${loc.evidence.filter(e => e.found).length}条线索</span>
          </div>
          <div class="loc-evidence-list">
            ${loc.evidence.filter(e => e.found).map(e => `
              <div class="evidence-item ${e.isKey ? 'key-evidence' : ''}">
                <span class="evi-type">${e.type === 'physical' ? '🔧' : e.type === 'document' ? '📄' : '💬'}</span>
                <div class="evi-info">
                  <span class="evi-name">${e.name} ${e.isKey ? '⭐' : ''}</span>
                  <span class="evi-desc">${e.description}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
    });
    
    availableLocs.forEach(loc => {
      locationsHtml += `
        <div class="loc-card loc-available">
          <div class="loc-header">
            <span class="loc-name">🔍 ${loc.name}</span>
            <span class="loc-evidence-hint">${loc.evidence.length}处可疑迹象</span>
          </div>
          <p class="loc-desc">${loc.description}</p>
          <button class="btn-investigate" data-action="visit-location" data-location-id="${loc.id}">调查此区域</button>
        </div>`;
    });

    const topBar = `
      <div class="screen-header">
        <span class="header-badge">现场调查</span>
        <div class="header-info">
          <span>🔍 证据 ${foundEvidence.length}/${gameCase.totalEvidence}</span>
          <span>🎯 步数 ${Game.steps}/${Game.maxSteps}</span>
          <span>⭐ 评分 ${Game.score}</span>
        </div>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.round((Game.steps / Game.maxSteps) * 100)}%"></div>
        <span class="progress-text">调查进度 | 已用 ${Game.steps}/${Game.maxSteps} 步</span>
      </div>`;

    const suspectsHtml = `
      <div class="panel suspects-panel">
        <div class="panel-header">
          <h3>嫌疑人列表</h3>
          <span class="panel-sub">点击审问获取口供</span>
        </div>
        <div class="suspects-grid">
          ${gameCase.suspects.map(s => {
            const interrogated = Game.interrogatedSuspects.includes(s.id);
            const evidenceAgainst = Game.getFoundEvidenceForSuspect(s.id);
            return `
              <div class="suspect-card ${interrogated ? 'suspect-interrogated' : ''}">
                <div class="suspect-portrait">${s.portrait}</div>
                <div class="suspect-info">
                  <span class="suspect-name">${s.name}</span>
                  <span class="suspect-occ">${s.occupation} · ${s.age}岁</span>
                  <span class="suspect-mood">${CaseGenerator.moodEmoji[s.mood]} ${CaseGenerator.moodText[s.mood]}</span>
                  ${interrogated ? '<span class="badge-done">已审问 ✓</span>' : ''}
                  ${evidenceAgainst.length > 0 ? `<span class="badge-evidence">${evidenceAgainst.length}条关联证据</span>` : ''}
                </div>
                ${!interrogated ? '<button class="btn-interrogate" data-action="interrogate" data-suspect-id="'+s.id+'">审问</button>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>`;

    const accuseHtml = foundEvidence.length > 0 ? `
      <div class="panel accuse-panel">
        <div class="panel-header">
          <h3>🔨 作出指认</h3>
          <span class="panel-sub">收集足够证据后指认真凶</span>
        </div>
        <div class="accuse-grid">
          ${gameCase.suspects.map(s => `
            <button class="btn-accuse" data-action="accuse" data-suspect-id="${s.id}">
              ${s.portrait} ${s.name}
            </button>
          `).join('')}
        </div>
      </div>` : '';

    el.innerHTML = topBar + `
      <div class="investigation-layout">
        <div class="left-panel">
          <div class="section-title">📍 调查区域</div>
          ${locationsHtml || '<div class="empty-state">所有区域已调查完毕</div>'}
        </div>
        <div class="right-panel">
          ${suspectsHtml}
          ${accuseHtml}
        </div>
      </div>
    `;
    this.currentScreen = 'investigation';
    this._scrollToTop();
  },

  renderInterrogation(suspect) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content interrogate-modal">
        <div class="modal-header">
          <div class="modal-suspect-info">
            <span class="modal-portrait">${suspect.portrait}</span>
            <div>
              <h3>审问 ${suspect.name}</h3>
              <p>${suspect.occupation} · ${suspect.age}岁 · ${CaseGenerator.moodText[suspect.mood]}</p>
            </div>
          </div>
          <button class="btn-close" data-action="back-investigation">&times;</button>
        </div>
        <div class="modal-divider"></div>
        <div class="interrogation-script">
          ${suspect.interrogationScript.map((q, idx) => `
            <div class="qa-block ${idx === 0 ? 'qa-open' : ''}">
              <div class="qa-question">
                <span class="qa-label">你问</span>
                <p>${q.question}</p>
              </div>
              <div class="qa-answer">
                <span class="qa-label">${suspect.name}</span>
                <p class="answer-text">${q.answer}</p>
              </div>
              <div class="qa-truth truth-hidden">
                <span class="qa-label">真相</span>
                <p>${q.truth}</p>
              </div>
              <button class="btn-reveal-truth" data-idx="${idx}">🕵️ 揭示真相</button>
            </div>
          `).join('')}
        </div>
        <div class="modal-footer">
          <button class="btn-primary" data-action="back-investigation">结束审问</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    // Reveal truth on click
    overlay.querySelectorAll('.btn-reveal-truth').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const truthBlock = overlay.querySelectorAll('.qa-truth')[idx];
        if (truthBlock) {
          truthBlock.classList.remove('truth-hidden');
          truthBlock.classList.add('truth-visible');
          btn.textContent = '✅ 已揭示';
          btn.disabled = true;
        }
      });
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
        UI.renderInvestigation(Game.currentCase, Game.foundEvidence, Game.visitedLocations);
      }
    });
    
    // Close button
    overlay.querySelector('.btn-close').addEventListener('click', () => {
      overlay.remove();
      UI.renderInvestigation(Game.currentCase, Game.foundEvidence, Game.visitedLocations);
    });
    
    // Back to investigation
    overlay.querySelector('[data-action="back-investigation"]').addEventListener('click', (e) => {
      if (e.target.closest('.modal-footer') || e.target.classList.contains('btn-close')) {
        overlay.remove();
        UI.renderInvestigation(Game.currentCase, Game.foundEvidence, Game.visitedLocations);
      }
    });
  },

  renderVerdict(result, gameCase) {
    this._clear();
    const el = this._el();
    
    const stars = result.correct ? '⭐⭐⭐⭐⭐' : '⭐⭐';
    const verdictClass = result.correct ? 'verdict-win' : 'verdict-lose';
    
    el.innerHTML = `
      <div class="screen verdict-screen ${verdictClass}">
        <div class="verdict-content card-elevated">
          <div class="verdict-icon">${result.correct ? '🎉' : '😔'}</div>
          <h2 class="verdict-title">${result.correct ? '案件告破！' : '调查失败...'}</h2>
          <p class="verdict-message">${result.message}</p>
          <div class="verdict-stars">${stars}</div>
          <div class="verdict-score">
            <span class="score-value">${result.score}</span>
            <span class="score-label">推理评分</span>
          </div>
          <div class="verdict-details">
            <div class="detail-row">
              <span>案件难度</span>
              <span>${'★'.repeat(gameCase.difficulty)}${'☆'.repeat(3 - gameCase.difficulty)}</span>
            </div>
            <div class="detail-row">
              <span>调查步数</span>
              <span>${Game.steps}/${Game.maxSteps}</span>
            </div>
            <div class="detail-row">
              <span>证据收集</span>
              <span>${Game.foundEvidence.length}/${gameCase.totalEvidence}</span>
            </div>
            ${result.evidenceFound !== undefined ? `
            <div class="detail-row">
              <span>关键证据</span>
              <span>${result.evidenceFound}/${result.totalEvidence}</span>
            </div>` : ''}
          </div>
          <div class="divider"></div>
          <div class="story-section">
            <h3>📖 真相还原</h3>
            <p class="story-text">${result.story}</p>
          </div>
          <div class="verdict-actions">
            <button class="btn-primary" data-action="next-case">下一案件</button>
            <button class="btn-secondary" data-action="back-menu">返回主菜单</button>
          </div>
          ${Monetization.renderDonationPrompt()}
        </div>
      </div>
    `;
    this.currentScreen = 'verdict';
    this._scrollToTop();
  },

  _showEvidencePanel() {
    const allEvidence = Game.getAllEvidence();
    const found = Game.foundEvidence;
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content evidence-modal">
        <div class="modal-header">
          <h3>📋 证据收集册 (${found.length}/${allEvidence.length})</h3>
          <button class="btn-close">&times;</button>
        </div>
        <div class="evidence-grid">
          ${allEvidence.map(e => {
            const isFound = found.find(f => f.id === e.id);
            return isFound ? `
              <div class="evidence-card ${e.isKey ? 'key-card' : ''}">
                <div class="evi-top">
                  <span>${e.type === 'physical' ? '🔧' : e.type === 'document' ? '📄' : '💬'} ${e.name}</span>
                  ${e.isKey ? '<span class="key-badge">关键</span>' : ''}
                </div>
                <p>${e.description}</p>
                <span class="evi-location">📍 ${e.location}</span>
              </div>
            ` : `
              <div class="evidence-card evidence-hidden">
                <div class="evi-top">
                  <span>❓ 未发现的线索</span>
                </div>
                <p>继续调查以发现此线索</p>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('.btn-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  _showSuspectsPanel() {
    // Already visible in investigation view
  },

  _selectEvidence(evidenceId, suspectId) {},
  _submitAccusation(suspectId) {},

  renderPaywall() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content paywall-modal">
        <div class="paywall-icon">🔒</div>
        <h2>免费案件已用尽</h2>
        <p class="paywall-text">你已经完成了 ${Monetization.FREE_CASE_LIMIT} 个免费案件的调查。<br>解锁高级版后可以无限畅玩所有案件！</p>
        <div class="paywall-stats">
          <div class="paywall-stat">
            <span class="stat-num">${Monetization.getTotalGames()}</span>
            <span>案件完成</span>
          </div>
          <div class="paywall-stat">
            <span class="stat-num">${Monetization.getHighScore()}</span>
            <span>最高评分</span>
          </div>
        </div>
        <div class="paywall-actions">
          <button class="btn-primary" data-action="show-redeem">🔓 输入激活码</button>
          <button class="btn-secondary" data-action="show-donate">☕ 打赏获取</button>
        </div>
        <button class="btn-back-menu" data-action="back-menu">返回主菜单</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    overlay.querySelector('[data-action="back-menu"]').addEventListener('click', () => {
      overlay.remove();
      this.renderMenu();
    });
    // 重新绑定按钮事件
    overlay.querySelector('[data-action="show-redeem"]').addEventListener('click', () => {
      overlay.remove();
      Monetization.showRedeemModal();
    });
    overlay.querySelector('[data-action="show-donate"]').addEventListener('click', () => {
      overlay.remove();
      Monetization.showDonateModal();
    });
  }
};

// 启动游戏
document.addEventListener('DOMContentLoaded', () => UI.init());
