# Requirements Document

## Introduction

Веб-приложение для внутренних блоггеров pifpafai.com - платформа для отслеживания статистики Instagram Reels с автоматическим обновлением данных из APIFAY API.

## Glossary

- **System**: Веб-приложение pifpafai-bloggers
- **Blogger**: Авторизованный пользователь платформы
- **Reel**: Видео из Instagram Reels
- **APIFAY**: Внешний API для получения данных об Instagram Reels
- **Dashboard**: Персональная страница блоггера с аналитикой

## Requirements

### Requirement 1: Авторизация блоггеров

**User Story:** As an administrator, I want to manage blogger accounts, so that each blogger can access their personal dashboard.

#### Acceptance Criteria

1. THE System SHALL support user registration with email and password
2. THE System SHALL authenticate users via secure login
3. THE System SHALL store passwords using bcrypt hashing
4. THE System SHALL create a session token upon successful login
5. THE System SHALL restrict access to dashboard only for authenticated users
6. THE System SHALL allow bloggers to view only their own Reels data

### Requirement 2: Получение данных Reels из APIFAY

**User Story:** As a blogger, I want to automatically fetch Instagram Reels data, so that I can track performance of my content.

#### Acceptance Criteria

1. WHEN a valid Instagram Reels URL is submitted, THE System SHALL send request to APIFAY API
2. WHEN APIFAY returns success, THE System SHALL extract: views count, publication date, video thumbnail URL
3. WHEN APIFAY returns an error, THE System SHALL display error message to user
4. THE System SHALL store fetched Reel data in database with association to the blogger
5. THE System SHALL support batch import of multiple Reel URLs

### Requirement 3: Отображение Reels в стиле Pinterest

**User Story:** As a blogger, I want to see my Reels in a visual grid layout, so that I can easily browse my content.

#### Acceptance Criteria

1. THE System SHALL display Reels in a responsive masonry/pinterest-style grid
2. THE System SHALL show video thumbnail as cover image for each Reel
3. THE System SHALL display view count on each thumbnail
4. THE System SHALL display publication date on each thumbnail
5. THE System SHALL support infinite scroll or pagination
6. THE System SHALL match visual design of pifpafai.com (colors, fonts, styling)

### Requirement 4: Персональный дашборд аналитики

**User Story:** As a blogger, I want to see analytics of my Reels, so that I can understand my content performance.

#### Acceptance Criteria

1. THE System SHALL display total views count across all Reels
2. THE System SHALL show average views per Reel
3. THE System SHALL display chart/graph of views over time
4. THE System SHALL show list of top performing Reels
5. THE System SHALL display recent Reels activity
6. THE System SHALL filter analytics by date range (7 days, 30 days, all time)

### Requirement 5: Управление ссылками

**User Story:** As a blogger, I want to manage my Reel links, so that I can add new content or remove old.

#### Acceptance Criteria

1. THE System SHALL allow adding new Reel URL
2. THE System SHALL allow deleting Reel from personal list
3. THE System SHALL allow manual refresh of Reel data
4. THE System SHALL automatically refresh Reel data every 6 hours
5. WHEN a Reel is deleted, THE System SHALL remove all associated data

### Requirement 6: API endpoint для интеграции

**User Story:** As a developer, I want to have API endpoints, so that I can integrate with external services.

#### Acceptance Criteria

1. THE System SHALL provide REST API for Reel management
2. THE API SHALL require authentication token
3. THE API SHALL support: GET /reels, POST /reels, DELETE /reels/:id
4. THE API SHALL return JSON format responses