CREATE DATABASE ecomap_db;

\c ecomap_db;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    rating INT DEFAULT 0
);

CREATE TABLE markers (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    lat NUMERIC(9,6) NOT NULL,
    lng NUMERIC(9,6) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    author_id INT REFERENCES users(id) ON DELETE SET NULL,
    need_help BOOLEAN DEFAULT false
);

INSERT INTO users (name, email, password, role, rating) VALUES
('Алексей Админ', 'admin@eco.ru', 'admin123', 'admin', 210),
('Мария Модератор', 'mod@eco.ru', 'mod123', 'moderator', 95),
('Дмитрий Волонтер', 'user@eco.ru', 'user123', 'user', 40);

INSERT INTO markers (type, lat, lng, description, status, author_id, need_help) VALUES
('problem', 55.796, 49.108, 'Свалка на Чистопольской', 'approved', 3, true),
('recycling', 55.790, 49.120, 'Пункт приема пластика', 'approved', 3, false),
('subbotnik', 55.805, 49.095, 'Субботник в парке', 'approved', 1, true);