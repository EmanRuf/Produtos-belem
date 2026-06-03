// Dependências do servidor: Express para rotas, path para caminhos de arquivos,
// sqlite3 para banco de dados local e cors para permitir chamadas de outras origens.
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

// Configuração básica do servidor e do caminho do banco de dados
const app = express();
const PORT = process.env.PORT || 3000;
const dbPath = path.join(__dirname, 'users.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
    process.exit(1);
  }
});

// Cria a tabela de usuários no banco de dados se ela ainda não existir.
// Isso garante que a aplicação tenha o esquema correto ao iniciar.
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

// Middlewares do Express:
// cors() permite requisições entre diferentes origens.
// express.json() interpreta corpo JSON nas requisições.
// express.static() serve arquivos estáticos da pasta atual.
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Rota GET /api/users
// Busca um usuário pelo CNPJ passado como query string.
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

// Rota POST /api/users
// Insere um novo usuário ou atualiza os dados de um CNPJ já existente.
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

// Inicia o servidor na porta configurada e exibe a URL no console.
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
