# 🎰 ARCADE PREMIUM — Estructura del Proyecto

## Descripción
Plataforma de juegos de casino estilo máquina arcade (inspirada en el concepto Manhattan Premium de Unidesa). Pantalla de lobby animada con selección de juegos, transiciones fluidas entre juegos, y comunicación de créditos entre pantallas.

---

## 📁 Estructura de Archivos

```
arcade-casino/
│
├── public/
│   ├── index.html              ← LOBBY PRINCIPAL y fuente única de verdad
│   ├── slots.html              ✅ Lucky Sevens — Video Slot 5 rodillos
│   ├── magic_trakka.html       ✅ Magic Trakka — Slot de bonos
│   ├── blackjack.html          ✅ Blackjack — 21 con doble y blackjack natural
│   ├── roulette.html           ✅ Ruleta Europea — 37 números, apuestas completas
│   ├── keno.html               ✅ Keno Turbo — 80 números, elige hasta 10
│   ├── mines.html              ✅ Mines Arcade — esquiva minas y multiplica
│   ├── crash.html              ✅ Crash — retira antes del impacto
│   ├── poker.html              ✅ Texas Hold'em — mesa premium
│   └── 3_en_1.html             ✅ Link Triple — Dragon, Fruits Party y Funny Fruits
│
├── css/
│   └── lobby.css               ← Estilos históricos del lobby
│
└── js/
    ├── lobby.js                ← Stub intencional para evitar lógica duplicada
    └── particles.js            ← Sistema de partículas ambientales (canvas)
```

---

## 🎮 Juegos Implementados

### 1. LOBBY (index.html)
- **Boot screen** con animación de arranque tipo sistema
- **Partículas ambientales** en canvas (80 partículas flotantes)
- **Cards de juego** con arte animado por juego (rodillos, orbes, bolas, etc.)
- **Filtro por categorías**: Todos / Video Slots / Video Link / Mesa / Keno
- **Jackpot en tiempo real** que sube automáticamente
- **Ticker de noticias** en la barra inferior
- **Transición suave** al entrar/salir de cada juego (slide + fade)
- **Comunicación de créditos** via `window.postMessage` desde los juegos al lobby
- **Scanlines** overlay para estética arcade

---

### 2. LUCKY SEVENS — Video Slot (`games/slots.html`)
- **5 rodillos × 3 filas**
- 10 símbolos con pesos diferenciados (7, 💎, ⭐, 🔔, 🍒, 🍋, 🍊, 🍇, BAR, 🍀)
- **Animación de giro** con stagger por rodillo y easing
- **Tabla de pagos**: desde ×3 hasta ×500
- Botones: BET -, BET +, GIRAR, AUTO (auto-spin)
- Mensajes animados: BIG WIN / MEGA WIN
- Apuestas: 1, 2, 5, 10, 25, 50

---

### 3. RULETA EUROPEA (`games/roulette.html`)
- **Ruleta de 37 números** (0-36) dibujada en Canvas
- **Animación de giro** con physics (ease-out cuártico)
- **Apuestas externas**: Rojo/Negro, Par/Impar, 1-18/19-36, Docenas, Columnas
- **Pleno** en cualquier número (paga 35:1)
- **Fichas**: 1, 5, 10, 25, 100
- Combinación de múltiples apuestas simultáneas
- Historial de apuestas pendientes
- Saldo recargable automáticamente

---

### 4. BLACKJACK (`games/blackjack.html`)
- **Baraja francesa** completa, barajada aleatoriamente
- **Acciones**: Repartir, Carta (Hit), Plantarse (Stand), Doblar (Double Down)
- **Blackjack natural** paga 3:2
- **Crupier** dibuja hasta 17+
- Chips de apuesta: 5, 10, 25, 50, 100
- Animaciones de reparto de cartas

---

### 5. KENO TURBO (`games/keno.html`)
- **80 números** en cuadrícula
- **Elige hasta 10 números** manualmente o con Selección Rápida
- **20 bolas** extraídas con animación secuencial
- **Tabla de pagos dinámica** según cuántos números elegiste
- Aciertos desde ×2 hasta ×10.000
- Apuestas: 1, 2, 5, 10, 25, 50, 100

---

## 🔧 Cómo Usar

1. Abre `index.html` en cualquier navegador moderno (Chrome, Firefox, Edge)
2. Espera la animación de arranque (~3 segundos)
3. Selecciona cualquier juego del lobby
4. Usa el botón "← VOLVER AL LOBBY" para regresar
5. Los créditos se sincronizan entre el lobby y los juegos

> ⚠️ Los juegos se cargan en un `<iframe>`. Por seguridad, abre el archivo con un servidor local si hay restricciones CORS (puedes usar Live Server en VS Code, o `python -m http.server 8080`).

---

## 📡 Comunicación Lobby ↔ Juegos

Los juegos envían actualizaciones de créditos al lobby mediante:

```javascript
window.parent.postMessage({ type: 'credits', value: creditsValue }, '*');
```

El lobby escucha en `public/index.html` con:

```javascript
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'credits') {
    credits = e.data.value;
    // actualiza display
  }
});
```

---

## 🎨 Stack Tecnológico

| Elemento       | Tecnología        |
|----------------|-------------------|
| Framework      | Vanilla HTML/CSS/JS (sin dependencias) |
| Canvas         | Web Canvas API (ruleta, partículas, mini-wheel) |
| Tipografía     | Google Fonts: Bebas Neue, Orbitron, Rajdhani |
| Animaciones    | CSS Keyframes + requestAnimationFrame |
| Comunicación   | window.postMessage API |
| Fuentes externas | Solo Google Fonts (sin npm, sin bundler) |

---

## 🚀 Expansión Futura

```
public/
├── magic_trakka.html     → Slot con mecánica de bonos
├── mines.html            → Juego de riesgo con multiplicadores
├── crash.html            → Juego de multiplicador creciente
└── 3_en_1.html           → Link triple con Dragon, Party y Funny

js/
├── credits.js            → Sistema de créditos global centralizado
├── sound.js              → Efectos de sonido (Web Audio API)
└── achievements.js       → Sistema de logros

css/
└── themes.css            → Temas alternativos (día/noche, navidad, etc.)
```

---

## 📋 Notas de Diseño

El diseño sigue una estética **arcade premium oscuro** con:
- Paleta dominante: Negro profundo + Dorado (#C9A84C) + Acentos de neón
- Tipografía display: Bebas Neue (impacto visual)
- UI/números: Orbitron (feel digital/arcade)
- Cuerpo: Rajdhani (legible, técnico)
- Scanlines sutiles para evocar pantallas CRT de máquinas recreativas
- Partículas flotantes para dar profundidad atmosférica
