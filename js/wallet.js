/**
 * ARCADE-PREMIUM - Sistema Centralizado de Monedero (Wallet API Client)
 * Versión mejorada para sincronización en tiempo real entre Lobby e Iframes.
 */

const WalletAPI = {
  API_URL: '/api/wallet',

  /**
   * Lee el usuario actual desde ?u= o desde localStorage.
   */
  getUsername() {
    const params = new URLSearchParams(window.location.search);
    const queryUser = params.get('u');
    const storedUser = localStorage.getItem('arcade_user');
    return (queryUser || storedUser || '').trim();
  },

  getCachedBalance() {
    const arcadeCredits = parseInt(localStorage.getItem('arcade_credits'), 10);
    return !Number.isNaN(arcadeCredits) ? arcadeCredits : 0;
  },

  cacheBalance(balance) {
    const cleanBalance = Math.floor(Number(balance) || 0);
    localStorage.setItem('arcade_credits', cleanBalance);
    // Notificar al padre (Lobby) si estamos en un iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'credits', value: cleanBalance }, '*');
    }
    return cleanBalance;
  },

  /**
   * Obtiene el saldo actual del usuario desde la base de datos
   */
  async getBalance() {
    const username = this.getUsername();
    if (!username) return this.getCachedBalance();

    try {
      const response = await fetch(`${this.API_URL}/balance/${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return this.cacheBalance(data.balance || 0);
    } catch (error) {
      console.error('Error al obtener saldo de la BD:', error);
      return this.getCachedBalance();
    }
  },

  /**
   * Registra un movimiento en la base de datos
   */
  async transaccionar(juego, cantidad) {
    const username = this.getUsername();
    if (!username) return { success: false, error: 'USER_NOT_FOUND' };

    const tipo = cantidad < 0 ? 'gasto_juego' : 'premio_juego';

    try {
      const response = await fetch(`${this.API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          game: juego,
          type: tipo,
          amount: Math.floor(cantidad)
        })
      });

      const data = await response.json();
      if (data.success || response.ok) {
        const balance = this.cacheBalance(data.new_balance ?? data.balance ?? 0);
        return { success: true, balance: balance, new_balance: balance };
      }

      return {
        success: false,
        error: data.error || data.message || 'Error en transacción',
        open_shop: data.open_shop || response.status === 402,
        balance: data.balance ?? this.getCachedBalance()
      };
    } catch (error) {
      console.error('Fallo de red, usando fallback local:', error);
      const nuevoSaldo = this.cacheBalance(this.getCachedBalance() + cantidad);
      return { success: true, balance: nuevoSaldo, new_balance: nuevoSaldo };
    }
  },

  /**
   * Abre la tienda en el padre
   */
  openShop() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'open_shop', open_shop: true }, '*');
    } else {
      // Si no hay padre, intentar abrir modal local si existe
      const shopModal = document.getElementById('shopModalNode');
      if (shopModal) shopModal.classList.add('active');
    }
  }
};

// Escuchar actualizaciones de créditos desde el padre
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'credits_updated') {
    const newBalance = Math.floor(event.data.balance);
    localStorage.setItem('arcade_credits', newBalance);
    // Disparar un evento personalizado para que el juego sepa que debe actualizar su UI
    window.dispatchEvent(new CustomEvent('walletUpdated', { detail: { balance: newBalance } }));
  }
});
