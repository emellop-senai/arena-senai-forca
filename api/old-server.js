const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const dotenv = require('dotenv')

dotenv.config()

const app = express();
app.use(cors({
    origin: '*', // Permite qualquer origem
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Permite estes métodos HTTP
    allowedHeaders: ['Content-Type', 'Authorization'] // Permite estes cabeçalhos
}));
app.use(express.json());

// Configuração da conexão com o banco de dados
// Lembre-se de colocar a sua senha real do MySQL aqui
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.USER_DB,
    password: process.env.PASSWORD_DB,
    database: process.env.DATABASE
});

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Rota de Login (Busca ou cria o usuário)
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;

        // Verifica se o usuário já existe
        const [users] = await pool.query('SELECT * FROM usuarios WHERE username = ?', [username]);

        if (users.length > 0) {
            // Usuário existe, retorna os dados dele
            res.json(users[0]);
        } else {
            // Usuário novo, insere no banco
            const [result] = await pool.query('INSERT INTO usuarios (username, score) VALUES (?, 0)', [username]);
            res.json({ id: result.insertId, username, score: 0 });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// 2. Rota para sortear uma palavra aleatória
app.get('/api/palavras/aleatoria', async (req, res) => {
    try {
        // O ORDER BY RAND() pega uma linha aleatória do banco
        const [palavras] = await pool.query('SELECT * FROM palavras ORDER BY RAND() LIMIT 1');

        if (palavras.length > 0) {
            res.json(palavras[0]);
        } else {
            res.status(404).json({ error: 'Nenhuma palavra encontrada no banco.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar palavra' });
    }
});

// 3. Rota para salvar o resultado da partida e atualizar a pontuação
app.post('/api/partidas', async (req, res) => {
    try {
        const { usuario_id, palavra_id, pontos_ganhos, resultado } = req.body;

        // Insere o histórico da partida
        await pool.query(
            'INSERT INTO partidas (usuario_id, palavra_id, pontos_ganhos, resultado) VALUES (?, ?, ?, ?)',
            [usuario_id, palavra_id, pontos_ganhos, resultado]
        );

        // Atualiza a pontuação total do usuário
        await pool.query(
            'UPDATE usuarios SET score = score + ? WHERE id = ?',
            [pontos_ganhos, usuario_id]
        );

        res.json({ message: 'Partida salva com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar partida' });
    }
});

// 4. Rota para buscar o Ranking (Leaderboard)
app.get('/api/ranking', async (req, res) => {
    try {
        // Pega os 5 melhores jogadores ordenados pela pontuação
        const [ranking] = await pool.query('SELECT username, score FROM usuarios ORDER BY score DESC LIMIT 5');
        res.json(ranking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar o ranking' });
    }
});

// ==========================================
// INICIANDO O SERVIDOR
// ==========================================
const PORT = 6262;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`API de Palavras: http://localhost:${PORT}/api/palavras/aleatoria`);
});