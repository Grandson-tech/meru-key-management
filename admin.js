// API base URL
const API_URL = 'http://localhost:3000/api';

// DOM Elements
const usernameDisplay = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const addKeyBtn = document.getElementById('addKeyBtn');
const addDepartmentBtn = document.getElementById('addDepartmentBtn');
const generateReportBtn = document.getElementById('generateReportBtn');
const backupBtn = document.getElementById('backupBtn');
const manageDepartmentsBtn = document.getElementById('manageDepartmentsBtn');
const manageUsersBtn = document.getElementById('manageUsersBtn');

// Statistics elements
const totalKeysElement = document.getElementById('totalKeys');
const assignedKeysElement = document.getElementById('assignedKeys');
const availableKeysElement = document.getElementById('availableKeys');
const lostKeysElement = document.getElementById('lostKeys');

// Lists
const activityList = document.getElementById('activityList');
const departmentList = document.getElementById('departmentList');
const userList = document.getElementById('userList');

// Modals
const addDepartmentModal = document.getElementById('addDepartmentModal');
const generateReportModal = document.getElementById('generateReportModal');

// Forms
const addDepartmentForm = document.getElementById('addDepartmentForm');
const generateReportForm = document.getElementById('generateReportForm');

// Admin management elements
const manageAdminsBtn = document.getElementById('manageAdminsBtn');
const addAdminModal = document.getElementById('addAdminModal');
const addAdminForm = document.getElementById('addAdminForm');
const adminList = document.getElementById('adminList');

// Check authentication on page load
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    if (!token || role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    usernameDisplay.textContent = username;
    loadDashboardData();
    loadRecentActivity();
    loadDepartments();
    loadUsers();
    loadAdminUsers();
});

// Event Listeners
logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.href = 'login.html';
    }
});

addKeyBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

addDepartmentBtn.addEventListener('click', () => {
    openModal('addDepartmentModal');
});

generateReportBtn.addEventListener('click', () => {
    openModal('generateReportModal');
});

backupBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_URL}/backup`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `keys-backup-${new Date().toISOString()}.db`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            alert('Backup downloaded successfully');
        } else {
            alert('Failed to create backup');
        }
    } catch (error) {
        console.error('Backup error:', error);
        alert('An error occurred while creating the backup');
    }
});

manageDepartmentsBtn.addEventListener('click', () => window.location.href = 'departments.html');
manageUsersBtn.addEventListener('click', () => window.location.href = 'users.html');

manageAdminsBtn.addEventListener('click', () => {
    loadAdminUsers();
});

// Functions
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/keys/stats`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            totalKeysElement.textContent = data.totalKeys;
            assignedKeysElement.textContent = data.assignedKeys;
            availableKeysElement.textContent = data.availableKeys;
            lostKeysElement.textContent = data.lostKeys;
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`${API_URL}/activity`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const activities = await response.json();
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <strong>${activity.action}</strong> - ${activity.person}
                    <div class="activity-time">${new Date(activity.date).toLocaleString()}</div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

