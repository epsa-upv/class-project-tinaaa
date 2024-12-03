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
    const { playerId } = req.body; // playerId is set as player1_id
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


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
