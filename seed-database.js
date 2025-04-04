const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('keys.db');

const keys = [
    { name: "Main Administration Block - Front Door", type: "Physical", status: "Active" },
    { name: "Main Administration Block - Back Door", type: "Physical", status: "Active" },
    { name: "Vice Chancellor's Office", type: "Physical", status: "Active" },
    { name: "Registrar's Office", type: "Physical", status: "Active" },
    { name: "Finance Department", type: "Physical", status: "Active" },
    { name: "ICT Department - Server Room", type: "Electronic", status: "Active" },
    { name: "ICT Department - Main Office", type: "Physical", status: "Active" },
    { name: "Library - Main Entrance", type: "Physical", status: "Active" },
    { name: "Library - Staff Section", type: "Physical", status: "Active" },
    { name: "Library - Storage Room", type: "Physical", status: "Active" },
    { name: "Science Block - Main Entrance", type: "Physical", status: "Active" },
    { name: "Science Block - Lab 1", type: "Physical", status: "Active" },
    { name: "Science Block - Lab 2", type: "Physical", status: "Active" },
    { name: "Science Block - Storage Room", type: "Physical", status: "Active" },
    { name: "Engineering Block - Main Entrance", type: "Physical", status: "Active" },
    { name: "Engineering Block - Workshop", type: "Physical", status: "Active" },
    { name: "Engineering Block - Lab", type: "Physical", status: "Active" },
    { name: "Business Block - Main Entrance", type: "Physical", status: "Active" },
    { name: "Business Block - Computer Lab", type: "Electronic", status: "Active" },
    { name: "Business Block - Staff Room", type: "Physical", status: "Active" },
    { name: "Student Center - Main Entrance", type: "Physical", status: "Active" },
    { name: "Student Center - Cafeteria", type: "Physical", status: "Active" },
    { name: "Student Center - Storage", type: "Physical", status: "Active" },
    { name: "Hostel Block A - Main Entrance", type: "Physical", status: "Active" },
    { name: "Hostel Block A - Common Room", type: "Physical", status: "Active" },
    { name: "Hostel Block B - Main Entrance", type: "Physical", status: "Active" },
    { name: "Hostel Block B - Common Room", type: "Physical", status: "Active" },
    { name: "Security Office", type: "Physical", status: "Active" },
    { name: "Maintenance Workshop", type: "Physical", status: "Active" },
    { name: "Sports Complex - Main Entrance", type: "Physical", status: "Active" },
    { name: "Sports Complex - Equipment Room", type: "Physical", status: "Active" },
    { name: "Sports Complex - Storage", type: "Physical", status: "Active" },
    { name: "Parking Area - Main Gate", type: "Electronic", status: "Active" },
    { name: "Parking Area - Staff Section", type: "Electronic", status: "Active" },
    { name: "Parking Area - Student Section", type: "Electronic", status: "Active" }
];

db.serialize(() => {
    // Create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT,
        status TEXT,
        lastUpdated TEXT
    )`);

    // Clear existing data
    db.run('DELETE FROM keys');

    // Insert new keys
    const stmt = db.prepare('INSERT INTO keys (name, type, status, lastUpdated) VALUES (?, ?, ?, ?)');
    
    keys.forEach(key => {
        const lastUpdated = new Date().toISOString();
        stmt.run(key.name, key.type, key.status, lastUpdated);
    });

    stmt.finalize();

    console.log('Database seeded successfully with 35 keys from Meru University');
});

db.close(); 