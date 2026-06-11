// Lista de símbolos disponibles
const symbols = ["cherry", "lemon", "star"];

// Función para obtener un símbolo aleatorio
function randomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Función para mostrar los símbolos en los rodillos
function mostrarResultado(s1, s2, s3) {
    document.getElementById("reel1").innerHTML = s1 ? `<img src="assets/img/symbols/${s1}.png">` : "";
    document.getElementById("reel2").innerHTML = s2 ? `<img src="assets/img/symbols/${s2}.png">` : "";
    document.getElementById("reel3").innerHTML = s3 ? `<img src="assets/img/symbols/${s3}.png">` : "";
}

// Función principal de giro
function spin() {
    // Vaciar rodillos mientras "gira"
    mostrarResultado("", "", "");

    // Simular tiempo de giro
    setTimeout(() => {
        const s1 = randomSymbol();
        const s2 = randomSymbol();
        const s3 = randomSymbol();

        mostrarResultado(s1, s2, s3);

        // Comprobación de victoria
        if (s1 === s2 && s2 === s3) {
            document.getElementById("message").innerText = "¡GANASTE!";
        } else {
            document.getElementById("message").innerText = "Sigue intentando...";
        }
    }, 800);
}

// Evento del botón
document.getElementById("spinBtn").addEventListener("click", spin);

// Rodillos vacíos al cargar la página
mostrarResultado("", "", "");
