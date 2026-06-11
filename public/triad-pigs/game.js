// ===== THE TRIAD PIGS OF OLYMPUS - GAME ENGINE =====

// Símbolos del juego con sus valores
const SYMBOLS = [
  { id: 'pig_zeus',     img: 'triad-pigs/assets/symbols/pig_zeus_v2.png',     name: 'Zeus Cerdo',       pays: [0, 0, 25, 100, 500],  weight: 2, fx: 'lightning-fx' },
  { id: 'pig_poseidon', img: 'triad-pigs/assets/symbols/pig_poseidon_v2.png', name: 'Poseidón Cerdo',   pays: [0, 0, 20, 80,  400],  weight: 2, fx: 'water-fx' },
  { id: 'pig_hades',    img: 'triad-pigs/assets/symbols/pig_hades_v2.png',    name: 'Hades Cerdo',      pays: [0, 0, 15, 70,  350],  weight: 3, fx: 'fire-fx' },
  { id: 'wild_symbol',  img: 'triad-pigs/assets/symbols/wild_symbol.png',  name: 'WILD',             pays: [0, 0, 50, 200, 1000], weight: 1 },
  { id: 'golden_apple', img: 'triad-pigs/assets/symbols/golden_apple.png', name: 'Manzana Dorada',   pays: [0, 0, 10, 40,  200],  weight: 4 },
  { id: 'lightning',    img: 'triad-pigs/assets/symbols/lightning_bolt.png',name: 'Rayo de Zeus',    pays: [0, 0, 8,  30,  150],  weight: 5 },
  { id: 'trident',      img: 'triad-pigs/assets/symbols/trident.png',      name: 'Tridente',         pays: [0, 0, 6,  25,  120],  weight: 5 },
  { id: 'olympus_coin', img: 'triad-pigs/assets/symbols/olympus_coin.png', name: 'Moneda Olímpica',  pays: [0, 0, 4,  15,  80],   weight: 8 },
];

// Construir array de símbolos ponderado
const SYMBOL_POOL = [];
SYMBOLS.forEach(s => {
  for (let i = 0; i < s.weight; i++) SYMBOL_POOL.push(s);
});

// Estado del juego
const state = {
  saldo: Number(localStorage.getItem('saldo') || 100),
  nickname: localStorage.getItem('nickname') || 'Invitado',
  bet: 1,
  betLevels: [1, 2, 5, 10, 25, 50, 100],
  betIndex: 0,
  jackpot: 50000,
  spinning: false,
  autoSpin: false,
  autoSpinTimer: null,
  reels: 5,
  rows: 3,
  // Matriz actual de símbolos visibles [col][row]
  grid: [],
};

// DOM refs
const nickDisplay = document.getElementById('nickDisplay');
const saldoDisplay = document.getElementById('saldoDisplay');
const betDisplay = document.getElementById('betDisplay');
const betValue = document.getElementById('betValue');
const winDisplay = document.getElementById('winDisplay');
const jackpotDisplay = document.getElementById('jackpotDisplay');
const spinBtn = document.getElementById('spinBtn');
const betMinus = document.getElementById('betMinus');
const betPlus = document.getElementById('betPlus');
const maxBetBtn = document.getElementById('maxBetBtn');
const autoSpinBtn = document.getElementById('autoSpinBtn');
const paytableBtn = document.getElementById('paytableBtn');
const shopBtn = document.getElementById('shopBtn');
const winOverlay = document.getElementById('winOverlay');
const winText = document.getElementById('winText');
const winAmount = document.getElementById('winAmount');
const epicWinScreen = document.getElementById('epicWinScreen');
const epicWinTitle = document.getElementById('epicWinTitle');
const epicWinAmount = document.getElementById('epicWinAmount');
const epicCoins = document.getElementById('epicCoins');
const paytableModal = document.getElementById('paytableModal');
const shopModal = document.getElementById('shopModal');

// ===== INICIALIZACIÓN =====
function init() {
  updateUI();
  initParticles();
  initReels();
  initControls();
  initModals();
  animateJackpot();
}

function updateUI() {
  nickDisplay.textContent = state.nickname;
  saldoDisplay.textContent = state.saldo.toLocaleString('es-ES');
  betDisplay.textContent = state.betLevels[state.betIndex];
  betValue.textContent = state.betLevels[state.betIndex] + '€';
  localStorage.setItem('saldo', state.saldo);
}

