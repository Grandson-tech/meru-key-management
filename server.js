const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

// Get port from environment variable or use 3000
const port = process.env.PORT || 3000;

// JWT secret key (in production, use a secure key from environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve files from the current directory

// Database setup
const dbPath = process.env.DATABASE_URL || 'keys.db';
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to the SQLite database.');
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        // Create departments table if it doesn't exist
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

        // Create keys table if it doesn't exist
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
                seedKeys();
            }
        });

        // Create key history table if it doesn't exist
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

        // Create users table if it doesn't exist
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
                // Seed default admin user
                seedDefaultAdmin();
            }
        });
    });
}

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
        },
        {
            name: "Engineering Department",
            faculty: "Engineering",
            building: "Engineering Block",
            contact_person: "Dr. Peter Maina",
            contact_email: "engineering@meruuniversity.ac.ke",
            contact_phone: "0745678901"
        },
        {
            name: "Business Department",
            faculty: "Business and Economics",
            building: "Business Block",
            contact_person: "Dr. Mary Wanjiku",
            contact_email: "business@meruuniversity.ac.ke",
            contact_phone: "0756789012"
        }
    ];

    const stmt = db.prepare('INSERT INTO departments (name, faculty, building, contact_person, contact_email, contact_phone) VALUES (?, ?, ?, ?, ?, ?)');
    
    departments.forEach(dept => {
        stmt.run(dept.name, dept.faculty, dept.building, dept.contact_person, dept.contact_email, dept.contact_phone, (err) => {
            if (err) {
                console.error(`Error inserting department ${dept.name}:`, err);
            }
        });
    });
    
    stmt.finalize((err) => {
        if (err) {
            console.error('Error finalizing department insert:', err);
        } else {
            console.log('Departments seeded successfully');
        }
    });
}

