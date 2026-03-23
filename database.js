const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Inicializa as tabelas do banco de dados
function initDb() {
    db.exec(`
        CREATE TABLE IF NOT EXISTS relatorios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tipo TEXT NOT NULL,
            descricao TEXT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            imagem_base64 TEXT,
            endereco TEXT
        );
    `);

    // Tentativa segura de adicionar colunas caso o banco já existisse
    try {
        db.exec("ALTER TABLE relatorios ADD COLUMN imagem_base64 TEXT;");
    } catch (e) { /* Ignora se a coluna já existir */ }
    
    try {
        db.exec("ALTER TABLE relatorios ADD COLUMN endereco TEXT;");
    } catch (e) { /* Ignora se a coluna já existir */ }

    db.exec(`
        CREATE TABLE IF NOT EXISTS favoritos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            emoji TEXT,
            endereco TEXT,
            imagem_base64 TEXT,
            descricao TEXT
        );
    `);

    // Tentativa segura de adicionar colunas em favoritos
    try { db.exec("ALTER TABLE favoritos ADD COLUMN emoji TEXT;"); } catch (e) { }
    try { db.exec("ALTER TABLE favoritos ADD COLUMN endereco TEXT;"); } catch (e) { }
    try { db.exec("ALTER TABLE favoritos ADD COLUMN imagem_base64 TEXT;"); } catch (e) { }
    try { db.exec("ALTER TABLE favoritos ADD COLUMN descricao TEXT;"); } catch (e) { }

    console.log('Tabelas do banco de dados inicializadas.');
}

initDb();

// Operações do banco de dados
const operacoesRelatorios = {
    obterTodos: () => {
        const stmt = db.prepare('SELECT * FROM relatorios ORDER BY timestamp DESC');
        return stmt.all();
    },
    adicionar: (relatorio) => {
        const stmt = db.prepare('INSERT INTO relatorios (tipo, descricao, lat, lng, imagem_base64, endereco) VALUES (?, ?, ?, ?, ?, ?)');
        const info = stmt.run(relatorio.tipo, relatorio.descricao || '', relatorio.lat, relatorio.lng, relatorio.imagem_base64 || null, relatorio.endereco || '');
        return { id: info.lastInsertRowid, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), ...relatorio };
    }
};

const operacoesFavoritos = {
    obterTodos: () => {
        const stmt = db.prepare('SELECT * FROM favoritos ORDER BY timestamp DESC');
        return stmt.all();
    },
    adicionar: (favorito) => {
        const stmt = db.prepare('INSERT INTO favoritos (nome, lat, lng, emoji, endereco, imagem_base64, descricao) VALUES (?, ?, ?, ?, ?, ?, ?)');
        const info = stmt.run(favorito.nome, favorito.lat, favorito.lng, favorito.emoji || '❤️', favorito.endereco || '', favorito.imagem_base64 || null, favorito.descricao || '');
        return { id: info.lastInsertRowid, timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), ...favorito };
    },
    editar: (id, favorito) => {
        const stmt = db.prepare('UPDATE favoritos SET nome = ?, lat = ?, lng = ?, emoji = ?, endereco = ?, imagem_base64 = ?, descricao = ? WHERE id = ?');
        stmt.run(favorito.nome, favorito.lat, favorito.lng, favorito.emoji || '❤️', favorito.endereco || '', favorito.imagem_base64 || null, favorito.descricao || '', id);
        return { id: parseInt(id), timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19), ...favorito };
    }
};

module.exports = {
    relatorios: operacoesRelatorios,
    favoritos: operacoesFavoritos
};
