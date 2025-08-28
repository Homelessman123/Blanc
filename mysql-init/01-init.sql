-- Initialize ContestHub database
CREATE DATABASE IF NOT EXISTS contesthub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user if not exists
CREATE USER IF NOT EXISTS 'contesthub_user'@'%' IDENTIFIED BY 'contesthub_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON contesthub.* TO 'contesthub_user'@'%';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, INDEX, ALTER ON contesthub.* TO 'contesthub_user'@'%';

-- Flush privileges
FLUSH PRIVILEGES;

-- Use the database
USE contesthub;

-- Set timezone
SET time_zone = '+07:00';
