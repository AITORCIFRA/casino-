/**
 * ARCADE-PREMIUM - Sistema Centralizado de Monedero (Wallet API Client)
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
    if (!Number.isNaN(arcadeCredits)) return arcadeCredits;

    const casinoCredits = parseInt(localStorage.getItem('casino_credits'), 10);
    if (!Number.isNaN(casinoCredits)) return casinoCredits;

    return 0;
  },

  cacheBalance(balance) {
    localStorage.setItem('arcade_credits', balance);
    localStorage.setItem('casino_credits', balance);
  },

  /**
   * Obtiene el saldo actual del usuario desde la base de datos
   */
  async getBalance() {
    const username = this.getUsername();
    if (!username) {
      console.error('No hay usuario activo para consultar el saldo.');
      return this.getCachedBalance();
    }

    try {
      const response = await fetch(`${this.API_URL}/balance/${encodeURIComponent(username)}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const balance = Math.floor(data.balance || 0);
      this.cacheBalance(balance);
      return balance;
    } catch (error) {
      console.error('Error al obtener saldo de la BD:', error);
      // Fallback local seguro si se cae el servidor
      return this.getCachedBalance();
    }
  },

  /**
   * Registra un movimiento en la base de datos (Gasto, Premio o Compra)
   * @param {string} juego - Nombre del juego origen (ej: 'dragon_link')
   * @param {number} cantidad - Monto relativo (negativo para restar, positivo para sumar)
   */
  async transaccionar(juego, cantidad) {
    const username = this.getUsername();
    const tipo = cantidad < 0 ? 'gasto_juego' : 'premio_juego';

    if (!username) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    try {
      const response = await fetch(`${this.API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          game: juego,
          type: tipo,
          amount: cantidad
        })
      });

      const data = await response.json();
      if (data.success) {
        const balance = Math.floor(data.new_balance ?? data.balance ?? 0);
        // Guardamos también en localStorage como espejo/caché por si acaso
        this.cacheBalance(balance);
        return { success: true, new_balance: balance, balance: balance };
      }

      return {
        success: false,
        error: data.error || data.message || 'Error en transacción',
        open_shop: data.open_shop || response.status === 402,
        balance: data.balance
      };
    } catch (error) {
      console.error('Fallo de red en la transacción, aplicando fallback controlado:', error);

      // Fallback transaccional temporal en localStorage si el backend offline
      const localCredits = this.getCachedBalance();
      const nuevoSaldo = localCredits + cantidad;
      if (nuevoSaldo < 0) {
        return {
          success: false,
          error: 'INSUFFICIENT_FUNDS',
          open_shop: true,
          balance: localCredits
        };
      }

      this.cacheBalance(nuevoSaldo);
      return { success: true, new_balance: nuevoSaldo, balance: nuevoSaldo };
    }
  }
};
