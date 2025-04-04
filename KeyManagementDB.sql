-- Create the database if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'KeyManagementDB')
BEGIN
    CREATE DATABASE KeyManagementDB;
END
GO

USE KeyManagementDB;
GO

-- Create the Keys table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'KeyItems')
BEGIN
    CREATE TABLE KeyItems (
        KeyID INT IDENTITY(1,1) PRIMARY KEY,
        KeyName NVARCHAR(100) NOT NULL,
        KeyType NVARCHAR(50),
        Status NVARCHAR(50),
        LastUpdated DATETIME DEFAULT GETDATE()
    );
END
GO

-- Create an index on KeyName for faster searches
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_KeyItems_KeyName')
BEGIN
    CREATE INDEX IX_KeyItems_KeyName ON KeyItems(KeyName);
END
GO 