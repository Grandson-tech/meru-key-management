Imports System.Windows.Forms
Imports System.Drawing

Public Class UpdateKeyForm
    Inherits Form

    Private keyId As String
    Private txtKeyName As TextBox
    Private txtKeyType As TextBox
    Private txtStatus As TextBox
    Private btnSave As Button
    Private btnCancel As Button
    Private dbHelper As DatabaseHelper
    Private lblTitle As Label
    Private pnlHeader As Panel

    Public ReadOnly Property KeyName As String
        Get
            Return txtKeyName.Text
        End Get
    End Property

    Public ReadOnly Property KeyType As String
        Get
            Return txtKeyType.Text
        End Get
    End Property

    Public ReadOnly Property Status As String
        Get
            Return txtStatus.Text
        End Get
    End Property

    Public Sub New(keyId As String)
        Me.keyId = keyId
        dbHelper = New DatabaseHelper()
        InitializeComponent()
        InitializeUI()
        LoadKeyData()
    End Sub

    Private Sub InitializeComponent()
        Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
        Me.ClientSize = New System.Drawing.Size(400, 300)
        Me.Text = "Update Key"
        Me.StartPosition = FormStartPosition.CenterParent
        Me.BackColor = Color.White
        Me.FormBorderStyle = FormBorderStyle.FixedDialog
        Me.MaximizeBox = False
        Me.MinimizeBox = False
    End Sub

    Private Sub InitializeUI()
        ' Header Panel
        pnlHeader = New Panel()
        pnlHeader.Dock = DockStyle.Top
        pnlHeader.Height = 60
        pnlHeader.BackColor = Color.FromArgb(41, 128, 185)
        Me.Controls.Add(pnlHeader)

        ' Title Label
        lblTitle = New Label()
        lblTitle.Text = "Update Key"
        lblTitle.Font = New Font("Segoe UI", 16, FontStyle.Bold)
        lblTitle.ForeColor = Color.White
        lblTitle.AutoSize = True
        lblTitle.Location = New Point(20, 15)
        pnlHeader.Controls.Add(lblTitle)

        ' Key Name
        Dim lblKeyName As New Label()
        lblKeyName.Text = "Key Name:"
        lblKeyName.Location = New Point(20, 80)
        lblKeyName.Size = New Size(100, 20)
        lblKeyName.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(lblKeyName)

        txtKeyName = New TextBox()
        txtKeyName.Location = New Point(130, 80)
        txtKeyName.Size = New Size(240, 30)
        txtKeyName.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(txtKeyName)

        ' Key Type
        Dim lblKeyType As New Label()
        lblKeyType.Text = "Key Type:"
        lblKeyType.Location = New Point(20, 120)
        lblKeyType.Size = New Size(100, 20)
        lblKeyType.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(lblKeyType)

        txtKeyType = New TextBox()
        txtKeyType.Location = New Point(130, 120)
        txtKeyType.Size = New Size(240, 30)
        txtKeyType.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(txtKeyType)

        ' Status
        Dim lblStatus As New Label()
        lblStatus.Text = "Status:"
        lblStatus.Location = New Point(20, 160)
        lblStatus.Size = New Size(100, 20)
        lblStatus.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(lblStatus)

        txtStatus = New TextBox()
        txtStatus.Location = New Point(130, 160)
        txtStatus.Size = New Size(240, 30)
        txtStatus.Font = New Font("Segoe UI", 10)
        Me.Controls.Add(txtStatus)

        ' Buttons
        btnSave = New Button()
        btnSave.Text = "Save"
        btnSave.Location = New Point(130, 220)
        btnSave.Size = New Size(100, 35)
        btnSave.Font = New Font("Segoe UI", 10)
        btnSave.BackColor = Color.FromArgb(46, 204, 113)
        btnSave.ForeColor = Color.White
        btnSave.FlatStyle = FlatStyle.Flat
        AddHandler btnSave.Click, AddressOf btnSave_Click
        Me.Controls.Add(btnSave)

        btnCancel = New Button()
        btnCancel.Text = "Cancel"
        btnCancel.Location = New Point(240, 220)
        btnCancel.Size = New Size(100, 35)
        btnCancel.Font = New Font("Segoe UI", 10)
        btnCancel.BackColor = Color.FromArgb(231, 76, 60)
        btnCancel.ForeColor = Color.White
        btnCancel.FlatStyle = FlatStyle.Flat
        AddHandler btnCancel.Click, AddressOf btnCancel_Click
        Me.Controls.Add(btnCancel)
    End Sub

    Private Sub LoadKeyData()
        Dim dt As DataTable = dbHelper.GetKeys()
        Dim row As DataRow = dt.Select($"KeyID = {keyId}")(0)
        If row IsNot Nothing Then
            txtKeyName.Text = row("KeyName").ToString()
            txtKeyType.Text = row("KeyType").ToString()
            txtStatus.Text = row("Status").ToString()
        End If
    End Sub

    Private Sub btnSave_Click(sender As Object, e As EventArgs)
        If String.IsNullOrWhiteSpace(txtKeyName.Text) Then
            MessageBox.Show("Please enter a key name.", "Validation Error", MessageBoxButtons.OK, MessageBoxIcon.Warning)
            Return
        End If

        Me.DialogResult = DialogResult.OK
        Me.Close()
    End Sub

    Private Sub btnCancel_Click(sender As Object, e As EventArgs)
        Me.DialogResult = DialogResult.Cancel
        Me.Close()
    End Sub
End Class 