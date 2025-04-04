Imports System.Data.SqlClient
Imports System.Windows.Forms
Imports System.Drawing

Public Class KeyManagementSystem
    Inherits Form

    Private components As System.ComponentModel.IContainer
    Private dataGridView As DataGridView
    Private btnAdd As Button
    Private btnUpdate As Button
    Private btnDelete As Button
    Private txtSearch As TextBox
    Private btnSearch As Button
    Private dbHelper As DatabaseHelper
    Private lblTitle As Label
    Private pnlHeader As Panel
    Private pnlSearch As Panel
    Private pnlButtons As Panel

    Public Sub New()
        InitializeComponent()
        InitializeUI()
        dbHelper = New DatabaseHelper()
        LoadKeys()
    End Sub

    Private Sub InitializeComponent()
        Me.components = New System.ComponentModel.Container()
        Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
        Me.ClientSize = New System.Drawing.Size(1000, 700)
        Me.Text = "Key Management System"
        Me.BackColor = Color.White
        Me.StartPosition = FormStartPosition.CenterScreen
        Me.MinimumSize = New Size(800, 600)
    End Sub

    Private Sub InitializeUI()
        ' Header Panel
        pnlHeader = New Panel()
        pnlHeader.Dock = DockStyle.Top
        pnlHeader.Height = 80
        pnlHeader.BackColor = Color.FromArgb(41, 128, 185)
        Me.Controls.Add(pnlHeader)

        ' Title Label
        lblTitle = New Label()
        lblTitle.Text = "Key Management System"
        lblTitle.Font = New Font("Segoe UI", 20, FontStyle.Bold)
        lblTitle.ForeColor = Color.White
        lblTitle.AutoSize = True
        lblTitle.Location = New Point(20, 20)
        pnlHeader.Controls.Add(lblTitle)

        ' Search Panel
        pnlSearch = New Panel()
        pnlSearch.Dock = DockStyle.Top
        pnlSearch.Height = 60
        pnlSearch.BackColor = Color.FromArgb(236, 240, 241)
        Me.Controls.Add(pnlSearch)

        ' Search Controls
        txtSearch = New TextBox()
        txtSearch.Location = New Point(20, 20)
        txtSearch.Size = New Size(300, 30)
        txtSearch.Font = New Font("Segoe UI", 10)
        txtSearch.PlaceholderText = "Search keys..."
        pnlSearch.Controls.Add(txtSearch)

        btnSearch = New Button()
        btnSearch.Text = "Search"
        btnSearch.Location = New Point(330, 20)
        btnSearch.Size = New Size(100, 30)
        btnSearch.Font = New Font("Segoe UI", 10)
        btnSearch.BackColor = Color.FromArgb(41, 128, 185)
        btnSearch.ForeColor = Color.White
        btnSearch.FlatStyle = FlatStyle.Flat
        AddHandler btnSearch.Click, AddressOf btnSearch_Click
        pnlSearch.Controls.Add(btnSearch)

        ' Buttons Panel
        pnlButtons = New Panel()
        pnlButtons.Dock = DockStyle.Top
        pnlButtons.Height = 60
        pnlButtons.BackColor = Color.White
        Me.Controls.Add(pnlButtons)

        ' Action Buttons
        btnAdd = New Button()
        btnAdd.Text = "Add New Key"
        btnAdd.Location = New Point(20, 15)
        btnAdd.Size = New Size(120, 30)
        btnAdd.Font = New Font("Segoe UI", 10)
        btnAdd.BackColor = Color.FromArgb(46, 204, 113)
        btnAdd.ForeColor = Color.White
        btnAdd.FlatStyle = FlatStyle.Flat
        AddHandler btnAdd.Click, AddressOf btnAdd_Click
        pnlButtons.Controls.Add(btnAdd)

        btnUpdate = New Button()
        btnUpdate.Text = "Update Key"
        btnUpdate.Location = New Point(150, 15)
        btnUpdate.Size = New Size(120, 30)
        btnUpdate.Font = New Font("Segoe UI", 10)
        btnUpdate.BackColor = Color.FromArgb(52, 152, 219)
        btnUpdate.ForeColor = Color.White
        btnUpdate.FlatStyle = FlatStyle.Flat
        AddHandler btnUpdate.Click, AddressOf btnUpdate_Click
        pnlButtons.Controls.Add(btnUpdate)

        btnDelete = New Button()
        btnDelete.Text = "Delete Key"
        btnDelete.Location = New Point(280, 15)
        btnDelete.Size = New Size(120, 30)
        btnDelete.Font = New Font("Segoe UI", 10)
        btnDelete.BackColor = Color.FromArgb(231, 76, 60)
        btnDelete.ForeColor = Color.White
        btnDelete.FlatStyle = FlatStyle.Flat
        AddHandler btnDelete.Click, AddressOf btnDelete_Click
        pnlButtons.Controls.Add(btnDelete)

        ' DataGridView
        dataGridView = New DataGridView()
        dataGridView.Dock = DockStyle.Fill
        dataGridView.AllowUserToAddRows = False
        dataGridView.AllowUserToDeleteRows = False
        dataGridView.ReadOnly = True
        dataGridView.SelectionMode = DataGridViewSelectionMode.FullRowSelect
        dataGridView.BackgroundColor = Color.White
        dataGridView.BorderStyle = BorderStyle.None
        dataGridView.Font = New Font("Segoe UI", 10)
        dataGridView.ColumnHeadersDefaultCellStyle.BackColor = Color.FromArgb(236, 240, 241)
        dataGridView.ColumnHeadersDefaultCellStyle.Font = New Font("Segoe UI", 10, FontStyle.Bold)
        dataGridView.EnableHeadersVisualStyles = False
        dataGridView.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill
        dataGridView.RowHeadersVisible = False
        Me.Controls.Add(dataGridView)

        ' Set the order of controls
        dataGridView.BringToFront()
    End Sub

    Private Sub LoadKeys()
        dataGridView.DataSource = dbHelper.GetKeys()
        If dataGridView.Columns.Count > 0 Then
            dataGridView.Columns("KeyID").Visible = False
            dataGridView.Columns("KeyName").HeaderText = "Key Name"
            dataGridView.Columns("KeyType").HeaderText = "Key Type"
            dataGridView.Columns("Status").HeaderText = "Status"
            dataGridView.Columns("LastUpdated").HeaderText = "Last Updated"
        End If
    End Sub

    Private Sub btnAdd_Click(sender As Object, e As EventArgs)
        Dim addForm As New AddKeyForm()
        If addForm.ShowDialog() = DialogResult.OK Then
            If dbHelper.AddKey(addForm.KeyName, addForm.KeyType, addForm.Status) Then
                LoadKeys()
            End If
        End If
    End Sub

    Private Sub btnUpdate_Click(sender As Object, e As EventArgs)
        If dataGridView.SelectedRows.Count > 0 Then
            Dim keyId As String = dataGridView.SelectedRows(0).Cells("KeyID").Value.ToString()
            Dim updateForm As New UpdateKeyForm(keyId)
            If updateForm.ShowDialog() = DialogResult.OK Then
                If dbHelper.UpdateKey(keyId, updateForm.KeyName, updateForm.KeyType, updateForm.Status) Then
                    LoadKeys()
                End If
            End If
        Else
            MessageBox.Show("Please select a key to update.", "No Selection", MessageBoxButtons.OK, MessageBoxIcon.Information)
        End If
    End Sub

    Private Sub btnDelete_Click(sender As Object, e As EventArgs)
        If dataGridView.SelectedRows.Count > 0 Then
            Dim result As DialogResult = MessageBox.Show("Are you sure you want to delete this key?", "Confirm Delete", MessageBoxButtons.YesNo, MessageBoxIcon.Question)
            If result = DialogResult.Yes Then
                Dim keyId As String = dataGridView.SelectedRows(0).Cells("KeyID").Value.ToString()
                If dbHelper.DeleteKey(keyId) Then
                    LoadKeys()
                End If
            End If
        Else
            MessageBox.Show("Please select a key to delete.", "No Selection", MessageBoxButtons.OK, MessageBoxIcon.Information)
        End If
    End Sub

    Private Sub btnSearch_Click(sender As Object, e As EventArgs)
        If Not String.IsNullOrWhiteSpace(txtSearch.Text) Then
            dataGridView.DataSource = dbHelper.SearchKeys(txtSearch.Text)
        Else
            LoadKeys()
        End If
    End Sub
End Class 