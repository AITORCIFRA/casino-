// ===== ARCADE PREMIUM — LOBBY JS v3 =====
// Integrado con DB de usuarios

const GAME_MAP = {
  poker:       { file: 'games/poker.html',       title: "TEXAS HOLD'EM"     },
  slots:       { file: 'games/slots.html',       title: 'LUCKY SEVENS'      },
  slots2:      { file: 'games/magic_trakka.html', title: 'MAGIC TRAKKA'     },
  frutas:      { file: 'games/fruits.html',       title: 'FRUITS PARTY'     },
  roulette:    { file: 'games/roulette.html',     title: 'RULETA EUROPEA'   },
  blackjack:   { file: 'games/blackjack.html',    title: 'BLACKJACK'        },
  keno:        { file: 'games/keno.html',         title: 'KENO TURBO'       },
  link_dragon: { file: 'games/dragon_link.html',  title: 'DRAGON MAGIC LINK'},
  link_fruits: { file: 'games/funny_fruits.html', title: 'FUNNY FRUITS LINK'},
};

let jackpot = 24836;

// ============================================================
//  AUTH FLOW
// ============================================================

function switchTab(tab) {
  document.getElementById('cardLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('cardRegister').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabReg').classList.toggle('active', tab === 'register');
  clearErrors();
}

function clearErrors() {
  ['loginError','regError'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('show'); }
  });
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function doLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value;
  if (!user || !pass) { showError('loginError', 'Rellena todos los campos'); return; }
  const result = DB.login(user, pass);
  if (!result.ok) { showError('loginError', result.msg); return; }
  enterSystem();
}

function doRegister() {
  const user = document.getElementById('regUser').value.trim();
  const pass = document.getElementById('regPass').value;
  const pass2 = document.getElementById('regPass2').value;
  if (!user || !pass || !pass2) { showError('regError', 'Rellena todos los campos'); return; }
  if (pass !== pass2) { showError('regError', 'Las contraseñas no coinciden'); return; }
  if (pass.length < 4) { showError('regError', 'Contraseña mínimo 4 caracteres'); return; }
  const result = DB.register(user, pass);
  if (!result.ok) { showError('regError', result.msg); return; }
  enterSystem();
}

function doLogout() {
  DB.logout();
  // reset & show auth
  document.getElementById('lobbyScreen').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  document.getElementById('regUser').value = '';
  document.getElementById('regPass').value = '';
  document.getElementById('regPass2').value = '';
  clearErrors();
  refreshUserList();
}

// Called after successful login or register
function enterSystem() {
  document.getElementById('authScreen').classList.add('hidden');
  // Show boot screen briefly
  const boot = document.getElementById('bootScreen');
  boot.classList.remove('hidden');
  boot.style.animation = 'none'; // reset so it plays
  void boot.offsetWidth;
  boot.style.animation = '';
  setTimeout(() => {
    boot.style.opacity = '0';
    boot.style.transition = 'opacity .5s';
    setTimeout(() => {
      boot.classList.add('hidden');
      boot.style.opacity = '';
      boot.style.transition = '';
      showLobby();
    }, 500);
  }, 2800);
}

function showLobby() {
  const lobby = document.getElementById('lobbyScreen');
  lobby.classList.remove('hidden');
  lobby.classList.add('slide-in');

  // Update user display
  const user = DB.getCurrentUser();
  if (user) {
    document.getElementById('userAvatar').textContent = user.username[0].toUpperCase();
    document.getElementById('userNameDisplay').textContent = user.username.toUpperCase();
    document.getElementById('credDisplay').textContent = user.credits.toLocaleString('es-ES');
  }

  drawMiniWheel();
  startJackpotTick();
  startLinkJackpotTick();
}

// Toggle existing user list under login
function toggleUserList() {
  const el = document.getElementById('existingUsers');
  el.classList.toggle('show');
}

function refreshUserList() {
  const el = document.getElementById('existingUsers');
  const users = DB.getAllUsers();
  if (users.length === 0) { el.innerHTML = '<div style="font-size:11px;color:rgba(255,255,255,.2);text-align:center">Sin usuarios guardados</div>'; return; }
  el.innerHTML = users.map(u => `
    <div class="eu-row" onclick="quickLogin('${u.username}')">
      <span class="eu-name">${u.username}</span>
      <span class="eu-credits">${u.credits.toLocaleString('es-ES')} créd · ${u.gamesPlayed} partidas</span>
    </div>
  `).join('');
}

function quickLogin(username) {
  document.getElementById('loginUser').value = username;
  document.getElementById('loginPass').focus();
  document.getElementById('existingUsers').classList.remove('show');
}

// Auto-restore session if already logged in
window.addEventListener('DOMContentLoaded', () => {
  refreshUserList();
  if (DB.isLoggedIn()) {
    document.getElementById('authScreen').classList.add('hidden');
    enterSystem();
  }
});

