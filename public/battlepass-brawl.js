/**
 * ARCADE-PREMIUM — Pase de Batalla Estilo Brawl Stars
 * Fila PREMIUM (arriba) y GRATIS (abajo) alineadas por número de nivel
 */

class BattlePassBrawl {
  constructor() {
    this.API_URL = '/api/progression';
    this.MAX_LEVELS = 100;
    this.XP_PER_LEVEL = 100;
    this.isVisible = false;
    this.hasPremium = false;
    this.currentLevel = 1;
    this.currentXP = 0;
    this._inject();
  }

  _inject() {
    // Estilos
    const style = document.createElement('style');
    style.innerHTML = `
      #bp-brawl-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.85);
        z-index: 9000;
        align-items: flex-end;
        justify-content: center;
        animation: bpFadeIn 0.25s ease;
      }
      #bp-brawl-overlay.open { display: flex; }
      @keyframes bpFadeIn { from { opacity: 0; } to { opacity: 1; } }

      #bp-brawl-panel {
        width: 100%;
        max-width: 1400px;
        background: linear-gradient(180deg, #1a0a2e 0%, #0d0d1a 100%);
        border-top: 3px solid #FFD700;
        border-radius: 20px 20px 0 0;
        padding: 20px 25px 25px;
        box-shadow: 0 -20px 60px rgba(0,0,0,0.8);
        animation: bpSlideUp 0.3s ease;
        max-height: 90vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      @keyframes bpSlideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }

      /* Header */
      .bp-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
      }
      .bp-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 18px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 2px;
        text-shadow: 0 0 15px rgba(255,215,0,0.5);
      }
      .bp-level-badge {
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 900;
        color: #00FF99;
        background: rgba(0,255,153,0.1);
        border: 1px solid rgba(0,255,153,0.3);
        padding: 6px 14px;
        border-radius: 20px;
      }
      .bp-premium-btn {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        color: #000;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: 900;
        padding: 8px 18px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        letter-spacing: 1px;
        box-shadow: 0 0 20px rgba(255,215,0,0.4);
        transition: all 0.3s;
      }
      .bp-premium-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(255,215,0,0.6); }
      .bp-premium-btn.active {
        background: linear-gradient(135deg, #a855f7, #7c3aed);
        color: #fff;
        box-shadow: 0 0 20px rgba(168,85,247,0.4);
      }
      .bp-close {
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.4);
        color: #EF4444;
        width: 32px; height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        font-weight: 900;
        transition: all 0.3s;
      }
      .bp-close:hover { background: rgba(239,68,68,0.3); }

      /* XP Bar */
      .bp-xp-wrap {
        position: relative;
        height: 10px;
        background: rgba(255,255,255,0.07);
        border-radius: 5px;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.1);
      }
      .bp-xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00FF99, #00BFFF);
        border-radius: 5px;
        transition: width 0.6s ease;
        box-shadow: 0 0 10px rgba(0,255,153,0.5);
      }
      .bp-xp-label {
        position: absolute;
        right: 8px;
        top: -18px;
        font-size: 10px;
        color: rgba(255,255,255,0.5);
        font-family: 'Orbitron', sans-serif;
      }

      /* Track container */
      .bp-tracks-wrap {
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow: hidden;
      }
      .bp-track-label {
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: 1px;
        padding: 0 4px;
      }
      .bp-track-label.premium { color: #a855f7; }
      .bp-track-label.free { color: #00FF99; }

      .bp-track-scroll {
        overflow-x: auto;
        overflow-y: hidden;
        padding: 4px 0 8px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,215,0,0.3) transparent;
      }
      .bp-track-scroll::-webkit-scrollbar { height: 4px; }
      .bp-track-scroll::-webkit-scrollbar-track { background: transparent; }
      .bp-track-scroll::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.3); border-radius: 2px; }

      .bp-track {
        display: flex;
        gap: 6px;
        min-width: max-content;
        padding: 0 10px;
      }

      /* Level node */
      .bp-node {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        width: 64px;
        cursor: pointer;
        transition: transform 0.2s;
      }
      .bp-node:hover { transform: scale(1.08); }

      .bp-node-box {
        width: 56px;
        height: 64px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        border: 2px solid rgba(255,255,255,0.1);
        background: rgba(255,255,255,0.04);
        position: relative;
        transition: all 0.3s;
        font-size: 22px;
      }

      /* Premium node */
      .bp-node.premium .bp-node-box {
        border-color: rgba(168,85,247,0.3);
        background: rgba(168,85,247,0.06);
      }
      .bp-node.premium.active .bp-node-box {
        border-color: #a855f7;
        background: rgba(168,85,247,0.2);
        box-shadow: 0 0 20px rgba(168,85,247,0.5);
      }
      .bp-node.premium.claimed .bp-node-box {
        border-color: #a855f7;
        background: rgba(168,85,247,0.15);
      }
      .bp-node.premium.locked .bp-node-box {
        opacity: 0.35;
        filter: grayscale(0.5);
      }
      .bp-node.premium.locked-premium .bp-node-box {
        opacity: 0.25;
        filter: grayscale(1);
      }

      /* Free node */
      .bp-node.free .bp-node-box {
        border-color: rgba(0,255,153,0.2);
        background: rgba(0,255,153,0.04);
      }
      .bp-node.free.active .bp-node-box {
        border-color: #00FF99;
        background: rgba(0,255,153,0.15);
        box-shadow: 0 0 20px rgba(0,255,153,0.4);
      }
      .bp-node.free.claimed .bp-node-box {
        border-color: #00FF99;
        background: rgba(0,255,153,0.1);
      }
      .bp-node.free.locked .bp-node-box {
        opacity: 0.35;
      }

      /* Check mark for claimed */
      .bp-node.claimed .bp-node-box::after {
        content: '✓';
        position: absolute;
        top: -6px;
        right: -6px;
        width: 16px;
        height: 16px;
        background: #00FF99;
        color: #000;
        font-size: 9px;
        font-weight: 900;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 16px;
        text-align: center;
      }
      .bp-node.premium.claimed .bp-node-box::after {
        background: #a855f7;
        color: #fff;
      }

      /* Current level pulse */
      .bp-node.active .bp-node-box {
        animation: bpPulse 1.5s ease-in-out infinite;
      }
      @keyframes bpPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }

      .bp-node-lvl {
        font-family: 'Orbitron', sans-serif;
        font-size: 9px;
        color: rgba(255,255,255,0.5);
        font-weight: 700;
      }
      .bp-node.active .bp-node-lvl { color: #FFD700; }

      .bp-reward-amount {
        font-family: 'Orbitron', sans-serif;
        font-size: 8px;
        color: rgba(255,255,255,0.6);
        text-align: center;
        line-height: 1.2;
      }

      /* Lock icon for premium locked */
      .bp-lock-icon {
        font-size: 14px;
        opacity: 0.6;
      }

      @media (max-width: 768px) {
        #bp-brawl-panel { padding: 15px; }
        .bp-node { width: 54px; }
        .bp-node-box { width: 48px; height: 56px; font-size: 18px; }
      }
    `;
    document.head.appendChild(style);

    // HTML
    const overlay = document.createElement('div');
    overlay.id = 'bp-brawl-overlay';
    overlay.innerHTML = `
      <div id="bp-brawl-panel">
        <div class="bp-header">
          <div class="bp-title">🏆 PASE DE BATALLA</div>
          <div class="bp-level-badge" id="bpLevelBadge">Nivel 1 / 100</div>
          <button class="bp-premium-btn" id="bpPremiumBtn" onclick="battlePassBrawl.togglePremium()">
            👑 ACTIVAR PREMIUM — 5000 🪙
          </button>
          <button class="bp-close" onclick="battlePassBrawl.hide()">✕</button>
        </div>

        <div style="position:relative; padding-top:20px;">
          <div class="bp-xp-label" id="bpXPLabel">0 / 100 XP</div>
          <div class="bp-xp-wrap">
            <div class="bp-xp-fill" id="bpXPFill" style="width:0%"></div>
          </div>
        </div>

        <div class="bp-tracks-wrap">
          <div class="bp-track-label premium">👑 PREMIUM</div>
          <div class="bp-track-scroll" id="bpScrollPremium">
            <div class="bp-track" id="bpTrackPremium"></div>
          </div>
          <div class="bp-track-label free">🎁 GRATIS</div>
          <div class="bp-track-scroll" id="bpScrollFree">
            <div class="bp-track" id="bpTrackFree"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Sincronizar scroll entre las dos filas
    const scrollP = overlay.querySelector('#bpScrollPremium');
    const scrollF = overlay.querySelector('#bpScrollFree');
    let syncing = false;
    scrollP.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      scrollF.scrollLeft = scrollP.scrollLeft;
      syncing = false;
    });
    scrollF.addEventListener('scroll', () => {
      if (syncing) return;
      syncing = true;
      scrollP.scrollLeft = scrollF.scrollLeft;
      syncing = false;
    });
  }

  show() {
    document.getElementById('bp-brawl-overlay').classList.add('open');
    this.isVisible = true;
  }

  hide() {
    document.getElementById('bp-brawl-overlay').classList.remove('open');
    this.isVisible = false;
  }

  async togglePremium() {
    if (this.hasPremium) return;
    const user = window.currentUser;
    if (!user) return;
    try {
      const res = await fetch(`${this.API_URL}/buy-battlepass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user })
      });
      if (res.ok) {
        this.hasPremium = true;
        document.getElementById('bpPremiumBtn').textContent = '👑 PREMIUM ACTIVADO';
        document.getElementById('bpPremiumBtn').classList.add('active');
        this._renderTracks(this.currentLevel);
        if (typeof updateHUD === 'function') updateHUD();
      } else {
        const err = await res.json();
        alert('❌ ' + (err.detail || 'Error al activar Premium'));
      }
    } catch(e) { alert('❌ Error de conexión'); }
  }

  async loadBattlePass(username) {
    if (!username) return;
    try {
      const res = await fetch(`${this.API_URL}/battlepass/${username}`);
      if (res.ok) {
        const data = await res.json();
        this.currentLevel = data.level || 1;
        this.currentXP = data.xp || 0;
        this.hasPremium = data.has_premium || false;

        // Actualizar UI
        document.getElementById('bpLevelBadge').innerText = `Nivel ${this.currentLevel} / 100`;
        document.getElementById('bpXPLabel').innerText = `${this.currentXP} / ${this.XP_PER_LEVEL} XP`;
        document.getElementById('bpXPFill').style.width = `${(this.currentXP / this.XP_PER_LEVEL) * 100}%`;

        const btn = document.getElementById('bpPremiumBtn');
        if (this.hasPremium) {
          btn.textContent = '👑 PREMIUM ACTIVADO';
          btn.classList.add('active');
        } else {
          btn.textContent = '👑 ACTIVAR PREMIUM — 5000 🪙';
          btn.classList.remove('active');
        }

        this._renderTracks(this.currentLevel);
        this.show();
        setTimeout(() => this._scrollToLevel(this.currentLevel), 150);
      }
    } catch(e) { console.error('Error cargando Pase:', e); }
  }

  _renderTracks(level) {
    const premiumTrack = document.getElementById('bpTrackPremium');
    const freeTrack = document.getElementById('bpTrackFree');

    let premiumHTML = '';
    let freeHTML = '';

    for (let i = 1; i <= this.MAX_LEVELS; i++) {
      const isActive = i === level;
      const isClaimed = i < level;
      const isLocked = i > level;

      const premiumReward = this._getPremiumReward(i);
      const freeReward = this._getFreeReward(i);

      // Nodo Premium
      let premiumState = isActive ? 'active' : isClaimed ? 'claimed' : isLocked ? 'locked' : '';
      if (!this.hasPremium && i > 0) premiumState += ' locked-premium';

      premiumHTML += `
        <div class="bp-node premium ${premiumState}" title="${premiumReward.label}">
          <div class="bp-node-box">
            ${!this.hasPremium ? `<span class="bp-lock-icon">🔒</span>` : premiumReward.icon}
            ${this.hasPremium ? `<div class="bp-reward-amount">${premiumReward.amount}</div>` : ''}
          </div>
          <div class="bp-node-lvl">${i}</div>
        </div>
      `;

      // Nodo Gratis
      const freeState = isActive ? 'active' : isClaimed ? 'claimed' : isLocked ? 'locked' : '';
      freeHTML += `
        <div class="bp-node free ${freeState}" title="${freeReward.label}">
          <div class="bp-node-box">
            ${freeReward.icon}
            <div class="bp-reward-amount">${freeReward.amount}</div>
          </div>
          <div class="bp-node-lvl">${i}</div>
        </div>
      `;
    }

    premiumTrack.innerHTML = premiumHTML;
    freeTrack.innerHTML = freeHTML;
  }

  _getPremiumReward(level) {
    if (level % 25 === 0) return { icon: '💎', amount: `${level * 500}🪙`, label: `Cofre Legendario: ${level * 500} fichas` };
    if (level % 10 === 0) return { icon: '🎯', amount: `x${1 + Math.floor(level/20)}`, label: `Multiplicador x${1 + Math.floor(level/20)}` };
    if (level % 5 === 0)  return { icon: '🔐', amount: 'SEGURO', label: 'Seguro de Racha' };
    if (level % 3 === 0)  return { icon: '🎰', amount: `${Math.ceil(level/10)} SPIN`, label: `${Math.ceil(level/10)} Tiradas Gratis` };
    return { icon: '🎁', amount: `${level * 100}🪙`, label: `${level * 100} fichas premium` };
  }

  _getFreeReward(level) {
    if (level % 20 === 0) return { icon: '🎫', amount: 'RASCA', label: 'Rasca y Gana' };
    if (level % 10 === 0) return { icon: '🎰', amount: `${Math.floor(level/10)} SPIN`, label: `${Math.floor(level/10)} Tiradas Gratis` };
    if (level % 5 === 0)  return { icon: '💰', amount: `${level * 50}🪙`, label: `${level * 50} fichas` };
    return { icon: '⭐', amount: '+XP', label: 'Punto de Progreso' };
  }

  _scrollToLevel(level) {
    const scrollP = document.getElementById('bpScrollPremium');
    const trackP = document.getElementById('bpTrackPremium');
    if (!scrollP || !trackP) return;
    const node = trackP.children[level - 1];
    if (node) {
      const scrollLeft = node.offsetLeft - scrollP.clientWidth / 2 + node.clientWidth / 2;
      scrollP.scrollLeft = Math.max(0, scrollLeft);
    }
  }

  // Llamado desde los juegos cuando se gana XP
  async addXP(username, amount) {
    try {
      await fetch(`${this.API_URL}/battlepass/${username}/xp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xp: amount })
      });
    } catch(e) {}
  }
}

const battlePassBrawl = new BattlePassBrawl();
