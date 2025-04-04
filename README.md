# Meru University Key Management System

A web-based key management system for Meru University, built with Node.js, Express, and SQLite.

## Features

- Add, view, update, and delete keys
- Assign and return keys to staff members
- Track key history and movements
- Department-based key management
- Search functionality
- Responsive web interface

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository or download the source code
2. Open a terminal in the project directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   node server.js
   ```
5. Open your web browser and navigate to:
   ```
   http://localhost:3000
   ```

## Database Setup

The system uses SQLite for data storage. The database (`keys.db`) will be automatically created when you first run the server. It includes:

- Departments table with predefined university departments
- Keys table for storing key information
- Key history table for tracking key movements

## Usage

### Adding a New Key
1. Click the "Add New Key" button
2. Fill in the key details:
   - Key Name
   - Key Type (Physical/Electronic)
   - Select Department (faculty and building will auto-populate)
   - Room Number
   - Status
   - Notes (optional)
3. Click "Save"

### Updating a Key
1. Select a key from the table
2. Click "Update Key"
3. Modify the required fields
4. Click "Update"

### Assigning a Key
1. Select a key from the table
2. Click "Assign Key"
3. Enter the person's name
4. Select the department
5. Add any notes
6. Click "Assign"

### Returning a Key
1. Select an assigned key from the table
2. Click "Return Key"
3. Add return notes (optional)
4. Click "Return"

### Viewing Key History
1. Select a key from the table
2. Click "View History"
3. View the complete history of the key's movements

### Searching Keys
1. Enter search terms in the search box
2. Click "Search" or press Enter
3. The table will filter to show matching keys

## Departments

The system includes predefined departments:
- ICT Department (Science and Technology)
- Library (Administration)
- Security (Administration)
- Engineering Department (Engineering)
- Business Department (Business and Economics)

## Troubleshooting

### Server Not Starting
If you see the error "address already in use :::3000":
1. Find the process using port 3000:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Kill the process using the PID:
   ```bash
   taskkill /F /PID <PID>
   ```
3. Start the server again:
   ```bash
   node server.js
   ```

### Database Issues
If you encounter database-related errors:
1. Stop the server
2. Delete the `keys.db` file
3. Restart the server (a new database will be created)

## Support

For any issues or questions, please contact the system administrator.

## License

This project is licensed under the MIT License. 