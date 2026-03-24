# MVP SaquaNav

Bem-vindo ao repositório do **SaquaNav**, um MVP focado em mapeamento e geolocalização.
Este projeto possui uma API em Node.js com Express e SQLite para registro e gerenciamento de localidades, separadas em "Relatórios" (ex: incidentes, pontos de interesse) e "Favoritos".

## Sobre o Projeto

O backend da aplicação expõe endpoints simples para:
- **Relatórios**: Criação e listagem de eventos baseados em coordenadas geográficas (latitude, longitude, tipo, imagem e endereço).
- **Favoritos**: Salvamento e edição de locais preferidos do usuário, com suporte a categorização visual.

O sistema é focado em performance leve e armazenamento rápido utilizando o banco de dados `better-sqlite3` que roda localmente.
O frontend da aplicação (estrutura HTML/CSS/JS) consome esses dados diretamente da pasta `public`.

## Fluxo de Trabalho e Branches

Para mantermos o código organizado e seguro, adotamos o seguinte fluxo de trabalho:

- **`main`**: É a nossa branch principal e de produção. Ela contém o código mais estável. Nenhum desenvolvimento direto deve acontecer aqui sem testes prévios.
- **`desenvolvimento`**: É a branch paralela dedicada à equipe de desenvolvimento. Todas as novas funcionalidades, correções de bugs e otimizações devem ser feitas a partir dessa branch.

### Como contribuir ou desenvolver:
1. Posicione-se na branch de desenvolvimento: `git checkout desenvolvimento`
2. Garanta que ela está atualizada num trabalho em equipe: `git pull origin desenvolvimento`
3. Crie e teste o seu código.
4. Faça marcações no repositório seguindo o **padrão do Conventional Commits** em português (ex: `feat: adiciona botao de mapa`, `fix: corrige falha no salvamento do sqlite`).
5. Envie suas modificações para a branch compartilhada: `git push origin desenvolvimento`

## Como rodar o projeto localmente

1. Clone este repositório.
2. Acesse a pasta do projeto: `cd saquanav`
3. Instale as dependências (caso seja a sua primeira vez rodando): `npm install`
4. Inicie o servidor: `node server.js`
5. O projeto estará rodando e respondendo na porta **3000** (`http://localhost:3000`).
