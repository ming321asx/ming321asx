// ================================
// 变现系统 - 迷雾侦探
// 免费限制 + 付费解锁 + 打赏 + 定制
// ================================

const Monetization = {
  FREE_CASE_LIMIT: 3,
  STORAGE_CASES: 'misty_cases_played',
  STORAGE_UNLOCKED: 'misty_unlocked',
  STORAGE_CODES: 'misty_codes',
  STORAGE_HIGH_SCORE: 'misty_high_score',
  STORAGE_TOTAL_SCORE: 'misty_total_score',
  STORAGE_GAMES_PLAYED: 'misty_games_total',

  // ---------- 核心方法 ----------
  getCasesPlayed() {
    return parseInt(localStorage.getItem(this.STORAGE_CASES) || '0');
  },

  incrementCasesPlayed() {
    const played = this.getCasesPlayed() + 1;
    localStorage.setItem(this.STORAGE_CASES, String(played));
    return played;
  },

  getTotalGames() {
    return parseInt(localStorage.getItem(this.STORAGE_GAMES_PLAYED) || '0');
  },

  incrementTotalGames() {
    const total = this.getTotalGames() + 1;
    localStorage.setItem(this.STORAGE_GAMES_PLAYED, String(total));
    return total;
  },

  updateHighScore(score) {
    const current = parseInt(localStorage.getItem(this.STORAGE_HIGH_SCORE) || '0');
    if (score > current) {
      localStorage.setItem(this.STORAGE_HIGH_SCORE, String(score));
    }
    const total = parseInt(localStorage.getItem(this.STORAGE_TOTAL_SCORE) || '0');
    localStorage.setItem(this.STORAGE_TOTAL_SCORE, String(total + score));
  },

  getHighScore() {
    return parseInt(localStorage.getItem(this.STORAGE_HIGH_SCORE) || '0');
  },

  getTotalScore() {
    return parseInt(localStorage.getItem(this.STORAGE_TOTAL_SCORE) || '0');
  },

  getAverageScore() {
    const total = this.getTotalGames();
    return total > 0 ? Math.round(this.getTotalScore() / total) : 0;
  },

  isPremiumUnlocked() {
    return localStorage.getItem(this.STORAGE_UNLOCKED) === 'true';
  },

  canPlay() {
    return this.getCasesPlayed() < this.FREE_CASE_LIMIT || this.isPremiumUnlocked();
  },

  remainingFree() {
    return Math.max(0, this.FREE_CASE_LIMIT - this.getCasesPlayed());
  },

  // ---------- 激活码系统 ----------
  _generateCheckDigit(code) {
    let sum = 0;
    for (let i = 0; i < code.length; i++) {
      sum += code.charCodeAt(i);
    }
    return String.fromCharCode(65 + (sum % 26));
  },

  generateCodes(count) {
    const codes = [];
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 4; j++) {
        for (let k = 0; k < 4; k++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
        if (j < 3) code += '-';
      }
      const check = this._generateCheckDigit(code);
      codes.push(code + check);
    }
    return codes;
  },

  redeemCode(inputCode) {
    const code = inputCode.trim().toUpperCase();
    // 从存储中获取已生成的有效码
    const validCodes = JSON.parse(localStorage.getItem(this.STORAGE_CODES) || '[]');
    const masterCode = 'MISTY-VIP-2026-X';

    if (code === masterCode) {
      this._unlockPremium();
      return { success: true, message: '高级版已永久解锁！感谢你的支持！' };
    }

    const idx = validCodes.indexOf(code);
    if (idx !== -1) {
      validCodes.splice(idx, 1);
      localStorage.setItem(this.STORAGE_CODES, JSON.stringify(validCodes));
      this._unlockPremium();
      return { success: true, message: '激活码有效！高级版已解锁！' };
    }

    return { success: false, message: '激活码无效，请检查后重新输入。' };
  },

  _unlockPremium() {
    localStorage.setItem(this.STORAGE_UNLOCKED, 'true');
  },

  // 管理员功能：生成并存储激活码（供出售）
  adminGenerateCodes(count) {
    const codes = this.generateCodes(count);
    const existing = JSON.parse(localStorage.getItem(this.STORAGE_CODES) || '[]');
    localStorage.setItem(this.STORAGE_CODES, JSON.stringify([...existing, ...codes]));
    return codes;
  },

  adminGetCodeList() {
    const codes = JSON.parse(localStorage.getItem(this.STORAGE_CODES) || '[]');
    const used = parseInt(localStorage.getItem('misty_codes_used') || '0');
    const generated = codes.length + used;
    return { codes, total: generated, used, remaining: codes.length };
  },

  // 管理员：重置所有数据
  adminReset() {
    localStorage.removeItem(this.STORAGE_CASES);
    localStorage.removeItem(this.STORAGE_UNLOCKED);
    localStorage.removeItem(this.STORAGE_CODES);
    // 保留高分记录
  },

  // ---------- 渲染组件 ----------
  renderMonetizationPanel() {
    const unlocked = this.isPremiumUnlocked();
    const remaining = this.remainingFree();
    const played = this.getCasesPlayed();
    const highScore = this.getHighScore();
    const totalGames = this.getTotalGames();

    let upgradeHtml = '';
    if (!unlocked) {
      upgradeHtml = `
        <div class="monet-card upgrade-card">
          <div class="monet-card-icon">🔓</div>
          <div class="monet-card-body">
            <h4>解锁高级版</h4>
            <p>已免费体验 ${played}/${this.FREE_CASE_LIMIT} 个案件。升级后无限畅玩！</p>
            <div class="upgrade-actions">
              <button class="btn-monet btn-redeem" data-action="show-redeem">输入激活码</button>
            </div>
          </div>
        </div>`;
    } else {
      upgradeHtml = `
        <div class="monet-card premium-card">
          <div class="monet-card-icon">👑</div>
          <div class="monet-card-body">
            <h4>高级版会员</h4>
            <p>感谢你的支持！案件数量无限制。</p>
            <span class="premium-badge">已解锁 ✓</span>
          </div>
        </div>`;
    }

    return `
      <div class="monetization-panel">
        <div class="panel-header">
          <h3>💎 支持与解锁</h3>
        </div>
        ${upgradeHtml}
        <div class="monet-card donate-card">
          <div class="monet-card-icon">☕</div>
          <div class="monet-card-body">
            <h4>请我喝杯咖啡</h4>
            <p>如果喜欢这个游戏，可以打赏支持我继续创作更多案件！</p>
            <button class="btn-monet btn-donate" data-action="show-donate">❤️ 打赏支持</button>
          </div>
        </div>
        <div class="monet-card custom-card">
          <div class="monet-card-icon">🎮</div>
          <div class="monet-card-body">
            <h4>定制你的游戏</h4>
            <p>想要专属的侦探游戏？我可以为你定制任何题材的互动探案游戏！</p>
            <button class="btn-monet btn-custom" data-action="show-custom">📩 联系定制</button>
          </div>
        </div>
        ${this._renderStats(highScore, totalGames)}
      </div>`;
  },

  _renderStats(highScore, totalGames) {
    return `
      <div class="monet-card stats-card">
        <div class="monet-card-icon">📊</div>
        <div class="monet-card-body">
          <h4>游戏统计</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">${totalGames}</span>
              <span class="stat-label">总案件数</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${highScore}</span>
              <span class="stat-label">最高评分</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">${this.getAverageScore()}</span>
              <span class="stat-label">平均评分</span>
            </div>
          </div>
        </div>
      </div>`;
  },

  showRedeemModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content redeem-modal">
        <div class="modal-header">
          <h3>🔓 输入激活码</h3>
          <button class="btn-close" id="close-redeem">&times;</button>
        </div>
        <p class="redeem-hint">购买了激活码？在这里输入即可解锁高级版，无限畅玩所有案件。</p>
        <div class="redeem-input-group">
          <input type="text" id="redeem-input" class="redeem-input" placeholder="输入激活码，如 MISTY-VIP-2026-X" maxlength="30" autocomplete="off">
          <button class="btn-primary" id="redeem-btn">激活</button>
        </div>
        <div id="redeem-result" class="redeem-result"></div>
        <div class="redeem-footer">
          <p>还没有激活码？</p>
          <button class="btn-secondary" id="get-code-btn">获取激活码</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#redeem-input');
    const btn = overlay.querySelector('#redeem-btn');
    const result = overlay.querySelector('#redeem-result');
    const close = overlay.querySelector('#close-redeem');

    const doRedeem = () => {
      const res = this.redeemCode(input.value);
      result.textContent = res.message;
      result.className = 'redeem-result ' + (res.success ? 'result-success' : 'result-error');
      if (res.success) {
        btn.disabled = true;
        input.disabled = true;
        setTimeout(() => { overlay.remove(); UI.renderMenu(); }, 2000);
      }
    };

    btn.addEventListener('click', doRedeem);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRedeem(); });
    close.addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    // 获取激活码按钮
    overlay.querySelector('#get-code-btn').addEventListener('click', () => {
      overlay.remove();
      this.showDonateModal();
    });

    setTimeout(() => input.focus(), 100);
  },

  showDonateModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content donate-modal">
        <div class="modal-header">
          <h3>☕ 打赏支持</h3>
          <button class="btn-close" id="close-donate">&times;</button>
        </div>
        <p class="donate-hint">如果这个游戏给你带来了乐趣，欢迎打赏支持我继续开发更多精彩案件！</p>
        <div class="qr-section">
          <div class="qr-placeholder">
            <div class="qr-icon">💳</div>
            <p>微信支付</p>
            <div class="qr-box" id="qr-wechat">
              <span class="qr-placeholder-text">请替换为你的<br>微信收款二维码</span>
            </div>
          </div>
          <div class="qr-placeholder">
            <div class="qr-icon">💳</div>
            <p>支付宝</p>
            <div class="qr-box" id="qr-alipay">
              <span class="qr-placeholder-text">请替换为你的<br>支付宝收款二维码</span>
            </div>
          </div>
        </div>
        <div class="donate-thanks">
          <p>🙏 感谢每一位支持者！</p>
          <p class="donate-note">打赏后联系我，赠送专属激活码一枚 ✨</p>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="close-donate-btn">好的</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-donate, #close-donate-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    
    // 可替换二维码提示
    ['qr-wechat', 'qr-alipay'].forEach(id => {
      overlay.querySelector('#' + id).addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              this.innerHTML = `<img src="${ev.target.result}" class="qr-image" alt="收款码">`;
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      });
    });
  },

  showCustomServiceModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content custom-modal">
        <div class="modal-header">
          <h3>🎮 游戏定制服务</h3>
          <button class="btn-close" id="close-custom">&times;</button>
        </div>
        <div class="custom-body">
          <p>我可以为你量身打造专属的互动探案游戏！</p>
          <div class="custom-features">
            <div class="custom-feat">
              <span>🎯</span>
              <div>
                <strong>题材定制</strong>
                <p>古风探案、科幻推理、恐怖解谜、校园悬疑——你想要什么题材都可以</p>
              </div>
            </div>
            <div class="custom-feat">
              <span>📱</span>
              <div>
                <strong>多端适配</strong>
                <p>手机、电脑都能玩，支持微信小程序、H5网页、独立站部署</p>
              </div>
            </div>
            <div class="custom-feat">
              <span>🔧</span>
              <div>
                <strong>功能扩展</strong>
                <p>多人联机探案、在线对战、剧情分支、动效升级，应有尽有</p>
              </div>
            </div>
            <div class="custom-feat">
              <span>💼</span>
              <div>
                <strong>商业授权</strong>
                <p>品牌合作、线下活动、密室逃脱数字化，案例丰富</p>
              </div>
            </div>
          </div>
          <div class="custom-cta">
            <p>📩 联系我获取报价</p>
            <div class="contact-info">
              <span>微信: 请替换为你的微信号</span>
              <span>邮箱: your-email@example.com</span>
            </div>
            <p class="contact-note">（以上信息可在 monetization.js 中修改）</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" id="close-custom-btn">好的</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#close-custom, #close-custom-btn').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  // 游戏结束后显示打赏提示
  renderDonationPrompt() {
    return `
      <div class="donation-prompt">
        <div class="divider"></div>
        <div class="donation-content">
          <p>🎮 喜欢这个游戏吗？</p>
          <div class="donation-btns">
            <button class="btn-secondary" data-action="show-donate">☕ 打赏支持</button>
            <button class="btn-secondary" data-action="show-redeem">🔓 解锁高级版</button>
          </div>
        </div>
      </div>`;
  },

  // 管理员面板（双击标题触发）
  showAdminPanel() {
    const isAdmin = confirm('进入管理模式？');
    if (!isAdmin) return;

    const codeInfo = this.adminGetCodeList();
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content admin-modal">
        <div class="modal-header">
          <h3>🔐 管理面板</h3>
          <button class="btn-close" id="close-admin">&times;</button>
        </div>
        <div class="admin-body">
          <div class="admin-stat">
            <p>已生成激活码: <strong>${codeInfo.total}</strong></p>
            <p>已使用: <strong>${codeInfo.used}</strong></p>
            <p>剩余可用: <strong>${codeInfo.remaining}</strong></p>
            <p>免费体验次数: <strong>${this.FREE_CASE_LIMIT}次</strong></p>
            <p>已用免费次数: <strong>${this.getCasesPlayed()}</strong></p>
          </div>
          <div class="admin-btns">
            <button class="btn-primary" id="gen-codes-btn">生成 5 个激活码</button>
            <button class="btn-primary" id="show-codes-btn">查看所有激活码</button>
            <button class="btn-secondary" id="reset-cases-btn">重置免费计数</button>
          </div>
          <div id="codes-display" class="codes-display"></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelector('#gen-codes-btn').addEventListener('click', () => {
      const newCodes = this.adminGenerateCodes(5);
      const display = overlay.querySelector('#codes-display');
      display.innerHTML = `
        <p>✅ 新生成 5 个激活码（可复制出售）：</p>
        <div class="codes-list">
          ${newCodes.map(c => `<code>${c}</code>`).join('')}
        </div>
        <p class="codes-tip">💡 每个码可激活一个高级版账号</p>`;
    });

    overlay.querySelector('#show-codes-btn').addEventListener('click', () => {
      const info = this.adminGetCodeList();
      const display = overlay.querySelector('#codes-display');
      if (info.codes.length === 0) {
        display.innerHTML = '<p>暂无可用激活码，请先生成。</p>';
      } else {
        display.innerHTML = `
          <p>📋 剩余 ${info.codes.length} 个激活码：</p>
          <div class="codes-list">
            ${info.codes.map(c => `<code>${c}</code>`).join('')}
          </div>`;
      }
    });

    overlay.querySelector('#reset-cases-btn').addEventListener('click', () => {
      localStorage.removeItem(this.STORAGE_CASES);
      overlay.remove();
      UI.renderMenu();
    });

    overlay.querySelector('#close-admin').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  }
};

// 管理员功能暴露到全局（双击标题触发）
document.addEventListener('dblclick', (e) => {
  const title = e.target.closest('.menu-title');
  if (title) Monetization.showAdminPanel();
});
