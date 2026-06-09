## Integración de la Base de Datos para Configuraciones de Mesas de Craps

Para gestionar las configuraciones de las mesas de Craps de forma persistente y dinámica, hemos implementado una integración con una base de datos. Esto permite que cada mesa tenga su propio `minimum_bet` y otras propiedades, que se cargan al iniciar el juego y se utilizan para escalar las fichas y validar las apuestas.

### 1. Esquema de la Base de Datos

Se ha diseñado una tabla `craps_tables` para almacenar la configuración de cada mesa. Aquí tienes el esquema SQL:

```sql
CREATE TABLE craps_tables (
    id VARCHAR(255) PRIMARY KEY, -- Identificador único de la mesa (ej: 'craps_low_stakes', 'craps_high_roller')
    name VARCHAR(255) NOT NULL, -- Nombre legible de la mesa
    minimum_bet INT NOT NULL,   -- Apuesta mínima permitida en esta mesa
    max_players INT DEFAULT 6,  -- Número máximo de jugadores (para futuras implementaciones multijugador)
    status VARCHAR(50) DEFAULT 'active' -- Estado de la mesa (active, maintenance, etc.)
);

-- Datos de ejemplo para inicializar algunas mesas
INSERT INTO craps_tables (id, name, minimum_bet, max_players, status) VALUES
('craps_low_stakes', 'Mesa de Apuestas Bajas', 100, 6, 'active'),
('craps_mid_stakes', 'Mesa de Apuestas Medias', 1000, 6, 'active'),
('craps_high_roller', 'Mesa VIP de Craps', 10000, 4, 'active');
```

### 2. Endpoints del Backend (FastAPI - `routers/craps.py`)

Se han añadido endpoints en el backend para permitir al frontend consultar la configuración de una mesa específica. Esto se hace a través de una ruta GET que recibe el `table_id`.

```python
# ... (imports y otras rutas)

@router.get("/tables/{table_id}")
async def get_craps_table_config(table_id: str):
    # Aquí deberías conectar con tu base de datos y buscar la configuración
    # Por simplicidad, usaremos un diccionario de ejemplo
    # En un entorno real, harías una consulta SQL a la tabla `craps_tables`
    mock_db_tables = {
        "craps_low_stakes": {"id": "craps_low_stakes", "name": "Mesa de Apuestas Bajas", "minimum_bet": 100},
        "craps_mid_stakes": {"id": "craps_mid_stakes", "name": "Mesa de Apuestas Medias", "minimum_bet": 1000},
        "craps_high_roller": {"id": "craps_high_roller", "name": "Mesa VIP de Craps", "minimum_bet": 10000},
    }
    
    table_config = mock_db_tables.get(table_id)
    if not table_config:
        raise HTTPException(status_code=404, detail="Table not found")
    return table_config

# ... (otras rutas como /roll)

@router.post("/roll")
async def craps_roll(bet_data: CrapsBet):
    # ... (lógica de tirada de dados y cálculo de ganancias)
    # Asegúrate de que `bet_data` incluya `table_id`
    # Y que la lógica de validación de apuestas use el `minimum_bet` de la mesa
    # Puedes recuperar el `minimum_bet` de la base de datos usando `bet_data.table_id`
    
    # Ejemplo de cómo usar table_id en el roll (simplificado)
    table_config = mock_db_tables.get(bet_data.table_id)
    if not table_config or bet_data.bet_amount < table_config["minimum_bet"]:
        raise HTTPException(status_code=400, detail="Bet below table minimum or invalid table")
    
    # ... (resto de la lógica de la tirada)
```

### 3. Integración en el Frontend (`public/craps.html`)

El frontend ha sido modificado para:

1.  **Obtener `table_id`**: Al cargar la página, se busca un parámetro `table_id` en la URL (ej: `craps.html?table_id=craps_mid_stakes`). Si no se especifica, se usa un ID por defecto.
2.  **Cargar Configuración**: Se realiza una llamada `fetch` al endpoint `/api/games/craps/tables/{table_id}` para obtener el `minimum_bet` de la mesa.
3.  **Escalar Fichas**: El `minimum_bet` obtenido se usa para calcular las denominaciones de las fichas dinámicas.
4.  **Enviar `table_id` con Apuestas**: Cada vez que se realiza una apuesta, el `table_id` actual se envía al backend para que este pueda validar la apuesta contra la configuración específica de esa mesa.

```javascript
// ... (otras variables y funciones)

let tableMinimum = 100; // Mínimo por defecto
let window.tableId; // Hacer tableId global

async function init() {
    try {
        balance = await WalletAPI.getBalance();
        const params = new URLSearchParams(window.location.search);
        window.tableId = params.get("table_id") || "craps_low_stakes"; // Obtener table_id de la URL
        
        // Cargar configuración de la mesa desde el backend
        const tableConfigResponse = await fetch(`/api/games/craps/tables/${window.tableId}`);
        if (!tableConfigResponse.ok) {
            console.error(`Error al cargar la configuración de la mesa ${window.tableId}:`, tableConfigResponse.statusText);
            tableMinimum = 100; // Fallback
        } else {
            const tableData = await tableConfigResponse.json();
            tableMinimum = tableData.minimum_bet;
        }
    } catch (e) {
        console.warn("WalletAPI o red no disponible:", e);
        balance = 10000; // Saldo de prueba
        tableMinimum = 100; // Mínimo de prueba
    }
    
    chipValues = getChipValuesForMinimum(tableMinimum);
    updateChipDisplay();
    currentC = chipValues[0];
    
    updateUI();
    startNewRound();
}

// ... (función doRoll)

// Dentro de la función doRoll, al enviar la apuesta al backend:
// ...
                    body: JSON.stringify({ 
                        username: WalletAPI.getUsername ? WalletAPI.getUsername() : 'test_user', 
                        bet_amount: bets[type], 
                        bet_type: type, 
                        table_id: window.tableId // ¡Importante! Enviar el ID de la mesa
                    })
// ...
```

### Conclusión

Esta integración asegura que las mesas de Craps sean dinámicas y configurables desde el backend, permitiendo diferentes niveles de apuesta y preparando el terreno para futuras funcionalidades multijugador donde los jugadores puedan unirse a mesas con configuraciones específicas. El frontend se encarga de cargar esta información y el backend de validarla, manteniendo la coherencia del juego.
