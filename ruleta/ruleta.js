let saldo = Number(localStorage.getItem("saldo") || 100);
let nickname = localStorage.getItem("nickname") || "Invitado";

document.getElementById("saldo").innerText = saldo;
document.getElementById("nickDisplay").innerText = nickname;
// Generar números del tapete

const tapete = document.getElementById("tapete");
let numeroSeleccionado = null;

for (let i = 0; i <= 36; i++) {
  const div = document.createElement("div");
  div.classList.add("numero");
  div.innerText = i;

  div.addEventListener("click", () => {
    document.querySelectorAll(".numero").forEach(n => n.classList.remove("seleccionado"));
    div.classList.add("seleccionado");
    numeroSeleccionado = i;
  });

  tapete.appendChild(div);
}

const ruletaImg = document.getElementById("ruletaImg");
const bola = document.getElementById("bola");
const historial = document.getElementById("historial");

let numeroGanador = null;

// Números de la ruleta en orden real
const numeros = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6,
  27, 13, 36, 11, 30, 8, 23, 10, 5, 24,
  16, 33, 1, 20, 14, 31, 9, 22, 18, 29,
  7, 28, 12, 35, 3, 26
];

// RTP mínimo 70%
function generarNumeroConRTP() {
  const apuesta = Number(document.getElementById("apuesta").value);
  const numeroApostado = Number(document.getElementById("numero").value);

  // 70% de las veces NO cae en tu número
  if (Math.random() < 0.70) {
    let n;
    do {
      n = numeros[Math.floor(Math.random() * numeros.length)];
    } while (n === numeroApostado);
    return n;
  }

  // 30% de las veces sí cae
  return numeroApostado;
}

document.getElementById("lanzarBtn").addEventListener("click", () => {
  const giro = 360 * 8 + Math.floor(Math.random() * 360);
  ruletaImg.style.transform = `rotate(${giro}deg)`;

  const bolaGiro = 360 * 6 + Math.floor(Math.random() * 360);
  bola.style.transform = `rotate(${bolaGiro}deg)`;
});

document.getElementById("apostarBtn").addEventListener("click", () => {
  const apuesta = Number(document.getElementById("apuesta").value);
  const numeroApostado = Number(document.getElementById("numero").value);

  if (!apuesta || apuesta <= 0) {
    alert("Apuesta inválida");
    return;
  }

  if (apuesta > saldo) {
    alert("No tienes suficiente saldo");
    return;
  }

  if (numeroApostado < 0 || numeroApostado > 36) {
    alert("Número inválido");
    return;
  }

  saldo -= apuesta;
  document.getElementById("saldo").innerText = saldo;

  numeroGanador = generarNumeroConRTP();

  historial.innerHTML = `<b>${numeroGanador}</b> ` + historial.innerHTML;

  if (numeroGanador === numeroApostado) {
    const premio = apuesta * 35;
    saldo += premio;
    alert(`🎉 ¡Ganaste ${premio}€!`);
  } else {
    alert(`❌ Perdiste. Salió el ${numeroGanador}`);
  }

  localStorage.setItem("saldo", saldo);
  document.getElementById("saldo").innerText = saldo;
});
