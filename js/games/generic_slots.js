const SYMBOLS = [
  { id: 'cherry', img: 'assets/slots/cherry.png', name: 'Cereza', pays: [0, 0, 10, 50, 200], weight: 8 },
  { id: 'lemon', img: 'assets/slots/lemon.png', name: 'Limón', pays: [0, 0, 15, 60, 250], weight: 7 },
  { id: 'diamond', img: 'assets/slots/diamond.png', name: 'Diamante', pays: [0, 0, 50, 200, 1000], weight: 2 },
  { id: 'seven', img: 'assets/slots/seven.png', name: 'Siete', pays: [0, 0, 100, 500, 2500], weight: 1 },
  { id: 'bar', img: 'assets/slots/bar.png', name: 'BAR', pays: [0, 0, 20, 100, 500], weight: 5 }
];
const SYMBOL_POOL = [];
SYMBOLS.forEach(s => { for (let i = 0; i < s.weight; i++) SYMBOL_POOL.push(s); });
const state = {
  saldo: Number(localStorage.getItem('arcade_credits') || 100000),
  betIndex: 0, betLevels: [1, 5, 10, 50, 100, 500], spinning: false
};
function updateUI() {
  document.getElementById('balance').textContent = state.saldo.toLocaleString();
  document.getElementById('betValue').textContent = state.betLevels[state.betIndex] + '€';
  localStorage.setItem('arcade_credits', state.saldo);
}
// ... (resto de la lógica simplificada para que funcione)
function init() { updateUI(); }
window.onload = init;
