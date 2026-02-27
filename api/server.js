// supabase
const express = require('express');
const { Pool } = require('pg'); // Alterado para pg
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configuração da conexão com o Supabase (PostgreSQL)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Use a Connection String do Supabase
    ssl: {
        rejectUnauthorized: false // Necessário para conexões externas com o Supabase
    }
});

// ==========================================
// ROTAS DA API
// ==========================================

// 1. Rota de Login
app.post('/api/login', async (req, res) => {
    try {
        const { username } = req.body;

        const users = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username]);

        if (users.rows.length > 0) {
            res.json(users.rows[0]);
        } else {
            // No Postgres usamos RETURNING id para obter o ID inserido
            const result = await pool.query(
                'INSERT INTO usuarios (username, score) VALUES ($1, 0) RETURNING id', 
                [username]
            );
            res.json({ id: result.rows[0].id, username, score: 0 });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// 2. Rota para sortear uma palavra aleatória
app.get('/api/palavras/aleatoria', async (req, res) => {
    try {
        // No Postgres é RANDOM() e não RAND()
        const palavras = await pool.query('SELECT * FROM palavras ORDER BY RANDOM() LIMIT 1');

        if (palavras.rows.length > 0) {
            res.json(palavras.rows[0]);
        } else {
            res.status(404).json({ error: 'Nenhuma palavra encontrada.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar palavra' });
    }
});

// 3. Rota para salvar partida
app.post('/api/partidas', async (req, res) => {
    try {
        const { usuario_id, palavra_id, pontos_ganhos, resultado } = req.body;

        await pool.query(
            'INSERT INTO partidas (usuario_id, palavra_id, pontos_ganhos, resultado) VALUES ($1, $2, $3, $4)',
            [usuario_id, palavra_id, pontos_ganhos, resultado]
        );

        await pool.query(
            'UPDATE usuarios SET score = score + $1 WHERE id = $2',
            [pontos_ganhos, usuario_id]
        );

        res.json({ message: 'Partida salva com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao salvar partida' });
    }
});

// 4. Rota para Ranking
app.get('/api/ranking', async (req, res) => {
    try {
        const ranking = await pool.query('SELECT username, score FROM usuarios ORDER BY score DESC LIMIT 5');
        res.json(ranking.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar o ranking' });
    }
});

const PORT = 6262;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
