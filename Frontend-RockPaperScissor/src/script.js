let playerScore = 0;
let computerScore = 0;

document.getElementById("rock").onclick = function() { play("Stein") };
document.getElementById("paper").onclick = function() { play("Papier") };
document.getElementById("scissors").onclick = function() { play("Schere") };

function play(playerChoice) {
    fetch('/api/game', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(playerChoice)  // Wandle den Spielerzug in einen JSON-String um
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Netzwerkantwort war nicht ok');
        }
        return response.json(); // Antworte als JSON zurück
    })
    .then(data => {
        // Aktualisiere die Anzeige mit den erhaltenen Daten
        updateDisplay(data.playerChoice, data.computerChoice, data.result);
    })
    .catch(error => {
        console.error('Fehler:', error);
    });
}

function updateDisplay(playerChoice, computerChoice, result) {
    document.getElementById("result").innerText = `Du wählst: ${playerChoice}, Computer wählt: ${computerChoice} - ${result}`;
    document.getElementById("score").innerText = `Spieler: ${++playerScore}, Computer: ${computerScore}`;
}

// Optional: Wenn du die Punkte im Backend verwalten willst, könntest du eine zusätzliche Methode zum Abrufen der Punkte hinzufügen.
function getScore() {
    fetch('/api/game/score')
        .then(response => response.text()) // Wir erwarten einen Text zurück
        .then(score => {
            document.getElementById("score").innerText = score;
        })
        .catch(error => {
            console.error('Fehler:', error);
        });
}
