/**
 * ARCADE-PREMIUM — Lobby de Mesas con Cuotas de Entrada
 * Muestra 10 mesas por juego con personajes indicando jugadores activos
 */

class TableLobby {
  constructor() {
    this.API = '/api/tables';
    this.currentGame = null;
    this.currentGameFile = null;
    this.currentRoomId = null;
    this._inject();
  }

  _inject() {
    const style = document.createElement('style');
    style.innerHTML = `
      #tableLobbyOverlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.92);
        z-index: 8000;
        align-items: center;
        justify-content: center;
        animation: tlFadeIn 0.2s ease;
      }
      #tableLobbyOverlay.open { display: flex; }
      @keyframes tlFadeIn { from { opacity:0; } to { opacity:1; } }

      #tableLobbyPanel {
        width: 95%;
        max-width: 1100px;
        max-height: 90vh;
        background: linear-gradient(180deg, #0d0d1a 0%, #07070d 100%);
        border: 2px solid rgba(255,215,0,0.2);
        border-radius: 20px;
        padding: 25px;
        overflow-y: auto;
        animation: tlSlideIn 0.3s ease;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,215,0,0.3) transparent;
      }
      @keyframes tlSlideIn {
        from { transform: scale(0.9); opacity:0; }
        to   { transform: scale(1);   opacity:1; }
      }

      .tl-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.07);
        padding-bottom: 15px;
      }
      .tl-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 20px;
        font-weight: 900;
        color: #FFD700;
        letter-spacing: 2px;
      }
      .tl-balance-badge {
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        color: #00FF99;
        background: rgba(0,255,153,0.1);
        border: 1px solid rgba(0,255,153,0.3);
        padding: 6px 14px;
        border-radius: 20px;
      }
      .tl-close {
        background: rgba(239,68,68,0.15);
        border: 1px solid rgba(239,68,68,0.4);
        color: #EF4444;
        width: 34px; height: 34px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 16px;
        font-weight: 900;
        transition: all 0.2s;
      }
      .tl-close:hover { background: rgba(239,68,68,0.3); }

      .tl-auto-btn {
        background: linear-gradient(135deg, #00FF99, #00BFFF);
        color: #000;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: 900;
        padding: 8px 18px;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        letter-spacing: 1px;
        transition: all 0.2s;
      }
      .tl-auto-btn:hover { transform: scale(1.05); }

      .tl-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 14px;
      }

      .tl-mesa {
        background: rgba(255,255,255,0.03);
        border: 2px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.25s;
        position: relative;
        overflow: hidden;
      }
      .tl-mesa.disponible:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
      }
      .tl-mesa.bloqueada {
        opacity: 0.4;
        cursor: not-allowed;
        filter: grayscale(0.6);
      }
      .tl-mesa::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        border-radius: 16px 16px 0 0;
      }

      .tl-mesa-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .tl-mesa-nombre {
        font-family: 'Orbitron', sans-serif;
        font-size: 13px;
        font-weight: 900;
        letter-spacing: 0.5px;
      }
      .tl-mesa-nivel {
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        color: rgba(255,255,255,0.4);
        background: rgba(255,255,255,0.06);
        padding: 3px 8px;
        border-radius: 10px;
      }

      .tl-mesa-info {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }
      .tl-info-pill {
        font-size: 10px;
        color: rgba(255,255,255,0.55);
        background: rgba(255,255,255,0.05);
        padding: 3px 8px;
        border-radius: 8px;
        border: 1px solid rgba(255,255,255,0.08);
      }

      /* Personajes (avatares de jugadores activos) */
      .tl-players-row {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 12px;
        min-height: 36px;
      }
      .tl-player-avatar {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px solid rgba(0,255,153,0.4);
        background: rgba(0,255,153,0.1);
        overflow: hidden;
        position: relative;
        animation: tlAvatarPop 0.3s ease;
      }
      @keyframes tlAvatarPop {
        from { transform: scale(0); }
        to   { transform: scale(1); }
      }
      .tl-player-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .tl-empty-slot {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 2px dashed rgba(255,255,255,0.12);
        background: rgba(255,255,255,0.02);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: rgba(255,255,255,0.15);
      }
      .tl-players-count {
        font-family: 'Orbitron', sans-serif;
        font-size: 10px;
        color: rgba(255,255,255,0.4);
        margin-left: 4px;
      }

      .tl-join-btn {
        width: 100%;
        padding: 10px;
        font-family: 'Orbitron', sans-serif;
        font-size: 11px;
        font-weight: 900;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        letter-spacing: 1px;
        transition: all 0.2s;
      }
      .tl-join-btn.disponible {
        background: linear-gradient(135deg, var(--mesa-color, #00FF99), rgba(0,0,0,0.3));
        color: #000;
        box-shadow: 0 0 15px rgba(0,255,153,0.3);
      }
      .tl-join-btn.disponible:hover {
        filter: brightness(1.2);
        transform: translateY(-1px);
      }
      .tl-join-btn.bloqueada {
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.2);
        cursor: not-allowed;
      }

      .tl-lock-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 18px;
        opacity: 0.6;
      }

      @media (max-width: 600px) {
        .tl-grid { grid-template-columns: 1fr; }
        #tableLobbyPanel { padding: 15px; }
      }

      /* Animación de Telón Brawl Stars */
      #tlCurtain {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 99999;
        overflow: hidden;
        pointer-events: none;
      }
      #tlCurtain.active { display: block; }
      
      .tl-curtain-half {
        position: absolute;
        width: 100%;
        height: 50%;
        background: var(--curtain-color, #E5E4E2);
        left: 0;
        transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 50px rgba(0,0,0,0.8);
      }
      .tl-curtain-top { top: 0; transform: translateY(-100%); border-bottom: 5px solid #fff; }
      .tl-curtain-bottom { bottom: 0; transform: translateY(100%); border-top: 5px solid #fff; }
      
      #tlCurtain.active .tl-curtain-top { transform: translateY(0); }
      #tlCurtain.active .tl-curtain-bottom { transform: translateY(0); }
      #tlCurtain.open .tl-curtain-top { transform: translateY(-100%); }
      #tlCurtain.open .tl-curtain-bottom { transform: translateY(100%); }

      .tl-curtain-content {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.5);
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #tlCurtain.active .tl-curtain-content { opacity: 1; transform: scale(1); }
      #tlCurtain.open .tl-curtain-content { opacity: 0; transform: scale(1.5); }

      .tl-curtain-title {
        font-family: 'Orbitron', sans-serif;
        font-size: 80px;
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 60px var(--curtain-color);
        letter-spacing: 10px;
        text-align: center;
        line-height: 1;
        animation: tlPulse 1.5s ease-in-out infinite;
      }
      .tl-curtain-subtitle {
        font-family: 'Orbitron', sans-serif;
        font-size: 24px;
        color: #fff;
        margin-top: 20px;
        letter-spacing: 5px;
        opacity: 0.8;
      }
      @keyframes tlPulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.05); filter: brightness(1.3); }
      }

      /* Efecto de partículas/destellos */
      .tl-sparkle {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        pointer-events: none;
        animation: tlSparkleAnim 1s linear forwards;
      }
      @keyframes tlSparkleAnim {
        0% { transform: scale(0) rotate(0deg); opacity: 1; }
        100% { transform: scale(1) rotate(180deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    const overlay = document.createElement('div');
    overlay.id = 'tableLobbyOverlay';
    overlay.innerHTML = `
      <div id="tableLobbyPanel">
        <div class="tl-header">
          <div class="tl-title" id="tlTitle">🎰 SELECCIONA TU MESA</div>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="tl-balance-badge">💰 <span id="tlBalance">0</span> fichas</div>
            <button class="tl-auto-btn" onclick="tableLobby.autoJoin()">⚡ AUTO</button>
            <button class="tl-close" onclick="tableLobby.hide()">✕</button>
          </div>
        </div>
        <div class="tl-grid" id="tlGrid">
          <div style="text-align:center; color:rgba(255,255,255,0.3); padding:40px; grid-column:1/-1;">
            Cargando mesas...
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const curtain = document.createElement('div');
    curtain.id = 'tlCurtain';
    curtain.innerHTML = `
      <div class="tl-curtain-half tl-curtain-top"></div>
      <div class="tl-curtain-half tl-curtain-bottom"></div>
      <div class="tl-curtain-content">
        <div class="tl-curtain-title" id="tlCurtainTitle">PLATINO</div>
        <div class="tl-curtain-subtitle" id="tlCurtainSubtitle">SALÓN DE ÉLITE</div>
      </div>
    `;
    document.body.appendChild(curtain);
  }

