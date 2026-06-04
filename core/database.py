# core/database.py
import mysql.connector
from mysql.connector import Error
from mysql.connector.abstracts import MySQLConnectionAbstract, MySQLCursorAbstract
import json
from typing import Any, Dict, List, Optional, Union, cast

# Configuración de la Base de Datos corregida
DB_CONFIG = {
    'host': 'localhost',
    'user': 'casino_user',         
    'password': 'casino123',  
    'database': 'arcade_premium_db'
}

XP_PER_LEVEL = 100

def get_db_connection() -> Optional[MySQLConnectionAbstract]:
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        return cast(MySQLConnectionAbstract, conn)
    except Error as e:
        # Si la base de datos no existe, conectar sin ella para crearla
        try:
            temp_config = DB_CONFIG.copy()
            temp_config.pop('database')
            conn = mysql.connector.connect(**temp_config)
            return cast(MySQLConnectionAbstract, conn)
        except Error as e2:
            print(f"Error conectando a MySQL: {e2}")
            return None

def init_db():
    """Crea todas las tablas si no existen."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        if not cursor:
            return

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
                avatar_url VARCHAR(512) DEFAULT 'https://api.dicebear.com/7.x/bottts/svg?seed=default',
                is_vip_user BOOLEAN DEFAULT FALSE,
                unique_id VARCHAR(10) UNIQUE,
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
                has_premium BOOLEAN DEFAULT FALSE,
                free_spins INT DEFAULT 0,
                FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE
            )
        """)
        try:
            cursor.execute("ALTER TABLE battlepass ADD COLUMN IF NOT EXISTS has_premium BOOLEAN DEFAULT FALSE")
        except Error:
            pass
        try:
            cursor.execute("ALTER TABLE battlepass ADD COLUMN IF NOT EXISTS free_spins INT DEFAULT 0")
        except Error:
            pass

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
                rubies INT NOT NULL DEFAULT 0,
                actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        try:
            cursor.execute("SHOW COLUMNS FROM usuarios LIKE 'rubies'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE usuarios ADD COLUMN rubies INT NOT NULL DEFAULT 0")
        except Error:
            pass

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

        # Tabla de amigos
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS friends (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50),
                friend_username VARCHAR(50),
                status ENUM('pending', 'accepted') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (username) REFERENCES players(username) ON DELETE CASCADE,
                FOREIGN KEY (friend_username) REFERENCES players(username) ON DELETE CASCADE,
                UNIQUE KEY unique_friendship (username, friend_username)
            )
        """)

        conn.commit()
        cursor.close()
    finally:
        conn.close()

def generate_unique_id() -> str:
    import random
    import string
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def ensure_user(username: str):
    """Crea el usuario en todas las tablas necesarias si no existe."""
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        if not cursor:
            return
        
        cursor.execute("USE arcade_premium_db")

        cursor.execute("SELECT username FROM players WHERE username = %s", (username,))
        if not cursor.fetchone():
            uid = generate_unique_id()
            cursor.execute(
                "INSERT INTO players (username, credits, unique_id) VALUES (%s, %s, %s)",
                (username, 50000, uid)
            )
            cursor.execute(
                "INSERT INTO battlepass (username, level, xp, claimed_rewards) VALUES (%s, %s, %s, %s)",
                (username, 1, 0, "[]")
            )
            cursor.execute(
                "INSERT INTO leagues (username, points, rank_name) VALUES (%s, %s, %s)",
                (username, 0, "Bronce")
            )

        try:
            cursor.execute("SHOW COLUMNS FROM usuarios LIKE 'rubies'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE usuarios ADD COLUMN rubies INT NOT NULL DEFAULT 0")
        except Error:
            pass

        cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO usuarios (username, creditos, rubies) VALUES (%s, %s, %s)",
                (username, 50000, 0)
            )

        conn.commit()
        cursor.close()
    finally:
        conn.close()

def get_balance(username: str) -> int:
    conn = get_db_connection()
    if not conn:
        return 0
    try:
        cursor = conn.cursor()
        if not cursor:
            return 0
        cursor.execute("USE arcade_premium_db")
        cursor.execute("SELECT creditos FROM usuarios WHERE username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        if row and isinstance(row, (list, tuple)):
            return int(row[0])
        return 0
    finally:
        conn.close()

def set_balance(username: str, new_balance: int) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        if not cursor:
            return False
        try:
            cursor.execute("USE arcade_premium_db")
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
    finally:
        conn.close()


def get_rubies(username: str) -> int:
    conn = get_db_connection()
    if not conn:
        return 0
    try:
        cursor = conn.cursor()
        if not cursor:
            return 0
        cursor.execute("USE arcade_premium_db")
        cursor.execute("SELECT rubies FROM usuarios WHERE username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        if row and isinstance(row, (list, tuple)):
            return int(row[0])
        return 0
    finally:
        conn.close()


def set_rubies(username: str, new_rubies: int) -> bool:
    conn = get_db_connection()
    if not conn:
        return False
    try:
        cursor = conn.cursor()
        if not cursor:
            return False
        try:
            cursor.execute("USE arcade_premium_db")
            cursor.execute(
                "UPDATE usuarios SET rubies = %s WHERE username = %s",
                (new_rubies, username)
            )
            conn.commit()
            return True
        except Error:
            return False
        finally:
            cursor.close()
    finally:
        conn.close()


def add_transaction(username: str, tipo: str, juego: str, cantidad: int, saldo_resultante: int):
    conn = get_db_connection()
    if not conn:
        return
    try:
        cursor = conn.cursor()
        if not cursor:
            return
        cursor.execute("USE arcade_premium_db")
        cursor.execute("SELECT id FROM usuarios WHERE username = %s", (username,))
        row = cursor.fetchone()
        if row and isinstance(row, (list, tuple)):
            user_id = row[0]
            cursor.execute(
                """INSERT INTO transacciones_creditos 
                   (usuario_id, tipo_movimiento, juego_origen, cantidad, saldo_resultante) 
                   VALUES (%s, %s, %s, %s, %s)""",
                (user_id, tipo, juego, cantidad, saldo_resultante)
            )
            conn.commit()
        cursor.close()
    finally:
        conn.close()


def _ensure_battlepass_has_premium_column(cursor) -> None:
    cursor.execute("USE arcade_premium_db")
    cursor.execute("SHOW COLUMNS FROM battlepass LIKE 'has_premium'")
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE battlepass ADD COLUMN has_premium BOOLEAN DEFAULT FALSE")


def get_battlepass(username: str) -> Dict[str, Any]:
    conn = get_db_connection()
    if not conn:
        return {"level": 1, "xp": 0, "claimed_rewards": [], "has_premium": False, "free_spins": 0}
    try:
        cursor = conn.cursor()
        if not cursor:
            return {"level": 1, "xp": 0, "claimed_rewards": [], "has_premium": False, "free_spins": 0}
        try:
            _ensure_battlepass_has_premium_column(cursor)
        except Error:
            pass
        try:
            cursor.execute("SHOW COLUMNS FROM battlepass LIKE 'free_spins'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE battlepass ADD COLUMN free_spins INT DEFAULT 0")
        except Error:
            pass
        cursor.execute("SELECT level, xp, claimed_rewards, COALESCE(has_premium, FALSE), COALESCE(free_spins, 0) FROM battlepass WHERE username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        if row and isinstance(row, (list, tuple)):
            claimed = json.loads(str(row[2])) if row[2] else []
            return {
                "level": int(row[0]),
                "xp": int(row[1]),
                "claimed_rewards": claimed,
                "has_premium": bool(row[3]),
                "free_spins": int(row[4])
            }
        else:
            ensure_user(username)
            return {"level": 1, "xp": 0, "claimed_rewards": [], "has_premium": False, "free_spins": 0}
    finally:
        conn.close()

def get_league(username: str) -> Dict[str, Any]:
    conn = get_db_connection()
    if not conn:
        return {"points": 0, "rank": "Bronce"}
    try:
        cursor = conn.cursor()
        if not cursor:
            return {"points": 0, "rank": "Bronce"}
        cursor.execute("USE arcade_premium_db")
        cursor.execute("SELECT points, rank_name FROM leagues WHERE username = %s", (username,))
        row = cursor.fetchone()
        cursor.close()
        if row and isinstance(row, (list, tuple)):
            return {"points": int(row[0]), "rank": str(row[1])}
        else:
            ensure_user(username)
            return {"points": 0, "rank": "Bronce"}
    finally:
        conn.close()

# Parche temporal para evitar el ImportError en routers/games.py
def update_battlepass(*args, **kwargs):
    print("WARNING: update_battlepass temporal ejecutada (no hace nada)")
    return True
# Parche temporal para evitar el ImportError de update_league
def update_league(*args, **kwargs):
    print("WARNING: update_league temporal ejecutada (no hace nada)")
    return True

# Inicializar base de datos al importar
init_db()
