const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database setup - use Render's persistent volume path
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'keys.db');
const dataDir = path.dirname(dbPath);

console.log('Current working directory:', process.cwd());
console.log('Database path:', dbPath);
console.log('Data directory:', dataDir);

// Ensure data directory exists
try {
    if (!fs.existsSync(dataDir)) {
        console.log('Creating data directory...');
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('Data directory created successfully');
    } else {
        console.log('Data directory already exists');
    }

    // Check if we can write to the directory
    const testFile = path.join(dataDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('Directory is writable');

    // Initialize database
    console.log('Initializing database...');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database:', err);
            process.exit(1);
        } else {
            console.log('Connected to the SQLite database successfully');
            createTables(db);
        }
    });

    // Handle database errors
    db.on('error', (err) => {
        console.error('Database error:', err);
    });

} catch (error) {
    console.error('Error during initialization:', error);
    process.exit(1);
}

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

    // Create keys table
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

    // Create key history table
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

// Close the database connection when done
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
}); 