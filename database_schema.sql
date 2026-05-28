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
);