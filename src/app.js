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

    // Check if the username already exists
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('Error when checking if user exists:', err);
            return res.status(500).send({ error: 'Database error while checking for existing username' });
        }

        if (results.length > 0) {
            return res.status(400).send({ error: 'Username already exists' });
        }

        // Hash the password
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                console.error('Error during password hashing:', err);
                return res.status(500).send({ error: 'Error during password hashing' });
            }

            // Save user to the database
            db.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role], (err, result) => {
                if (err) {
                    console.error('Error saving the user:', err);
                    return res.status(500).send({ error: 'Error saving the user to the database' });
                }

                res.status(201).json({ message: 'User registered successfully' });
            });
        });
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








// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