// ===== PARTÍCULAS =====
function initParticles() {
  const container = document.getElementById('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
    p.style.animationDuration = (Math.random() * 8 + 6) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.background = Math.random() > 0.5 ? '#FFD700' : '#A855F7';
    container.appendChild(p);
  }
}

// ===== RODILLOS =====
function getRandomSymbol() {
  return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
}

function createSymbolEl(symbol) {
  const cell = document.createElement('div');
  cell.className = 'symbol-cell';
  cell.dataset.symbolId = symbol.id;
  const img = document.createElement('img');
  img.src = symbol.img;
  img.alt = symbol.name;
  img.loading = 'lazy';
  cell.appendChild(img);
  return cell;
}

function initReels() {
  state.grid = [];
  for (let col = 0; col < state.reels; col++) {
    const strip = document.getElementById(`strip-${col}`);
    strip.innerHTML = '';
    state.grid[col] = [];

    // Crear 9 símbolos (3 visibles + buffer arriba/abajo)
    for (let row = 0; row < 9; row++) {
      const sym = getRandomSymbol();
      const cell = createSymbolEl(sym);
      strip.appendChild(cell);
      if (row >= 3 && row < 6) {
        state.grid[col].push(sym);
      }
    }
  }
}

// ===== SPIN PRINCIPAL =====
async function spin() {
  if (state.spinning) return;

  const bet = state.betLevels[state.betIndex];
  if (bet > state.saldo) {
    showMessage('¡Saldo insuficiente!', 'error');
    return;
  }

  state.spinning = true;
  state.saldo -= bet;
  updateUI();
  winDisplay.textContent = '0';

  spinBtn.disabled = true;
  spinBtn.classList.add('spinning');
  winOverlay.classList.add('hidden');

  // Ocultar línea de pago
  document.getElementById('payline-center').classList.remove('winning');

  // Generar nueva matriz de resultados
  const newGrid = [];
  for (let col = 0; col < state.reels; col++) {
    newGrid[col] = [];
    for (let row = 0; row < 3; row++) {
      newGrid[col].push(getRandomSymbol());
    }
  }

  // Animar rodillos en cascada
  const spinPromises = [];
  for (let col = 0; col < state.reels; col++) {
    const delay = col * 150;
    const duration = 800 + col * 200;
    spinPromises.push(spinReel(col, newGrid[col], delay, duration));
  }

  await Promise.all(spinPromises);

  // Actualizar grid
  state.grid = newGrid;

  // Calcular ganancias
  const result = calculateWin(newGrid, bet);

  if (result.win > 0) {
    state.saldo += result.win;
    updateUI();
    winDisplay.textContent = result.win;

    // Destacar símbolos ganadores
    highlightWinners(result.winningCells);

    // Mostrar overlay de victoria
    setTimeout(() => {
      if (result.win >= bet * 50) {
        showEpicWin(result.win, result.winType);
      } else {
        showWinOverlay(result.win, result.winType);
      }
    }, 300);
  }

  // Contribuir al jackpot
  state.jackpot += Math.floor(bet * 0.01);

  state.spinning = false;
  spinBtn.disabled = false;
  spinBtn.classList.remove('spinning');

  // Auto spin
  if (state.autoSpin) {
    state.autoSpinTimer = setTimeout(spin, 1500);
  }
}

