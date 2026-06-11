// Estado global simple
const state = {
    nickname: localStorage.getItem("nickname") || "Invitado",
    saldo: Number(localStorage.getItem("saldo") || 100)
};

function actualizarUI() {
    document.getElementById("nicknameDisplay").innerText = state.nickname;
    document.getElementById("saldoDisplay").innerText = state.saldo.toString();
    localStorage.setItem("nickname", state.nickname);
    localStorage.setItem("saldo", state.saldo.toString());
}

// Cambio de vista
function mostrarVista(view) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById(`view-${view}`).classList.remove("hidden");
}

// Inicializar menú
function initMenu() {
    document.querySelectorAll(".menu button").forEach(btn => {
        btn.addEventListener("click", () => {
            const view = btn.getAttribute("data-view");
            mostrarVista(view);
        });
    });
}

// Nickname
function initNickname() {
    document.getElementById("btnSetNick").addEventListener("click", () => {
        const nick = prompt("Introduce tu nickname:", state.nickname);
        if (nick && nick.trim().length > 0) {
            state.nickname = nick.trim();
            actualizarUI();
        }
    });
}

// Exponer helpers para componentes
window.CasinoState = state;
window.CasinoUpdateUI = actualizarUI;

window.addEventListener("DOMContentLoaded", () => {
    actualizarUI();
    initMenu();
    initNickname();

    // Montar componentes
    renderSlots(document.getElementById("view-slots"));
    renderRuleta(document.getElementById("view-ruleta"));
    renderPagos(document.getElementById("view-pagos"));

    // Vista por defecto
    mostrarVista("slots");
});
