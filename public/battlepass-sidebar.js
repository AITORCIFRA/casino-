/**
 * ARCADE-PREMIUM - Pase de Batalla Lateral (Brawl Stars Style)
 * 100 niveles con recompensas progresivas
 */

class BattlePassSidebar {
  constructor() {
    this.API_URL = '/api/progression';
    this.MAX_LEVELS = 100;
    this.XP_PER_LEVEL = 100;
    this.createSidebar();
  }

  createSidebar() {
    const sidebar = document.createElement('div');
    sidebar.id = 'battlepass-sidebar';
    sidebar.innerHTML = `
      <div class="bp-header">
        <div class="bp-title">PASE DE BATALLA</div>
        <div class="bp-level-display">
          <div class="bp-level-number" id="bpSideLevel">1</div>
          <div class="bp-level-text">/ 100</div>
        </div>
      </div>
      
      <div class="bp-xp-section">
        <div class="bp-xp-label">XP</div>
        <div class="bp-xp-bar">
          <div class="bp-xp-fill" id="bpSideXPBar" style="width: 0%"></div>
        </div>
        <div class="bp-xp-text" id="bpSideXPText">0 / 100</div>
      </div>
      
      <div class="bp-rewards-scroll" id="bpRewardsScroll">
        <!-- Se generarán dinámicamente -->
      </div>
      
      <div class="bp-footer">
        <button class="bp-info-btn" onclick="battlePassSidebar.toggleInfo()">ℹ️ INFO</button>
      </div>
    `;
    
    const style = document.createElement('style');
    style.innerHTML = `
      #battlepass-sidebar {
        position: fixed;
        right: 0;
        top: 0;
        width: 280px;
        height: 100vh;
        background: linear-gradient(135deg, rgba(255,215,0,0.05), rgba(0,255,153,0.05));
        border-left: 2px solid rgba(255,215,0,0.3);
        display: flex;
        flex-direction: column;
        z-index: 100;
        font-family: 'Orbitron', sans-serif;
        overflow: hidden;
      }
      
      .bp-header {
        padding: 15px;
        background: rgba(0,0,0,0.3);
        border-bottom: 1px solid rgba(255,215,0,0.2);
      }
      
      .bp-title {
        font-size: 14px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 1px;
        margin-bottom: 8px;
      }
      
      .bp-level-display {
        display: flex;
        align-items: baseline;
        gap: 5px;
      }
      
      .bp-level-number {
        font-size: 32px;
        font-weight: 900;
        color: #00FF99;
      }
      
      .bp-level-text {
        font-size: 12px;
        color: rgba(255,255,255,0.5);
      }
      
      .bp-xp-section {
        padding: 12px 15px;
        background: rgba(0,191,255,0.05);
        border-bottom: 1px solid rgba(0,191,255,0.2);
      }
      
      .bp-xp-label {
        font-size: 10px;
        color: #00BFFF;
        font-weight: 900;
        margin-bottom: 6px;
        letter-spacing: 1px;
      }
      
      .bp-xp-bar {
        height: 8px;
        background: rgba(0,255,153,0.1);
        border-radius: 4px;
        overflow: hidden;
        border: 1px solid rgba(0,255,153,0.2);
        margin-bottom: 4px;
      }
      
      .bp-xp-fill {
        height: 100%;
        background: linear-gradient(90deg, #00FF99, #00BFFF);
        transition: width 0.3s ease;
      }
      
      .bp-xp-text {
        font-size: 10px;
        color: rgba(255,255,255,0.6);
        text-align: right;
      }
      
      .bp-rewards-scroll {
        flex: 1;
        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .bp-reward-item {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: all 0.3s;
        font-size: 11px;
      }
      
      .bp-reward-item:hover {
        background: rgba(255,255,255,0.05);
        border-color: rgba(255,215,0,0.3);
      }
      
      .bp-reward-item.claimed {
        background: rgba(0,255,153,0.1);
        border-color: rgba(0,255,153,0.3);
      }
      
      .bp-reward-level {
        font-weight: 900;
        color: #FFD700;
        min-width: 30px;
        text-align: center;
      }
      
      .bp-reward-icon {
        font-size: 16px;
      }
      
      .bp-reward-text {
        flex: 1;
        color: rgba(255,255,255,0.8);
      }
      
      .bp-reward-check {
        color: #00FF99;
        font-weight: 900;
      }
      
      .bp-footer {
        padding: 10px;
        border-top: 1px solid rgba(255,255,255,0.1);
        background: rgba(0,0,0,0.2);
      }
      
      .bp-info-btn {
        width: 100%;
        padding: 8px;
        background: rgba(0,191,255,0.1);
        border: 1px solid rgba(0,191,255,0.3);
        color: #00BFFF;
        border-radius: 6px;
        font-family: 'Orbitron';
        font-weight: 900;
        font-size: 11px;
        cursor: pointer;
        transition: all 0.3s;
      }
      
      .bp-info-btn:hover {
        background: rgba(0,191,255,0.2);
        box-shadow: 0 0 10px rgba(0,191,255,0.3);
      }
      
      /* Ajustar el lobby para el sidebar */
      #lobbyScreen {
        margin-right: 280px;
      }
      
      @media (max-width: 1200px) {
        #battlepass-sidebar {
          width: 200px;
        }
        #lobbyScreen {
          margin-right: 200px;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(sidebar);
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
    
    document.getElementById('bpSideLevel').innerText = level;
    document.getElementById('bpSideXPText').innerText = `${xp} / ${this.XP_PER_LEVEL}`;
    document.getElementById('bpSideXPBar').style.width = `${(xp / this.XP_PER_LEVEL) * 100}%`;
    
    // Generar recompensas
    const rewards = this.generateRewards(level);
    const container = document.getElementById('bpRewardsScroll');
    container.innerHTML = rewards.map(r => `
      <div class="bp-reward-item ${r.claimed ? 'claimed' : ''}" onclick="battlePassSidebar.claimReward(${r.level})">
        <div class="bp-reward-level">${r.level}</div>
        <div class="bp-reward-icon">${r.icon}</div>
        <div class="bp-reward-text">${r.text}</div>
        <div class="bp-reward-check">${r.claimed ? '✓' : ''}</div>
      </div>
    `).join('');
  }

  /**
   * Generar recompensas para cada nivel
   */
  generateRewards(currentLevel) {
    const rewards = [];
    for (let i = 1; i <= this.MAX_LEVELS; i++) {
      let reward = {};
      reward.level = i;
      reward.claimed = i <= currentLevel;
      
      // Recompensas cada 5 niveles
      if (i % 5 === 0) {
        const fichas = i * 100;
        reward.icon = '💰';
        reward.text = `${fichas} fichas`;
      } else if (i % 10 === 0) {
        const spins = Math.floor(i / 10);
        reward.icon = '🎰';
        reward.text = `${spins} tiradas gratis`;
      } else if (i % 20 === 0) {
        reward.icon = '🎫';
        reward.text = 'Rasca y Gana';
      } else {
        reward.icon = '⭐';
        reward.text = `+50 XP`;
      }
      
      rewards.push(reward);
    }
    return rewards;
  }

  /**
   * Reclamar recompensa
   */
  async claimReward(level) {
    console.log(`Recompensa del nivel ${level} reclamada`);
  }

  /**
   * Toggle info
   */
  toggleInfo() {
    alert('🎫 PASE DE BATALLA\\n\\nSube de nivel jugando y gana recompensas:\\n- Fichas\\n- Tiradas gratis\\n- Rascas y Gana\\n\\n¡Alcanza el nivel 100!');
  }
}

// Inicializar
const battlePassSidebar = new BattlePassSidebar();
