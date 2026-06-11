const ROJO = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const NEGRO = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];

function renderRuleta(container) {
    container.innerHTML = `
        <div class="ruleta-container">
            <h2>🎡 Ruleta clásica</h2>
            <p>Apuesta a color, par/impar o número exacto.</p>

            <label>Tipo de apuesta:</label>
            <select id="tipoApuesta">
                <option value="rojo">Rojo</option>
                <option value="negro">Negro</option>
                <option value="par">Par</option>
                <option value="impar">Impar</option>
                <option value="numero">Número exacto</option>
            </select>

            <input id="numeroExacto" type="number" min="0" max="36" placeholder="0-36" style="display:none;">

            <br><br>
            <input id="apuestaRuleta" type="number" min="1" placeholder="Apuesta (€)">
            <button class="primary" id="btnRuletaPlay">Girar ruleta</button>

            <div class="ruleta-result" id="ruletaResult"></div>
        </div>
    `;

    const tipoSelect = container.querySelector("#tipoApuesta");
    const numeroInput = container.querySelector("#numeroExacto");
    const btnPlay = container.querySelector("#btnRuletaPlay");
    const resultDiv = container.querySelector("#ruletaResult");

    tipoSelect.addEventListener("change", () => {
        numeroInput.style.display = tipoSelect.value === "numero" ? "inline-block" : "none";
    });

    btnPlay.addEventListener("click", () => {
        const apuesta = Number(container.querySelector("#apuestaRuleta").value);
        const tipo = tipoSelect.value;
        const numeroExacto = Number(numeroInput.value);

        if (!apuesta || apuesta <= 0) {
            resultDiv.innerText = "Apuesta inválida.";
            return;
        }
        if (apuesta > CasinoState.saldo) {
            resultDiv.innerText = "No tienes suficiente saldo.";
            return;
        }

        CasinoState.saldo -= apuesta;

        const bola = Math.floor(Math.random() * 37);
        let gana = false;
        let multiplicador = 0;

        if (tipo === "rojo" && ROJO.includes(bola)) { gana = true; multiplicador = 2; }
        if (tipo === "negro" && NEGRO.includes(bola)) { gana = true; multiplicador = 2; }
        if (tipo === "par" && bola !== 0 && bola % 2 === 0) { gana = true; multiplicador = 2; }
        if (tipo === "impar" && bola % 2 === 1) { gana = true; multiplicador = 2; }
        if (tipo === "numero" && bola === numeroExacto) { gana = true; multiplicador = 35; }

        if (gana) {
            const ganancia = apuesta * multiplicador;
            CasinoState.saldo += ganancia;
            resultDiv.innerText = `La bola cayó en ${bola}. GANASTE ${ganancia}€`;
        } else {
            resultDiv.innerText = `La bola cayó en ${bola}. Perdiste ${apuesta}€`;
        }

        CasinoUpdateUI();
    });
}
