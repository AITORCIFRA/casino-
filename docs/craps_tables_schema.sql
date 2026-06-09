CREATE TABLE IF NOT EXISTS craps_tables (
    table_id VARCHAR(255) PRIMARY KEY, -- ID único de la mesa (ej: 'craps_high_roller_01')
    minimum_bet INT NOT NULL,          -- Cuota de entrada de la mesa
    max_players INT DEFAULT 8,         -- Número máximo de jugadores permitidos
    status VARCHAR(50) DEFAULT 'open', -- Estado de la mesa (open, full, closed, maintenance)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Opcional: Tabla para guardar el estado actual de una partida si se necesita persistencia
CREATE TABLE IF NOT EXISTS craps_game_state (
    game_id VARCHAR(255) PRIMARY KEY,
    table_id VARCHAR(255) NOT NULL,
    current_point INT DEFAULT 0,       -- El número del punto (0 si no hay punto establecido)
    dice_rolls JSON,                   -- Historial de tiradas de dados (ej: [[2,3], [6,1]])
    bets_data JSON,                    -- Todas las apuestas activas en formato JSON
    players_data JSON,                 -- Datos de los jugadores en la mesa
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (table_id) REFERENCES craps_tables(table_id)
);

-- Opcional: Tabla para registrar las transacciones de cada jugador en la mesa
CREATE TABLE IF NOT EXISTS craps_transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    player_id VARCHAR(255) NOT NULL,
    bet_type VARCHAR(50) NOT NULL,
    bet_amount INT NOT NULL,
    win_amount INT DEFAULT 0,
    transaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES craps_game_state(game_id)
);
