const express = require('express');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Endpoints da API

// Obter todos os relatórios
app.get('/api/relatorios', (req, res) => {
    try {
        const relatorios = db.relatorios.obterTodos();
        res.json(relatorios);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Falha ao buscar relatórios' });
    }
});

// Adicionar um novo relatório
app.post('/api/relatorios', (req, res) => {
    try {
        const { tipo, descricao, lat, lng, imagem_base64, endereco } = req.body;
        if (!tipo || lat === undefined || lng === undefined) {
            return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
        }
        const novoRelatorio = db.relatorios.adicionar({ tipo, descricao, lat, lng, imagem_base64, endereco });
        res.status(201).json(novoRelatorio);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Falha ao criar relatório' });
    }
});

// Obter todos os favoritos
app.get('/api/favoritos', (req, res) => {
    try {
        const favoritos = db.favoritos.obterTodos();
        res.json(favoritos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Falha ao buscar favoritos' });
    }
});

// Adicionar um novo favorito
app.post('/api/favoritos', (req, res) => {
    try {
        const { nome, lat, lng, emoji, endereco, imagem_base64, descricao } = req.body;
        if (!nome || lat === undefined || lng === undefined) {
            return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
        }
        const novoFavorito = db.favoritos.adicionar({ nome, lat, lng, emoji, endereco, imagem_base64, descricao });
        res.status(201).json(novoFavorito);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Falha ao criar favorito' });
    }
});

// Atualizar um favorito existente
app.put('/api/favoritos/:id', (req, res) => {
    try {
        const id = req.params.id;
        const { nome, lat, lng, emoji, endereco, imagem_base64, descricao } = req.body;
        if (!nome || lat === undefined || lng === undefined) {
            return res.status(400).json({ erro: 'Campos obrigatórios ausentes' });
        }
        const favoritoAtualizado = db.favoritos.editar(id, { nome, lat, lng, emoji, endereco, imagem_base64, descricao });
        res.status(200).json(favoritoAtualizado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ erro: 'Falha ao atualizar favorito' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