// ============================================================
//  LOBBY FUNCTIONS
// ============================================================

function drawMiniWheel() {
  const c = document.getElementById('miniWheel');
  if (!c) return;
  const ctx = c.getContext('2d');
  const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  const nums = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
  const n = nums.length, slice = (2 * Math.PI) / n, cx = 50, cy = 50, r = 48;
  ctx.clearRect(0, 0, 100, 100);
  for (let i = 0; i < n; i++) {
    const num = nums[i];
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, i * slice, (i + 1) * slice);
    ctx.fillStyle = num === 0 ? '#1B7A40' : RED.includes(num) ? '#8B1A1A' : '#111';
    ctx.fill();
    ctx.strokeStyle = '#C9A84C'; ctx.lineWidth = 0.5; ctx.stroke();
  }
  ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
  ctx.fillStyle = '#C9A84C'; ctx.fill();
}

function startJackpotTick() {
  setInterval(() => {
    jackpot += Math.floor(Math.random() * 7) + 1;
    const el = document.getElementById('jackDisplay');
    if (el) el.textContent = jackpot.toLocaleString('es-ES');
  }, 800);
}

function startLinkJackpotTick() {
  let j1 = 50000, j2 = 25000;
  setInterval(() => {
    j1 += Math.floor(Math.random() * 5) + 1;
    j2 += Math.floor(Math.random() * 8) + 2;
    const e1 = document.getElementById('linkJack1');
    const e2 = document.getElementById('linkJack2');
    if (e1) e1.textContent = j1.toLocaleString('es-ES');
    if (e2) e2.textContent = j2.toLocaleString('es-ES');
  }, 600);
}

function filterCat(btn, cat) {
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.game-card').forEach((card, i) => {
    const match = cat === 'all' || card.dataset.cat === cat;
    if (match) {
      card.style.display = '';
      card.style.animationDelay = (i * 0.05) + 's';
      card.classList.remove('card-hide');
      card.classList.add('card-show');
    } else {
      card.classList.add('card-hide');
      setTimeout(() => { if (card.classList.contains('card-hide')) card.style.display = 'none'; }, 200);
    }
  });
}

// ============================================================
//  GAME LAUNCH / EXIT
// ============================================================

function launchGame(gameId) {
  const game = GAME_MAP[gameId];
  if (!game) { alert('Juego próximamente!'); return; }

  // Save current credits to DB before launching
  const user = DB.getCurrentUser();
  const credits = user ? user.credits : 1000;

  const lobby     = document.getElementById('lobbyScreen');
  const container = document.getElementById('gameContainer');
  const frame     = document.getElementById('gameFrame');

  document.getElementById('gameTitleBar').textContent  = game.title;
  document.getElementById('ingameCredits').textContent = credits.toLocaleString('es-ES');

  lobby.classList.remove('slide-in');
  lobby.classList.add('slide-out');
  setTimeout(() => {
    lobby.classList.add('hidden');
    lobby.classList.remove('slide-out');
    container.classList.remove('hidden');
    container.classList.add('slide-in');
    // Pass credits + username to game via URL param so it loads user's balance
    frame.src = game.file + '?u=' + encodeURIComponent(DB.getCurrentKey() || '') + '&c=' + credits;
  }, 280);

  window.addEventListener('message', onGameMessage);
}

function onGameMessage(e) {
  if (!e.data) return;

  // Credits update from game
  if (e.data.type === 'credits') {
    const val = Math.floor(e.data.value);
    DB.setCredits(val);
    const el  = document.getElementById('ingameCredits');
    const el2 = document.getElementById('credDisplay');
    if (el)  el.textContent  = val.toLocaleString('es-ES');
    if (el2) el2.textContent = val.toLocaleString('es-ES');
  }

  // Round recorded from game
  if (e.data.type === 'round') {
    // Normalizamos los datos de la ronda tanto si vienen encapsulados en 'payload' 
    // como si vienen directamente en la raíz (formato que usa nuestro poker.html)
    const roundData = e.data.payload || {
      game: e.data.game,
      bet: e.data.bet,
      win: e.data.win,
      credits: e.data.credits
    };
    
    DB.recordRound(roundData);
  }
}

function exitGame() {
  const lobby     = document.getElementById('lobbyScreen');
  const container = document.getElementById('gameContainer');
  const frame     = document.getElementById('gameFrame');

  container.classList.remove('slide-in');
  container.classList.add('slide-out');
  setTimeout(() => {
    frame.src = '';
    container.classList.add('hidden');
    container.classList.remove('slide-out');
    lobby.classList.remove('hidden');
    lobby.classList.add('slide-in');
    // Refresh credits from DB
    const user = DB.getCurrentUser();
    const creds = user ? user.credits : 0;
    const el = document.getElementById('credDisplay');
    if (el) el.textContent = creds.toLocaleString('es-ES');
  }, 280);

  window.removeEventListener('message', onGameMessage);
}