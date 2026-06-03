/**
 * ARCADE-PREMIUM - Sistema de Juego Social
 * Invitar amigos y unirse a partidas
 */

class SocialPlay {
  constructor() {
    this.API_URL = '/api';
    this.currentRoom = null;
    this.roomPlayers = [];
  }

  /**
   * Crear una sala de juego
   */
  async createRoom(gameName, maxPlayers = 4) {
    try {
      const username = localStorage.getItem('arcade_user');
      const res = await fetch(`${this.API_URL}/games/create-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          creator: username, 
          game: gameName, 
          max_players: maxPlayers 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        this.currentRoom = data.room_id;
        this.roomPlayers = [{ username, avatar: this.getAvatar(username) }];
        return data.room_id;
      }
    } catch(e) {
      console.log("Error creando sala");
    }
  }

  /**
   * Obtener avatar del usuario
   */
  getAvatar(username) {
    return `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`;
  }

  /**
   * Invitar amigos a la sala
   */
  async inviteFriend(friendUsername) {
    if (!this.currentRoom) {
      alert("No hay sala activa");
      return;
    }
    
    try {
      const res = await fetch(`${this.API_URL}/games/invite-player`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_id: this.currentRoom,
          player_username: friendUsername 
        })
      });
      
      if (res.ok) {
        alert(`¡Invitación enviada a ${friendUsername}!`);
      }
    } catch(e) {
      console.log("Error enviando invitación");
    }
  }

  /**
   * Unirse a una sala
   */
  async joinRoom(roomId) {
    try {
      const username = localStorage.getItem('arcade_user');
      const res = await fetch(`${this.API_URL}/games/join-room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          room_id: roomId,
          player_username: username 
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        this.currentRoom = roomId;
        this.roomPlayers = data.players;
        return true;
      }
    } catch(e) {
      console.log("Error uniéndose a la sala");
    }
    return false;
  }

  /**
   * Obtener jugadores en la sala
   */
  async getRoomPlayers() {
    if (!this.currentRoom) return [];
    
    try {
      const res = await fetch(`${this.API_URL}/games/room-players/${this.currentRoom}`);
      if (res.ok) {
        const data = await res.json();
        this.roomPlayers = data.players;
        return data.players;
      }
    } catch(e) {
      console.log("Error obteniendo jugadores");
    }
    return [];
  }

  /**
   * Mostrar modal de invitación
   */
  showInviteModal() {
    const modal = document.createElement('div');
    modal.className = 'panel-modal';
    modal.id = 'inviteModal';
    modal.innerHTML = `
      <div class="panel-container" style="max-width:500px;">
        <span class="panel-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 style="font-family:'Orbitron'; color:#00FF99; margin-bottom:20px;">👥 INVITAR AMIGOS</h2>
        
        <div id="friendsList" style="display:flex; flex-direction:column; gap:10px; max-height:300px; overflow-y:auto;">
          <div style="text-align:center; color:rgba(255,255,255,0.4); padding:20px;">Cargando amigos...</div>
        </div>
        
        <div style="margin-top:20px; display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <button onclick="socialPlay.startGame()" style="background:#00FF99; color:#000; border:none; padding:10px; border-radius:8px; font-family:'Orbitron'; font-weight:900; cursor:pointer;">EMPEZAR JUEGO</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#666; color:#fff; border:none; padding:10px; border-radius:8px; font-family:'Orbitron'; font-weight:900; cursor:pointer;">CERRAR</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    this.loadFriendsForInvite();
  }

  /**
   * Cargar amigos para invitar
   */
  async loadFriendsForInvite() {
    const username = localStorage.getItem('arcade_user');
    try {
      const res = await fetch(`${this.API_URL}/progression/friends/${username}`);
      if (res.ok) {
        const data = await res.json();
        const friendsList = document.getElementById('friendsList');
        
        if (data.friends.length === 0) {
          friendsList.innerHTML = '<div style="text-align:center; color:rgba(255,255,255,0.4); padding:20px;">No tienes amigos aún</div>';
          return;
        }
        
        friendsList.innerHTML = data.friends.map(f => `
          <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; display:flex; align-items:center; gap:10px; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:10px; flex:1;">
              <img src="${this.getAvatar(f.username)}" style="width:35px; height:35px; border-radius:50%; border:1px solid #00FF99;">
              <div>
                <div style="font-weight:bold; font-size:12px;">${f.username}</div>
                <div style="font-size:10px; color:rgba(255,255,255,0.5);">Online</div>
              </div>
            </div>
            <button onclick="socialPlay.inviteFriend('${f.username}')" style="background:#00BFFF; color:#000; border:none; padding:6px 12px; border-radius:6px; font-family:'Orbitron'; font-weight:900; font-size:10px; cursor:pointer;">INVITAR</button>
          </div>
        `).join('');
      }
    } catch(e) {
      console.log("Error cargando amigos");
    }
  }

  /**
   * Iniciar el juego
   */
  startGame() {
    console.log(`Iniciando juego en sala ${this.currentRoom} con ${this.roomPlayers.length} jugadores`);
    // Aquí se podría enviar un mensaje a todos los jugadores para que inicien
    document.getElementById('inviteModal').remove();
  }

  /**
   * Mostrar jugadores en la sala
   */
  showRoomPlayers() {
    const modal = document.createElement('div');
    modal.className = 'panel-modal';
    modal.innerHTML = `
      <div class="panel-container" style="max-width:400px;">
        <span class="panel-close" onclick="this.parentElement.parentElement.remove()">&times;</span>
        <h2 style="font-family:'Orbitron'; color:#00FF99; margin-bottom:20px;">👥 JUGADORES EN SALA</h2>
        
        <div id="roomPlayersList" style="display:flex; flex-direction:column; gap:10px;">
          ${this.roomPlayers.map(p => `
            <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:8px; display:flex; align-items:center; gap:10px;">
              <img src="${this.getAvatar(p.username)}" style="width:35px; height:35px; border-radius:50%; border:1px solid #00FF99;">
              <div style="flex:1;">
                <div style="font-weight:bold; font-size:12px;">${p.username}</div>
              </div>
              <div style="color:#00FF99; font-size:10px;">✓</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }
}

// Inicializar
const socialPlay = new SocialPlay();
