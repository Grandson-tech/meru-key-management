// API base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const keysTableBody = document.getElementById('keysTableBody');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const addButton = document.getElementById('addButton');
const updateButton = document.getElementById('updateButton');
const deleteButton = document.getElementById('deleteButton');
const assignButton = document.getElementById('assignButton');
const returnButton = document.getElementById('returnButton');
const historyButton = document.getElementById('historyButton');
const addModal = document.getElementById('addModal');
const updateModal = document.getElementById('updateModal');
const assignModal = document.getElementById('assignModal');
const returnModal = document.getElementById('returnModal');
const historyModal = document.getElementById('historyModal');
const addKeyForm = document.getElementById('addKeyForm');
const updateKeyForm = document.getElementById('updateKeyForm');
const assignKeyForm = document.getElementById('assignKeyForm');
const returnKeyForm = document.getElementById('returnKeyForm');
const historyTableBody = document.getElementById('historyTableBody');
const logoutBtn = document.getElementById('logoutBtn');
const usernameDisplay = document.getElementById('username');

let selectedKeyId = null;
let departments = [];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const username = localStorage.getItem('username');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    usernameDisplay.textContent = username;
    loadDepartments().then(() => {
        loadKeys();
    }).catch(error => {
        console.error('Failed to initialize:', error);
        alert('Failed to initialize the application. Please check the console for details.');
    });
});

searchButton.addEventListener('click', searchKeys);
addButton.addEventListener('click', () => openModal('addModal'));
updateButton.addEventListener('click', openUpdateModal);
deleteButton.addEventListener('click', deleteSelectedKey);
assignButton.addEventListener('click', openAssignModal);
returnButton.addEventListener('click', openReturnModal);
historyButton.addEventListener('click', openHistoryModal);
addKeyForm.addEventListener('submit', addKey);
updateKeyForm.addEventListener('submit', updateKey);
assignKeyForm.addEventListener('submit', assignKey);
returnKeyForm.addEventListener('submit', returnKey);
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
});

// Department selection handlers
document.getElementById('department').addEventListener('change', updateDepartmentInfo);
document.getElementById('updateDepartment').addEventListener('change', updateUpdateDepartmentInfo);
document.getElementById('assignDepartment').addEventListener('change', updateAssignDepartmentInfo);

