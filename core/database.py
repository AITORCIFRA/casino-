# core/database.py
import mysql.connector
from mysql.connector import Error
import json

DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',          # cámbialo si usas otro usuario
    'password': 'tu_contraseña',  # pon la contraseña real
    'database': 'arcade_premium_db'
}

XP_PER_LEVEL = 100

def get_db_connection():
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return conn
    except Error as e:
        print(f"Error conectando a MySQL: {e}")
        return None

def init_db():
    """Crea todas las tablas si no existen."""
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()

    cursor.execute("CREATE DATABASE IF NOT EXISTS arcade_premium_db")
    cursor.execute("USE arcade_premium_db")

    # Tabla de usuarios (contraseñas)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(50) PRIMARY KEY,
            password VARCHAR(255) NOT NULL
        )
    """)

    # Tabla players (perfil)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS players (
            username VARCHAR(50) PRIMARY KEY,
            credits BIGINT DEFAULT 50000,
            current_level INT DEFAULT 1,
            current_xp INT DEFAULT 0,
            avatar_url TEXT DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
            is_vip_user BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)

    # Tabla battlepass
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS battlepass (
            username VARCHAR(50) PRIMARY KEY,
            level INT DEFAULT 1,
            xp INT DEFAULT 0,
            claimed_rewards TEXT,
            FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
        )
    """)

    # Tabla leagues
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS leagues (
            username VARCHAR(50) PRIMARY KEY,
            points INT DEFAULT 0,
            rank_name VARCHAR(20) DEFAULT 'Bronce',
            FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
        )
    """)

    # Tabla usuarios (monedero global)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            creditos INT NOT NULL DEFAULT 50000,
            actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    """)

    # Tabla transacciones
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transacciones_creditos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario_id INT NOT NULL,
            tipo_movimiento ENUM('gasto_juego', 'premio_juego', 'compra_tienda', 'ajuste_admin') NOT NULL,
            juego_origen VARCHAR(50) NOT NULL,
            cantidad INT NOT NULL,
            saldo_resultante INT NOT NULL,
            creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
        )
    """)

    # Tabla claimed_rewards
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS claimed_rewards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50),
            reward_type VARCHAR(20),
            level_num INT NOT NULL,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE,
            UNIQUE KEY unique_claim (username, reward_type, level_num)
        )
    """)

    # Tabla player_stats
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS player_stats (
            username VARCHAR(50),
            game_key VARCHAR(50),
            partidas_jugadas INT DEFAULT 0,
            partidas_ganadas INT DEFAULT 0,
            total_apostado BIGINT DEFAULT 0,
            PRIMARY KEY (username, game_key),
            FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
        )
    """)

    conn.commit()
    cursor.close()
    conn.close()

# ------------------------------------------------------------
# Funciones de usuario y saldo
# ------------------------------------------------------------

def ensure_user(username: str):
    """Crea el usuario en todas las tablas necesarias si no existe."""
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()

    cursor.execute("SELECT username FROM players WHERE username = %s", (username,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO players (username, credits) VALUES (%s, %s)",
            (username, 50000)
        )
        cursor.execute(
            "INSERT INTO battlepass (username, level, xp, claimed_rewards) VALUES (%s, %s, %s, %s)",
            (username, 1, 0, "[]")
        )
        cursor.execute(
            "INSERT INTO leagues (username, points, rank_name) VALUES (%s, %s, %s)",
            (username, 0, "Bronce")
        )

    cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO usuarios (username, creditos) VALUES (%s, %s)",
            (username, 50000)
        )

    conn.commit()
    cursor.close()
    conn.close()

def get_balance(username: str) -> int:
    conn = get_db_connection()
    if not conn:
        return 0
    cursor = conn.cursor()
    cursor.execute("SELECT creditos FROM usuarios WHERE username = %s", (username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    return row[0] if row else 0

def set_balance(username: str, new_balance: int) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE usuarios SET creditos = %s WHERE username = %s",
            (new_balance, username)
        )
        cursor.execute(
            "UPDATE players SET credits = %s WHERE username = %s",
            (new_balance, username)
        )
        conn.commit()
        return True
    except Error:
        return False
    finally:
        cursor.close()
        conn.close()

def add_transaction(username: str, tipo: str, juego: str, cantidad: int, saldo_resultante: int):
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
    row = cursor.fetchone()
    if row:
        user_id = row[0]
        cursor.execute(
            """INSERT INTO transacciones_creditos 
               (usuario_id, tipo_movimiento, juego_origen, cantidad, saldo_resultante) 
               VALUES (%s, %s, %s, %s, %s)""",
            (user_id, tipo, juego, cantidad, saldo_resultante)
        )
        conn.commit()
    cursor.close()
    conn.close()

# ------------------------------------------------------------
# Funciones battlepass
# ------------------------------------------------------------

def get_battlepass(username: str):
    conn = get_db_connection()
    if not conn:
        return {"level": 1, "xp": 0, "claimed_rewards": []}
    cursor = conn.cursor()
    cursor.execute("SELECT level, xp, claimed_rewards FROM battlepass WHERE username = %s", (username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        claimed = json.loads(row[2]) if row[2] else []
        return {"level": row[0], "xp": row[1], "claimed_rewards": claimed}
    else:
        ensure_user(username)
        return {"level": 1, "xp": 0, "claimed_rewards": []}

def update_battlepass(username: str, xp_gain: int):
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()
    cursor.execute("SELECT level, xp FROM battlepass WHERE username = %s", (username,))
    row = cursor.fetchone()
    if not row:
        cursor.execute(
            "INSERT INTO battlepass (username, level, xp, claimed_rewards) VALUES (%s, %s, %s, %s)",
            (username, 1, 0, "[]")
        )
        conn.commit()
        level = 1
        current_xp = 0
    else:
        level, current_xp = row
    new_xp = current_xp + xp_gain
    new_level = level + (new_xp // XP_PER_LEVEL)
    new_xp = new_xp % XP_PER_LEVEL
    cursor.execute(
        "UPDATE battlepass SET level = %s, xp = %s WHERE username = %s",
        (new_level, new_xp, username)
    )
    conn.commit()
    cursor.close()
    conn.close()

# ------------------------------------------------------------
# Funciones leagues
# ------------------------------------------------------------

def get_league(username: str):
    conn = get_db_connection()
    if not conn:
        return {"points": 0, "rank": "Bronce"}
    cursor = conn.cursor()
    cursor.execute("SELECT points, rank_name FROM leagues WHERE username = %s", (username,))
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return {"points": row[0], "rank": row[1]}
    else:
        ensure_user(username)
        return {"points": 0, "rank": "Bronce"}

def update_league(username: str, points_gain: int):
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor()
    cursor.execute("SELECT points FROM leagues WHERE username = %s", (username,))
    row = cursor.fetchone()
    if not row:
        cursor.execute(
            "INSERT INTO leagues (username, points, rank_name) VALUES (%s, %s, %s)",
            (username, points_gain, "Bronce")
        )
        new_points = points_gain
    else:
        new_points = row[0] + points_gain
        cursor.execute("UPDATE leagues SET points = %s WHERE username = %s", (new_points, username))

    if new_points > 500:
        rank = "Oro"
    elif new_points > 200:
        rank = "Plata"
    else:
        rank = "Bronce"
    cursor.execute("UPDATE leagues SET rank_name = %s WHERE username = %s", (rank, username))
    conn.commit()
    cursor.close()
    conn.close()

# Inicializar base de datos al importar
init_db()