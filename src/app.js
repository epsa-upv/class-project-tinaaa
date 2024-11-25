const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); 
const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'emily',
    database: 'alcoy_db'
});

db.connect((err) => {
    if (err) {
        console.error('Data connection fail:', err.stack);
        return;
    }
    console.log('Data connection successful.');
});

// create Player
app.post('/api/players', (req, res) => {
    const { playerName } = req.body;
    if (!playerName) {
        return res.status(400).send('Playername required.');
    }

    const insertPlayerSql = 'INSERT INTO players (name) VALUES (?)';
    db.query(insertPlayerSql, [playerName], (err, result) => {
        if (err) {
            console.error('Error when creating the player:', err);
            return res.status(500).send('Error when creating the player');
        }
        res.status(201).json({ id: result.insertId, name: playerName });
    });
});

// Show open games
app.get('/api/games/open', (req, res) => {
    const getOpenGamesSql = 'SELECT * FROM games WHERE status = "open"';
    db.query(getOpenGamesSql, (err, results) => {
        if (err) {
            console.error('Error when showing open games:', err);
            return res.status(500).json({ error: 'Error when showing open games' });
        }
        res.json(results);
    });
});

// Creating new game
app.post('/api/games', (req, res) => {
    const { playerId } = req.body; // playerId wird als player1_id gesetzt
    const sql = 'INSERT INTO games (player1_id, player2_id, status) VALUES (?, NULL, "open")';
    db.query(sql, [playerId], (err, result) => {
        if (err) {
            console.error("Error when creating a new game:", err);
            res.status(500).send("Error when creating a new game.");
            return;
        }
        res.status(201).json({ gameId: result.insertId, player1_id: playerId, player2_id: null, status: "open" });
    });
});


// Start game & choose move
app.post('/api/games/:gameId/play', (req, res) => {
    const { gameId } = req.params;
    const { playerMove } = req.body;

    const getGameSql = 'SELECT * FROM games WHERE id = ? AND status = "open"';
    db.query(getGameSql, [gameId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Error showing the game or game not available:", err);
            res.status(404).send("Error showing the game or game not available.");
            return;
        }

        const moves = ['rock', 'paper', 'scissors'];
        const computerMove = moves[Math.floor(Math.random() * moves.length)];

        let result;
        if (playerMove === computerMove) {
            result = 'draw';
        } else if (
            (playerMove === 'rock' && computerMove === 'scissors') ||
            (playerMove === 'scissors' && computerMove === 'paper') ||
            (playerMove === 'paper' && computerMove === 'rock')
        ) {
            result = 'win';
        } else {
            result = 'lose';
        }

        const updateGameSql = 'UPDATE games SET status = "closed", result = ? WHERE id = ?';
        db.query(updateGameSql, [result, gameId], (updateErr) => {
            if (updateErr) {
                console.error("Error when updating the game:", updateErr);
                res.status(500).send("Error when updating the game.");
                return;
            }

            if (result === 'win') {
                const updateScoreSql = 'UPDATE players SET score = score + 1 WHERE id = ?';
                db.query(updateScoreSql, [results[0].playerId], (scoreErr) => {
                    if (scoreErr) {
                        console.error("Error when updating the player status:", scoreErr);
                        res.status(500).send("Error when updating the player status.");
                        return;
                    }
                    res.json({ playerMove, computerMove, result });
                });
            } else {
                res.json({ playerMove, computerMove, result });
            }
        });
    });
});

// Show completed games
app.get('/api/games/closed', (req, res) => {
    const sql = 'SELECT * FROM games WHERE status = "closed"';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error when showing completed games:", err);
            res.status(500).send("Error when showing completed games.");
            return;
        }
        res.json(results);
    });
});



//Tournaments


// create tournament
app.post('/api/tournaments', async (req, res) => {
    try {
        const { name, startDate, endDate } = req.body;
        const tournament = await Tournament.create({
            name,
            startDate,
            endDate,
            status: 'active' // Standardmäßig auf 'active' setzen
        });
        res.status(201).json(tournament);
    } catch (error) {
        console.error('Error creating tournament:', error);
        res.status(500).json({ message: 'Error creating tournament' });
    }
});


// show tournaments
app.get('/api/tournaments', async (req, res) => {
    try {
        const tournaments = await Tournament.findAll();
        res.status(200).json(tournaments);
    } catch (error) {
        console.error('Error fetching tournaments:', error);
        res.status(500).json({ message: 'Error fetching tournaments' });
    }
});



//Rounds

// create Rounds for Tournament
app.post('/api/tournaments/:tournamentID/rounds', async (req, res) => {
    try {
        const { tournamentID } = req.params;
        const { round_number, start_date, end_date } = req.body;

        const round = await Round.create({
            tournamentID,
            round_number,
            start_date,
            end_date,
            status: 'active' // Standardmäßig auf 'active' setzen
        });

        res.status(201).json(round);
    } catch (error) {
        console.error('Error creating round for tournament:', error);
        res.status(500).json({ message: 'Error creating round' });
    }
});



// Show all rounds from a tournament
app.get('/api/tournaments/:tournamentID/rounds', async (req, res) => {
    try {
        const { tournamentID } = req.params;
        const rounds = await Round.findAll({
            where: { tournamentID },
            order: [['round_number', 'ASC']] // Sortiere nach der Runde
        });
        res.status(200).json(rounds);
    } catch (error) {
        console.error('Error fetching rounds for tournament:', error);
        res.status(500).json({ message: 'Error fetching rounds' });
    }
});



// Play round
app.post('/api/tournaments/:tournamentID/rounds/:roundID/play', async (req, res) => {
    try {
        const { tournamentID, roundID } = req.params;
        const { playerMove } = req.body;
        
        const round = await Round.findByPk(roundID);
        if (!round) {
            return res.status(404).json({ message: 'Round not found' });
        }
        
        const aiMove = getAIChoice();
        const result = determineWinner(playerMove, aiMove);

        // Update Runde mit Ergebnis
        await round.update({ status: 'completed', result, aiMove });

        res.status(200).json({ playerMove, aiMove, result });
    } catch (error) {
        console.error('Error playing round:', error);
        res.status(500).json({ message: 'Error playing round' });
    }
});

// Hilfsfunktionen für das Spiel
function getAIChoice() {
    const choices = ['rock', 'paper', 'scissors'];
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
}

function determineWinner(playerMove, aiMove) {
    if (playerMove === aiMove) {
        return 'Draw';
    }
    if (
        (playerMove === 'rock' && aiMove === 'scissors') ||
        (playerMove === 'scissors' && aiMove === 'paper') ||
        (playerMove === 'paper' && aiMove === 'rock')
    ) {
        return 'You win';
    }
    return 'AI wins';
}






// Server starten
app.listen(PORT, () => {
    console.log(`Server runs on http://localhost:${PORT}`);
});
