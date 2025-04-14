const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database setup - use Render's persistent volume path
const dbPath = process.env.DATABASE_URL || path.join(process.cwd(), 'data', 'keys.db');
const dataDir = path.dirname(dbPath);

// Enhanced logging function with colors and levels
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        warning: '\x1b[33m', // Yellow
        error: '\x1b[31m',   // Red
        reset: '\x1b[0m'     // Reset
    };
    const color = colors[level] || colors.info;
    const logMessage = `${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`;
    console.log(logMessage);
}

// Error handling wrapper with detailed error information
async function withErrorHandling(operation, errorMessage) {
    try {
        return await operation();
    } catch (error) {
        log(`${errorMessage}: ${error.message}`, 'error');
        log(`Stack trace: ${error.stack}`, 'error');
        if (error.code) {
            log(`Error code: ${error.code}`, 'error');
        }
        if (error.errno) {
            log(`Error number: ${error.errno}`, 'error');
        }
        throw error;
    }
}

// Database connection wrapper with retry logic
async function connectToDatabase(retries = 3, delay = 1000) {
    return withErrorHandling(async () => {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                log(`Attempting database connection (attempt ${attempt}/${retries})...`);
                const db = await new Promise((resolve, reject) => {
                    const db = new sqlite3.Database(dbPath, (err) => {
                        if (err) reject(err);
                        else resolve(db);
                    });
                });
                log('Database connection established successfully', 'success');
                return db;
            } catch (error) {
                if (attempt === retries) throw error;
                log(`Connection attempt ${attempt} failed, retrying in ${delay}ms...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }, 'Failed to connect to database');
}

// Directory initialization with permission checks
async function initializeDataDirectory() {
    return withErrorHandling(async () => {
        log('Initializing data directory...');
        
        // Check if directory exists
        if (!fs.existsSync(dataDir)) {
            log('Creating data directory...');
            fs.mkdirSync(dataDir, { recursive: true });
            log('Data directory created successfully', 'success');
        } else {
            log('Data directory already exists');
        }

        // Check write permissions
        const testFile = path.join(dataDir, 'test.txt');
        try {
            fs.writeFileSync(testFile, 'test');
            fs.unlinkSync(testFile);
            log('Directory is writable', 'success');
        } catch (error) {
            log('Directory is not writable', 'error');
            throw error;
        }

        // Check database file
        if (fs.existsSync(dbPath)) {
            log(`Database file exists at: ${dbPath}`);
            try {
                const stats = fs.statSync(dbPath);
                log(`Database file size: ${stats.size} bytes`);
                log(`Database file permissions: ${stats.mode.toString(8)}`);
            } catch (error) {
                log('Error checking database file properties', 'warning');
            }
        } else {
            log('Database file does not exist yet', 'warning');
        }
    }, 'Failed to initialize data directory');
}

// Table creation with verification
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
        await withErrorHandling(async () => {
            log(`Creating ${table.name} table...`);
            
            // Create table
            await new Promise((resolve, reject) => {
                db.run(table.sql, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            log(`${table.name} table created successfully`, 'success');

            // Verify table exists
            const tableExists = await new Promise((resolve) => {
                db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [table.name], (err, row) => {
                    resolve(!!row);
                });
            });
            
            if (!tableExists) {
                throw new Error(`Table ${table.name} was not created successfully`);
            }
            log(`${table.name} table verified`, 'success');

            // Run callback if exists
            if (table.callback) {
                await table.callback();
            }
        }, `Failed to create ${table.name} table`);
    }
}

// Enhanced user seeding with verification
async function seedUser(db, user, role) {
    return withErrorHandling(async () => {
        log(`Starting ${role} user seeding...`);
        
        // Check if user already exists
        const existingUser = await new Promise((resolve) => {
            db.get('SELECT * FROM users WHERE username = ?', [user.username], (err, row) => {
                resolve(row);
            });
        });

        if (existingUser) {
            log(`${role} user already exists`, 'warning');
            return;
        }

        // Hash password
        const hash = await bcrypt.hash(user.password, 10);
        log('Password hashed successfully');

        // Insert user
        await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
                [user.username, user.email, hash, user.department_id, user.role],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
        log(`${role} user inserted successfully`, 'success');

        // Verify user creation
        const createdUser = await new Promise((resolve) => {
            db.get('SELECT * FROM users WHERE username = ?', [user.username], (err, row) => {
                resolve(row);
            });
        });

        if (!createdUser) {
            throw new Error(`${role} user not found after creation`);
        }
        log(`${role} user verified successfully`, 'success');
    }, `Failed to seed ${role} user`);
}

// Seed default admin
async function seedDefaultAdmin(db) {
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@meru.ac.ke',
        password: 'admin123',
        department_id: 1,
        role: 'admin'
    };
    await seedUser(db, defaultAdmin, 'Admin');
}

// Seed test user
async function seedTestUser(db) {
    const testUser = {
        username: 'testuser',
        email: 'test@meru.ac.ke',
        password: 'test123',
        department_id: 1,
        role: 'user'
    };
    await seedUser(db, testUser, 'Test');
}

// Main initialization function
async function initialize() {
    try {
        log('Starting database initialization...');
        log(`Current working directory: ${process.cwd()}`);
        log(`Database path: ${dbPath}`);
        log(`Data directory: ${dataDir}`);

        await initializeDataDirectory();
        const db = await connectToDatabase();
        await createTables(db);
        
        log('Database initialization completed successfully', 'success');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                log(`Error closing database: ${err.message}`, 'error');
            } else {
                log('Database connection closed', 'success');
            }
        });
    } catch (error) {
        log('Database initialization failed', 'error');
        process.exit(1);
    }
}

// Start initialization
initialize(); 