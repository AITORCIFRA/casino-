// ===== CASINO DEL PANA - MAIN SCRIPT =====

// Estado global
const casino = {
  saldo: Number(localStorage.getItem('saldo') || 100),
  nickname: localStorage.getItem('nickname') || 'Invitado',
  jackpot: 1250000,
};

// DOM refs
const nickDisplay = document.getElementById('nickDisplay');
const saldoDisplay = document.getElementById('saldoDisplay');
const changeNickBtn = document.getElementById('changeNickBtn');
const addBalanceBtn = document.getElementById('addBalanceBtn');
const balanceModal = document.getElementById('balanceModal');
const closeBalanceModal = document.getElementById('closeBalanceModal');
const tickerJackpot = document.getElementById('tickerJackpot');

// ===== INICIALIZACIÓN =====
function init() {
  updateUI();
  initCategoryFilter();
  initNickname();
  initBalanceModal();
  animateJackpotTicker();
  duplicateTickerContent();
}

function updateUI() {
  nickDisplay.textContent = casino.nickname;
  saldoDisplay.textContent = casino.saldo.toLocaleString('es-ES');
  localStorage.setItem('saldo', casino.saldo);
  localStorage.setItem('nickname', casino.nickname);
}

// ===== TICKER JACKPOT =====
function animateJackpotTicker() {
  setInterval(() => {
    casino.jackpot += Math.floor(Math.random() * 10 + 5);
    if (tickerJackpot) {
      tickerJackpot.textContent = '€ ' + casino.jackpot.toLocaleString('es-ES');
    }
  }, 1000);
}

function duplicateTickerContent() {
  const ticker = document.querySelector('.ticker-content');
  if (ticker) {
    const clone = ticker.cloneNode(true);
    ticker.parentElement.appendChild(clone);
  }
}

// ===== FILTRO DE CATEGORÍAS =====
function initCategoryFilter() {
  const catBtns = document.querySelectorAll('.cat-btn');
  const gameCards = document.querySelectorAll('.game-card');

  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Actualizar botón activo
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const cat = btn.dataset.cat;

      gameCards.forEach(card => {
        if (cat === 'all') {
          card.classList.remove('hidden-by-filter');
        } else {
          const cardCats = card.dataset.cat || '';
          if (cardCats.includes(cat)) {
            card.classList.remove('hidden-by-filter');
          } else {
            card.classList.add('hidden-by-filter');
          }
        }
      });

      // Ocultar secciones vacías
      document.querySelectorAll('.games-section').forEach(section => {
        const visibleCards = section.querySelectorAll('.game-card:not(.hidden-by-filter)');
        section.style.display = visibleCards.length === 0 ? 'none' : '';
      });
    });
  });
}

// ===== NICKNAME =====
function initNickname() {
  changeNickBtn.addEventListener('click', () => {
    const nuevo = prompt('Introduce tu nickname:', casino.nickname);
    if (nuevo && nuevo.trim().length > 0) {
      casino.nickname = nuevo.trim();
      updateUI();
    }
  });
}

// ===== MODAL DE SALDO =====
function initBalanceModal() {
  addBalanceBtn.addEventListener('click', () => {
    balanceModal.classList.remove('hidden');
  });

  closeBalanceModal.addEventListener('click', () => {
    balanceModal.classList.add('hidden');
  });

  balanceModal.addEventListener('click', (e) => {
    if (e.target === balanceModal) balanceModal.classList.add('hidden');
  });

  document.querySelectorAll('.bal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = Number(btn.dataset.amount);
      casino.saldo += amount;
      updateUI();
      balanceModal.classList.add('hidden');

      // Notificación
      showToast(`+${amount}€ añadidos a tu saldo!`, 'success');
    });
  });
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 24px;
    background: ${type === 'success' ? '#16A34A' : type === 'error' ? '#DC2626' : '#1E40AF'};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    z-index: 9999;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    animation: toastIn 0.3s ease-out, toastOut 0.3s ease-in 2.7s forwards;
    max-width: 280px;
  `;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes toastIn { from { opacity:0; transform: translateX(20px); } to { opacity:1; transform: translateX(0); } }
    @keyframes toastOut { from { opacity:1; } to { opacity:0; } }
  `;
  document.head.appendChild(style);
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== EFECTOS DE ENTRADA EN TARJETAS =====
function initCardAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'cardFadeIn 0.4s ease-out forwards';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const style = document.createElement('style');
  style.textContent = `
    @keyframes cardFadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .game-card { opacity: 0; }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.game-card').forEach((card, i) => {
    card.style.animationDelay = (i * 0.05) + 's';
    observer.observe(card);
  });
}

// ===== INICIAR =====
document.addEventListener('DOMContentLoaded', () => {
  init();
  initCardAnimations();
});