function spinReel(col, finalSymbols, delay, duration) {
  return new Promise(resolve => {
    setTimeout(() => {
      const strip = document.getElementById(`strip-${col}`);
      const reel = document.getElementById(`reel-${col}`);
      reel.classList.add('spinning');

      // Animación de giro con CSS
      let startTime = null;
      const totalDistance = 120 * 12; // 12 símbolos de altura
      const symbolHeight = 120;

      // Crear símbolos de animación
      strip.innerHTML = '';

      // Símbolos de relleno durante el giro
      const spinSymbols = [];
      for (let i = 0; i < 12; i++) {
        spinSymbols.push(getRandomSymbol());
      }
      // Añadir los símbolos finales al final
      finalSymbols.forEach(s => spinSymbols.push(s));

      spinSymbols.forEach(sym => {
        strip.appendChild(createSymbolEl(sym));
      });

      // Posición inicial: mostrar los primeros 3
      strip.style.transform = 'translateY(0)';

      // Animar
      const targetY = -(spinSymbols.length - 3) * symbolHeight;

      let startPos = 0;
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing: aceleración al inicio, desaceleración al final
        const eased = easeInOutCubic(progress);
        const currentY = startPos + (targetY - startPos) * eased;
        strip.style.transform = `translateY(${currentY}px)`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          strip.style.transform = `translateY(${targetY}px)`;
          reel.classList.remove('spinning');
          resolve();
        }
      };

      requestAnimationFrame(animate);
    }, delay);
  });
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== CÁLCULO DE GANANCIAS =====
function calculateWin(grid, bet) {
  let totalWin = 0;
  let winType = '';
  const winningCells = [];

  // Líneas de pago (5 líneas)
  const paylines = [
    [[0,1],[1,1],[2,1],[3,1],[4,1]], // Centro
    [[0,0],[1,0],[2,0],[3,0],[4,0]], // Arriba
    [[0,2],[1,2],[2,2],[3,2],[4,2]], // Abajo
    [[0,0],[1,1],[2,2],[3,1],[4,0]], // V
    [[0,2],[1,1],[2,0],[3,1],[4,2]], // ^
  ];

  paylines.forEach(line => {
    const lineSymbols = line.map(([col, row]) => grid[col][row]);
    const result = checkLine(lineSymbols, bet);
    if (result.win > 0) {
      totalWin += result.win;
      if (result.count === 5) winType = result.count === 5 && lineSymbols[0].id === 'wild_symbol' ? 'MEGA WIN!' : 'BIG WIN!';
      else if (result.count === 4) winType = winType || 'GRAN VICTORIA!';
      else winType = winType || 'VICTORIA!';

      line.slice(0, result.count).forEach(([col, row]) => {
        winningCells.push({ col, row });
      });
    }
  });

  // Bonus: 3 WILD en cualquier posición
  let wildCount = 0;
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      if (grid[col][row].id === 'wild_symbol') wildCount++;
    }
  }
  if (wildCount >= 3) {
    const bonus = bet * wildCount * 5;
    totalWin += bonus;
    if (!winType) winType = 'BONUS WILD!';
  }

  return { win: totalWin, winType, winningCells };
}

function checkLine(symbols, bet) {
  // Contar coincidencias desde la izquierda (WILD comodín)
  const firstNonWild = symbols.find(s => s.id !== 'wild_symbol');
  if (!firstNonWild) {
    // Todos WILD
    const sym = SYMBOLS.find(s => s.id === 'wild_symbol');
    return { win: bet * sym.pays[4], count: 5 };
  }

  let count = 0;
  for (let i = 0; i < symbols.length; i++) {
    if (symbols[i].id === firstNonWild.id || symbols[i].id === 'wild_symbol') {
      count++;
    } else {
      break;
    }
  }

  if (count < 3) return { win: 0, count: 0 };

  const sym = SYMBOLS.find(s => s.id === firstNonWild.id);
  const multiplier = sym.pays[count - 1] || 0;
  return { win: bet * multiplier, count };
}

// ===== HIGHLIGHT GANADORES =====
function highlightWinners(cells) {
  // Resaltar línea de pago
  document.getElementById('payline-center').classList.add('winning');

  cells.forEach(({ col, row }) => {
    const strip = document.getElementById(`strip-${col}`);
    const allCells = strip.querySelectorAll('.symbol-cell');
    // Los últimos 3 son los visibles
    const visibleStart = allCells.length - 3;
    const cell = allCells[visibleStart + row];
    if (cell) {
      const sym = SYMBOLS.find(s => s.id === cell.dataset.symbolId);
      cell.classList.add('winning');
      if (sym && sym.fx) cell.classList.add(sym.fx);
      setTimeout(() => {
        cell.classList.remove('winning');
        if (sym && sym.fx) cell.classList.remove(sym.fx);
      }, 3000);
    }
  });
}

// ===== OVERLAYS DE VICTORIA =====
function showWinOverlay(amount, type) {
  winText.textContent = type || '¡VICTORIA!';
  winAmount.textContent = '+' + amount + '€';
  winOverlay.classList.remove('hidden');
  setTimeout(() => winOverlay.classList.add('hidden'), 2500);
}

