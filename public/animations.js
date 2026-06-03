/**
 * ARCADE-PREMIUM - Sistema de Animaciones Ludópata
 * Efectos de victoria explosivos para enganchar al jugador
 */

class WinAnimation {
  constructor() {
    this.container = null;
  }

  /**
   * Crea un contenedor para las animaciones si no existe
   */
  ensureContainer() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'win-animation-container';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  /**
   * Animación de confeti explosivo
   */
  confetti(duration = 3000) {
    const container = this.ensureContainer();
    const colors = ['#00FF99', '#00BFFF', '#FF9900', '#A855F7', '#EC4899', '#22C55E'];
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 10 + 5;
      const x = Math.random() * 100;
      const delay = Math.random() * 0.5;
      
      confetti.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        left: ${x}%;
        top: -10px;
        box-shadow: 0 0 ${size}px ${color};
        animation: confetti-fall ${2 + Math.random() * 1}s linear ${delay}s forwards;
      `;
      container.appendChild(confetti);
    }

    setTimeout(() => {
      container.innerHTML = '';
    }, duration);
  }

  /**
   * Lluvia de dinero/fichas
   */
  moneyRain(duration = 2500) {
    const container = this.ensureContainer();
    const symbols = ['💰', '💎', '🪙', '💵'];
    
    for (let i = 0; i < 30; i++) {
      const money = document.createElement('div');
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const x = Math.random() * 100;
      const delay = Math.random() * 0.3;
      
      money.style.cssText = `
        position: absolute;
        font-size: 40px;
        left: ${x}%;
        top: -50px;
        animation: money-fall ${1.5 + Math.random() * 0.5}s ease-in ${delay}s forwards;
      `;
      money.textContent = symbol;
      container.appendChild(money);
    }

    setTimeout(() => {
      container.innerHTML = '';
    }, duration);
  }

  /**
   * Explosión de luz/destello
   */
  lightBurst(duration = 1500) {
    const container = this.ensureContainer();
    const burst = document.createElement('div');
    
    burst.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      width: 100px;
      height: 100px;
      background: radial-gradient(circle, #FFD700, #FF9900, transparent);
      border-radius: 50%;
      transform: translate(-50%, -50%);
      animation: burst-expand ${duration}ms ease-out forwards;
      box-shadow: 0 0 100px #FFD700, 0 0 200px #FF9900;
    `;
    
    container.appendChild(burst);
    setTimeout(() => burst.remove(), duration);
  }

  /**
   * Texto flotante con animación
   */
  floatingText(text, duration = 2000, color = '#00FF99') {
    const container = this.ensureContainer();
    const floater = document.createElement('div');
    
    floater.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-family: 'Orbitron', sans-serif;
      font-size: 60px;
      font-weight: 900;
      color: ${color};
      text-shadow: 0 0 30px ${color}, 0 0 60px ${color};
      animation: float-up ${duration}ms ease-out forwards;
      pointer-events: none;
      letter-spacing: 2px;
    `;
    floater.textContent = text;
    container.appendChild(floater);
    
    setTimeout(() => floater.remove(), duration);
  }

  /**
   * Vibración de pantalla
   */
  screenShake(intensity = 10, duration = 500) {
    const container = this.ensureContainer();
    const shakes = Math.floor(duration / 50);
    
    for (let i = 0; i < shakes; i++) {
      setTimeout(() => {
        const x = (Math.random() - 0.5) * intensity * 2;
        const y = (Math.random() - 0.5) * intensity * 2;
        container.style.transform = `translate(${x}px, ${y}px)`;
      }, i * 50);
    }
    
    setTimeout(() => {
      container.style.transform = 'translate(0, 0)';
    }, duration);
  }

  /**
   * Animación de victoria completa (combo)
   */
  bigWin(amount, duration = 4000) {
    this.screenShake(15, 600);
    this.lightBurst(1500);
    this.confetti(3500);
    this.moneyRain(2500);
    
    setTimeout(() => {
      this.floatingText('¡GANASTE!', 2000, '#FFD700');
    }, 300);
    
    setTimeout(() => {
      this.floatingText(`+${amount}`, 2000, '#00FF99');
    }, 1000);
  }

  /**
   * Animación de pequeña victoria (para enganchar)
   */
  smallWin(amount, duration = 2000) {
    this.screenShake(5, 300);
    this.floatingText(`+${amount}`, 1500, '#00BFFF');
    
    const container = this.ensureContainer();
    for (let i = 0; i < 15; i++) {
      const spark = document.createElement('div');
      const angle = (i / 15) * Math.PI * 2;
      const distance = 100;
      
      spark.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 5px;
        height: 5px;
        background: #00BFFF;
        border-radius: 50%;
        box-shadow: 0 0 10px #00BFFF;
        animation: spark-fly ${1}s ease-out forwards;
        --angle: ${angle};
        --distance: ${distance}px;
      `;
      container.appendChild(spark);
    }
    
    setTimeout(() => {
      const sparks = container.querySelectorAll('[style*="spark-fly"]');
      sparks.forEach(s => s.remove());
    }, 1500);
  }

  /**
   * Animación de jackpot
   */
  jackpot(amount, duration = 5000) {
    this.screenShake(20, 800);
    this.lightBurst(2000);
    this.confetti(4000);
    this.moneyRain(3000);
    
    setTimeout(() => {
      this.floatingText('🏆 JACKPOT 🏆', 2500, '#FFD700');
    }, 300);
    
    setTimeout(() => {
      this.floatingText(`+${amount}`, 2500, '#FFD700');
    }, 1200);
  }
}

// Inyectar estilos de animación en el documento
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    to {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes money-fall {
    to {
      transform: translateY(100vh) rotate(360deg);
      opacity: 0;
    }
  }

  @keyframes burst-expand {
    from {
      transform: translate(-50%, -50%) scale(0);
      opacity: 1;
    }
    to {
      transform: translate(-50%, -50%) scale(3);
      opacity: 0;
    }
  }

  @keyframes float-up {
    0% {
      transform: translate(-50%, -50%) scale(0.5);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -100%) scale(1.2);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -200%) scale(0.8);
      opacity: 0;
    }
  }

  @keyframes spark-fly {
    to {
      transform: 
        translate(
          calc(cos(var(--angle)) * var(--distance)), 
          calc(sin(var(--angle)) * var(--distance))
        );
      opacity: 0;
    }
  }

  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px currentColor; }
    50% { box-shadow: 0 0 40px currentColor; }
  }

  @keyframes spin-3d {
    from { transform: rotateY(0deg); }
    to { transform: rotateY(360deg); }
  }

  @keyframes bounce-in {
    0% { transform: scale(0); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// Exportar globalmente
window.WinAnimation = WinAnimation;
