// Spieler abrufen
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

// Rangliste abrufen
async function fetchRankings() {
    try {
        const response = await fetch('http://localhost:3000/api/rankings');
        const rankings = await response.json();
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = rankings.map(rank => 
            `<p>${rank.name}: ${rank.rankPoints} Punkte - Siege: ${rank.wins}, Niederlagen: ${rank.losses}</p>`
        ).join('');
    } catch (error) {
        console.error("Fehler beim Abrufen der Rangliste:", error);
    }
}

// Spielerliste und Rangliste abrufen, wenn die Seite geladen wird
fetchPlayers();
fetchRankings();
