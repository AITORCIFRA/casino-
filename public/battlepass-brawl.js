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
    this.rubies = 0;
    this.claimedRewards = new Set();
    // No inyectar en el constructor, esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this._inject());
    } else {
      this._inject();
    }
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
      .bp-buy-level-btn {
        background: linear-gradient(135deg, #10b981, #047857);
        color: #fff;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: 900;
        padding: 8px 18px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        letter-spacing: 1px;
        box-shadow: 0 0 20px rgba(16,185,129,0.3);
        transition: all 0.3s;
      }
      .bp-buy-level-btn:hover { transform: scale(1.05); box-shadow: 0 0 30px rgba(16,185,129,0.5); }
      .bp-rubies-badge {
        font-family: 'Orbitron', sans-serif;
        font-size: 12px;
        font-weight: 900;
        color: #38bdf8;
        background: rgba(56,189,248,0.12);
        border: 1px solid rgba(56,189,248,0.3);
        padding: 6px 14px;
        border-radius: 20px;
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

      .bp-purchase-toast {
        position: fixed;
        right: 24px;
        bottom: 24px;
        z-index: 10010;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 18px 24px;
        border-radius: 24px;
        background: linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,121,0,0.95));
        box-shadow: 0 24px 80px rgba(255,160,0,0.25);
        color: #111;
        font-family: 'Orbitron', sans-serif;
        font-weight: 900;
        opacity: 0;
        transform: translateY(24px) scale(0.96);
        transition: opacity 0.35s ease, transform 0.35s ease;
        pointer-events: none;
      }
      .bp-purchase-toast.open {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .bp-toast-icon {
        font-size: 28px;
        animation: bpToastPulse 1.2s ease-in-out infinite;
      }
      .bp-toast-text {
        display: flex;
        flex-direction: column;
        gap: 2px;
        text-align: left;
      }
      .bp-toast-title {
        font-size: 14px;
        letter-spacing: 1px;
      }
      .bp-toast-subtitle {
        font-size: 11px;
        opacity: 0.85;
        color: rgba(17,17,17,0.9);
      }
      @keyframes bpToastPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }

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
      .bp-node.free.claimable .bp-node-box {
        border-color: #00FF99;
        background: rgba(0,255,153,0.12);
        transform: scale(1.03);
      }
      .bp-node.free.claimable:hover .bp-node-box {
        box-shadow: 0 0 18px rgba(0,255,153,0.35);
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
          <div class="bp-rubies-badge" id="bpRubiesBadge">Rubíes: 0</div>
          <button class="bp-premium-btn" id="bpPremiumBtn" onclick="battlePassBrawl.togglePremium()">
            👑 ACTIVAR PREMIUM — 5000 🪙
          </button>
          <button class="bp-buy-level-btn" id="bpBuyLevelBtn" onclick="battlePassBrawl.buyLevels()">
            💎 COMPRAR 1 NIVEL — 200 RUBÍ
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
    this._createPurchaseToast();

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
    let overlay = document.getElementById('bp-brawl-overlay');
    if (!overlay) {
      console.log("Overlay no encontrado, re-inyectando...");
      this._inject();
      overlay = document.getElementById('bp-brawl-overlay');
    }
    
    if (overlay) {
      overlay.classList.add('open');
      this.isVisible = true;
    } else {
      console.error("No se pudo mostrar el Pase de Batalla: Overlay ausente.");
    }
  }

  hide() {
    document.getElementById('bp-brawl-overlay').classList.remove('open');
    this.isVisible = false;
  }

  async buyLevels(levels = 1) {
    const username = window.currentUser || localStorage.getItem('arcade_user');
    if (!username) {
      alert('❌ Inicia sesión para comprar niveles');
      return;
    }

    // Animación de "cargando" en el botón
    const btn = document.getElementById('bpBuyLevelBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Comprando...';
      btn.style.opacity = '0.7';
    }

    try {
      const res = await fetch(`${this.API_URL}/battlepass/${username}/buy-levels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levels })
      });

      if (!res.ok) {
        const err = await res.json();
        this._showLevelErrorAnim(err.detail || 'Rubíes insuficientes');
        if (btn) { btn.disabled = false; btn.textContent = '💎 COMPRAR 1 NIVEL — 200 RUBÍ'; btn.style.opacity = '1'; }
        return;
      }

      const data = await res.json();
      const oldLevel = this.currentLevel;
      this.currentLevel = data.battlepass.level || this.currentLevel;
      this.currentXP = data.battlepass.xp || this.currentXP;
      this.rubies = data.new_rubies;

      // Actualizar badge de nivel con animación
      const badge = document.getElementById('bpLevelBadge');
      if (badge) {
        badge.style.transition = 'all 0.3s';
        badge.style.transform = 'scale(1.3)';
        badge.style.color = '#FFD700';
        badge.innerText = `Nivel ${this.currentLevel} / 100`;
        setTimeout(() => { badge.style.transform = 'scale(1)'; badge.style.color = ''; }, 400);
      }

      this._updateRubiesBadge();
      this._renderTracks(this.currentLevel);
      if (btn) { btn.disabled = false; btn.textContent = '💎 COMPRAR 1 NIVEL — 200 RUBÍ'; btn.style.opacity = '1'; }

      // 🎉 ANIMACIÓN LUDÓPATA DE NIVEL SUBIDO
      this._showLevelUpBoom(oldLevel, this.currentLevel);

    } catch (e) {
      console.log(e);
      alert('❌ Error de conexión');
      if (btn) { btn.disabled = false; btn.textContent = '💎 COMPRAR 1 NIVEL — 200 RUBÍ'; btn.style.opacity = '1'; }
    }
  }

  _showLevelUpBoom(oldLevel, newLevel) {
    // Crear overlay de celebración
    const boom = document.createElement('div');
    boom.id = 'bp-levelup-boom';
    boom.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      pointer-events: none; overflow: hidden;
    `;

    // Confeti
    const colors = ['#FFD700','#FF4500','#00FF99','#00BFFF','#FF69B4','#a855f7'];
    let confettiHTML = '';
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * 100;
      const delay = Math.random() * 0.6;
      const dur = 0.8 + Math.random() * 0.8;
      const size = 6 + Math.random() * 10;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const rot = Math.random() * 360;
      confettiHTML += `<div style="
        position:absolute; top:-20px; left:${x}%;
        width:${size}px; height:${size * 0.5}px;
        background:${color}; border-radius:2px;
        animation: bpConfettiFall ${dur}s ${delay}s ease-in forwards;
        transform: rotate(${rot}deg);
      "></div>`;
    }

    // Textos de motivación que rotan
    const messages = [
      '🔥 ¡NIVEL SUBIDO!',
      '⚡ ¡IMPARABLE!',
      '🏆 ¡ERES UN CRACK!',
      '💥 ¡OTRO NIVEL MÁS!',
      '🎯 ¡A POR EL SIGUIENTE!',
      '🚀 ¡AL INFINITO!',
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];

    boom.innerHTML = `
      <style>
        @keyframes bpConfettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bpBoomPop {
          0% { transform: scale(0.3) rotate(-5deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(2deg); opacity: 1; }
          80% { transform: scale(0.95) rotate(-1deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes bpLevelNum {
          0% { transform: translateY(40px); opacity: 0; }
          50% { transform: translateY(-10px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes bpPulseGlow {
          0%, 100% { text-shadow: 0 0 20px #FFD700, 0 0 40px #FFD700; }
          50% { text-shadow: 0 0 60px #FFD700, 0 0 100px #FFA500, 0 0 20px #fff; }
        }
        @keyframes bpShake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-8px) rotate(-2deg); }
          40% { transform: translateX(8px) rotate(2deg); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes bpCoinSpin {
          0% { transform: rotateY(0deg) scale(0); opacity:0; }
          30% { opacity: 1; }
          100% { transform: rotateY(720deg) scale(1.2) translateY(-60px); opacity:0; }
        }
      </style>
      ${confettiHTML}
      <div style="
        animation: bpBoomPop 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
        text-align: center;
        background: linear-gradient(135deg, rgba(20,0,40,0.97), rgba(10,10,30,0.97));
        border: 3px solid #FFD700;
        border-radius: 24px;
        padding: 40px 60px;
        box-shadow: 0 0 80px rgba(255,215,0,0.6), inset 0 0 40px rgba(255,215,0,0.05);
        position: relative; overflow: hidden;
      ">
        <!-- Destello de fondo -->
        <div style="
          position:absolute; inset:0; border-radius:21px;
          background: radial-gradient(ellipse at center, rgba(255,215,0,0.15) 0%, transparent 70%);
          animation: bpPulseGlow 0.8s ease-in-out 3;
        "></div>

        <div style="
          font-family:'Orbitron',sans-serif;
          font-size: clamp(14px, 3vw, 20px);
          color: #aaa; letter-spacing: 4px; margin-bottom: 8px;
        ">NIVEL DESBLOQUEADO</div>

        <div style="
          font-family:'Orbitron',sans-serif;
          font-size: clamp(60px, 12vw, 100px);
          font-weight: 900; color: #FFD700;
          line-height: 1;
          animation: bpLevelNum 0.4s 0.2s both, bpPulseGlow 1s 0.6s infinite;
          text-shadow: 0 0 30px #FFD700;
        ">${newLevel}</div>

        <div style="
          font-family:'Orbitron',sans-serif;
          font-size: clamp(16px, 3vw, 22px);
          font-weight:900; color:#fff;
          letter-spacing: 2px; margin-top: 10px;
          animation: bpShake 0.5s 0.6s both;
        ">${msg}</div>

        ${newLevel % 5 === 0 ? `<div style="
          margin-top:16px; padding: 8px 20px;
          background: linear-gradient(135deg,#FFD700,#FFA500);
          color:#000; font-family:'Orbitron'; font-weight:900;
          border-radius:20px; font-size:13px; letter-spacing:1px;
          animation: bpBoomPop 0.3s 0.8s both;
        ">🎁 ¡NIVEL ESPECIAL! RECOMPENSA DESBLOQUEADA</div>` : ''}

        <div style="
          margin-top:20px;
          font-size:28px;
          animation: bpCoinSpin 1s 0.3s both;
          display:inline-block;
        ">💎</div>
      </div>
    `;

    document.body.appendChild(boom);
    setTimeout(() => boom.remove(), 3000);
  }

  _showLevelErrorAnim(msg) {
    const err = document.createElement('div');
    err.style.cssText = `
      position:fixed; bottom:40px; left:50%; transform:translateX(-50%);
      background:linear-gradient(135deg,#7f1d1d,#450a0a);
      border:2px solid #EF4444; border-radius:16px;
      padding:16px 32px; z-index:99999;
      font-family:'Orbitron',sans-serif; color:#FCA5A5;
      font-size:14px; font-weight:900; letter-spacing:1px;
      box-shadow:0 0 30px rgba(239,68,68,0.4);
      animation:bpSlideUp 0.3s ease;
    `;
    err.innerHTML = `<style>@keyframes bpSlideUp{from{transform:translateX(-50%) translateY(40px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}</style>❌ ${msg}`;
    document.body.appendChild(err);
    setTimeout(() => err.remove(), 2500);
  }

  async claimReward(level) {
    const username = window.currentUser || localStorage.getItem('arcade_user');
    if (!username) {
      alert('❌ Inicia sesión para reclamar recompensas');
      return;
    }
    if (level > this.currentLevel) {
      alert('❌ Nivel no alcanzado');
      return;
    }
    const rewardKey = `free:${level}`;
    if (this.claimedRewards && this.claimedRewards.has(rewardKey)) {
      alert('✅ Recompensa ya reclamada');
      return;
    }

    try {
      const res = await fetch(`${this.API_URL}/battlepass/${encodeURIComponent(username)}/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, reward_type: 'free' })
      });
      const data = await res.json();
      if (!res.ok) {
        alert('❌ ' + (data.detail || 'No se pudo reclamar la recompensa'));
        return;
      }
      alert(`✅ Recompensa nivel ${level} reclamada`);
      this.currentLevel = data.battlepass.level || this.currentLevel;
      this.currentXP = data.battlepass.xp || this.currentXP;
      this.claimedRewards = new Set((data.battlepass.claimed_rewards || []).map(String));
      this._loadProfile(username);
      this._renderTracks(this.currentLevel);
      if (typeof updateHUD === 'function') updateHUD();
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'credits', value: data.new_balance }, '*');
      }
    } catch (e) {
      console.log('Error reclamando recompensa', e);
      alert('❌ Error de conexión al reclamar recompensa');
    }
  }

  async _loadProfile(username) {
    try {
      const res = await fetch(`${this.API_URL}/profile/${username}`);
      if (!res.ok) return;
      const profile = await res.json();
      this.rubies = profile.rubies || 0;
      this._updateRubiesBadge();
    } catch (e) {
      console.log('Error cargando perfil', e);
    }
  }

  _updateRubiesBadge() {
    const badge = document.getElementById('bpRubiesBadge');
    if (badge) {
      badge.textContent = `Rubíes: ${this.rubies || 0}`;
    }
  }

  async togglePremium() {
    if (this.hasPremium) return;
    const user = window.currentUser || localStorage.getItem('arcade_user');
    if (!user) {
      alert('❌ Inicia sesión para activar Premium');
      return;
    }
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
        this._showPurchaseToast();
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
        this.claimedRewards = new Set((data.claimed_rewards || []).map(String));
        this.rubies = 0;

        // Actualizar UI
        document.getElementById('bpLevelBadge').innerText = `Nivel ${this.currentLevel} / 100`;
        document.getElementById('bpXPLabel').innerText = `${this.currentXP} / ${this.XP_PER_LEVEL} XP`;
        document.getElementById('bpXPFill').style.width = `${(this.currentXP / this.XP_PER_LEVEL) * 100}%`;
        this._updateRubiesBadge();

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
        await this._loadProfile(username);
      }
    } catch (e) {
      console.error('Error cargando Battle Pass', e);
    }
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
      const claimKey = `free:${i}`;
      const isFreeClaimed = this.claimedRewards ? this.claimedRewards.has(claimKey) : false;
      const freeState = isActive ? 'active' : isFreeClaimed ? 'claimed' : isLocked ? 'locked' : '';
      const isClaimable = i <= level && !isFreeClaimed;
      const freeClasses = `${freeState}${isClaimable ? ' claimable' : ''}`;
      freeHTML += `
        <div class="bp-node free ${freeClasses}" title="${freeReward.label}" ${isClaimable ? `onclick="battlePassBrawl.claimReward(${i})"` : ''}>
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

  _createPurchaseToast() {
    const toast = document.createElement('div');
    toast.id = 'bp-purchase-toast';
    toast.className = 'bp-purchase-toast';
    toast.innerHTML = `
      <span class="bp-toast-icon">✨</span>
      <div class="bp-toast-text">
        <div class="bp-toast-title">¡Pase Premium comprado!</div>
        <div class="bp-toast-subtitle">Has desbloqueado el modo Oro del pase.</div>
      </div>
    `;
    document.body.appendChild(toast);
  }

  _showPurchaseToast() {
    const toast = document.getElementById('bp-purchase-toast');
    if (!toast) return;
    toast.classList.add('open');
    setTimeout(() => toast.classList.remove('open'), 3200);
  }
}

// Instanciar cuando el DOM esté listo
function _initBattlePassBrawl() {
  if (window.battlePassBrawl) return;
  console.log("Initializing BattlePassBrawl...");
  const bp = new BattlePassBrawl();
  window.battlePassBrawl = bp;
}

// Inicialización inmediata para evitar problemas de carga
_initBattlePassBrawl();

// Backup por si el DOM no estaba listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _initBattlePassBrawl);
}