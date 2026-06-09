/**
 * ARCADE-PREMIUM — Efecto de Entrada Épico
 * Animaciones personalizadas para cada nivel de mesa de Craps.
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
        background: #000;
      }
      #globalCurtain.active { display: block; }
      
      .curtain-overlay {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.3;
        filter: blur(5px);
        transition: all 1s ease;
      }

      .curtain-half {
        position: absolute;
        width: 100%;
        height: 50%;
        background: var(--curtain-color, #1a6b8f);
        left: 0;
        transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 100px rgba(0,0,0,0.9);
      }
      .curtain-top { top: 0; transform: translateY(0); border-bottom: 4px solid var(--accent-color, #fff); }
      .curtain-bottom { bottom: 0; transform: translateY(0); border-top: 4px solid var(--accent-color, #fff); }
      
      #globalCurtain.open .curtain-top { transform: translateY(-100%); }
      #globalCurtain.open .curtain-bottom { transform: translateY(100%); }

      .curtain-content {
        position: absolute;
        inset: 0;
        z-index: 20;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transform: scale(0.8);
        transition: all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      #globalCurtain.active .curtain-content { opacity: 1; transform: scale(1); }
      #globalCurtain.open .curtain-content { opacity: 0; transform: scale(1.5); }

      .curtain-title {
        font-family: 'Bebas Neue', sans-serif;
        font-size: clamp(60px, 15vw, 120px);
        font-weight: 900;
        color: #fff;
        text-transform: uppercase;
        text-shadow: 0 0 30px var(--accent-color, #fff);
        letter-spacing: 15px;
        text-align: center;
        line-height: 1;
        margin-bottom: 10px;
      }

      .curtain-subtitle {
        font-family: 'Orbitron', sans-serif;
        font-size: clamp(16px, 4vw, 32px);
        color: var(--accent-color, #fff);
        letter-spacing: 8px;
        text-align: center;
        font-weight: 700;
        text-transform: uppercase;
      }

      /* Efectos especiales */
      .neon-glow {
        animation: neonPulse 1.5s ease-in-out infinite;
      }
      @keyframes neonPulse {
        0%, 100% { filter: brightness(1) drop-shadow(0 0 20px var(--accent-color)); }
        50% { filter: brightness(1.5) drop-shadow(0 0 40px var(--accent-color)); }
      }

      .vip-shine {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: -100%;
        animation: vipShineAnim 2s infinite;
      }
      @keyframes vipShineAnim {
        0% { left: -100%; }
        100% { left: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  _injectHTML() {
    if (document.getElementById('globalCurtain')) return;
    const curtain = document.createElement('div');
    curtain.id = 'globalCurtain';
    curtain.innerHTML = `
      <div class="curtain-overlay" id="curtainOverlay"></div>
      <div class="curtain-half curtain-top"></div>
      <div class="curtain-half curtain-bottom"></div>
      <div class="curtain-content">
        <div class="curtain-title" id="curtainTitle">BIENVENIDO</div>
        <div class="curtain-subtitle" id="curtainSubtitle">MESA DE CRAPS</div>
        <div class="vip-shine" id="vipShine" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(curtain);
  }

  async play(tableId) {
    const curtain = document.getElementById('globalCurtain');
    const overlay = document.getElementById('curtainOverlay');
    const title = document.getElementById('curtainTitle');
    const subtitle = document.getElementById('curtainSubtitle');
    const vipShine = document.getElementById('vipShine');
    
    const configs = {
      'craps_low_stakes': {
        color: '#1a6b8f',
        accent: '#00d2ff',
        title: 'BÁSICA',
        subtitle: 'VEGAS LOW STAKES',
        img: '/assets/tables/table_low.jpg'
      },
      'craps_mid_stakes': {
        color: '#0d3b4f',
        accent: '#00ff99',
        title: 'NEÓN',
        subtitle: 'MID STAKES ARENA',
        img: '/assets/tables/table_mid.jpg',
        neon: true
      },
      'craps_high_roller': {
        color: '#1a0f05',
        accent: '#f4c430',
        title: 'VIP',
        subtitle: 'HIGH ROLLER ELITE',
        img: '/assets/tables/table_high.jpg',
        vip: true
      }
    };

    const config = configs[tableId] || configs['craps_low_stakes'];
    
    curtain.style.setProperty('--curtain-color', config.color);
    curtain.style.setProperty('--accent-color', config.accent);
    overlay.style.backgroundImage = `url(${config.img})`;
    title.innerText = config.title;
    subtitle.innerText = config.subtitle;
    
    // Aplicar efectos
    title.classList.toggle('neon-glow', !!config.neon);
    vipShine.style.display = config.vip ? 'block' : 'none';
    
    curtain.style.display = 'block';
    curtain.classList.add('active');
    
    return new Promise(resolve => {
      setTimeout(() => {
        curtain.classList.add('open');
        setTimeout(() => {
          curtain.style.display = 'none';
          curtain.classList.remove('active', 'open');
          resolve();
        }, 1200);
      }, 2500);
    });
  }
}

window.curtainEffect = new CurtainEffect();
