// script.js
let playerId = null;

// Spieler erstellen
function createPlayer() {
    const name = document.getElementById('playerName').value;
    if (!name) {
        alert("Bitte einen Namen eingeben!");
        return;
    }

    fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score: 0 })
    })
    .then(response => response.json())
    .then(data => {
        playerId = data.id;
        document.getElementById('playerMessage').innerText = `Spieler '${name}' wurde erstellt! (ID: ${playerId})`;
    })
    .catch(error => console.error('Fehler beim Erstellen des Spielers:', error));
}

// Offene Spiele laden
function loadOpenGames() {
    fetch('/api/games/open')
        .then(response => response.json())
        .then(data => {
            const openGamesList = document.getElementById('openGamesList');
            openGamesList.innerHTML = '';
            data.forEach(game => {
                const li = document.createElement('li');
                li.innerText = `Spiel-ID: ${game.id}`;
                openGamesList.appendChild(li);
            });
        })
        .catch(error => console.error('Fehler beim Laden der offenen Spiele:', error));
}

// Neues Spiel erstellen
function createGame() {
    if (!playerId) {
        alert("Bitte zuerst einen Spieler erstellen!");
        return;
    }

    fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('gameMessage').innerText = `Neues Spiel erstellt! (ID: ${data.gameId})`;
    })
    .catch(error => console.error('Fehler beim Erstellen des Spiels:', error));
}

// Spiel spielen
function playGame(playerMove) {
    if (!playerId) {
        alert("Bitte zuerst ein Spiel erstellen!");
        return;
    }

    fetch('/api/games/open')
        .then(response => response.json())
        .then(openGames => {
            if (openGames.length === 0) {
                alert("Es gibt keine offenen Spiele. Bitte ein neues Spiel erstellen.");
                return;
            }

            const gameId = openGames[0].id; // Erstes offenes Spiel verwenden

            fetch(`/api/games/${gameId}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerMove })
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('gameResult').innerText = `Dein Zug: ${playerMove}, Computerzug: ${data.computerMove}, Ergebnis: ${data.result}`;
            })
            .catch(error => console.error('Fehler beim Spielen:', error));
        })
        .catch(error => console.error('Fehler beim Laden der offenen Spiele:', error));
}

// Abgeschlossene Spiele laden
function loadClosedGames() {
    fetch('/api/games/closed')
        .then(response => response.json())
        .then(data => {
            const closedGamesList = document.getElementById('closedGamesList');
            closedGamesList.innerHTML = '';
            data.forEach(game => {
                const li = document.createElement('li');
                li.innerText = `Spiel-ID: ${game.id}, Ergebnis: ${game.result}`;
                closedGamesList.appendChild(li);
            });
        })
        .catch(error => console.error('Fehler beim Laden der abgeschlossenen Spiele:', error));
}