function showEpicWin(amount, type) {
  epicWinTitle.textContent = type || 'MEGA WIN!';
  epicWinAmount.textContent = '+' + amount.toLocaleString('es-ES') + '€';
  epicWinScreen.classList.remove('hidden');
  createEpicCoins();
}

function createEpicCoins() {
  epicCoins.innerHTML = '';
  const coins = ['💰', '⚡', '🏆', '✨', '💎', '🌟'];
  for (let i = 0; i < 20; i++) {
    const coin = document.createElement('div');
    coin.className = 'epic-coin';
    coin.textContent = coins[Math.floor(Math.random() * coins.length)];
    coin.style.left = Math.random() * 100 + '%';
    coin.style.animationDuration = (Math.random() * 2 + 1) + 's';
    coin.style.animationDelay = (Math.random() * 2) + 's';
    epicCoins.appendChild(coin);
  }
}

document.getElementById('closeEpicWin').addEventListener('click', () => {
  epicWinScreen.classList.add('hidden');
});

// ===== JACKPOT ANIMADO =====
function animateJackpot() {
  setInterval(() => {
    state.jackpot += Math.floor(Math.random() * 3 + 1);
    jackpotDisplay.textContent = state.jackpot.toLocaleString('es-ES');
  }, 500);
}

// ===== CONTROLES =====
function initControls() {
  spinBtn.addEventListener('click', spin);

  betMinus.addEventListener('click', () => {
    if (state.betIndex > 0) {
      state.betIndex--;
      updateUI();
    }
  });

  betPlus.addEventListener('click', () => {
    if (state.betIndex < state.betLevels.length - 1) {
      state.betIndex++;
      updateUI();
    }
  });

  maxBetBtn.addEventListener('click', () => {
    state.betIndex = state.betLevels.length - 1;
    updateUI();
  });

  autoSpinBtn.addEventListener('click', () => {
    state.autoSpin = !state.autoSpin;
    autoSpinBtn.classList.toggle('active', state.autoSpin);
    autoSpinBtn.textContent = state.autoSpin ? 'STOP' : 'AUTO';
    if (state.autoSpin && !state.spinning) {
      spin();
    } else if (!state.autoSpin && state.autoSpinTimer) {
      clearTimeout(state.autoSpinTimer);
    }
  });

  // Teclado: Espacio para girar
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !state.spinning) {
      e.preventDefault();
      spin();
    }
  });
}

// ===== MODALES =====
function initModals() {
  paytableBtn.addEventListener('click', () => paytableModal.classList.remove('hidden'));
  document.getElementById('closePaytable').addEventListener('click', () => paytableModal.classList.add('hidden'));

  shopBtn.addEventListener('click', () => shopModal.classList.remove('hidden'));
  document.getElementById('closeShop').addEventListener('click', () => shopModal.classList.add('hidden'));

  // Tienda
  document.querySelectorAll('.shop-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const amount = Number(btn.dataset.amount);
      state.saldo += amount;
      updateUI();
      shopModal.classList.add('hidden');
      showMessage(`+${amount}€ añadidos!`, 'win');
    });
  });

  // Cerrar modal al hacer click fuera
  [paytableModal, shopModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });
}

// ===== MENSAJE FLASH =====
function showMessage(msg, type) {
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
    background: ${type === 'win' ? '#22C55E' : '#EF4444'};
    color: white; padding: 12px 24px; border-radius: 8px;
    font-family: 'Cinzel', serif; font-weight: 700; font-size: 14px;
    z-index: 999; animation: fadeInOut 2s ease-in-out forwards;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  `;
  el.textContent = msg;

  const style = document.createElement('style');
  style.textContent = `@keyframes fadeInOut { 0%{opacity:0;top:60px} 20%{opacity:1;top:80px} 80%{opacity:1;top:80px} 100%{opacity:0;top:60px} }`;
  document.head.appendChild(style);

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

// ===== INDICADORES DE LÍNEAS =====
document.querySelectorAll('.payline-indicator').forEach(ind => {
  ind.addEventListener('click', () => {
    ind.classList.toggle('active');
  });
});

// Activar primera línea por defecto
document.querySelectorAll('[data-line="1"]').forEach(el => el.classList.add('active'));

// ===== INICIAR JUEGO =====
init();