// Functions
async function loadDepartments() {
    try {
        console.log('Loading departments...');
        const response = await fetch(`${API_URL}/departments`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        departments = await response.json();
        console.log(`Loaded ${departments.length} departments`);
        
        if (departments.length === 0) {
            throw new Error('No departments found in the database');
        }
        
        populateDepartmentSelects();
        return true;
    } catch (error) {
        console.error('Error loading departments:', error);
        alert('Error loading departments. Please check if the server is running and try again.');
        throw error;
    }
}

function populateDepartmentSelects() {
    try {
        const departmentSelects = [
            document.getElementById('department'),
            document.getElementById('updateDepartment'),
            document.getElementById('assignDepartment')
        ];

        departmentSelects.forEach(select => {
            if (!select) {
                throw new Error(`Department select element not found`);
            }
            
            select.innerHTML = '<option value="">Select Department</option>';
            departments.forEach(dept => {
                const option = document.createElement('option');
                option.value = dept.name;
                option.textContent = dept.name;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error populating department selects:', error);
        throw error;
    }
}

function updateDepartmentInfo() {
    try {
        const deptName = document.getElementById('department').value;
        const dept = departments.find(d => d.name === deptName);
        
        const facultyInput = document.getElementById('faculty');
        const buildingInput = document.getElementById('building');
        
        if (!facultyInput || !buildingInput) {
            throw new Error('Required input elements not found');
        }
        
        if (dept) {
            facultyInput.value = dept.faculty;
            buildingInput.value = dept.building;
        } else {
            facultyInput.value = '';
            buildingInput.value = '';
        }
    } catch (error) {
        console.error('Error updating department info:', error);
        alert('Error updating department information. Please try again.');
    }
}

function updateUpdateDepartmentInfo() {
    try {
        const deptName = document.getElementById('updateDepartment').value;
        const dept = departments.find(d => d.name === deptName);
        
        const facultyInput = document.getElementById('updateFaculty');
        const buildingInput = document.getElementById('updateBuilding');
        
        if (!facultyInput || !buildingInput) {
            throw new Error('Required input elements not found');
        }
        
        if (dept) {
            facultyInput.value = dept.faculty;
            buildingInput.value = dept.building;
        } else {
            facultyInput.value = '';
            buildingInput.value = '';
        }
    } catch (error) {
        console.error('Error updating department info:', error);
        alert('Error updating department information. Please try again.');
    }
}

function updateAssignDepartmentInfo() {
    try {
        const deptName = document.getElementById('assignDepartment').value;
        const dept = departments.find(d => d.name === deptName);
        
        const facultyInput = document.getElementById('assignFaculty');
        if (!facultyInput) {
            throw new Error('Faculty input element not found');
        }
        
        if (dept) {
            facultyInput.value = dept.faculty;
        } else {
            facultyInput.value = '';
        }
    } catch (error) {
        console.error('Error updating department info:', error);
        alert('Error updating department information. Please try again.');
    }
}

async function loadKeys() {
    try {
        console.log('Loading keys...');
        const response = await fetch(`${API_URL}/keys`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const keys = await response.json();
        console.log(`Loaded ${keys.length} keys`);
        displayKeys(keys);
    } catch (error) {
        console.error('Error loading keys:', error);
        alert('Error loading keys. Please check if the server is running and try again.');
    }
}

function displayKeys(keys) {
    try {
        keysTableBody.innerHTML = '';
        keys.forEach(key => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${key.name}</td>
                <td>${key.type}</td>
                <td><span class="status-badge status-${key.status.toLowerCase()}">${key.status}</span></td>
                <td>${key.assignedTo || '-'}</td>
                <td>${key.department || '-'}</td>
                <td>${key.faculty || '-'}</td>
                <td>${key.building || '-'}</td>
                <td>${key.room || '-'}</td>
                <td>${new Date(key.lastUpdated).toLocaleString()}</td>
            `;
            row.addEventListener('click', () => selectRow(row, key.id));
            keysTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying keys:', error);
        alert('Error displaying keys. Please try again.');
    }
}

function searchKeys() {
    try {
        const searchTerm = searchInput.value.toLowerCase();
        const rows = keysTableBody.getElementsByTagName('tr');
        
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    } catch (error) {
        console.error('Error searching keys:', error);
        alert('Error searching keys. Please try again.');
    }
}

function openModal(modalId) {
    try {
        document.getElementById(modalId).style.display = 'block';
    } catch (error) {
        console.error('Error opening modal:', error);
        alert('Error opening form. Please try again.');
    }
}

function closeModal(modalId) {
    try {
        document.getElementById(modalId).style.display = 'none';
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

function openUpdateModal() {
    try {
        if (!selectedKeyId) {
            alert('Please select a key to update');
            return;
        }
        
        const selectedRow = document.querySelector('tr.selected');
        const cells = selectedRow.cells;
        
        document.getElementById('updateKeyId').value = selectedKeyId;
        document.getElementById('updateKeyName').value = cells[0].textContent;
        document.getElementById('updateKeyType').value = cells[1].textContent;
        document.getElementById('updateDepartment').value = cells[4].textContent;
        document.getElementById('updateFaculty').value = cells[5].textContent;
        document.getElementById('updateBuilding').value = cells[6].textContent;
        document.getElementById('updateRoom').value = cells[7].textContent;
        document.getElementById('updateStatus').value = cells[2].textContent.trim();
        
        openModal('updateModal');
    } catch (error) {
        console.error('Error opening update modal:', error);
        alert('Error opening update form. Please try again.');
    }
}

function openAssignModal() {
    try {
        if (!selectedKeyId) {
            alert('Please select a key to assign');
            return;
        }
        
        document.getElementById('assignKeyId').value = selectedKeyId;
        openModal('assignModal');
    } catch (error) {
        console.error('Error opening assign modal:', error);
        alert('Error opening assign form. Please try again.');
    }
}

function openReturnModal() {
    try {
        if (!selectedKeyId) {
            alert('Please select a key to return');
            return;
        }
        
        document.getElementById('returnKeyId').value = selectedKeyId;
        openModal('returnModal');
    } catch (error) {
        console.error('Error opening return modal:', error);
        alert('Error opening return form. Please try again.');
    }
}

async function openHistoryModal() {
    try {
        if (!selectedKeyId) {
            alert('Please select a key to view its history');
            return;
        }
        
        const response = await fetch(`${API_URL}/keys/${selectedKeyId}/history`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const history = await response.json();
        displayHistory(history);
        openModal('historyModal');
    } catch (error) {
        console.error('Error loading key history:', error);
        alert('Error loading key history. Please try again.');
    }
}

function displayHistory(history) {
    try {
        historyTableBody.innerHTML = '';
        history.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(record.date).toLocaleString()}</td>
                <td>${record.action}</td>
                <td>${record.person || '-'}</td>
                <td>${record.department || '-'}</td>
                <td>${record.faculty || '-'}</td>
                <td>${record.notes || '-'}</td>
            `;
            historyTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error displaying history:', error);
        alert('Error displaying history. Please try again.');
    }
}

function selectRow(row, keyId) {
    try {
        document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        selectedKeyId = keyId;
    } catch (error) {
        console.error('Error selecting row:', error);
    }
}

async function addKey(event) {
    event.preventDefault();
    
    try {
        // Get form values
        const keyName = document.getElementById('keyName').value.trim();
        const keyType = document.getElementById('keyType').value;
        const department = document.getElementById('department').value;
        const faculty = document.getElementById('faculty').value.trim();
        const building = document.getElementById('building').value.trim();
        const room = document.getElementById('room').value.trim();
        const notes = document.getElementById('notes').value.trim();

        // Validate required fields
        if (!keyName) {
            alert('Please enter a key name');
            return;
        }
        if (!keyType) {
            alert('Please select a key type');
            return;
        }
        if (!department) {
            alert('Please select a department');
            return;
        }

        const keyData = {
            name: keyName,
            type: keyType,
            status: 'Available', // Default status for new keys
            department: department,
            faculty: faculty,
            building: building,
            room: room,
            notes: notes
        };
        
        console.log('Adding new key:', keyData);
        
        const response = await fetch(`${API_URL}/keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(keyData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        // Show success message
        alert('Key added successfully!');
        
        // Refresh the keys list
        await loadKeys();
        
        // Close modal and reset form
        closeModal('addModal');
        addKeyForm.reset();
    } catch (error) {
        console.error('Error adding key:', error);
        alert(`Error adding key: ${error.message}`);
    }
}

async function updateKey(event) {
    event.preventDefault();
    
    try {
        const keyData = {
            name: document.getElementById('updateKeyName').value,
            type: document.getElementById('updateKeyType').value,
            status: document.getElementById('updateStatus').value,
            department: document.getElementById('updateDepartment').value,
            faculty: document.getElementById('updateFaculty').value,
            building: document.getElementById('updateBuilding').value,
            room: document.getElementById('updateRoom').value,
            notes: document.getElementById('updateNotes').value
        };
        
        const response = await fetch(`${API_URL}/keys/${selectedKeyId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(keyData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loadKeys();
        closeModal('updateModal');
        updateKeyForm.reset();
        selectedKeyId = null;
    } catch (error) {
        console.error('Error updating key:', error);
        alert('Error updating key. Please try again.');
    }
}

async function assignKey(event) {
    event.preventDefault();
    
    try {
        const assignData = {
            person: document.getElementById('assignPerson').value,
            department: document.getElementById('assignDepartment').value,
            faculty: document.getElementById('assignFaculty').value,
            notes: document.getElementById('assignNotes').value
        };
        
        const response = await fetch(`${API_URL}/keys/${selectedKeyId}/assign`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assignData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loadKeys();
        closeModal('assignModal');
        assignKeyForm.reset();
    } catch (error) {
        console.error('Error assigning key:', error);
        alert('Error assigning key. Please try again.');
    }
}

async function returnKey(event) {
    event.preventDefault();
    
    try {
        const returnData = {
            notes: document.getElementById('returnNotes').value
        };
        
        const response = await fetch(`${API_URL}/keys/${selectedKeyId}/return`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(returnData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        loadKeys();
        closeModal('returnModal');
        returnKeyForm.reset();
    } catch (error) {
        console.error('Error returning key:', error);
        alert('Error returning key. Please try again.');
    }
}

async function deleteSelectedKey() {
    try {
        if (!selectedKeyId) {
            alert('Please select a key to delete');
            return;
        }
        
        if (confirm('Are you sure you want to delete this key?')) {
            const response = await fetch(`${API_URL}/keys/${selectedKeyId}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            loadKeys();
            selectedKeyId = null;
        }
    } catch (error) {
        console.error('Error deleting key:', error);
        alert('Error deleting key. Please try again.');
    }
}

// Close modals when clicking outside
window.addEventListener('click', (event) => {
    try {
        if (event.target === addModal) closeModal('addModal');
        if (event.target === updateModal) closeModal('updateModal');
        if (event.target === assignModal) closeModal('assignModal');
        if (event.target === returnModal) closeModal('returnModal');
        if (event.target === historyModal) closeModal('historyModal');
    } catch (error) {
        console.error('Error handling modal click:', error);
    }
}); 