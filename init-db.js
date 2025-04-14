const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database setup - use Render's persistent volume path
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'keys.db');
const dataDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log('Database path:', dbPath);
console.log('Data directory:', dataDir);

// Initialize database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
        process.exit(1);
    } else {
        console.log('Connected to the SQLite database successfully');
        createTables(db);
    }
});

function createTables(db) {
    console.log('Creating tables...');
    
    // Create departments table
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
            seedDepartments(db);
        }
    });

    // Create users table
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
            seedDefaultAdmin(db);
            seedTestUser(db);
        }
    });

    // Create other tables...
}

function seedDepartments(db) {
    const departments = [
        {
            name: "ICT Department",
            faculty: "Science and Technology",
            building: "Science Block",
            contact_person: "Dr. John Mwangi",
            contact_email: "ict@meruuniversity.ac.ke",
            contact_phone: "0712345678"
        },
        // Add other departments...
    ];

    departments.forEach(dept => {
        db.run('INSERT OR IGNORE INTO departments (name, faculty, building, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)',
            [dept.name, dept.faculty, dept.building, dept.contact_person, dept.contact_email, dept.contact_phone]);
    });
}

function seedDefaultAdmin(db) {
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@meru.ac.ke',
        password: 'admin123',
        department_id: 1,
        role: 'admin'
    };

    bcrypt.hash(defaultAdmin.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }

        db.run('INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [defaultAdmin.username, defaultAdmin.email, hash, defaultAdmin.department_id, defaultAdmin.role]);
    });
}

function seedTestUser(db) {
    const testUser = {
        username: 'testuser',
        email: 'test@meru.ac.ke',
        password: 'test123',
        department_id: 1,
        role: 'user'
    };

    bcrypt.hash(testUser.password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }

        db.run('INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [testUser.username, testUser.email, hash, testUser.department_id, testUser.role]);
    });
} 