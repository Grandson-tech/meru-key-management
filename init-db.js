const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database setup - use Render's persistent volume path
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'keys.db');
const dataDir = path.dirname(dbPath);

// Enhanced logging function
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    console.log(logMessage);
}

// Error handling wrapper
async function withErrorHandling(operation, errorMessage) {
    try {
        return await operation();
    } catch (error) {
        log(`${errorMessage}: ${error.message}`, 'error');
        log(`Stack trace: ${error.stack}`, 'error');
        throw error;
    }
}

log('Starting database initialization...');
log(`Current working directory: ${process.cwd()}`);
log(`Database path: ${dbPath}`);
log(`Data directory: ${dataDir}`);

// Ensure data directory exists
async function initializeDataDirectory() {
    return withErrorHandling(async () => {
        if (!fs.existsSync(dataDir)) {
            log('Creating data directory...');
            fs.mkdirSync(dataDir, { recursive: true });
            log('Data directory created successfully');
        } else {
            log('Data directory already exists');
        }

        // Check if we can write to the directory
        const testFile = path.join(dataDir, 'test.txt');
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        log('Directory is writable');
    }, 'Failed to initialize data directory');
}

// Initialize database
async function initializeDatabase() {
    return withErrorHandling(() => {
        return new Promise((resolve, reject) => {
            log('Initializing database connection...');
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    log(`Error opening database: ${err.message}`, 'error');
                    reject(err);
                } else {
                    log('Connected to the SQLite database successfully');
                    resolve(db);
                }
            });

            // Handle database errors
            db.on('error', (err) => {
                log(`Database error: ${err.message}`, 'error');
            });
        });
    }, 'Failed to initialize database');
}

// Create tables
async function createTables(db) {
    log('Starting table creation...');
    
    const tables = [
        {
            name: 'departments',
            sql: `CREATE TABLE IF NOT EXISTS departments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                faculty TEXT,
                building TEXT,
                contact_person TEXT,
                contact_email TEXT,
                contact_phone TEXT
            )`,
            callback: () => seedDepartments(db)
        },
        {
            name: 'users',
            sql: `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                department_id INTEGER,
                role TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (department_id) REFERENCES departments(id)
            )`,
            callback: () => {
                seedDefaultAdmin(db);
                seedTestUser(db);
            }
        },
        {
            name: 'keys',
            sql: `CREATE TABLE IF NOT EXISTS keys (
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
            )`
        },
        {
            name: 'key_history',
            sql: `CREATE TABLE IF NOT EXISTS key_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                keyId INTEGER,
                action TEXT,
                person TEXT,
                department TEXT,
                faculty TEXT,
                date TEXT,
                notes TEXT,
                FOREIGN KEY(keyId) REFERENCES keys(id)
            )`
        }
    ];

    for (const table of tables) {
        await withErrorHandling(() => {
            return new Promise((resolve, reject) => {
                log(`Creating ${table.name} table...`);
                db.run(table.sql, (err) => {
                    if (err) {
                        log(`Error creating ${table.name} table: ${err.message}`, 'error');
                        reject(err);
                    } else {
                        log(`${table.name} table created successfully`);
                        if (table.callback) {
                            table.callback();
                        }
                        resolve();
                    }
                });
            });
        }, `Failed to create ${table.name} table`);
    }
}

// Seed departments
async function seedDepartments(db) {
    log('Starting department seeding...');
    
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

    for (const dept of departments) {
        await withErrorHandling(() => {
            return new Promise((resolve, reject) => {
                log(`Seeding department: ${dept.name}`);
                db.run(
                    'INSERT OR IGNORE INTO departments (name, faculty, building, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)',
                    [dept.name, dept.faculty, dept.building, dept.contact_person, dept.contact_email, dept.contact_phone],
                    (err) => {
                        if (err) {
                            log(`Error seeding department ${dept.name}: ${err.message}`, 'error');
                            reject(err);
                        } else {
                            log(`Department ${dept.name} seeded successfully`);
                            resolve();
                        }
                    }
                );
            });
        }, `Failed to seed department ${dept.name}`);
    }
}

// Seed default admin
async function seedDefaultAdmin(db) {
    log('Starting admin user seeding...');
    
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@meru.ac.ke',
        password: 'admin123',
        department_id: 1,
        role: 'admin'
    };

    await withErrorHandling(async () => {
        const hash = await bcrypt.hash(defaultAdmin.password, 10);
        
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
                [defaultAdmin.username, defaultAdmin.email, hash, defaultAdmin.department_id, defaultAdmin.role],
                async (err) => {
                    if (err) {
                        log(`Error seeding admin user: ${err.message}`, 'error');
                        reject(err);
                    } else {
                        log('Admin user seeded successfully');
                        
                        // Verify admin user
                        db.get('SELECT * FROM users WHERE username = ?', [defaultAdmin.username], (err, row) => {
                            if (err) {
                                log(`Error verifying admin user: ${err.message}`, 'error');
                            } else if (row) {
                                log('Admin user verified successfully');
                            } else {
                                log('Admin user not found after seeding', 'error');
                            }
                            resolve();
                        });
                    }
                }
            );
        });
    }, 'Failed to seed admin user');
}

// Seed test user
async function seedTestUser(db) {
    log('Starting test user seeding...');
    
    const testUser = {
        username: 'testuser',
        email: 'test@meru.ac.ke',
        password: 'test123',
        department_id: 1,
        role: 'user'
    };

    await withErrorHandling(async () => {
        const hash = await bcrypt.hash(testUser.password, 10);
        
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT OR IGNORE INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
                [testUser.username, testUser.email, hash, testUser.department_id, testUser.role],
                async (err) => {
                    if (err) {
                        log(`Error seeding test user: ${err.message}`, 'error');
                        reject(err);
                    } else {
                        log('Test user seeded successfully');
                        
                        // Verify test user
                        db.get('SELECT * FROM users WHERE username = ?', [testUser.username], (err, row) => {
                            if (err) {
                                log(`Error verifying test user: ${err.message}`, 'error');
                            } else if (row) {
                                log('Test user verified successfully');
                            } else {
                                log('Test user not found after seeding', 'error');
                            }
                            resolve();
                        });
                    }
                }
            );
        });
    }, 'Failed to seed test user');
}

// Main initialization function
async function initialize() {
    try {
        await initializeDataDirectory();
        const db = await initializeDatabase();
        await createTables(db);
        
        log('Database initialization completed successfully');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                log(`Error closing database: ${err.message}`, 'error');
            } else {
                log('Database connection closed');
            }
        });
    } catch (error) {
        log('Database initialization failed', 'error');
        process.exit(1);
    }
}

// Start initialization
initialize(); 