async function seedKeys() {
    try {
        console.log('Starting to seed keys...');
        
        // First, check if there are any existing keys
        const existingKeys = await new Promise((resolve, reject) => {
            db.all('SELECT COUNT(*) as count FROM keys', (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0].count);
            });
        });

        if (existingKeys > 0) {
            console.log('Keys already exist in the database, skipping seeding');
            return;
        }

        console.log('No existing keys found, proceeding with seeding...');
        
        const keys = [
            // School of Computing and Informatics
            { name: 'Main Server Room', type: 'Physical', status: 'Available', department: 'School of Computing and Informatics', faculty: 'Faculty of Computing and Informatics', building: 'SCI Building', room: 'SCI-101', notes: 'Main server room access key' },
            { name: 'Computer Lab 1', type: 'Physical', status: 'Available', department: 'School of Computing and Informatics', faculty: 'Faculty of Computing and Informatics', building: 'SCI Building', room: 'SCI-201', notes: 'Computer laboratory access key' },
            { name: 'Network Room', type: 'Physical', status: 'Available', department: 'School of Computing and Informatics', faculty: 'Faculty of Computing and Informatics', building: 'SCI Building', room: 'SCI-102', notes: 'Network equipment room key' },

            // School of Business and Economics
            { name: 'Dean\'s Office', type: 'Physical', status: 'Available', department: 'School of Business and Economics', faculty: 'Faculty of Business and Economics', building: 'SBE Building', room: 'SBE-001', notes: 'Dean\'s office access key' },
            { name: 'Finance Lab', type: 'Physical', status: 'Available', department: 'School of Business and Economics', faculty: 'Faculty of Business and Economics', building: 'SBE Building', room: 'SBE-201', notes: 'Finance laboratory key' },
            { name: 'Conference Room', type: 'Physical', status: 'Available', department: 'School of Business and Economics', faculty: 'Faculty of Business and Economics', building: 'SBE Building', room: 'SBE-301', notes: 'Main conference room key' },

            // School of Engineering
            { name: 'Workshop 1', type: 'Physical', status: 'Available', department: 'School of Engineering', faculty: 'Faculty of Engineering', building: 'ENG Building', room: 'ENG-101', notes: 'Main engineering workshop key' },
            { name: 'Electronics Lab', type: 'Physical', status: 'Available', department: 'School of Engineering', faculty: 'Faculty of Engineering', building: 'ENG Building', room: 'ENG-202', notes: 'Electronics laboratory key' },
            { name: 'Storage Room', type: 'Physical', status: 'Available', department: 'School of Engineering', faculty: 'Faculty of Engineering', building: 'ENG Building', room: 'ENG-103', notes: 'Engineering equipment storage key' },

            // School of Agriculture
            { name: 'Greenhouse 1', type: 'Physical', status: 'Available', department: 'School of Agriculture', faculty: 'Faculty of Agriculture', building: 'AGR Building', room: 'AGR-101', notes: 'Main greenhouse access key' },
            { name: 'Laboratory', type: 'Physical', status: 'Available', department: 'School of Agriculture', faculty: 'Faculty of Agriculture', building: 'AGR Building', room: 'AGR-201', notes: 'Agriculture laboratory key' },
            { name: 'Storage Shed', type: 'Physical', status: 'Available', department: 'School of Agriculture', faculty: 'Faculty of Agriculture', building: 'AGR Building', room: 'AGR-102', notes: 'Equipment storage shed key' },

            // School of Health Sciences
            { name: 'Medical Lab', type: 'Physical', status: 'Available', department: 'School of Health Sciences', faculty: 'Faculty of Health Sciences', building: 'HSC Building', room: 'HSC-101', notes: 'Medical laboratory key' },
            { name: 'Pharmacy Room', type: 'Physical', status: 'Available', department: 'School of Health Sciences', faculty: 'Faculty of Health Sciences', building: 'HSC Building', room: 'HSC-201', notes: 'Pharmacy storage room key' },
            { name: 'Clinical Room', type: 'Physical', status: 'Available', department: 'School of Health Sciences', faculty: 'Faculty of Health Sciences', building: 'HSC Building', room: 'HSC-301', notes: 'Clinical practice room key' },

            // School of Education
            { name: 'Resource Center', type: 'Physical', status: 'Available', department: 'School of Education', faculty: 'Faculty of Education', building: 'EDU Building', room: 'EDU-101', notes: 'Education resource center key' },
            { name: 'Computer Lab', type: 'Physical', status: 'Available', department: 'School of Education', faculty: 'Faculty of Education', building: 'EDU Building', room: 'EDU-201', notes: 'Education computer lab key' },
            { name: 'Conference Room', type: 'Physical', status: 'Available', department: 'School of Education', faculty: 'Faculty of Education', building: 'EDU Building', room: 'EDU-301', notes: 'Education conference room key' },

            // School of Pure and Applied Sciences
            { name: 'Chemistry Lab', type: 'Physical', status: 'Available', department: 'School of Pure and Applied Sciences', faculty: 'Faculty of Science', building: 'SCI Building', room: 'SCI-301', notes: 'Chemistry laboratory key' },
            { name: 'Physics Lab', type: 'Physical', status: 'Available', department: 'School of Pure and Applied Sciences', faculty: 'Faculty of Science', building: 'SCI Building', room: 'SCI-302', notes: 'Physics laboratory key' },
            { name: 'Biology Lab', type: 'Physical', status: 'Available', department: 'School of Pure and Applied Sciences', faculty: 'Faculty of Science', building: 'SCI Building', room: 'SCI-303', notes: 'Biology laboratory key' }
        ];

        console.log(`Preparing to insert ${keys.length} keys...`);

        const stmt = db.prepare(`
            INSERT INTO keys (
                name, type, status, department, faculty, building, room, notes, lastUpdated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let insertedCount = 0;
        for (const key of keys) {
            try {
                stmt.run(
                    key.name,
                    key.type,
                    key.status,
                    key.department,
                    key.faculty,
                    key.building,
                    key.room,
                    key.notes,
                    new Date().toISOString()
                );
                insertedCount++;
            } catch (err) {
                console.error(`Error inserting key ${key.name}:`, err);
            }
        }

        stmt.finalize();
        console.log(`Successfully inserted ${insertedCount} keys`);
    } catch (error) {
        console.error('Error in seedKeys:', error);
    }
}

// Function to seed default admin user
function seedDefaultAdmin() {
    const defaultAdmin = {
        username: 'admin',
        email: 'admin@meru.ac.ke',
        password: 'admin123', // In production, use a secure password
        department_id: 1, // Assuming department_id 1 exists
        role: 'admin'
    };

    // Check if admin user already exists
    db.get('SELECT * FROM users WHERE username = ?', [defaultAdmin.username], (err, row) => {
        if (err) {
            console.error('Error checking for admin user:', err);
            return;
        }

        if (!row) {
            // Insert default admin user
            db.run(
                'INSERT INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
                [defaultAdmin.username, defaultAdmin.email, defaultAdmin.password, defaultAdmin.department_id, defaultAdmin.role],
                (err) => {
                    if (err) {
                        console.error('Error seeding admin user:', err);
                    } else {
                        console.log('Default admin user seeded successfully');
                    }
                }
            );
        } else {
            console.log('Admin user already exists');
        }
    });
}

// API Routes
app.get('/api/departments', (req, res) => {
    console.log('Fetching departments...');
    db.all('SELECT * FROM departments ORDER BY name', [], (err, rows) => {
        if (err) {
            console.error('Error fetching departments:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Found ${rows.length} departments`);
        res.json(rows);
    });
});

