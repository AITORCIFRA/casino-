/**
 * ARCADE-PREMIUM — Efecto de Telón Global
 * Reutilizable en todos los juegos para entradas de alto nivel.
 */

class CurtainEffect {
  constructor() {
    this._injectStyles();
    this._injectHTML();
  }

  _injectStyles() {
    if (document.getElementById('curtainStyles')) return;
    const style = document.createElement('style');
    style.id = 'curtainStyles';
    style.innerHTML = `
      #globalCurtain {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 999999;
        overflow: hidden;
        pointer-events: none;
      }
      #globalCurtain.active { display: block; }
      
      .curtain-half {
        position: absolute;
        width: 100%;
        height: 50%;
        background: var(--curtain-color, #E5E4E2);
        left: 0;
        transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 50px rgba(0,0,0,0.8);
      }
      .curtain-top { top: 0; transform: translateY(0); border-bottom: 5px solid #fff; }
      .curtain-bottom { bottom: 0; transform: translateY(0); border-top: 5px solid #fff; }
      
      #globalCurtain.open .curtain-top { transform: translateY(-100%); }
      #globalCurtain.open .curtain-bottom { transform: translateY(100%); }

      .curtain-content {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 1;
        transform: scale(1);
        transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #globalCurtain.open .curtain-content { opacity: 0; transform: scale(1.5); }

      .curtain-title {
        font-family: 'Orbitron', 'Bebas Neue', sans-serif;
        font-size: clamp(40px, 10vw, 80px);
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        text-shadow: 0 0 30px rgba(255,255,255,0.8), 0 0 60px var(--curtain-color);
        letter-spacing: 10px;
        text-align: center;
        line-height: 1;
        animation: curtainPulse 1.5s ease-in-out infinite;
      }
      .curtain-subtitle {
        font-family: 'Orbitron', sans-serif;
        font-size: clamp(14px, 3vw, 24px);
        color: #fff;
        margin-top: 20px;
        letter-spacing: 5px;
        opacity: 0.8;
        text-align: center;
      }
      @keyframes curtainPulse {
        0%, 100% { transform: scale(1); filter: brightness(1); }
        50% { transform: scale(1.05); filter: brightness(1.3); }
      }

      .curtain-sparkle {
        position: absolute;
        background: #fff;
        border-radius: 50%;
        pointer-events: none;
        animation: curtainSparkleAnim 1s linear forwards;
      }
      @keyframes curtainSparkleAnim {
        0% { transform: scale(0) rotate(0deg); opacity: 1; }
        100% { transform: scale(1) rotate(180deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  _injectHTML() {
    if (document.getElementById('globalCurtain')) return;
    const curtain = document.createElement('div');
    curtain.id = 'globalCurtain';
    curtain.innerHTML = `
      <div class="curtain-half curtain-top"></div>
      <div class="curtain-half curtain-bottom"></div>
      <div class="curtain-content">
        <div class="curtain-title" id="curtainTitle">PLATINO</div>
        <div class="curtain-subtitle" id="curtainSubtitle">SALÓN DE ÉLITE</div>
      </div>
    `;
    document.body.appendChild(curtain);
  }

  async play(mesaData) {
    if (!mesaData || !mesaData.nombre) return;
    
    const curtain = document.getElementById('globalCurtain');
    const title = document.getElementById('curtainTitle');
    const subtitle = document.getElementById('curtainSubtitle');
    
    curtain.style.setProperty('--curtain-color', mesaData.color || '#E5E4E2');
    title.innerText = mesaData.nombre.split(' ').pop().toUpperCase();
    subtitle.innerText = mesaData.nombre.toUpperCase();
    
    curtain.classList.add('active');
    
    // Iniciar chispas
    const interval = setInterval(() => this._createSparkle(mesaData.color), 50);

    return new Promise(resolve => {
      setTimeout(() => {
        clearInterval(interval);
        curtain.classList.add('open');
        setTimeout(() => {
          curtain.classList.remove('active', 'open');
          resolve();
        }, 1000);
      }, 2000);
    });
  }

  _createSparkle(color) {
    const sparkle = document.createElement('div');
    sparkle.className = 'curtain-sparkle';
    const size = Math.random() * 15 + 5;
    sparkle.style.width = size + 'px';
    sparkle.style.height = size + 'px';
    sparkle.style.left = Math.random() * 100 + 'vw';
    sparkle.style.top = Math.random() * 100 + 'vh';
    sparkle.style.background = color || '#fff';
    sparkle.style.boxShadow = `0 0 ${size}px #fff`;
    document.body.appendChild(sparkle);
    setTimeout(() => sparkle.remove(), 1000);
  }
}

window.curtainEffect = new CurtainEffect();

// Auto-ejecutar si hay datos de mesa en la URL
(async function() {
  const params = new URLSearchParams(window.location.search);
  const mesaJson = params.get('mesa_data');
  if (mesaJson) {
    try {
      const mesa = JSON.parse(decodeURIComponent(mesaJson));
      if (mesa.nivel >= 6) {
        await window.curtainEffect.play(mesa);
      }
    } catch (e) { console.error("Error al auto-ejecutar telón", e); }
  }
})();
