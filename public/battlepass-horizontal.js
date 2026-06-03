/**
 * ARCADE-PREMIUM - Pase de Batalla Horizontal (Trophy Road Style)
 * 100 niveles con scroll lateral
 */

class BattlePassHorizontal {
  constructor() {
    this.API_URL = '/api/progression';
    this.MAX_LEVELS = 100;
    this.XP_PER_LEVEL = 100;
    this.createHorizontalBar();
  }

  createHorizontalBar() {
    const bar = document.createElement('div');
    bar.id = 'battlepass-horizontal';
    bar.innerHTML = `
      <div class="bp-h-container">
        <div class="bp-h-header">
          <div class="bp-h-title">🏆 PASE DE BATALLA</div>
          <div class="bp-h-level-info">
            <span id="bpHLevel">Nivel 1</span> / 100
          </div>
        </div>
        
        <div class="bp-h-xp-bar">
          <div class="bp-h-xp-fill" id="bpHXPFill" style="width: 0%"></div>
          <div class="bp-h-xp-text" id="bpHXPText">0 / 100 XP</div>
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
        background: linear-gradient(180deg, rgba(0,0,0,0.8), rgba(0,0,0,0.95));
        border-top: 2px solid rgba(255,215,0,0.4);
        padding: 15px;
        z-index: 99;
        font-family: 'Orbitron', sans-serif;
        box-shadow: 0 -10px 30px rgba(0,0,0,0.5);
      }
      
      .bp-h-container {
        max-width: 1400px;
        margin: 0 auto;
      }
      
      .bp-h-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
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
        min-width: 60px;
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
        font-size: 11px;
        color: rgba(255,255,255,0.7);
      }
      
      .bp-h-reward-icon {
        font-size: 16px;
        height: 16px;
      }
      
      .bp-h-level.locked .bp-h-level-circle {
        opacity: 0.5;
      }
      
      /* Ajustar el lobby para la barra horizontal */
      #lobbyScreen {
        margin-bottom: 180px;
      }
      
      @media (max-width: 768px) {
        #battlepass-horizontal {
          padding: 10px;
        }
        
        .bp-h-level {
          min-width: 45px;
        }
        
        .bp-h-level-circle {
          width: 40px;
          height: 40px;
          font-size: 10px;
        }
        
        .bp-h-reward-icon {
          font-size: 12px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(bar);
  }

  /**
   * Cargar datos del Pase de Batalla
   */
  async loadBattlePass(username) {
    try {
      const res = await fetch(`${this.API_URL}/battlepass/${username}`);
      if (res.ok) {
        const data = await res.json();
        this.renderBattlePass(data);
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
    
    // Generar niveles
    const track = document.getElementById('bpHTrack');
    track.innerHTML = Array(this.MAX_LEVELS).fill(0).map((_, i) => {
      const lvl = i + 1;
      const isActive = lvl === level;
      const isClaimed = lvl < level;
      const isLocked = lvl > level;
      const reward = this.getReward(lvl);
      
      return `
        <div class="bp-h-level ${isActive ? 'active' : ''} ${isClaimed ? 'claimed' : ''} ${isLocked ? 'locked' : ''}" 
             title="${reward.text}">
          <div class="bp-h-level-circle">
            <div class="bp-h-reward-icon">${reward.icon}</div>
          </div>
          <div class="bp-h-level-number">${lvl}</div>
        </div>
      `;
    }).join('');
    
    // Auto-scroll al nivel actual
    setTimeout(() => this.scrollToLevel(level), 100);
  }

  /**
   * Obtener recompensa por nivel
   */
  getReward(level) {
    if (level % 20 === 0) return { icon: '🎫', text: 'Rasca y Gana' };
    if (level % 10 === 0) return { icon: '🎰', text: `${Math.floor(level / 10)} Tiradas` };
    if (level % 5 === 0) return { icon: '💰', text: `${level * 100} Fichas` };
    return { icon: '⭐', text: '+50 XP' };
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
