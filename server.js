// Dependencies
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(path.join(__dirname)));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Database setup
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'keys.db');
const dataDir = path.dirname(dbPath);

// Create database directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to the SQLite database');
        createTables();
    }
});

// Create tables
function createTables() {
    // Departments table
    db.run(`CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        faculty TEXT,
        building TEXT,
        contact_person TEXT,
        contact_email TEXT,
        contact_phone TEXT
    )`, (err) => {
        if (err) {
            console.error('Error creating departments table:', err);
        } else {
            console.log('Departments table created successfully');
            seedDepartments();
        }
    });

    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        department_id INTEGER,
        role TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating users table:', err);
        } else {
            console.log('Users table created successfully');
            seedDefaultAdmin();
            seedTestUser();
        }
    });

    // Keys table
    db.run(`CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        status TEXT,
        lastUpdated TEXT,
        assignedTo TEXT,
        department TEXT,
        faculty TEXT,
        building TEXT,
        room TEXT,
        notes TEXT,
        FOREIGN KEY(department) REFERENCES departments(name)
    )`, (err) => {
        if (err) {
            console.error('Error creating keys table:', err);
        } else {
            console.log('Keys table created successfully');
        }
    });

    // Key history table
    db.run(`CREATE TABLE IF NOT EXISTS key_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyId INTEGER,
        action TEXT,
        person TEXT,
        department TEXT,
        faculty TEXT,
        date TEXT,
        notes TEXT,
        FOREIGN KEY(keyId) REFERENCES keys(id)
    )`, (err) => {
        if (err) {
            console.error('Error creating key_history table:', err);
        } else {
            console.log('Key history table created successfully');
        }
    });
}

// Seed departments
function seedDepartments() {
    const departments = [
        {
            name: "ICT Department",
            faculty: "Science and Technology",
            building: "Science Block",
            contact_person: "Dr. John Mwangi",
            contact_email: "ict@meruuniversity.ac.ke",
            contact_phone: "0712345678"
        },
        {
            name: "Library",
            faculty: "Administration",
            building: "Library Block",
            contact_person: "Ms. Sarah Kamau",
            contact_email: "library@meruuniversity.ac.ke",
            contact_phone: "0723456789"
        },
        {
            name: "Security",
            faculty: "Administration",
            building: "Main Gate",
            contact_person: "Mr. James Kariuki",
            contact_email: "security@meruuniversity.ac.ke",
            contact_phone: "0734567890"
        }
    ];

    departments.forEach(dept => {
        db.run('INSERT OR IGNORE INTO departments (name, faculty, building, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)',
            [dept.name, dept.faculty, dept.building, dept.contact_person, dept.contact_email, dept.contact_phone],
            (err) => {
                if (err) {
                    console.error(`Error seeding department ${dept.name}:`, err);
                } else {
                    console.log(`Department ${dept.name} seeded successfully`);
                }
            });
    });
}

// Seed default admin
function seedDefaultAdmin() {
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@meru.ac.ke',
        password: 'admin123',
        department_id: 1,
        role: 'admin'
    };

    bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing admin password:', err);
            return;
        }

        db.run('INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [defaultAdmin.username, defaultAdmin.email, hash, defaultAdmin.department_id, defaultAdmin.role],
            (err) => {
                if (err) {
                    console.error('Error seeding admin user:', err);
                } else {
                    console.log('Admin user seeded successfully');
                    // Verify the admin user was created
                    db.get('SELECT * FROM users WHERE username = ?', [defaultAdmin.username], (err, row) => {
                        if (err) {
                            console.error('Error verifying admin user:', err);
                        } else if (row) {
                            console.log('Admin user verified:', row);
                        } else {
                            console.error('Admin user not found after seeding');
                        }
                    });
                }
            });
    });
}

// Seed test user
function seedTestUser() {
    const testUser = {
        username: 'testuser',
        email: 'test@meru.ac.ke',
        password: 'test123',
        department_id: 1,
        role: 'user'
    };

    bcrypt.hash(testUser.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing test user password:', err);
            return;
        }

        db.run('INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [testUser.username, testUser.email, hash, testUser.department_id, testUser.role],
            (err) => {
                if (err) {
                    console.error('Error seeding test user:', err);
                } else {
                    console.log('Test user seeded successfully');
                    // Verify the test user was created
                    db.get('SELECT * FROM users WHERE username = ?', [testUser.username], (err, row) => {
                        if (err) {
                            console.error('Error verifying test user:', err);
                        } else if (row) {
                            console.log('Test user verified:', row);
                        } else {
                            console.error('Test user not found after seeding');
                        }
                    });
                }
            });
    });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token is required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'meru-key-management-secret-2024', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Admin middleware
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
};

// Routes
// ... existing routes ...

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Add a simple test endpoint to verify server is running
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ status: 'ok', message: 'Server is running' });
}); 