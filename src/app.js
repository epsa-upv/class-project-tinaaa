const express = require('express');
const mysql = require('mysql2');
const cors = require('cors'); // Importiere CORS
const app = express();
const PORT = 3000;

app.use(cors()); // Aktiviert CORS für alle Ursprünge
app.use(express.json());

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Hochbett-2000',
    database: 'alcoy_db'
});

db.connect((err) => {
    if (err) {
        console.error('Datenbankverbindung fehlgeschlagen:', err.stack);
        return;
    }
    console.log('Erfolgreich mit der Datenbank verbunden.');
});

// Spieler erstellen
app.post('/api/players', (req, res) => {
    const { playerName } = req.body;
    if (!playerName) {
        return res.status(400).send('Spielername erforderlich');
    }

    const insertPlayerSql = 'INSERT INTO players (name) VALUES (?)';
    db.query(insertPlayerSql, [playerName], (err, result) => {
        if (err) {
            console.error('Fehler beim Erstellen des Spielers:', err);
            return res.status(500).send('Fehler beim Erstellen des Spielers');
        }
        res.status(201).json({ id: result.insertId, name: playerName });
    });
});

// Abrufen der offenen Spiele
app.get('/api/games/open', (req, res) => {
    const getOpenGamesSql = 'SELECT * FROM games WHERE status = "open"';
    db.query(getOpenGamesSql, (err, results) => {
        if (err) {
            console.error('Fehler beim Abrufen der offenen Spiele:', err);
            return res.status(500).json({ error: 'Fehler beim Abrufen der offenen Spiele' });
        }
        res.json(results);
    });
});

// Neues Spiel erstellen
app.post('/api/games', (req, res) => {
    const { playerId } = req.body;
    const sql = 'INSERT INTO games (playerId, status) VALUES (?, "open")';
    db.query(sql, [playerId], (err, result) => {
        if (err) {
            console.error("Fehler beim Erstellen eines neuen Spiels:", err);
            res.status(500).send("Fehler beim Erstellen eines neuen Spiels.");
            return;
        }
        res.status(201).json({ gameId: result.insertId, status: "open" });
    });
});

// Spiel starten und Spielzug auswählen
app.post('/api/games/:gameId/play', (req, res) => {
    const { gameId } = req.params;
    const { playerMove } = req.body;

    const getGameSql = 'SELECT * FROM games WHERE id = ? AND status = "open"';
    db.query(getGameSql, [gameId], (err, results) => {
        if (err || results.length === 0) {
            console.error("Fehler beim Abrufen des Spiels oder Spiel nicht verfügbar:", err);
            res.status(404).send("Spiel nicht verfügbar oder bereits abgeschlossen.");
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
                console.error("Fehler beim Aktualisieren des Spiels:", updateErr);
                res.status(500).send("Fehler beim Speichern des Spielergebnisses.");
                return;
            }

            if (result === 'win') {
                const updateScoreSql = 'UPDATE players SET score = score + 1 WHERE id = ?';
                db.query(updateScoreSql, [results[0].playerId], (scoreErr) => {
                    if (scoreErr) {
                        console.error("Fehler beim Aktualisieren des Spielerstands:", scoreErr);
                        res.status(500).send("Fehler beim Aktualisieren des Spielerstands.");
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

// Alle abgeschlossenen Spiele anzeigen
app.get('/api/games/closed', (req, res) => {
    const sql = 'SELECT * FROM games WHERE status = "closed"';
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fehler beim Abrufen abgeschlossener Spiele:", err);
            res.status(500).send("Fehler beim Abrufen abgeschlossener Spiele.");
            return;
        }
        res.json(results);
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
