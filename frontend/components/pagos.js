function renderPagos(container) {
    container.innerHTML = `
        <div class="pagos-container">
            <h2>💳 Pagos / Recargas</h2>
            <p>(Simulado por ahora, sin Stripe real)</p>
            <p>Recarga tu saldo para seguir perdiendo dinero con estilo, ${CasinoState.nickname}.</p>

            <input id="cantidadRecarga" type="number" min="1" placeholder="Cantidad a recargar (€)">
            <button class="primary" id="btnRecargar">Recargar saldo</button>

            <p id="pagosMsg"></p>
        </div>
    `;

    const btnRecargar = container.querySelector("#btnRecargar");
    const msg = container.querySelector("#pagosMsg");

    btnRecargar.addEventListener("click", () => {
        const cantidad = Number(container.querySelector("#cantidadRecarga").value);
        if (!cantidad || cantidad <= 0) {
            msg.innerText = "Cantidad inválida.";
            return;
        }

        // Aquí en el futuro: llamada al backend / Stripe
        CasinoState.saldo += cantidad;
        CasinoUpdateUI();
        msg.innerText = `Has recargado ${cantidad}€. Nuevo saldo: ${CasinoState.saldo}€`;
    });
}