async function loadDepartments() {
    try {
        const response = await fetch(`${API_URL}/departments`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const departments = await response.json();
            departmentList.innerHTML = departments.map(dept => `
                <div class="list-item">
                    <div>
                        <strong>${dept.name}</strong>
                        <div>${dept.faculty} - ${dept.building}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading departments:', error);
    }
}

async function loadUsers() {
    try {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');

        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-user-role': role
            }
        });

        if (response.ok) {
            const users = await response.json();
            console.log('Loaded users:', users);
            
            userList.innerHTML = users.map(user => `
                <div class="list-item">
                    <div>
                        <strong>${user.username}</strong>
                        <div>${user.email} - ${user.role}</div>
                    </div>
                </div>
            `).join('');
        } else {
            console.error('Failed to load users');
            userList.innerHTML = '<div class="list-item">Error loading users</div>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        userList.innerHTML = '<div class="list-item">Error loading users</div>';
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

// Form Submissions
addDepartmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const department = {
        name: document.getElementById('deptName').value,
        faculty: document.getElementById('deptFaculty').value,
        building: document.getElementById('deptBuilding').value,
        contact_person: document.getElementById('deptContact').value,
        contact_email: document.getElementById('deptEmail').value,
        contact_phone: document.getElementById('deptPhone').value
    };

    try {
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(department)
        });

        if (response.ok) {
            alert('Department added successfully');
            closeModal('addDepartmentModal');
            loadDepartments();
            addDepartmentForm.reset();
        } else {
            alert('Failed to add department');
        }
    } catch (error) {
        console.error('Add department error:', error);
        alert('An error occurred while adding the department');
    }
});

generateReportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const reportData = {
        type: document.getElementById('reportType').value,
        format: document.getElementById('reportFormat').value,
        department: document.getElementById('reportDepartment').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value
    };

    try {
        const response = await fetch(`${API_URL}/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(reportData)
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `key-report-${new Date().toISOString()}.${reportData.format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            closeModal('generateReportModal');
        } else {
            alert('Failed to generate report');
        }
    } catch (error) {
        console.error('Generate report error:', error);
        alert('An error occurred while generating the report');
    }
});

// Report type change handler
document.getElementById('reportType').addEventListener('change', (e) => {
    const departmentGroup = document.getElementById('departmentSelectGroup');
    const dateRangeGroup = document.getElementById('dateRangeGroup');

    departmentGroup.style.display = e.target.value === 'department' ? 'block' : 'none';
    dateRangeGroup.style.display = e.target.value === 'date' ? 'block' : 'none';
});

addAdminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const admin = {
        username: document.getElementById('adminUsername').value,
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value
    };

    try {
        const response = await fetch(`${API_URL}/admin/create-admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'x-user-role': localStorage.getItem('userRole')
            },
            body: JSON.stringify(admin)
        });

        if (response.ok) {
            alert('Admin user created successfully');
            closeModal('addAdminModal');
            loadAdminUsers();
            addAdminForm.reset();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to create admin user');
        }
    } catch (error) {
        console.error('Create admin error:', error);
        alert('An error occurred while creating admin user');
    }
});

async function loadAdminUsers() {
    try {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');

        console.log('Loading admin users...');
        console.log('User role:', role);
        console.log('Auth token:', token ? 'Present' : 'Missing');

        if (!token || role !== 'admin') {
            console.log('Access denied - Invalid token or role');
            adminList.innerHTML = '<div class="list-item">Access denied. Please log in as admin.</div>';
            return;
        }

        const response = await fetch(`${API_URL}/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-user-role': role
            }
        });

        console.log('Response status:', response.status);

        if (response.ok) {
            const users = await response.json();
            console.log('Fetched users:', users);
            
            const admins = users.filter(user => user.role === 'admin');
            console.log('Admin users:', admins);
            
            if (admins.length === 0) {
                adminList.innerHTML = '<div class="list-item">No admin users found</div>';
                return;
            }

            adminList.innerHTML = admins.map(admin => `
                <div class="list-item">
                    <div class="admin-info">
                        <strong>${admin.username}</strong>
                        <div>${admin.email}</div>
                    </div>
                    <div class="admin-actions">
                        <button class="btn-edit" onclick="editAdmin('${admin.id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteAdmin('${admin.id}')">Delete</button>
                    </div>
                </div>
            `).join('');
        } else {
            const error = await response.json();
            console.error('Failed to load admin users:', error);
            adminList.innerHTML = '<div class="list-item">Error loading admin users: ' + error.message + '</div>';
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
        adminList.innerHTML = '<div class="list-item">Error loading admin users. Please check your connection.</div>';
    }
}

async function deleteAdmin(adminId) {
    if (!confirm('Are you sure you want to delete this admin user?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin/users/${adminId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'x-user-role': localStorage.getItem('userRole')
            }
        });

        if (response.ok) {
            alert('Admin user deleted successfully');
            loadAdminUsers();
        } else {
            const data = await response.json();
            alert(data.message || 'Failed to delete admin user');
        }
    } catch (error) {
        console.error('Delete admin error:', error);
        alert('An error occurred while deleting admin user');
    }
}

async function editAdmin(adminId) {
    try {
        const response = await fetch(`${API_URL}/admin/users/${adminId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (response.ok) {
            const admin = await response.json();
            document.getElementById('adminUsername').value = admin.username;
            document.getElementById('adminEmail').value = admin.email;
            document.getElementById('adminPassword').value = ''; // Clear password field
            openModal('addAdminModal');
        }
    } catch (error) {
        console.error('Error loading admin details:', error);
        alert('An error occurred while loading admin details');
    }
} 