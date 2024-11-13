async function fetchPlayers() {
    try {
        const response = await fetch('http://localhost:3000/api/players');
        const players = await response.json();
        const playerList = document.getElementById('player-list');
        playerList.innerHTML = players.map(player => `<p>${player.name}: ${player.score}</p>`).join('');
    } catch (error) {
        console.error("Fehler beim Abrufen der Spieler:", error);
    }
}

// Abrufen der Spielerliste, wenn die Seite geladen wird
fetchPlayers();
