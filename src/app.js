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

// Server starten
app.listen(PORT, () => {
    console.log(`Server runs on http://localhost:${PORT}`);
});
