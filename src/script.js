let playerId = null;

// Create Player
function createPlayer() {
    const name = document.getElementById('playerName').value;
    if (!name) {
        alert("Please enter a name!");
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
        document.getElementById('playerMessage').innerText = `Player '${name}' is created! (ID: ${playerId})`;
    })
    .catch(error => console.error('Error while creating Player:', error));
}

// load open games
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
        .catch(error => console.error('Error while loading open games:', error));
}

// create new game
function createGame() {
    if (!playerId) {
        alert("Please create a player first!");
        return;
    }

    fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('gameMessage').innerText = `New game created! (ID: ${data.gameId})`;
    })
    .catch(error => console.error('Error while creating the game:', error));
}

// Play game
function playGame(playerMove) {
    if (!playerId) {
        alert("Please create a game first!");
        return;
    }

    fetch('/api/games/open')
        .then(response => response.json())
        .then(openGames => {
            if (openGames.length === 0) {
                alert("There are no open games. Please create a new game.");
                return;
            }

            const gameId = openGames[0].id; // use the first open game

            fetch(`/api/games/${gameId}/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerMove })
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('gameResult').innerText = `Dein Zug: ${playerMove}, Computerzug: ${data.computerMove}, Ergebnis: ${data.result}`;
            })
            .catch(error => console.error('Error while playing:', error));
        })
        .catch(error => console.error('Error while loading the open games:', error));
}

// load closed games
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
        .catch(error => console.error('Error while loading closed games:', error));
}
