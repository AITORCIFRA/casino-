/**
 * ARCADE-PREMIUM - Pase de Batalla Estilo Brawl Stars
 * Filas simultáneas: Gratis (abajo) y Premium (arriba)
 */

class BattlePassBrawl {
  constructor() {
    this.API_URL = '/api/progression';
    this.MAX_LEVELS = 100;
    this.XP_PER_LEVEL = 100;
    this.isVisible = false;
    this.createBrawlStyleBar();
  }

  createBrawlStyleBar() {
    const bar = document.createElement('div');
    bar.id = 'battlepass-brawl';
    bar.style.display = 'none';
    bar.innerHTML = `
      <div class="bp-brawl-container">
        <div class="bp-brawl-header">
          <div class="bp-brawl-title">🏆 PASE DE BATALLA</div>
          <div class="bp-brawl-level-info">
            <span id="bpBLevel">Nivel 1</span> / 100
          </div>
          <button class="bp-brawl-close" onclick="battlePassBrawl.hide()">✕</button>
        </div>
        
        <div class="bp-brawl-xp-bar">
          <div class="bp-brawl-xp-fill" id="bpBXPFill" style="width: 0%"></div>
          <div class="bp-brawl-xp-text" id="bpBXPText">0 / 100 XP</div>
        </div>
        
        <div class="bp-brawl-dual-track">
          <div class="bp-brawl-track-section">
            <div class="bp-brawl-track-label">👑 PREMIUM</div>
            <div class="bp-brawl-track-wrapper">
              <div class="bp-brawl-track" id="bpBTrackPremium"></div>
            </div>
          </div>
          
          <div class="bp-brawl-track-section">
            <div class="bp-brawl-track-label">🎁 GRATIS</div>
            <div class="bp-brawl-track-wrapper">
              <div class="bp-brawl-track" id="bpBTrackFree"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.innerHTML = `
      #battlepass-brawl {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.95));
        border-top: 3px solid rgba(255,215,0,0.5);
        padding: 15px;
        z-index: 99;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 -15px 40px rgba(0,0,0,0.7);
        animation: slideUp 0.3s ease;
      }
      
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      
      .bp-brawl-container {
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .bp-brawl-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .bp-brawl-title {
        font-size: 14px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 1px;
      }
      
      .bp-brawl-level-info {
        font-size: 12px;
        color: #00FF99;
        font-weight: 900;
      }
      
      .bp-brawl-close {
        background: rgba(239,68,68,0.1);
        border: 1px solid rgba(239,68,68,0.3);
        color: #EF4444;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        cursor: pointer;
        font-weight: 900;
        transition: all 0.3s;
      }
      
      .bp-brawl-close:hover {
        background: rgba(239,68,68,0.2);
        box-shadow: 0 0 10px rgba(239,68,68,0.3);
      }
      
      .bp-brawl-xp-bar {
        height: 6px;
        background: rgba(0,255,153,0.1);
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid rgba(0,255,153,0.2);
        margin-bottom: 15px;
        position: relative;
      }
      
      .bp-brawl-xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00FF99, #00BFFF);
        transition: width 0.3s ease;
      }
      
      .bp-brawl-xp-text {
        position: absolute;
        right: 5px;
        top: -18px;
        font-size: 10px;
        color: rgba(255,255,255,0.6);
      }
      
      .bp-brawl-dual-track {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }
      
      .bp-brawl-track-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .bp-brawl-track-label {
        font-size: 11px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 0.5px;
      }
      
