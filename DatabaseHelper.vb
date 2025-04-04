Imports System.Data.SQLite

Public Class DatabaseHelper
    Private dbPath As String = "KeyManagement.db"
    Private connectionString As String = $"Data Source={dbPath};Version=3;"

    Public Sub New()
        If Not System.IO.File.Exists(dbPath) Then
            CreateDatabase()
        End If
    End Sub

    Private Sub CreateDatabase()
        Using connection As New SQLiteConnection(connectionString)
            connection.Open()
            Using command As New SQLiteCommand(connection)
                ' Create KeyItems table
                command.CommandText = "CREATE TABLE IF NOT EXISTS KeyItems (
                    KeyID INTEGER PRIMARY KEY AUTOINCREMENT,
                    KeyName TEXT NOT NULL,
                    KeyType TEXT,
                    Status TEXT,
                    LastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP
                )"
                command.ExecuteNonQuery()
            End Using
        End Using
    End Sub

    Public Function GetKeys() As DataTable
        Dim dt As New DataTable()
        Using connection As New SQLiteConnection(connectionString)
            Using command As New SQLiteCommand("SELECT * FROM KeyItems", connection)
                connection.Open()
                Using adapter As New SQLiteDataAdapter(command)
                    adapter.Fill(dt)
                End Using
            End Using
        End Using
        Return dt
    End Function

    Public Function AddKey(keyName As String, keyType As String, status As String) As Boolean
        Try
            Using connection As New SQLiteConnection(connectionString)
                Using command As New SQLiteCommand("INSERT INTO KeyItems (KeyName, KeyType, Status) VALUES (@KeyName, @KeyType, @Status)", connection)
                    command.Parameters.AddWithValue("@KeyName", keyName)
                    command.Parameters.AddWithValue("@KeyType", keyType)
                    command.Parameters.AddWithValue("@Status", status)
                    connection.Open()
                    command.ExecuteNonQuery()
                End Using
            End Using
            Return True
        Catch ex As Exception
            MessageBox.Show("Error adding key: " & ex.Message, "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

    Public Function UpdateKey(keyId As String, keyName As String, keyType As String, status As String) As Boolean
        Try
            Using connection As New SQLiteConnection(connectionString)
                Using command As New SQLiteCommand("UPDATE KeyItems SET KeyName = @KeyName, KeyType = @KeyType, Status = @Status, LastUpdated = CURRENT_TIMESTAMP WHERE KeyID = @KeyID", connection)
                    command.Parameters.AddWithValue("@KeyID", keyId)
                    command.Parameters.AddWithValue("@KeyName", keyName)
                    command.Parameters.AddWithValue("@KeyType", keyType)
                    command.Parameters.AddWithValue("@Status", status)
                    connection.Open()
                    command.ExecuteNonQuery()
                End Using
            End Using
            Return True
        Catch ex As Exception
            MessageBox.Show("Error updating key: " & ex.Message, "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

    Public Function DeleteKey(keyId As String) As Boolean
        Try
            Using connection As New SQLiteConnection(connectionString)
                Using command As New SQLiteCommand("DELETE FROM KeyItems WHERE KeyID = @KeyID", connection)
                    command.Parameters.AddWithValue("@KeyID", keyId)
                    connection.Open()
                    command.ExecuteNonQuery()
                End Using
            End Using
            Return True
        Catch ex As Exception
            MessageBox.Show("Error deleting key: " & ex.Message, "Database Error", MessageBoxButtons.OK, MessageBoxIcon.Error)
            Return False
        End Try
    End Function

    Public Function SearchKeys(searchTerm As String) As DataTable
        Dim dt As New DataTable()
        Using connection As New SQLiteConnection(connectionString)
            Using command As New SQLiteCommand("SELECT * FROM KeyItems WHERE KeyName LIKE @SearchTerm OR KeyType LIKE @SearchTerm OR Status LIKE @SearchTerm", connection)
                command.Parameters.AddWithValue("@SearchTerm", "%" & searchTerm & "%")
                connection.Open()
                Using adapter As New SQLiteDataAdapter(command)
                    adapter.Fill(dt)
                End Using
            End Using
        End Using
        Return dt
    End Function
End Class 