// ===== ARCADE PREMIUM — DATABASE v4 =====
const DB_KEY = 'arcadePremiumDB';

const DB = {

  init() {
    if (!localStorage.getItem(DB_KEY)) {
      localStorage.setItem(DB_KEY, JSON.stringify({ users: {}, currentUser: null }));
    }
    return this;
  },

  _get() { return JSON.parse(localStorage.getItem(DB_KEY)); },
  _save(data) { localStorage.setItem(DB_KEY, JSON.stringify(data)); },

  // ---- USERS ----
  // ---- USERS MODIFICADO AUTOMÁTICAMENTE PARA SOPORTAR NIVELES Y ADAPTACIÓN ----
 register(username, password) {
    const data = this._get();
    const key = username.trim().toLowerCase();
    if (!key || key.length < 3) return { ok: false, msg: 'Usuario debe tener al menos 3 caracteres' };
    if (data.users[key]) return { ok: false, msg: 'Ese usuario ya existe' };
    const id = 'ARC-' + Math.random().toString(36).substr(2,6).toUpperCase();
    
    data.users[key] = {
      username: username.trim(),
      password: this._hash(password),
      id,
      credits: 50000, 
      level: 1,
      xp: 0,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${username.trim()}`,
      gameStats: {
         fruits: { partidas: 0, ganadas: 0 },
         poker: { partidas: 0, ganadas: 0 },
         blackjack: { partidas: 0, ganadas: 0 },
         slots: { partidas: 0, ganadas: 0 },
         roulette: { partidas: 0, ganadas: 0 },
         mines: { partidas: 0, ganadas: 0 },
         crash: { partidas: 0, ganadas: 0 },
         dragon_link: { partidas: 0, ganadas: 0 }
      },
      createdAt: Date.now(),
      lastSeen: Date.now(),
      totalSpent: 0,
      totalWon: 0,
      gamesPlayed: 0,
      history: [],
      friends: [],
      friendRequests: [],
      sentRequests: []
    };
    this._save(data);
    return { ok: true, msg: 'Usuario registrado con éxito' };
  },

  login(username, password) {
    const data = this._get();
    const key = username.trim().toLowerCase();
    const user = data.users[key];
    if (!user) return { ok: false, msg: 'Usuario no encontrado' };
    if (user.password !== this._hash(password)) return { ok: false, msg: 'Contraseña incorrecta' };
    user.lastSeen = Date.now();
    data.currentUser = key;
    this._save(data);
    return { ok: true, user };
  },

  logout() {
    const data = this._get();
    data.currentUser = null;
    this._save(data);
  },

  getCurrentUser() {
    const data = this._get();
    if (!data.currentUser) return null;
    return data.users[data.currentUser] || null;
  },

  getCurrentKey() { return this._get().currentUser; },
  isLoggedIn() { return !!this.getCurrentKey(); },

  _updateUser(fn) {
    const data = this._get();
    const key = data.currentUser;
    if (!key || !data.users[key]) return;
    fn(data.users[key], data);
    this._save(data);
  },

  // ---- CREDITS ----
  getCredits() { const u = this.getCurrentUser(); return u ? u.credits : 0; },
  setCredits(amount) {
    this._updateUser(u => { u.credits = Math.max(0, Math.floor(amount)); });
  },
  addCredits(amount) { this.setCredits(this.getCredits() + amount); },

  // ---- HISTORY / STATS ----
  recordRound({ game, bet, win, credits, details = {} }) {
    this._updateUser(u => {
      const entry = {
        ts: Date.now(), game,
        bet: Math.floor(bet), win: Math.floor(win),
        net: Math.floor(win - bet),
        credits: Math.floor(credits), details,
      };
      u.history.unshift(entry);
      if (u.history.length > 200) u.history = u.history.slice(0, 200);
      u.totalSpent  += entry.bet;
      u.totalWon    += entry.win;
      u.gamesPlayed += 1;
      u.credits      = entry.credits;
    });
    this.checkAchievements();
  },

  getStats() {
    const u = this.getCurrentUser();
    if (!u) return null;
    const h = u.history;
    const totalBet = u.totalSpent || 0;
    const totalWon = u.totalWon  || 0;
    const rtp      = totalBet > 0 ? ((totalWon / totalBet) * 100).toFixed(1) : '—';
    const wins     = h.filter(r => r.net > 0).length;
    const winRate  = h.length > 0 ? ((wins / h.length) * 100).toFixed(1) : '—';
    const bigWin   = h.reduce((m, r) => Math.max(m, r.win), 0);
    const streak   = calcStreak(h);
    const byGame   = {};
    h.forEach(r => {
      if (!byGame[r.game]) byGame[r.game] = { rounds: 0, spent: 0, won: 0 };
      byGame[r.game].rounds++;
      byGame[r.game].spent += r.bet;
      byGame[r.game].won   += r.win;
    });
    return { rtp, winRate, bigWin, streak, byGame, gamesPlayed: u.gamesPlayed, totalBet, totalWon };
  },

  // ---- FRIENDS ----
  // Busca usuario por ID público (ARC-XXXXXX) o por nombre
  findUser(query) {
    const data = this._get();
    const q = query.trim().toLowerCase();
    const byKey  = data.users[q];
    if (byKey) return { key: q, user: byKey };
    const byId   = Object.entries(data.users).find(([,u]) => u.id && u.id.toLowerCase() === q);
    if (byId) return { key: byId[0], user: byId[1] };
    return null;
  },

  sendFriendRequest(targetQuery) {
    const data    = this._get();
    const myKey   = data.currentUser;
    const me      = data.users[myKey];
    if (!me) return { ok: false, msg: 'No hay sesión' };

    const found = this.findUser(targetQuery);
    if (!found) return { ok: false, msg: 'Usuario no encontrado' };
    const { key: targetKey, user: target } = found;

    if (targetKey === myKey) return { ok: false, msg: 'No puedes agregarte a ti mismo' };
    if (me.friends.includes(targetKey)) return { ok: false, msg: 'Ya sois amigos' };
    if (me.sentRequests.includes(targetKey)) return { ok: false, msg: 'Solicitud ya enviada' };
    if (target.sentRequests && target.sentRequests.includes(myKey)) {
      // Ya nos envió solicitud — aceptar directamente
      return this.acceptFriendRequest(myKey, targetKey);
    }

    if (!me.sentRequests) me.sentRequests = [];
    if (!target.friendRequests) target.friendRequests = [];
    if (!target.notifications) target.notifications = [];

    me.sentRequests.push(targetKey);
    target.friendRequests.push({ from: myKey, fromName: me.username, ts: Date.now() });
    target.notifications.unshift({
      id: Date.now() + Math.random(),
      type: 'friend_request',
      msg: `${me.username} te ha enviado una solicitud de amistad`,
      ts: Date.now(), read: false,
      meta: { from: myKey }
    });

    this._save(data);
    return { ok: true, msg: `Solicitud enviada a ${target.username}` };
  },

  acceptFriendRequest(myKey, fromKey) {
    const data = this._get();
    const me   = data.users[myKey || data.currentUser];
    const from = data.users[fromKey];
    if (!me || !from) return { ok: false, msg: 'Usuario no encontrado' };

    // Add each other
    if (!me.friends.includes(fromKey))   me.friends.push(fromKey);
    if (!from.friends.includes(myKey || data.currentUser)) from.friends.push(myKey || data.currentUser);

    // Remove pending requests
    me.friendRequests  = (me.friendRequests  || []).filter(r => r.from !== fromKey);
    from.sentRequests  = (from.sentRequests  || []).filter(k => k !== (myKey || data.currentUser));

    // Notify the requester
    if (!from.notifications) from.notifications = [];
    from.notifications.unshift({
      id: Date.now() + Math.random(),
      type: 'friend_accepted',
      msg: `${me.username} aceptó tu solicitud de amistad 🎉`,
      ts: Date.now(), read: false,
    });

    this._save(data);
    return { ok: true };
  },

  rejectFriendRequest(fromKey) {
    const data  = this._get();
    const myKey = data.currentUser;
    const me    = data.users[myKey];
    if (!me) return;
    me.friendRequests = (me.friendRequests || []).filter(r => r.from !== fromKey);
    const from = data.users[fromKey];
    if (from) from.sentRequests = (from.sentRequests || []).filter(k => k !== myKey);
    this._save(data);
  },

  removeFriend(friendKey) {
    const data  = this._get();
    const myKey = data.currentUser;
    const me    = data.users[myKey];
    const them  = data.users[friendKey];
    if (!me) return;
    me.friends = (me.friends || []).filter(k => k !== friendKey);
    if (them) them.friends = (them.friends || []).filter(k => k !== myKey);
    this._save(data);
  },

  getFriendList() {
    const data  = this._get();
    const myKey = data.currentUser;
    const me    = data.users[myKey];
    if (!me) return [];
    return (me.friends || []).map(key => {
      const u = data.users[key];
      if (!u) return null;
      return {
        key, username: u.username, id: u.id,
        credits: u.credits, gamesPlayed: u.gamesPlayed,
        lastSeen: u.lastSeen,
      };
    }).filter(Boolean);
  },

  // ---- NOTIFICATIONS ----
  getNotifications() {
    const u = this.getCurrentUser();
    return u ? (u.notifications || []) : [];
  },

  markAllRead() {
    this._updateUser(u => {
      (u.notifications || []).forEach(n => n.read = true);
    });
  },

  clearNotification(id) {
    this._updateUser(u => {
      u.notifications = (u.notifications || []).filter(n => n.id !== id);
    });
  },

  unreadCount() {
    const u = this.getCurrentUser();
    return u ? (u.notifications || []).filter(n => !n.read).length : 0;
  },

  // ---- ACHIEVEMENTS ----
  ACHIEVEMENTS: {
    first_spin:     { name: 'Primera apuesta',    desc: 'Juega tu primera partida',              icon: '🎰', req: u => u.gamesPlayed >= 1 },
    ten_games:      { name: 'Calentando motores',  desc: 'Juega 10 partidas',                     icon: '🔥', req: u => u.gamesPlayed >= 10 },
    hundred_games:  { name: 'Veterano',            desc: 'Juega 100 partidas',                    icon: '🏅', req: u => u.gamesPlayed >= 100 },
    big_winner:     { name: 'Gran ganador',        desc: 'Gana 500 créditos en una sola partida', icon: '💰', req: u => (u.history||[]).some(r => r.win >= 500) },
    mega_winner:    { name: 'MEGA WIN',            desc: 'Gana 5.000 créditos en una sola partida',icon:'💎', req: u => (u.history||[]).some(r => r.win >= 5000) },
    jackpot_hunter: { name: 'Cazador de jackpots', desc: 'Gana un jackpot en cualquier Link',     icon: '🏆', req: u => (u.history||[]).some(r => r.details && r.details.jackpot) },
    social:         { name: 'Social',              desc: 'Añade tu primer amigo',                 icon: '🤝', req: u => (u.friends||[]).length >= 1 },
    high_roller:    { name: 'High Roller',         desc: 'Apuesta 100+ créditos en una partida',  icon: '💸', req: u => (u.history||[]).some(r => r.bet >= 100) },
    millionaire:    { name: 'Millonario',          desc: 'Acumula 10.000 créditos ganados en total',icon:'🤑',req: u => u.totalWon >= 10000 },
    loyal:          { name: 'Fiel al casino',      desc: 'Lleva 7 días registrado',               icon: '⭐', req: u => (Date.now() - u.createdAt) >= 7*24*60*60*1000 },
  },

  checkAchievements() {
    const data  = this._get();
    const myKey = data.currentUser;
    const u     = data.users[myKey];
    if (!u) return;
    if (!u.achievements) u.achievements = {};

    let changed = false;
    for (const [key, ach] of Object.entries(this.ACHIEVEMENTS)) {
      if (!u.achievements[key] && ach.req(u)) {
        u.achievements[key] = { unlockedAt: Date.now() };
        if (!u.notifications) u.notifications = [];
        u.notifications.unshift({
          id: Date.now() + Math.random(),
          type: 'achievement',
          msg: `🏅 Logro desbloqueado: ${ach.icon} ${ach.name}`,
          ts: Date.now(), read: false,
        });
        changed = true;
      }
    }
    if (changed) this._save(data);
  },

  getAchievements() {
    const u = this.getCurrentUser();
    const unlocked = u ? (u.achievements || {}) : {};
    return Object.entries(this.ACHIEVEMENTS).map(([key, ach]) => ({
      key, ...ach,
      unlocked: !!unlocked[key],
      unlockedAt: unlocked[key]?.unlockedAt || null,
    }));
  },

  // ---- PURCHASE ----
  purchase(packageCredits, cost) {
    const data  = this._get();
    const myKey = data.currentUser;
    if (!myKey || !data.users[myKey]) return false;
    data.users[myKey].credits += packageCredits;
    if (!data.users[myKey].purchases) data.users[myKey].purchases = [];
    data.users[myKey].purchases.push({ ts: Date.now(), credits: packageCredits, cost });
    this._save(data);
    return true;
  },

  // ---- UTILS ----
  getAllUsers() {
    const data = this._get();
    return Object.values(data.users).map(u => ({
      username: u.username, id: u.id,
      credits: u.credits, gamesPlayed: u.gamesPlayed, lastSeen: u.lastSeen,
    }));
  },

  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return h.toString(36);
  },
};

function calcStreak(history) {
  if (!history.length) return { type: 'none', count: 0 };
  let count = 1, type = history[0].net > 0 ? 'win' : 'lose';
  for (let i = 1; i < history.length; i++) {
    const cur = history[i].net > 0 ? 'win' : 'lose';
    if (cur === type) count++; else break;
  }
  return { type, count };
}

DB.init();