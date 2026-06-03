/**
 * ARCADE-PREMIUM - Sistema de Pase de Batalla
 * Rasca y Gana con 3 números iguales + Tiradas Gratis
 */

class BattlePassSystem {
  constructor() {
    this.API_URL = '/api/progression';
    this.PASS_PRICE = 5000; // 5000 fichas = 5€
    this.SCRATCH_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    this.SCRATCH_MULTIPLIERS = {
      1: 1,
      2: 2,
      3: 5,
      4: 10,
      5: 25,
      6: 50,
      7: 100,
      8: 250,
      9: 500
    };
  }

  /**
   * Abre el modal del Pase de Batalla
   */
  async openBattlePassModal(username) {
    const modal = document.getElementById('battlepassModal');
    if (!modal) this.createBattlePassModal();
    
    try {
      const res = await fetch(`${this.API_URL}/battlepass/${username}`);
      if (res.ok) {
        const data = await res.json();
        this.renderBattlePass(data, username);
        document.getElementById('battlepassModal').classList.add('open');
      }
    } catch(e) {
      console.log("Error cargando Pase de Batalla");
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
      <div class="panel-container" style="max-width:900px; background:linear-gradient(135deg, rgba(255,215,0,0.05), rgba(0,255,153,0.05)); border:2px solid rgba(255,215,0,0.3); border-radius:20px; padding:30px;">
        <span class="panel-close" onclick="battlePass.closeBattlePass()" style="font-size:28px; cursor:pointer;">&times;</span>
        <h2 style="font-family:'Orbitron'; color:#FFD700; margin-bottom:20px; text-align:center; font-size:28px; letter-spacing:2px;">🎫 PASE DE BATALLA PREMIUM</h2>
        
        <div id="battlepassContent" style="display:grid; grid-template-columns:1fr 1fr; gap:30px;">
          <!-- Izquierda: Info del Pase -->
          <div>
            <div style="background:rgba(255,215,0,0.1); padding:20px; border-radius:15px; border:2px solid rgba(255,215,0,0.3); margin-bottom:15px;">
              <div style="font-family:'Orbitron'; color:#FFD700; font-weight:900; margin-bottom:10px;">NIVEL ACTUAL</div>
              <div id="bpLevel" style="font-size:32px; color:#00FF99; font-weight:900;">Nivel 1</div>
              <div style="margin-top:15px;">
                <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-bottom:5px;" id="bpXP">XP: 0/100</div>
                <div style="background:rgba(0,255,153,0.1); height:8px; border-radius:4px; overflow:hidden; border:1px solid rgba(0,255,153,0.3);">
                  <div id="bpXPBar" style="height:100%; background:linear-gradient(90deg, #00FF99, #00BFFF); width:0%; transition:width 0.3s;"></div>
                </div>
              </div>
            </div>
            
            <div style="background:rgba(0,255,153,0.05); padding:15px; border-radius:12px; border:1px solid rgba(0,255,153,0.2);">
              <div style="font-family:'Orbitron'; color:#00FF99; font-weight:900; margin-bottom:10px; font-size:14px;">TIRADAS GRATIS</div>
              <div id="freeSpins" style="font-size:28px; color:#FFD700; font-weight:900;">0</div>
            </div>
          </div>
          
          <!-- Derecha: Rasca y Gana -->
          <div>
            <div style="font-family:'Orbitron'; color:#00BFFF; font-weight:900; margin-bottom:15px; font-size:16px; letter-spacing:1px;">RASCA Y GANA</div>
            <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; margin-bottom:20px;" id="scratchCardsContainer">
              <!-- Se generarán dinámicamente -->
            </div>
            <button onclick="battlePass.playNewScratch()" style="width:100%; padding:12px; background:linear-gradient(135deg, #FFD700, #FFA500); color:#000; border:none; border-radius:10px; font-family:'Orbitron'; font-weight:900; cursor:pointer; font-size:14px; letter-spacing:1px;">NUEVO RASCA</button>
          </div>
        </div>
        
        <div style="margin-top:30px; padding-top:20px; border-top:1px solid rgba(255,255,255,0.1);">
          <div style="font-family:'Orbitron'; color:#00BFFF; font-weight:900; margin-bottom:15px; font-size:14px;">RECOMPENSAS POR NIVEL</div>
          <div id="bpRewards" style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px; max-height:150px; overflow-y:auto;">
            <!-- Se generarán dinámicamente -->
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    this.generateScratchCards();
  }

  /**
   * Genera las tarjetas de rasca y gana
   */
  generateScratchCards() {
    const container = document.getElementById('scratchCardsContainer');
    if (!container) return;
    
    container.innerHTML = Array(9).fill(0).map((_, i) => `
      <div class="scratch-card" data-index="${i}" onclick="battlePass.revealScratch(${i})" style="
        width:100%; aspect-ratio:1;
        background:linear-gradient(135deg, #FFD700, #FFA500);
        border:2px solid rgba(255,215,0,0.5);
        border-radius:12px;
        display:flex;
        align-items:center;
        justify-content:center;
        cursor:pointer;
        font-family:'Orbitron';
        font-weight:900;
        font-size:24px;
        color:#000;
        transition:all 0.3s;
        position:relative;
        overflow:hidden;
      ">
        <span style="position:relative; z-index:2; text-shadow:0 0 10px rgba(0,0,0,0.3);">?</span>
        <div class="scratch-shine" style="
          position:absolute;
          top:0; left:-100%;
          width:100%; height:100%;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation:shine 2s infinite;
        "></div>
      </div>
    `).join('');
    
    // Añadir animación de brillo
    if (!document.getElementById('scratch-shine-style')) {
      const style = document.createElement('style');
      style.id = 'scratch-shine-style';
      style.textContent = `
        @keyframes shine {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Renderiza el contenido del Pase de Batalla
   */
  renderBattlePass(data, username) {
    document.getElementById('bpLevel').innerText = `Nivel ${data.level || 1}`;
    document.getElementById('bpXP').innerText = `XP: ${data.xp || 0}/100`;
    document.getElementById('bpXPBar').style.width = `${((data.xp || 0) / 100) * 100}%`;
    
    // Mostrar recompensas
    const rewards = [
      { level: 1, reward: '100 fichas' },
      { level: 5, reward: '500 fichas' },
      { level: 10, reward: '5 tiradas gratis' },
      { level: 15, reward: '1000 fichas' },
      { level: 20, reward: '10 tiradas gratis' }
    ];
    
    document.getElementById('bpRewards').innerHTML = rewards.map(r => `
      <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
        <span>Nivel ${r.level}</span>
        <span style="color:#00FF99; font-weight:bold;">${r.reward}</span>
        <span style="color:${(data.level || 1) >= r.level ? '#00FF99' : '#666'};">✓</span>
      </div>
    `).join('');
    
    document.getElementById('freeSpins').innerText = data.free_spins || 0;
  }

  /**
   * Juega un nuevo rasca y gana
   */
  playNewScratch() {
    this.generateScratchCards();
  }

  /**
   * Revela una tarjeta de rasca y gana
   */
  revealScratch(index) {
    const cards = document.querySelectorAll('.scratch-card');
    const card = cards[index];
    if (card.classList.contains('revealed')) return;
    
    // Generar número aleatorio
    const number = this.SCRATCH_NUMBERS[Math.floor(Math.random() * this.SCRATCH_NUMBERS.length)];
    card.classList.add('revealed');
    card.style.background = 'linear-gradient(135deg, #00FF99, #00BFFF)';
    card.style.color = '#000';
    card.innerHTML = `<span style="position:relative; z-index:2; font-size:32px;">${number}</span>`;
    
    // Verificar si hay 3 números iguales
    setTimeout(() => this.checkWin(), 300);
  }

  /**
   * Verifica si hay 3 números iguales
   */
  checkWin() {
    const cards = document.querySelectorAll('.scratch-card.revealed');
    if (cards.length < 3) return;
    
    const numbers = Array.from(cards).map(c => {
      const text = c.innerText.trim();
      return parseInt(text);
    });
    
    // Buscar 3 números iguales
    for (let num of this.SCRATCH_NUMBERS) {
      const count = numbers.filter(n => n === num).length;
      if (count >= 3) {
        this.winScratch(num);
        return;
      }
    }
  }

  /**
   * Gana un rasca y gana
   */
  async winScratch(number) {
    const multiplier = this.SCRATCH_MULTIPLIERS[number] || 1;
    const betAmount = 50; // Apuesta base
    const winAmount = betAmount * multiplier;
    
    // Mostrar animación de victoria
    const modal = document.getElementById('battlepassModal');
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:fixed; top:0; left:0; right:0; bottom:0;
      background:rgba(0,0,0,0.8); z-index:9999;
      display:flex; align-items:center; justify-content:center;
    `;
    overlay.innerHTML = `
      <div style="
        text-align:center; font-family:'Orbitron'; color:#FFD700;
        font-size:48px; font-weight:900; letter-spacing:3px;
        animation:pulse 0.5s infinite;
      ">
        ¡GANASTE!<br><span style="font-size:36px; color:#00FF99;">+${winAmount} FICHAS</span>
      </div>
    `;
    document.body.appendChild(overlay);
    
    setTimeout(() => overlay.remove(), 2000);
    
    // Reclamar premio
    await this.claimPrize(winAmount);
  }

  /**
   * Reclama un premio
   */
  async claimPrize(amount) {
    const username = localStorage.getItem('arcade_user');
    try {
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
    } catch(e) {
      console.log("Error reclamando premio");
    }
  }

  /**
   * Compra el Pase de Batalla
   */
  async buyBattlePass() {
    const username = localStorage.getItem('arcade_user');
    try {
      const res = await fetch(`${this.API_URL}/buy-battlepass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (res.ok) {
        alert('¡Pase de Batalla comprado!');
        this.openBattlePassModal(username);
      } else {
        alert('No tienes suficientes fichas');
      }
    } catch(e) {
      console.log("Error comprando Pase");
    }
  }

  /**
   * Cierra el modal del Pase de Batalla
   */
  closeBattlePass() {
    const modal = document.getElementById('battlepassModal');
    if (modal) modal.classList.remove('open');
  }
}

// Inicializar el sistema
const battlePass = new BattlePassSystem();