  async show(game, gameFile, balance) {
    this.currentGame = game;
    this.currentGameFile = gameFile;
    document.getElementById('tlTitle').innerText = `🎰 MESAS — ${game.toUpperCase()}`;
    document.getElementById('tlBalance').innerText = Math.floor(balance).toLocaleString();
    document.getElementById('tableLobbyOverlay').classList.add('open');
    await this._loadMesas(game, balance);
  }

  hide() {
    document.getElementById('tableLobbyOverlay').classList.remove('open');
  }

  async _loadMesas(game, balance) {
    const grid = document.getElementById('tlGrid');
    grid.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.3);padding:40px;grid-column:1/-1;">Cargando mesas...</div>';
    try {
      const res = await fetch(`${this.API}/mesas/${game}`);
      const data = await res.json();
      this._renderMesas(data.mesas, balance);
    } catch(e) {
      grid.innerHTML = '<div style="text-align:center;color:#EF4444;padding:40px;grid-column:1/-1;">Error cargando mesas</div>';
    }
  }

  _renderMesas(mesas, balance) {
    const grid = document.getElementById('tlGrid');
    grid.innerHTML = mesas.map(mesa => {
      const disponible = balance >= mesa.buy_in;
      const jugActivos = mesa.jugadores_activos || 0;
      const avatarsHTML = this._renderAvatars(jugActivos, mesa.max_jugadores, mesa.color);

      return `
        <div class="tl-mesa ${disponible ? 'disponible' : 'bloqueada'}"
             style="--mesa-color:${mesa.color}; border-color:${disponible ? mesa.color + '44' : 'rgba(255,255,255,0.08)'};">
          <div class="tl-mesa::before" style="background:${mesa.color};"></div>
          <div style="height:3px; background:${mesa.color}; border-radius:10px 10px 0 0; margin:-16px -16px 12px; opacity:${disponible ? 1 : 0.3};"></div>

          ${!disponible ? `<div class="tl-lock-badge">🔒</div>` : ''}

          <div class="tl-mesa-header">
            <div class="tl-mesa-nombre" style="color:${mesa.color};">${mesa.nombre}</div>
            <div class="tl-mesa-nivel">MESA ${mesa.nivel}</div>
          </div>

          <div class="tl-mesa-info">
            <span class="tl-info-pill">💰 Entrada: ${this._fmt(mesa.buy_in)}</span>
            <span class="tl-info-pill">📉 Min: ${this._fmt(mesa.min_bet)}</span>
            <span class="tl-info-pill">📈 Max: ${this._fmt(mesa.max_bet)}</span>
          </div>

          <div class="tl-players-row">${avatarsHTML}</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.35); margin-bottom:10px; font-family:'Orbitron';">
            ${jugActivos} / ${mesa.max_jugadores} jugadores
          </div>

          <button class="tl-join-btn ${disponible ? 'disponible' : 'bloqueada'}"
                  style="${disponible ? `--mesa-color:${mesa.color}; background:linear-gradient(135deg,${mesa.color},${mesa.color}88); color:#000;` : ''}"
                  ${disponible ? `onclick="tableLobby.joinMesa(${mesa.nivel})"` : 'disabled'}>
            ${disponible ? '▶ UNIRSE' : `🔒 NECESITAS ${this._fmt(mesa.buy_in)}`}
          </button>
        </div>
      `;
    }).join('');
  }

  _renderAvatars(activos, max, color) {
    let html = '';
    const mostrar = Math.min(activos, 5);
    for (let i = 0; i < mostrar; i++) {
      const seed = 'player' + Math.floor(Math.random() * 100);
      html += `<div class="tl-player-avatar" style="border-color:${color}66;">
        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=${seed}" alt="jugador">
      </div>`;
    }
    // Slots vacíos (máximo 5 mostrados)
    const vacios = Math.min(5 - mostrar, max - activos);
    for (let i = 0; i < vacios; i++) {
      html += `<div class="tl-empty-slot">+</div>`;
    }
    if (activos > 0) {
      html += `<span class="tl-players-count">${activos > 5 ? `+${activos - 5} más` : ''}</span>`;
    }
    return html;
  }

  async joinMesa(nivel) {
    const user = window.currentUser;
    if (!user) { alert('Inicia sesión primero'); return; }
    try {
      const res = await fetch(`${this.API}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, game: this.currentGame, mesa_nivel: nivel })
      });
      const data = await res.json();
      if (res.ok) {
        this.currentRoomId = data.room_id;
        
        // Animación de Telón para niveles altos (6+)
        if (nivel >= 6) {
          await this._playCurtainAnimation(data.mesa);
        }

        this.hide();
        // Lanzar el juego con la mesa seleccionada
        if (typeof launchGame === 'function') {
          launchGame(this.currentGameFile, data.room_id, data.mesa);
        }
      } else {
        alert('❌ ' + (data.detail || 'Error al unirse'));
      }
    } catch(e) { alert('❌ Error de conexión'); }
  }

  async _playCurtainAnimation(mesa) {
    return new Promise(resolve => {
      const curtain = document.getElementById('tlCurtain');
      const title = document.getElementById('tlCurtainTitle');
      const subtitle = document.getElementById('tlCurtainSubtitle');
      
      // Configurar colores y textos
      curtain.style.setProperty('--curtain-color', mesa.color);
      
      // Extraer tipo (SALÓN, LIGA, CLUB) del nombre
      let type = "MESA";
      if (mesa.nombre.toUpperCase().includes("SALÓN")) type = "SALÓN";
      else if (mesa.nombre.toUpperCase().includes("LIGA")) type = "LIGA";
      else if (mesa.nombre.toUpperCase().includes("CLUB")) type = "CLUB";
      else if (mesa.nombre.toUpperCase().includes("MESA")) type = "MESA";
      
      title.innerText = mesa.nombre.split(' ').pop(); // Última palabra (Platino, Diamante, etc)
      subtitle.innerText = mesa.nombre.toUpperCase();
      
      curtain.classList.add('active');
      
      // Efecto de destellos ludópatas
      const interval = setInterval(() => {
        this._createSparkle(mesa.color);
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        curtain.classList.add('open');
        setTimeout(() => {
          curtain.classList.remove('active', 'open');
          resolve();
        }, 800);
      }, 2000);
    });
  }

  _createSparkle(color) {
    const sparkle = document.createElement('div');
    sparkle.className = 'tl-sparkle';
    const size = Math.random() * 15 + 5;
    sparkle.style.width = size + 'px';
    sparkle.style.height = size + 'px';
    sparkle.style.left = Math.random() * 100 + 'vw';
    sparkle.style.top = Math.random() * 100 + 'vh';
    sparkle.style.background = color;
    sparkle.style.boxShadow = `0 0 ${size}px #fff`;
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
  }

  async autoJoin() {
    const user = window.currentUser;
    if (!user) return;
    try {
      const res = await fetch(`${this.API}/auto/${user}/${this.currentGame}`);
      const data = await res.json();
      if (res.ok && data.mesa_recomendada) {
        await this.joinMesa(data.mesa_recomendada.nivel);
      }
    } catch(e) { alert('❌ Error al seleccionar mesa automáticamente'); }
  }

  _fmt(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
    return n.toLocaleString();
  }
}

window.tableLobby = new TableLobby();
