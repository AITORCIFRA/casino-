/**
 * ARCADE-PREMIUM - Sistema Centralizado de Monedero (Wallet API Client)
 */

const WalletAPI = {
  // Configura aquí la ruta base de tu API o backend (Node.js, PHP, etc.)
  API_URL: '/api/wallet', 
  USUARIO_ID: 1, // ID del usuario de la sesión actual (hardcodeado temporalmente o dinámico)

  /**
   * Obtiene el saldo actual del usuario desde la base de datos
   */
  async getBalance() {
    try {
      const response = await fetch(`${this.API_URL}/balance?usuario_id=${this.USUARIO_ID}`);
      const data = await response.json();
      if (data.success) {
        return data.creditos;
      }
      return 0;
    } catch (error) {
      console.error("Error al obtener saldo de la BD:", error);
      // Fallback local seguro si se cae el servidor
      return parseInt(localStorage.getItem('casino_credits')) || 0;
    }
  },

  /**
   * Registra un movimiento en la base de datos (Gasto, Premio o Compra)
   * @param {string} juego - Nombre del juego origen (ej: 'dragon_link')
   * @param {number} cantidad - Monto relativo (negativo para restar, positivo para sumar)
   */
  async transaccionar(juego, cantidad) {
    const tipo = cantidad < 0 ? 'gasto_juego' : 'premio_juego';
    
    try {
      const response = await fetch(`${this.API_URL}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.USUARIO_ID,
          juego_origen: juego,
          tipo_movimiento: tipo,
          cantidad: cantidad
        })
      });

      const data = await response.json();
      if (data.success) {
        // Guardamos también en localStorage como espejo/caché por si acaso
        localStorage.setItem('casino_credits', data.nuevo_saldo);
        return { success: true, saldo: data.nuevo_saldo };
      } else {
        return { success: false, error: data.message || 'Error en transacción' };
      }
    } catch (error) {
      console.error("Fallo de red en la transacción, aplicando fallback controlado:", error);
      
      // Fallback transaccional temporal en localStorage si el backend offline
      let localCredits = parseInt(localStorage.getItem('casino_credits')) || 0;
      let nuevoSaldo = localCredits + cantidad;
      if (nuevoSaldo < 0) return { success: false, error: 'insufficient_funds' };
      
      localStorage.setItem('casino_credits', nuevoSaldo);
      return { success: true, saldo: nuevoSaldo };
    }
  }
};