/**
 * ARCADE-PREMIUM - Pase de Batalla Horizontal (Trophy Road Style)
 * Gratis vs Premium con recompensas diferenciales
 */

class BattlePassHorizontal {
  constructor() {
    this.API_URL = '/api/progression';
    this.MAX_LEVELS = 100;
    this.XP_PER_LEVEL = 100;
    this.isVisible = false;
    this.createHorizontalBar();
  }

  createHorizontalBar() {
    const bar = document.createElement('div');
    bar.id = 'battlepass-horizontal';
    bar.style.display = 'none'; // Oculto por defecto
    bar.innerHTML = `
      <div class="bp-h-container">
        <div class="bp-h-header">
          <div class="bp-h-title">🏆 PASE DE BATALLA</div>
          <div class="bp-h-level-info">
            <span id="bpHLevel">Nivel 1</span> / 100
          </div>
          <button class="bp-h-close" onclick="battlePassHorizontal.hide()">✕</button>
        </div>
        
        <div class="bp-h-xp-bar">
          <div class="bp-h-xp-fill" id="bpHXPFill" style="width: 0%"></div>
          <div class="bp-h-xp-text" id="bpHXPText">0 / 100 XP</div>
        </div>
        
        <div class="bp-h-tabs">
          <button class="bp-h-tab active" onclick="battlePassHorizontal.switchTab('free')">🎁 GRATIS</button>
          <button class="bp-h-tab" onclick="battlePassHorizontal.switchTab('premium')">👑 PREMIUM</button>
        </div>
        
        <div class="bp-h-track-wrapper">
          <div class="bp-h-track" id="bpHTrack">
            <!-- Se generarán dinámicamente -->
          </div>
        </div>
      </div>
    `;
    
    const style = document.createElement('style');
    style.innerHTML = `
      #battlepass-horizontal {
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
      
      .bp-h-container {
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .bp-h-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
      }
      
      .bp-h-title {
        font-size: 14px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 1px;
      }
      
      .bp-h-level-info {
        font-size: 12px;
        color: #00FF99;
        font-weight: 900;
      }
      
      .bp-h-close {
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
      
      .bp-h-close:hover {
        background: rgba(239,68,68,0.2);
        box-shadow: 0 0 10px rgba(239,68,68,0.3);
      }
      
      .bp-h-xp-bar {
        height: 6px;
        background: rgba(0,255,153,0.1);
        border-radius: 3px;
        overflow: hidden;
        border: 1px solid rgba(0,255,153,0.2);
        margin-bottom: 10px;
        position: relative;
      }
      
      .bp-h-xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00FF99, #00BFFF);
        transition: width 0.3s ease;
      }
      
      .bp-h-xp-text {
        position: absolute;
        right: 5px;
        top: -18px;
        font-size: 10px;
        color: rgba(255,255,255,0.6);
      }
      
      .bp-h-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
      }
      
      .bp-h-tab {
        padding: 6px 12px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px;
        color: rgba(255,255,255,0.6);
        font-family: 'Orbitron';
        font-weight: 900;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .bp-h-tab:hover {
        background: rgba(255,255,255,0.1);
      }
      
      .bp-h-tab.active {
        background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(0,255,153,0.2));
        border-color: rgba(255,215,0,0.4);
        color: #FFD700;
      }
      
      .bp-h-track-wrapper {
        overflow-x: auto;
        overflow-y: hidden;
        padding-bottom: 5px;
      }
      
      .bp-h-track-wrapper::-webkit-scrollbar {
        height: 4px;
      }
      
      .bp-h-track-wrapper::-webkit-scrollbar-track {
        background: rgba(255,255,255,0.05);
      }
      
      .bp-h-track-wrapper::-webkit-scrollbar-thumb {
        background: rgba(255,215,0,0.3);
        border-radius: 2px;
      }
      
      .bp-h-track {
        display: flex;
        gap: 8px;
        min-width: min-content;
        padding: 5px 0;
      }
      
      .bp-h-level {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        cursor: pointer;
        transition: all 0.3s;
        min-width: 65px;
      }
      
      .bp-h-level-circle {
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
        position: relative;
      }
      
      .bp-h-level:hover .bp-h-level-circle {
        transform: scale(1.1);
        box-shadow: 0 0 15px rgba(255,215,0,0.3);
      }
      
      .bp-h-level.active .bp-h-level-circle {
        background: linear-gradient(135deg, #FFD700, #FFA500);
        border-color: #FFD700;
        box-shadow: 0 0 20px rgba(255,215,0,0.5);
        color: #000;
      }
      
      .bp-h-level.claimed .bp-h-level-circle {
        background: rgba(0,255,153,0.2);
        border-color: #00FF99;
        color: #00FF99;
      }
      
      .bp-h-level-number {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
      }
      
      .bp-h-reward-icon {
        font-size: 18px;
        height: 18px;
      }
      
      .bp-h-level.locked .bp-h-level-circle {
        opacity: 0.4;
      }
      
      .bp-h-level.premium .bp-h-level-circle {
        border-color: rgba(168,85,247,0.5);
        background: rgba(168,85,247,0.1);
      }
      
      .bp-h-level.premium.active .bp-h-level-circle {
        background: linear-gradient(135deg, #A855F7, #D946EF);
        border-color: #A855F7;
        box-shadow: 0 0 20px rgba(168,85,247,0.5);
      }
      
      @media (max-width: 768px) {
        #battlepass-horizontal {
          padding: 10px;
        }
        
        .bp-h-level {
          min-width: 50px;
        }
        
        .bp-h-level-circle {
          width: 40px;
          height: 40px;
          font-size: 10px;
        }
        
        .bp-h-reward-icon {
          font-size: 14px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(bar);
  }

  /**
   * Mostrar el Pase
   */
  show() {
    document.getElementById('battlepass-horizontal').style.display = 'block';
    this.isVisible = true;
  }

  /**
   * Ocultar el Pase
   */
  hide() {
    document.getElementById('battlepass-horizontal').style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Cambiar entre tabs (Gratis/Premium)
   */
  switchTab(tab) {
    document.querySelectorAll('.bp-h-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Guardar tab activo
    this.activeTab = tab;
    this.renderTrack();
  }

  /**
   * Cargar datos del Pase de Batalla
   */
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

  /**
   * Renderizar el Pase de Batalla
   */
  renderBattlePass(data) {
    const level = data.level || 1;
    const xp = data.xp || 0;
    
    document.getElementById('bpHLevel').innerText = `Nivel ${level}`;
    document.getElementById('bpHXPText').innerText = `${xp} / ${this.XP_PER_LEVEL} XP`;
    document.getElementById('bpHXPFill').style.width = `${(xp / this.XP_PER_LEVEL) * 100}%`;
    
    this.activeTab = 'free';
    this.renderTrack();
    
    setTimeout(() => this.scrollToLevel(level), 100);
  }

  /**
   * Renderizar el track de niveles
   */
  renderTrack() {
    const track = document.getElementById('bpHTrack');
    const level = this.currentData?.level || 1;
    const isPremium = this.activeTab === 'premium';
    
    track.innerHTML = Array(this.MAX_LEVELS).fill(0).map((_, i) => {
      const lvl = i + 1;
      const isActive = lvl === level;
      const isClaimed = lvl < level;
      const isLocked = lvl > level;
      const reward = this.getReward(lvl, isPremium);
      
      return `
        <div class="bp-h-level ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''} ${isPremium ? 'premium' : ''}" 
             title="${reward.text}">
          <div class="bp-h-level-circle">
            <div class="bp-h-reward-icon">${reward.icon}</div>
          </div>
          <div class="bp-h-level-number">${lvl}</div>
        </div>
      `;
    }).join('');
  }

  /**
   * Obtener recompensa por nivel (Gratis vs Premium)
   */
  getReward(level, isPremium) {
    if (isPremium) {
      // Recompensas PREMIUM (más interesantes)
      if (level % 20 === 0) return { icon: '💎', text: 'Cofre Legendario' };
      if (level % 10 === 0) return { icon: '🎯', text: 'Multiplicador x2' };
      if (level % 5 === 0) return { icon: '🔐', text: 'Seguro de Racha' };
      return { icon: '🎁', text: 'Cupón Premium' };
    } else {
      // Recompensas GRATIS (básicas)
      if (level % 20 === 0) return { icon: '🎫', text: 'Rasca y Gana' };
      if (level % 10 === 0) return { icon: '🎰', text: `${Math.floor(level / 10)} Tiradas` };
      if (level % 5 === 0) return { icon: '💰', text: `${level * 50} Fichas` };
      return { icon: '⭐', text: 'Punto de Progreso' };
    }
  }

  /**
   * Auto-scroll al nivel actual
   */
  scrollToLevel(level) {
    const track = document.getElementById('bpHTrack');
    const wrapper = track.parentElement;
    const levelElement = track.children[level - 1];
    
    if (levelElement) {
      const scrollLeft = levelElement.offsetLeft - wrapper.clientWidth / 2 + levelElement.clientWidth / 2;
      wrapper.scrollLeft = scrollLeft;
    }
  }
}

// Inicializar
const battlePassHorizontal = new BattlePassHorizontal();
