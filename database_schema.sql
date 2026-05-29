CREATE DATABASE IF NOT EXISTS arcade_premium_db;
USE arcade_premium_db;

-- TABLA MAESTRA DE USUARIOS VIP Y CRÉDITOS
CREATE TABLE IF NOT EXISTS players (
    username VARCHAR(50) PRIMARY KEY,
    credits BIGINT DEFAULT 50000,
    current_level INT DEFAULT 1,
    current_xp INT DEFAULT 0,
    avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
    is_vip_user BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- RECOMPENSAS DEL PASE DE BATALLA (SABER QUÉ NIVEL SE RECLAMÓ)
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50),
    reward_type VARCHAR(20), -- 'gratis' o 'vip'
    level_num INT NOT NULL,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE,
    UNIQUE KEY unique_claim (username, reward_type, level_num)
);

-- HISTORIAL ESTADÍSTICO DE TODOS LOS JUEGOS ACTIVOS
CREATE TABLE IF NOT EXISTS player_stats (
    username VARCHAR(50),
    game_key VARCHAR(50),
    partidas_jugadas INT DEFAULT 0,
    partidas_ganadas INT DEFAULT 0,
    total_apostado BIGINT DEFAULT 0,
    PRIMARY KEY (username, game_key),
    FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
);-- Crear tabla de monedero global por usuario
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    creditos INT NOT NULL DEFAULT 50000,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de auditoría para registrar cada movimiento de créditos
CREATE TABLE IF NOT EXISTS transacciones_creditos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_movimiento ENUM('gasto_juego', 'premio_juego', 'compra_tienda', 'ajuste_admin') NOT NULL,
    juego_origen VARCHAR(50) NOT NULL,
    cantidad INT NOT NULL,
    saldo_resultante INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar un usuario de pruebas por defecto si no existe
INSERT IGNORE INTO usuarios (id, username, creditos) VALUES (1, 'Jugador_Premium', 50000);