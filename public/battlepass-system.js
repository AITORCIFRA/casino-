/**
 * ARCADE-PREMIUM - Sistema de Pase de Batalla
 * Rasca y Gana con premios millonarios + Tiradas Gratis
 */

class BattlePassSystem {
  constructor() {
    this.API_URL = '/api/progression';
    this.PASS_PRICE = 5; // 5 euros
    this.SCRATCH_PRIZES = [
      { probability: 0.70, prize: 0, label: 'NADA' },
      { probability: 0.15, prize: 2500000, label: '2.5M' },
      { probability: 0.08, prize: 500000000, label: '500M' },
      { probability: 0.05, prize: 1000000000, label: '1B' },
      { probability: 0.015, prize: 2000000000, label: '2B' },
      { probability: 0.005, prize: 10000000000, label: '10B' }
    ];
  }

  /**
   * Abre el modal del Pase de Batalla
   */
  async openBattlePassModal(username) {
    const modal = document.getElementById('battlepassModal');
    if (!modal) this.createBattlePassModal();
    
    const res = await fetch(`${this.API_URL}/battlepass/${username}`);
    if (res.ok) {
      const data = await res.json();
      this.renderBattlePass(data, username);
      document.getElementById('battlepassModal').classList.add('open');
    }
  }

  /**
   * Crea el modal del Pase de Batalla si no existe
   */
  createBattlePassModal() {
    const modal = document.createElement('div');
    modal.id = 'battlepassModal';
    modal.className = 'panel-modal';
    modal.innerHTML = `
      <div class="panel-container">
        <span class="panel-close" onclick="battlePass.closeBattlePass()">&times;</span>
        <h2 style="font-family:'Orbitron'; color:#FFD700; margin-bottom:20px;">🎫 PASE DE BATALLA PREMIUM</h2>
        
        <div id="battlepassContent" style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
          <!-- Izquierda: Info del Pase -->
          <div>
            <div style="background:rgba(255,215,0,0.1); padding:20px; border-radius:15px; border:2px solid rgba(255,215,0,0.3); margin-bottom:15px;">
              <div style="font-family:'Orbitron'; font-size:14px; color:#FFD700; margin-bottom:10px;">📊 PROGRESO</div>
              <div id="bpLevel" style="font-size:24px; font-weight:bold; color:#00FF99;">Nivel 1</div>
              <div id="bpXP" style="font-size:12px; color:rgba(255,255,255,0.6); margin-top:5px;">XP: 0/100</div>
              <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:4px; margin-top:10px; overflow:hidden;">
                <div id="bpXPBar" style="height:100%; background:linear-gradient(90deg,#00FF99,#00BFFF); width:0%; transition:width 0.3s;"></div>
              </div>
            </div>
            
            <div style="background:rgba(0,255,153,0.1); padding:20px; border-radius:15px; border:2px solid rgba(0,255,153,0.3);">
              <div style="font-family:'Orbitron'; font-size:14px; color:#00FF99; margin-bottom:15px;">🎁 RECOMPENSAS</div>
              <div id="bpRewards" style="display:flex; flex-direction:column; gap:8px; max-height:200px; overflow-y:auto;"></div>
            </div>
          </div>
          
          <!-- Derecha: Rasca y Gana + Tiradas Gratis -->
          <div>
            <div style="background:rgba(255,100,100,0.1); padding:20px; border-radius:15px; border:2px solid rgba(255,100,100,0.3); margin-bottom:15px;">
              <div style="font-family:'Orbitron'; font-size:14px; color:#FF6464; margin-bottom:15px;">🎰 RASCA Y GANA</div>
              <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:15px;">
                ${Array.from({length:9}, (_, i) => `
                  <div class="scratch-card" data-index="${i}" onclick="battlePass.revealScratch(${i})" style="
                    background:linear-gradient(135deg,#FFD700,#FFA500);
                    padding:20px;
                    border-radius:10px;
                    text-align:center;
                    cursor:pointer;
                    font-weight:bold;
                    font-size:24px;
                    transition:all 0.3s;
                    border:2px solid rgba(255,255,255,0.3);
                  ">
                    <div style="font-size:32px;">🎫</div>
                    <div style="font-size:10px; margin-top:5px; color:rgba(0,0,0,0.6);">RASCA</div>
                  </div>
                `).join('')}
              </div>
              <button onclick="battlePass.buyBattlePass()" style="width:100%; background:linear-gradient(135deg,#FFD700,#FFA500); color:#000; border:none; padding:12px; border-radius:10px; font-family:'Orbitron'; font-weight:900; cursor:pointer; font-size:14px;">
                💰 COMPRAR PASE (5€)
              </button>
            </div>
            
            <div style="background:rgba(100,200,255,0.1); padding:20px; border-radius:15px; border:2px solid rgba(100,200,255,0.3);">
              <div style="font-family:'Orbitron'; font-size:14px; color:#64C8FF; margin-bottom:10px;">🎲 TIRADAS GRATIS</div>
              <div id="freeSpins" style="font-size:32px; font-weight:bold; color:#00FF99; text-align:center; margin:15px 0;">0</div>
              <button onclick="battlePass.useFreeSpins()" style="width:100%; background:linear-gradient(135deg,#00BFFF,#00FF99); color:#000; border:none; padding:12px; border-radius:10px; font-family:'Orbitron'; font-weight:900; cursor:pointer; font-size:12px;">
                ▶ USAR EN SLOTS
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Renderiza el contenido del Pase de Batalla
   */
  renderBattlePass(data, username) {
    document.getElementById('bpLevel').innerText = `Nivel ${data.level}`;
    document.getElementById('bpXP').innerText = `XP: ${data.xp}/100`;
    document.getElementById('bpXPBar').style.width = `${(data.xp / 100) * 100}%`;
    
    // Mostrar recompensas
    const rewards = [
      { level: 1, reward: '100 fichas' },
      { level: 5, reward: '500 fichas' },
      { level: 10, reward: '5 tiradas gratis' },
      { level: 15, reward: '1000 fichas' },
      { level: 20, reward: '10 tiradas gratis' }
    ];
    
    document.getElementById('bpRewards').innerHTML = rewards.map(r => `
      <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:12px;">Nivel ${r.level}</span>
        <span style="color:#00FF99; font-weight:bold;">${r.reward}</span>
        <span style="color:${data.level >= r.level ? '#00FF99' : '#666'};">✓</span>
      </div>
    `).join('');
    
    document.getElementById('freeSpins').innerText = data.free_spins || 0;
  }

  /**
   * Revela una tarjeta de rasca y gana
   */
  revealScratch(index) {
    const cards = document.querySelectorAll('.scratch-card');
    const card = cards[index];
    if (card.classList.contains('revealed')) return;
    
    const prize = this.generatePrize();
    card.classList.add('revealed');
    card.style.background = prize.prize > 0 ? 'linear-gradient(135deg,#00FF99,#00BFFF)' : 'linear-gradient(135deg,#666,#333)';
    card.innerHTML = `
      <div style="font-size:12px; color:${prize.prize > 0 ? '#000' : '#999'}; font-weight:bold;">
        ${prize.label}
      </div>
      <div style="font-size:24px; margin-top:5px;">
        ${prize.prize > 0 ? '🎉' : '❌'}
      </div>
    `;
    
    if (prize.prize > 0) {
      this.claimPrize(prize.prize);
    }
  }

  /**
   * Genera un premio basado en probabilidades
   */
  generatePrize() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const item of this.SCRATCH_PRIZES) {
      cumulative += item.probability;
      if (rand <= cumulative) return item;
    }
    
    return this.SCRATCH_PRIZES[0];
  }

  /**
   * Reclama un premio
   */
  async claimPrize(amount) {
    const username = localStorage.getItem('arcade_user');
    const res = await fetch(`${this.API_URL}/claim-scratch-prize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, amount })
    });
    
    if (res.ok) {
      const data = await res.json();
      // Actualizar saldo en el lobby
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'credits', value: data.new_balance }, '*');
      }
    }
  }

  /**
   * Compra el Pase de Batalla
   */
  async buyBattlePass() {
    const username = localStorage.getItem('arcade_user');
    const res = await fetch(`${this.API_URL}/buy-battlepass`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    
    if (res.ok) {
      alert('¡Pase de Batalla comprado! Ahora puedes rascar y ganar.');
      this.openBattlePassModal(username);
    } else {
      alert('No tienes suficientes fichas.');
    }
  }

  /**
   * Usa tiradas gratis en las slots
   */
  useFreeSpins() {
    const username = localStorage.getItem('arcade_user');
    localStorage.setItem('free_spins_active', '1');
    window.location.href = `/slots.html?u=${username}`;
  }

  closeBattlePass() {
    document.getElementById('battlepassModal').classList.remove('open');
  }
}

const battlePass = new BattlePassSystem();