app.get('/api/keys', (req, res) => {
    console.log('Fetching all keys...');
    db.all('SELECT * FROM keys', [], (err, rows) => {
        if (err) {
            console.error('Error fetching keys:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        console.log(`Found ${rows.length} keys`);
        res.json(rows);
    });
});

app.get('/api/keys/:id/history', (req, res) => {
    db.all('SELECT * FROM key_history WHERE keyId = ? ORDER BY date DESC', 
        [req.params.id], 
        (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
});

app.post('/api/keys', (req, res) => {
    const { name, type, status, department, faculty, building, room, notes } = req.body;
    const lastUpdated = new Date().toISOString();
    
    db.run('INSERT INTO keys (name, type, status, lastUpdated, department, faculty, building, room, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, type, status, lastUpdated, department, faculty, building, room, notes],
        function(err) {
            if (err) {
                console.error('Error adding key:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                name,
                type,
                status,
                lastUpdated,
                department,
                faculty,
                building,
                room,
                notes
            });
        });
});

app.put('/api/keys/:id', (req, res) => {
    const { name, type, status, assignedTo, department, faculty, building, room, notes } = req.body;
    const lastUpdated = new Date().toISOString();
    
    db.run('UPDATE keys SET name = ?, type = ?, status = ?, lastUpdated = ?, assignedTo = ?, department = ?, faculty = ?, building = ?, room = ?, notes = ? WHERE id = ?',
        [name, type, status, lastUpdated, assignedTo, department, faculty, building, room, notes, req.params.id],
        function(err) {
            if (err) {
                console.error('Error updating key:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: req.params.id,
                name,
                type,
                status,
                lastUpdated,
                assignedTo,
                department,
                faculty,
                building,
                room,
                notes
            });
        });
});

app.post('/api/keys/:id/assign', (req, res) => {
    const { person, department, faculty, notes } = req.body;
    const date = new Date().toISOString();
    
    db.serialize(() => {
        db.run('UPDATE keys SET assignedTo = ?, status = "Assigned", lastUpdated = ? WHERE id = ?',
            [person, date, req.params.id]);
            
        db.run('INSERT INTO key_history (keyId, action, person, department, faculty, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.params.id, 'Assigned', person, department, faculty, date, notes]);
            
        res.json({ message: 'Key assigned successfully' });
    });
});

app.post('/api/keys/:id/return', (req, res) => {
    const { notes } = req.body;
    const date = new Date().toISOString();
    
    db.serialize(() => {
        db.run('UPDATE keys SET assignedTo = NULL, status = "Available", lastUpdated = ? WHERE id = ?',
            [date, req.params.id]);
            
        db.run('INSERT INTO key_history (keyId, action, person, department, faculty, date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [req.params.id, 'Returned', null, null, null, date, notes]);
            
        res.json({ message: 'Key returned successfully' });
    });
});

app.delete('/api/keys/:id', (req, res) => {
    db.run('DELETE FROM keys WHERE id = ?', req.params.id, function(err) {
        if (err) {
            console.error('Error deleting key:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Key deleted successfully' });
    });
});

// Admin Dashboard Endpoints
app.get('/api/keys/stats', (req, res) => {
    db.all(`
        SELECT 
            COUNT(*) as totalKeys,
            SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assignedKeys,
            SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END) as availableKeys,
            SUM(CASE WHEN status = 'Lost' THEN 1 ELSE 0 END) as lostKeys,
            SUM(CASE WHEN status = 'Damaged' THEN 1 ELSE 0 END) as damagedKeys
        FROM keys
    `, (err, rows) => {
        if (err) {
            console.error('Error getting key statistics:', err);
            res.status(500).json({ error: 'Failed to get key statistics' });
        } else {
            res.json(rows[0]);
        }
    });
});

app.get('/api/activity', (req, res) => {
    db.all(`
        SELECT * FROM key_history
        ORDER BY date DESC
        LIMIT 10
    `, (err, rows) => {
        if (err) {
            console.error('Error getting recent activity:', err);
            res.status(500).json({ error: 'Failed to get recent activity' });
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/backup', (req, res) => {
    const backupPath = path.join(__dirname, 'backups', `keys-backup-${Date.now()}.db`);
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(path.join(__dirname, 'backups'))) {
        fs.mkdirSync(path.join(__dirname, 'backups'));
    }
    
    // Copy the database file
    fs.copyFile('keys.db', backupPath, (err) => {
        if (err) {
            console.error('Error creating backup:', err);
            res.status(500).json({ error: 'Failed to create backup' });
        } else {
            res.download(backupPath, (err) => {
                if (err) {
                    console.error('Error sending backup file:', err);
                }
                // Delete the backup file after sending
                fs.unlink(backupPath, (err) => {
                    if (err) console.error('Error deleting backup file:', err);
                });
            });
        }
    });
});

app.post('/api/reports', (req, res) => {
    const { type, format, startDate, endDate, department } = req.body;
    
    let query = 'SELECT * FROM keys';
    const params = [];
    
    switch (type) {
        case 'assigned':
            query += ' WHERE status = ?';
            params.push('Assigned');
            break;
        case 'available':
            query += ' WHERE status = ?';
            params.push('Available');
            break;
        case 'department':
            query += ' WHERE department = ?';
            params.push(department);
            break;
        case 'date':
            query += ' WHERE lastUpdated BETWEEN ? AND ?';
            params.push(startDate, endDate);
            break;
    }
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Error generating report:', err);
            res.status(500).json({ error: 'Failed to generate report' });
        } else {
            // For now, we'll just return the data as JSON
            // In a real application, you would generate PDF/Excel/CSV files
            res.json(rows);
        }
    });
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Function to check if user is admin
const isAdmin = (req, res, next) => {
    const role = req.headers['x-user-role'];
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

// Debug endpoint to check current users
app.get('/api/debug/users', (req, res) => {
    db.all('SELECT id, username, email, role FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }
        console.log('Current users:', rows);
        res.json(rows);
    });
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, (req, res) => {
    console.log('User role:', req.user.role);
    if (req.user.role !== 'admin') {
        console.log('Access denied for non-admin user');
        return res.status(403).json({ message: 'Access denied' });
    }

    db.all('SELECT id, username, email, role FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }
        console.log('Fetched users:', rows);
        res.json(rows);
    });
});

// Authentication endpoints
app.post('/api/auth/register', (req, res) => {
    const { username, email, password, department, role } = req.body;

    // Validate input
    if (!username || !email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    // Prevent admin role in regular registration
    if (role === 'admin') {
        return res.status(403).json({ message: 'Cannot register as admin' });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.status(500).json({ message: 'Error hashing password' });
        }

        db.run(
            'INSERT INTO users (username, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, department, role],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ message: 'Username or email already exists' });
                    }
                    return res.status(500).json({ message: 'Error creating user' });
                }
                res.status(201).json({ message: 'User created successfully' });
            }
        );
    });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Error during login' });
            }
            if (!user) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }

            // Verify password
            bcrypt.compare(password, user.password, (err, result) => {
                if (err || !result) {
                    return res.status(401).json({ message: 'Invalid username or password' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { 
                        id: user.id,
                        username: user.username,
                        role: user.role 
                    },
                    JWT_SECRET,
                    { expiresIn: '24h' }
                );

                res.json({
                    token,
                    username: user.username,
                    role: user.role
                });
            });
        }
    );
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // Check if email exists in the database
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) {
            return res.status(500).json({ message: 'Error checking email' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Email not found' });
        }

        // In a real application, you would:
        // 1. Generate a reset token
        // 2. Store the token in the database with an expiration time
        // 3. Send an email with the reset link
        // For this example, we'll just return a success message

        res.json({ 
            message: 'If an account with this email exists, a password reset link has been sent'
        });
    });
});

// Protect admin routes
app.use('/api/admin/*', authenticateToken);

// Create admin user (admin only)
app.post('/api/admin/create-admin', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if username or email already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) {
            console.error('Error checking existing user:', err);
            return res.status(500).json({ message: 'Error checking user' });
        }
        if (row) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.error('Error hashing password:', err);
                return res.status(500).json({ message: 'Error creating user' });
            }

            // Insert new admin user
            db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hash, 'admin'],
                function(err) {
                    if (err) {
                        console.error('Error creating admin user:', err);
                        return res.status(500).json({ message: 'Error creating admin user' });
                    }
                    res.status(201).json({ 
                        message: 'Admin user created successfully',
                        id: this.lastID
                    });
                }
            );
        });
    });
});

// Delete admin user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const userId = req.params.id;
    db.run('DELETE FROM users WHERE id = ? AND role = ?', [userId, 'admin'], function(err) {
        if (err) {
            console.error('Error deleting admin user:', err);
            return res.status(500).json({ message: 'Error deleting admin user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'Admin user not found' });
        }
        res.json({ message: 'Admin user deleted successfully' });
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
}); 