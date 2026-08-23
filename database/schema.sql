-- pifpafai-bloggers Database Schema

-- Create database
CREATE DATABASE IF NOT EXISTS pifpafai_bloggers;
USE pifpafai_bloggers;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reels table
CREATE TABLE IF NOT EXISTS reels (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  reel_url VARCHAR(500) NOT NULL,
  reel_id VARCHAR(255),
  views INT DEFAULT 0,
  thumbnail_url VARCHAR(500),
  published_at DATE,
  fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index for faster queries
CREATE INDEX idx_reels_user_id ON reels(user_id);
CREATE INDEX idx_reels_fetched_at ON reels(fetched_at);