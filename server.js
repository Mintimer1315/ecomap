require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// Мидлвары
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false
});

// 1. Получить список всех пользователей
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, rating FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения пользователей:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 2. Регистрация нового пользователя
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Заполните все поля' });
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    const newUser = await pool.query(
      'INSERT INTO users (name, email, password, role, rating) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, rating',
      [name, email, password, 'user', 0]
    );

    res.status(201).json(newUser.rows[0]);
  } catch (err) {
    console.error('Ошибка регистрации:', err);
    res.status(500).json({ error: 'Ошибка сервера при регистрации' });
  }
});

// 3. Вход (Логин)
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, name, email, role, rating FROM users WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка авторизации:', err);
    res.status(500).json({ error: 'Ошибка сервера при входе' });
  }
});

// 4. Получить все метки
app.get('/api/markers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM markers ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка получения меток:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 5. Добавить новую метку
app.post('/api/markers', async (req, res) => {
  const { type, lat, lng, description, status, author_id, need_help } = req.body;

  try {
    const newMarker = await pool.query(
      `INSERT INTO markers (type, lat, lng, description, status, author_id, need_help) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [type, lat, lng, description, status || 'pending', author_id, need_help || false]
    );

    // Добавляем очки рейтинга автору
    if (author_id) {
      await pool.query('UPDATE users SET rating = rating + 10 WHERE id = $1', [author_id]);
    }

    res.status(201).json(newMarker.rows[0]);
  } catch (err) {
    console.error('Ошибка создания метки:', err);
    res.status(500).json({ error: 'Ошибка сервера при создании метки' });
  }
});

// 6. Изменить статус метки (Модерация)
app.patch('/api/markers/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const result = await pool.query(
      'UPDATE markers SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Метка не найдена' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка обнуления/изменения статуса:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 7. Удалить метку
app.delete('/api/markers/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM markers WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Метка не найдена' });
    }

    res.json({ message: 'Метка успешно удалена' });
  } catch (err) {
    console.error('Ошибка удаления метки:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});