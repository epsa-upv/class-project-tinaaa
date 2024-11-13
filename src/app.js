// app.js
const express = require('express');
const mysql = require('mysql2');
const app = express();
const PORT = 3000;

// Middleware zum Parsen von JSON-Daten
app.use(express.json());

// MySQL-Datenbankverbindung einrichten
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',       // Dein MySQL-Benutzername
    password: 'emily', // Dein MySQL-Passwort
    database: 'alcoy_db'
});

db.connect((err) => {
    if (err) {
        console.error('Datenbankverbindung fehlgeschlagen:', err.stack);
        return;
    }
    console.log('Erfolgreich mit der Datenbank verbunden.');
});

// Beispiel-Endpunkt zum Abrufen aller Spieler
app.get('/api/players', (req, res) => {
    const sql = 'SELECT * FROM players';
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// Beispiel-Endpunkt zum Hinzufügen eines Spielers
app.post('/api/players', (req, res) => {
    const { name, score } = req.body;
    const sql = 'INSERT INTO players (name, score) VALUES (?, ?)';
    db.query(sql, [name, score], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, name, score });
    });
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});


