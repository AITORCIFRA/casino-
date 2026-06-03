/**
 * ARCADE-PREMIUM - Sistema de Animaciones Ludópatas y Efectos Visuales
 */

class WinAnimation {
  constructor() {
    this.container = null;
    this.coinIcon = '🪙'; // Icono de ficha
    this.createStyles();
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

  createStyles() {
    if (document.getElementById('win-anim-styles')) return;
    const style = document.createElement('style');
    style.id = 'win-anim-styles';
    style.innerHTML = `
      .win-particle {
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        font-size: 24px;
        animation: particle-fly 1s cubic-bezier(0.12, 0, 0.39, 0) forwards;
      }
      
      @keyframes particle-fly {
        0% { transform: translate(0, 0) scale(1); opacity: 1; }
        100% { transform: translate(var(--tx), var(--ty)) scale(0.5); opacity: 0.8; }
      }

      .floating-text {
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        font-family: 'Bebas Neue', sans-serif;
        font-size: 80px;
        color: #FFD700;
        text-shadow: 0 0 20px #FFD700, 0 0 40px #FFA500;
        animation: text-float 2s ease-out forwards;
      }

      @keyframes text-float {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
        20% { transform: translate(-50%, -60%) scale(1.2); opacity: 1; }
        80% { transform: translate(-50%, -70%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -80%) scale(0.8); opacity: 0; }
      }

      .screen-shake {
        animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
      }

      @keyframes shake {
        10%, 90% { transform: translate3d(-1px, 0, 0); }
        20%, 80% { transform: translate3d(2px, 0, 0); }
        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
        40%, 60% { transform: translate3d(4px, 0, 0); }
      }

      @keyframes confetti-fall {
        to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }

      @keyframes money-fall {
        to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
      }

      @keyframes burst-expand {
        from { transform: translate(-50%, -50%) scale(0); opacity: 1; }
        to { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Efecto de fuente de fichas volando hacia el saldo
   */
  fountainEffect(amount, sourceElement = null) {
    const target = document.getElementById('lobbyCredits') || document.getElementById('cred');
    if (!target) return;

    const targetRect = target.getBoundingClientRect();
    const startX = sourceElement ? sourceElement.getBoundingClientRect().left : window.innerWidth / 2;
    const startY = sourceElement ? sourceElement.getBoundingClientRect().top : window.innerHeight / 2;

    const count = Math.min(50, Math.max(10, Math.floor(amount / 10)));
    
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        p.className = 'win-particle';
        p.innerText = this.coinIcon;
        p.style.left = startX + 'px';
        p.style.top = startY + 'px';
        
        const tx = targetRect.left - startX + (Math.random() * 20 - 10);
        const ty = targetRect.top - startY + (Math.random() * 20 - 10);
        
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        
        document.body.appendChild(p);
        
        p.addEventListener('animationend', () => {
          p.remove();
          if (i === count - 1) {
            this.animateValue(target, amount);
          }
        });
      }, i * 30);
    }
  }

  /**
   * Actualiza el valor numérico de forma progresiva y rápida
   */
  animateValue(obj, addAmount) {
    const startValue = parseInt(obj.innerText.replace(/,/g, '')) || 0;
    const endValue = startValue + addAmount;
    const duration = 1000;
    let startTimestamp = null;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = Math.floor(progress * (endValue - startValue) + startValue);
      obj.innerText = current.toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        obj.innerText = endValue.toLocaleString();
      }
    };
    window.requestAnimationFrame(step);
  }

  smallWin(amount) {
    this.fountainEffect(amount);
    this.showText(`+${amount}`, '#00FF99');
  }
  
  /**
   * Notifica ganancia de XP al lobby
   */
  addXP(amount) {
    try {
      window.parent.postMessage({ type: 'add_xp', amount }, '*');
    } catch(e) {
      console.log("Error enviando XP");
    }
  }

  bigWin(amount) {
    document.body.classList.add('screen-shake');
    setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    this.fountainEffect(amount);
    this.showText("BIG WIN!!", "#FFD700");
    this.confetti();
  }

  jackpot(amount) {
    document.body.classList.add('screen-shake');
    this.fountainEffect(amount);
    this.showText("JACKPOT!!!", "#FF0000");
    for(let i=0; i<3; i++) setTimeout(() => this.confetti(), i * 500);
  }

  showText(text, color) {
    const t = document.createElement('div');
    t.className = 'floating-text';
    t.innerText = text;
    t.style.color = color;
    t.style.left = '50%';
    t.style.top = '50%';
    document.body.appendChild(t);
    t.addEventListener('animationend', () => t.remove());
  }

  confetti() {
    const container = this.ensureContainer();
    const colors = ['#00FF99', '#00BFFF', '#A855F7', '#FFD700', '#FF3366'];
    for (let i = 0; i < 100; i++) {
      const p = document.createElement('div');
      p.style.position = 'fixed';
      p.style.width = '8px';
      p.style.height = '8px';
      p.style.background = colors[Math.floor(Math.random() * colors.length)];
      p.style.left = '50%';
      p.style.top = '50%';
      p.style.zIndex = '9999';
      p.style.borderRadius = '2px';
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = 10 + Math.random() * 20;
      const tx = Math.cos(angle) * velocity * 20;
      const ty = Math.sin(angle) * velocity * 20;
      
      p.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
      ], {
        duration: 1000 + Math.random() * 1000,
        easing: 'cubic-bezier(0, .9, .57, 1)',
        fill: 'forwards'
      }).onfinish = () => p.remove();
      
      container.appendChild(p);
    }
  }
}

window.WinAnimation = WinAnimation;
