const symbols = ["🍒", "🍋", "⭐", "🔔", "7️⃣"];

let saldo = Number(localStorage.getItem("saldo") || 100);
let nickname = localStorage.getItem("nickname") || "Invitado";

const saldoEl = document.getElementById("saldo");
const nickEl = document.getElementById("nickDisplay");
const msgEl = document.getElementById("message");
const betInput = document.getElementById("bet");

saldoEl.innerText = saldo;
nickEl.innerText = nickname;

document.getElementById("changeNick").addEventListener("click", () => {
  const nuevo = prompt("Introduce tu nickname:", nickname);
  if (nuevo && nuevo.trim() !== "") {
    nickname = nuevo.trim();
    localStorage.setItem("nickname", nickname);
    nickEl.innerText = nickname;
  }
});

document.getElementById("spinBtn").addEventListener("click", spin);

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function setReel(id, value) {
  document.getElementById(id).innerText = value;
}

function setSpinning(state) {
  ["reel1", "reel2", "reel3"].forEach(id => {
    const el = document.getElementById(id);
    if (state) el.classList.add("spinning");
    else el.classList.remove("spinning");
  });
}

function spin() {
  const apuesta = Number(betInput.value);

  if (!apuesta || apuesta <= 0) {
    msgEl.innerText = "Apuesta inválida.";
    return;
  }
  if (apuesta > saldo) {
    msgEl.innerText = "No tienes suficiente saldo.";
    return;
  }

  saldo -= apuesta;
  saldoEl.innerText = saldo;
  localStorage.setItem("saldo", saldo);

  msgEl.innerText = "Girando...";
  setSpinning(true);

  const r1 = randomSymbol();
  const r2 = randomSymbol();
  const r3 = randomSymbol();

  setReel("reel1", "");
  setReel("reel2", "");
  setReel("reel3", "");

  setTimeout(() => setReel("reel1", r1), 300);
  setTimeout(() => setReel("reel2", r2), 600);

  setTimeout(() => {
    setReel("reel3", r3);
    setSpinning(false);

    let ganancia = 0;

    // RTP 70–75%
    if (r1 === r2 && r2 === r3) {
      ganancia = apuesta * 12; // jackpot mejorado
      msgEl.innerText = `💥 JACKPOT! Ganaste ${ganancia}€`;
    } else if (r1 === r2 || r2 === r3 || r1 === r3) {
      ganancia = apuesta * 3; // premio medio mejorado
      msgEl.innerText = `✨ Dos iguales! Ganaste ${ganancia}€`;
    } else {
      if (Math.random() < 0.20) {
        ganancia = apuesta; // devolución 20%
        msgEl.innerText = `🔄 Recuperaste tu apuesta (${ganancia}€)`;
      } else {
        msgEl.innerText = `😢 Mala suerte, perdiste ${apuesta}€`;
      }
    }

    saldo += ganancia;
    saldoEl.innerText = saldo;
    localStorage.setItem("saldo", saldo);

  }, 1000);
}

// TIENDA
document.getElementById("openShop").addEventListener("click", () => {
  document.getElementById("shop").classList.remove("hidden");
});

document.getElementById("closeShop").addEventListener("click", () => {
  document.getElementById("shop").classList.add("hidden");
});

document.querySelectorAll(".shop-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const amount = Number(btn.dataset.amount);
    saldo += amount;
    saldoEl.innerText = saldo;
    localStorage.setItem("saldo", saldo);
  });
});

// Estado inicial
setReel("reel1", "");
setReel("reel2", "");
setReel("reel3", "");
