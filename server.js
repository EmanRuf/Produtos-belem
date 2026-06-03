const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cnpj TEXT UNIQUE,
    name TEXT,
    email TEXT,
    quantity INTEGER,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.get('/api/users', (req, res) => {
  const cnpj = String(req.query.cnpj || '').replace(/\D/g, '');
  if (!cnpj) {
    return res.status(400).json({ error: 'CNPJ é obrigatório.' });
  }

  db.get('SELECT cnpj, name, email, quantity FROM users WHERE cnpj = ?', [cnpj], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao consultar o banco de dados.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Nenhum usuário encontrado para esse CNPJ.' });
    }
    res.json(row);
  });
});

app.post('/api/users', (req, res) => {
  const cnpj = String(req.body.cnpj || '').replace(/\D/g, '');
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim();
  const quantity = Number(req.body.quantity);

  if (!cnpj || cnpj.length !== 14) {
    return res.status(400).json({ error: 'CNPJ inválido.' });
  }
  if (!name) {
    return res.status(400).json({ error: 'Nome do usuário é obrigatório.' });
  }
  if (!quantity || quantity < 50) {
    return res.status(400).json({ error: 'Quantidade mínima de 50 unidades é obrigatória.' });
  }

  const query = `INSERT INTO users (cnpj, name, email, quantity, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(cnpj) DO UPDATE SET
      name = excluded.name,
      email = excluded.email,
      quantity = excluded.quantity,
      updated_at = datetime('now')`;

  db.run(query, [cnpj, name, email, quantity], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Erro ao salvar os dados do usuário.' });
    }
    res.json({ cnpj, name, email, quantity });
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
