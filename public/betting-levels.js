/**
 * ARCADE-PREMIUM - Sistema de Niveles de Apuesta
 * Diferentes mesas con buy-in, apuesta mínima y máxima
 */

const BETTING_LEVELS = [
  {
    nivel: 1,
    nombre_sala: "Escuela de Novatos",
    cuota_entrada_buy_in: 100,
    apuesta_minima: 2,
    apuesta_maxima: 40,
    perfil_jugador: "Principiante / Tutorial",
    color: "#00FF99"
  },
  {
    nivel: 2,
    nombre_sala: "Pub de la Esquina",
    cuota_entrada_buy_in: 500,
    apuesta_minima: 10,
    apuesta_maxima: 200,
    perfil_jugador: "Casual",
    color: "#00BFFF"
  },
  {
    nivel: 3,
    nombre_sala: "Sala Bronce",
    cuota_entrada_buy_in: 2500,
    apuesta_minima: 50,
    apuesta_maxima: 1000,
    perfil_jugador: "Casual Avanzado",
    color: "#CD7F32"
  },
  {
    nivel: 4,
    nombre_sala: "Club Plata",
    cuota_entrada_buy_in: 10000,
    apuesta_minima: 200,
    apuesta_maxima: 4000,
    perfil_jugador: "Jugador habitual",
    color: "#C0C0C0"
  },
  {
    nivel: 5,
    nombre_sala: "Casino Oro",
    cuota_entrada_buy_in: 50000,
    apuesta_minima: 1000,
    apuesta_maxima: 20000,
    perfil_jugador: "Jugador habitual",
    color: "#FFD700"
  },
  {
    nivel: 6,
    nombre_sala: "Salón Platino",
    cuota_entrada_buy_in: 250000,
    apuesta_minima: 5000,
    apuesta_maxima: 100000,
    perfil_jugador: "Competitivo",
    color: "#E5E4E2"
  },
  {
    nivel: 7,
    nombre_sala: "Liga Diamante",
    cuota_entrada_buy_in: 1000000,
    apuesta_minima: 20000,
    apuesta_maxima: 400000,
    perfil_jugador: "Avanzado (1M)",
    color: "#B9F2FF"
  },
  {
    nivel: 8,
    nombre_sala: "Club de Caballeros",
    cuota_entrada_buy_in: 5000000,
    apuesta_minima: 100000,
    apuesta_maxima: 2000000,
    perfil_jugador: "Avanzado / VIP (5M)",
    color: "#FF1493"
  },
  {
    nivel: 9,
    nombre_sala: "Salón de la Fama",
    cuota_entrada_buy_in: 25000000,
    apuesta_minima: 500000,
    apuesta_maxima: 10000000,
    perfil_jugador: "High Roller (25M)",
    color: "#FFD700"
  },
  {
    nivel: 10,
    nombre_sala: "Mesa VIP Imperial",
    cuota_entrada_buy_in: 100000000,
    apuesta_minima: 2000000,
    apuesta_maxima: 40000000,
    perfil_jugador: "High Roller (100M)",
    color: "#FF6347"
  }
];

class BettingSystem {
  constructor() {
    this.currentLevel = 1;
  }

  /**
   * Obtener el nivel de apuesta según los créditos del jugador
   */
  getLevelByBalance(balance) {
    for (let i = BETTING_LEVELS.length - 1; i >= 0; i--) {
      if (balance >= BETTING_LEVELS[i].cuota_entrada_buy_in) {
        return BETTING_LEVELS[i];
      }
    }
    return BETTING_LEVELS[0];
  }

  /**
   * Validar si una apuesta es válida para el nivel
   */
  isValidBet(bet, level) {
    return bet >= level.apuesta_minima && bet <= level.apuesta_maxima;
  }

  /**
   * Obtener todos los niveles disponibles
   */
  getAllLevels() {
    return BETTING_LEVELS;
  }

  /**
   * Mostrar modal de selección de mesa
   */
  showTableSelection(balance) {
    const currentLevel = this.getLevelByBalance(balance);
    
    const modal = document.createElement('div');
    modal.className = 'panel-modal open';
    modal.id = 'tableSelectionModal';
    modal.innerHTML = `
      <div class="panel-container" style="max-width:700px;">
        <span class="panel-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 style="font-family:'Orbitron'; color:#00FF99; margin-bottom:20px; letter-spacing:2px;">🎰 SELECCIONA TU MESA</h2>
        
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:15px; max-height:500px; overflow-y:auto;">
          ${BETTING_LEVELS.map(level => `
            <div style="background:rgba(${this.hexToRgb(level.color).join(',')}, 0.1); border:2px solid ${level.color}; border-radius:12px; padding:15px; cursor:pointer; transition:all 0.3s; ${balance >= level.cuota_entrada_buy_in ? 'opacity:1' : 'opacity:0.4; pointer-events:none'}" 
                 onclick="${balance >= level.cuota_entrada_buy_in ? `bettingSystem.selectTable(${level.nivel})` : ''}">
              <div style="font-family:'Orbitron'; font-weight:900; color:${level.color}; margin-bottom:8px; font-size:14px;">${level.nombre_sala}</div>
              <div style="font-size:11px; color:rgba(255,255,255,0.6); margin-bottom:10px;">${level.perfil_jugador}</div>
              <div style="display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.5);">
                <span>💰 Entrada: ${level.cuota_entrada_buy_in.toLocaleString()}</span>
              </div>
              <div style="display:flex; justify-content:space-between; font-size:10px; color:rgba(255,255,255,0.5); margin-top:5px;">
                <span>Apuesta: ${level.apuesta_minima.toLocaleString()} - ${level.apuesta_maxima.toLocaleString()}</span>
              </div>
              ${balance >= level.cuota_entrada_buy_in ? `<div style="margin-top:10px; color:#00FF99; font-size:10px; font-weight:bold;">✓ DISPONIBLE</div>` : `<div style="margin-top:10px; color:#FF3366; font-size:10px; font-weight:bold;">❌ BLOQUEADO</div>`}
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  /**
   * Convertir hex a RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 255, 153];
  }

  /**
   * Seleccionar una mesa
   */
  selectTable(nivel) {
    const level = BETTING_LEVELS.find(l => l.nivel === nivel);
    if (level) {
      console.log(`Seleccionada mesa: ${level.nombre_sala}`);
      document.getElementById('tableSelectionModal').remove();
      // Aquí se podría iniciar el juego con los parámetros de apuesta
    }
  }
}

const bettingSystem = new BettingSystem();