      .bp-brawl-track-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 5px;
      }
      
      .bp-brawl-track-wrapper::-webkit-scrollbar {
        height: 4px;
      }
      
      .bp-brawl-track-wrapper::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.05);
      }
      
      .bp-brawl-track-wrapper::-webkit-scrollbar-thumb {
        background: rgba(255,215,0,0.3);
        border-radius: 2px;
      }
      
      .bp-brawl-track {
        display: flex;
        gap: 8px;
        min-width: min-content;
        padding: 5px 0;
      }
      
      .bp-brawl-level {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: all 0.3s;
        min-width: 65px;
      }
      
      .bp-brawl-level-circle {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 900;
        font-size: 12px;
        border: 2px solid rgba(255,215,0,0.3);
        background: rgba(255,215,0,0.05);
        transition: all 0.3s;
      }
      
      .bp-brawl-level:hover .bp-brawl-level-circle {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(255,215,0,0.3);
      }
      
      .bp-brawl-level.active .bp-brawl-level-circle {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        border-color: #FFD700;
        box-shadow: 0 0 20px rgba(255,215,0,0.5);
        color: #000;
      }
      
      .bp-brawl-level.claimed .bp-brawl-level-circle {
        background: rgba(0,255,153,0.2);
        border-color: #00FF99;
        color: #00FF99;
      }
      
      .bp-brawl-level.locked .bp-brawl-level-circle {
        opacity: 0.4;
      }
      
      .bp-brawl-level-number {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
      }
      
      .bp-brawl-reward-icon {
        font-size: 18px;
        height: 18px;
      }
      
      @media (max-width: 768px) {
        .bp-brawl-dual-track {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(bar);
  }

  show() {
    document.getElementById('battlepass-brawl').style.display = 'block';
    this.isVisible = true;
  }

  hide() {
    document.getElementById('battlepass-brawl').style.display = 'none';
    this.isVisible = false;
  }

  async loadBattlePass(username) {
    try {
      const res = await fetch(`${this.API_URL}/battlepass/${username}`);
      if (res.ok) {
        const data = await res.json();
        this.currentData = data;
        this.renderBattlePass(data);
        this.show();
      }
    } catch(e) {
      console.log("Error cargando Pase");
    }
  }

  renderBattlePass(data) {
    const level = data.level || 1;
    const xp = data.xp || 0;
    
    document.getElementById('bpBLevel').innerText = `Nivel ${level}`;
    document.getElementById('bpBXPText').innerText = `${xp} / ${this.XP_PER_LEVEL} XP`;
    document.getElementById('bpBXPFill').style.width = `${(xp / this.XP_PER_LEVEL) * 100}%`;
    
    // Renderizar filas
    this.renderTrack('bpBTrackFree', level, false);
    this.renderTrack('bpBTrackPremium', level, true);
    
    setTimeout(() => this.scrollToLevel(level), 100);
  }

  renderTrack(trackId, level, isPremium) {
    const track = document.getElementById(trackId);
    
    track.innerHTML = Array(this.MAX_LEVELS).fill(0).map((_, i) => {
      const lvl = i + 1;
      const isActive = lvl === level;
      const isClaimed = lvl < level;
      const isLocked = lvl > level;
      const reward = this.getReward(lvl, isPremium);
      
      return `
        <div class="bp-brawl-level ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''}" 
             title="${reward.text}">
          <div class="bp-brawl-level-circle">
            <div class="bp-brawl-reward-icon">${reward.icon}</div>
          </div>
          <div class="bp-brawl-level-number">${lvl}</div>
        </div>
      `;
    }).join('');
  }

  getReward(level, isPremium) {
    if (isPremium) {
      if (level % 20 === 0) return { icon: '💎', text: 'Cofre Legendario' };
      if (level % 10 === 0) return { icon: '🎯', text: 'Multiplicador x2' };
      if (level % 5 === 0) return { icon: '🔐', text: 'Seguro de Racha' };
      return { icon: '🎁', text: 'Cupón Premium' };
    } else {
      if (level % 20 === 0) return { icon: '🎫', text: 'Rasca y Gana' };
      if (level % 10 === 0) return { icon: '🎰', text: `${Math.floor(level / 10)} Tiradas` };
      if (level % 5 === 0) return { icon: '💰', text: `${level * 50} Fichas` };
      return { icon: '⭐', text: 'Punto de Progreso' };
    }
  }

  scrollToLevel(level) {
    const trackFree = document.getElementById('bpBTrackFree');
    const trackPremium = document.getElementById('bpBTrackPremium');
    
    [trackFree, trackPremium].forEach(track => {
      if (track) {
        const wrapper = track.parentElement;
        const levelElement = track.children[level - 1];
        
        if (levelElement) {
          const scrollLeft = levelElement.offsetLeft - wrapper.clientWidth / 2 + levelElement.clientWidth / 2;
          wrapper.scrollLeft = scrollLeft;
        }
      }
    });
  }
}

const battlePassBrawl = new BattlePassBrawl();
