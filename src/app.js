const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // For hashing passwords
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


// Show open games
app.get('/api/games/open', (req, res) => {
    const getOpenGamesSql = 'SELECT * FROM games WHERE player2_id IS NULL';
    db.query(getOpenGamesSql, (err, results) => {
        if (err) {
            console.error('Error when showing open games:', err);
            return res.status(500).json({ error: 'Error when showing open games' });
        }
        res.json(results);
    });
});

//start game
app.post('/api/games/start', (req, res) => {
    const { player1Id, move } = req.body;

    if (!player1Id || !move) {
        return res.status(400).json({ error: "Player1 ID und Move sind erforderlich!" });
    }

    const sql = `
        INSERT INTO games (player1_id, player1_move, player2_id, player2_move, status) 
        VALUES (?, ?, NULL, NULL, "player1_turn")
    `;

    db.query(sql, [player1Id, move], (err, result) => {
        if (err) {
            console.error("Fehler beim Speichern des Spiels:", err);
            return res.status(500).json({ error: "Fehler beim Speichern des Spiels." });
        }

        res.status(201).json({
            message: "Spiel wurde gestartet und Player1's Zug gespeichert.",
            gameId: result.insertId,
        });
    });
});


// Join an open game as player2
app.post('/api/games/join', (req, res) => {
    const { gameId, player2Id } = req.body;

    // Überprüfe, ob die erforderlichen Parameter übergeben wurden
    if (!gameId || !player2Id) {
        return res.status(400).json({ error: "gameId und player2Id sind erforderlich!" });
    }

    // SQL-Query, um das Spiel zu aktualisieren und player2_id zu setzen
    const updateGameSql = 'UPDATE games SET player2_id = ?, status = "in_progress" WHERE id = ? AND player2_id IS NULL';

    db.query(updateGameSql, [player2Id, gameId], (err, result) => {
        if (err) {
            console.error('Fehler beim Beitreten des Spiels:', err);
            return res.status(500).json({ error: 'Fehler beim Beitreten des Spiels' });
        }

        // Wenn keine Zeilen aktualisiert wurden, bedeutet das, dass das Spiel entweder
        // nicht existiert oder bereits einen Player2 hat
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Spiel nicht gefunden oder bereits besetzt.' });
        }

        // Erfolgsmeldung, wenn das Spiel erfolgreich beigetreten wurde
        res.status(200).json({ message: 'Spiel beigetreten und als Player2 gespeichert.' });
    });
});



// Login route (distinguishing between Admin and Player)
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Search for the user in the database
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error when finding user:', err);
            return res.status(500).send('Database error');
        }

        if (results.length === 0) {
            return res.status(404).send('User not found');
        }

        const user = results[0];

        // Verify password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                console.error('Error during password comparison:', err);
                return res.status(500).send('Error during password comparison');
            }

            if (!isMatch) {
                return res.status(401).send('Invalid password');
            }

            // Return user role (Admin or Player)
            res.status(200).json({ message: 'Login successful', role: user.role });
        });
    });
});

// Register route (creating new user)
app.post('/api/register', (req, res) => {
    const { username, password, role = 'player' } = req.body;

    // Check if username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error during user registration:', err);
            return res.status(500).json({ error: 'Database error' });
        }

        if (results.length > 0) {
            console.log('Username already exists');
            return res.status(400).json({ error: 'Username already exists' }); // JSON Response on Error
        }

        // Hash the password and save the user
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error during password hashing:', err);
                return res.status(500).json({ error: 'Error during password hashing' });
            }

            db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
                if (err) {
                    console.error('Error saving user:', err);
                    return res.status(500).json({ error: 'Error saving user' });
                }

                res.status(201).json({ message: 'User registered successfully' });
            });
        });
    });
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


//Tournaments

// Show all tournaments
app.get('/api/tournaments', (req, res) => {
    const sql = 'SELECT * FROM tournaments';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching tournaments:', err);
            return res.status(500).json({ error: 'Error fetching tournaments' });
        }
        res.json(results);
    });
});


// Create a new tournament
app.post('/api/tournaments', (req, res) => {
    const { name, startDate, endDate } = req.body;

    // Validating input
    if (!name || !startDate || !endDate) {
        return res.status(400).json({ error: 'All fields (name, startDate, endDate) are required.' });
    }

    const sql = 'INSERT INTO tournaments (name, status, startDate, endDate) VALUES (?, "active", ?, ?)';
    db.query(sql, [name, startDate, endDate], (err, result) => {
        if (err) {
            console.error('Error creating tournament:', err);
            return res.status(500).json({ error: 'Error creating tournament.' });
        }
        res.status(201).json({ message: 'Tournament created successfully', tournamentID: result.insertId });
    });
});




// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
