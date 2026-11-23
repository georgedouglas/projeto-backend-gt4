# Digital Store API

Back-end do projeto de loja da Digital College. A API usa Node.js, Express, Sequelize e MySQL.

## Executar localmente

Pré-requisitos: Node.js 22+, npm e MySQL 8.

1. Crie um banco MySQL para a API com `CREATE DATABASE digital_store CHARACTER SET utf8mb4;`. Use um banco novo se já tiver as tabelas do exercício de turmas.
2. Execute `npm ci` e copie `.env.example` para `.env` (`Copy-Item .env.example .env` no PowerShell ou `cp .env.example .env` no Bash).
3. Preencha os dados do MySQL e `JWT_SECRET`. Para gerar uma chave, execute `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
4. Execute `npm run db:migrate` e `npm start`. A API inicia em `http://localhost:3000` por padrão.

A migration cria seis tabelas relacionadas: `users`, `categories`, `products`, `product_images`, `product_options` e `product_categories`. Imagens e opções pertencem a um produto. A tabela de junção liga vários produtos a várias categorias.

## API

Importe `http://localhost:3000/openapi.json` no Swagger Editor, Postman ou Insomnia. A especificação inclui os corpos das requisições, os filtros e as respostas.

| Método | Caminho | JWT |
| --- | --- | --- |
| GET | `/health` | Público |
| POST | `/v1/user`, `/v1/user/token` | Público |
| GET | `/v1/user/:id` | Público |
| PUT, DELETE | `/v1/user/:id` | Próprio usuário |
| GET | `/v1/category/search`, `/v1/category/:id` | Público |
| POST | `/v1/category` | Obrigatório |
| PUT, DELETE | `/v1/category/:id` | Obrigatório |
| GET | `/v1/product/search`, `/v1/product/:id` | Público |
| POST | `/v1/product` | Obrigatório |
| PUT, DELETE | `/v1/product/:id` | Obrigatório |

### Fluxo para demonstração

1. Cadastre um usuário em `POST /v1/user` com `firstname`, `surname`, `email`, `password` e `confirmPassword`.
2. Envie `email` e `password` para `POST /v1/user/token`. Use o JWT recebido em `Authorization: Bearer SEU_TOKEN` nas rotas protegidas.
3. Cadastre uma categoria com `{"name":"Tênis","slug":"tenis","use_in_menu":true}` e use o ID retornado em `category_ids` no cadastro do produto.
4. Envie o produto abaixo para `POST /v1/product`. Ajuste `category_ids` conforme a resposta do passo anterior.

```json
{
  "enabled": true,
  "name": "Tênis casual",
  "slug": "tenis-casual",
  "stock": 10,
  "price": 119.90,
  "price_with_discount": 99.90,
  "category_ids": [1],
  "images": [{ "path": "http://localhost:3000/public/imagem-teste.png" }],
  "options": [{ "title": "Tamanho", "shape": "square", "type": "text", "values": ["39", "40"] }]
}
```

As buscas retornam `data`, `total`, `limit` e `page`. Use `limit=-1` para retornar todos e `fields=id,name` para selecionar campos. A busca de categorias aceita `use_in_menu=true`. A busca de produtos aceita `match`, `category_ids`, `price-range` e filtros como `option[1]=40`, com o ID real da opção.

### Imagens de teste

Coloque os arquivos de imagem manualmente na pasta `public/`. Com a API no ar, abra http://localhost:3000/public/imagem-teste.png para testar o arquivo de exemplo. Se a API usa outra porta ou domínio, ajuste o endereço.

No cadastro do produto, envie a URL HTTP ou HTTPS no campo `images[].path`. A API guarda o endereço, e o Express serve os arquivos da pasta pública.

Na edição, informe o ID para atualizar uma imagem ou opção. Para excluir, envie o ID com `deleted: true`. Quando você envia `category_ids`, a API substitui os vínculos. Uma lista vazia remove todos os vínculos.

## Testes

Execute `npm test` para verificar as rotas HTTP e a documentação sem MySQL. Para o teste de integração, configure um banco de testes pelo `.env`, execute `npm run db:migrate` e depois `npm run test:integration`. O teste cadastra e remove os próprios registros.

## Organização do código

A API é configurada em app.js e iniciada por index.js. As rotas em routes/route.js chamam os handlers de repositories/. Os modelos ficam em models/, com conexão compartilhada em connection.js. Autenticação e tratamento HTTP ficam em middleware/. A especificação OpenAPI está em docs/openapi.js.

## Escopo da entrega

O GitHub Actions executa o teste HTTP, a migration e o teste de integração em um MySQL de teste a cada push e pull request.

O servidor principal executa a API da loja. Os arquivos anteriores de turmas, matrículas e a página de teste ficaram no repositório como material do exercício inicial. Para integrar uma loja React, configure a origem do front-end em `CORS_ORIGINS`.

[Enunciado oficial do projeto](https://github.com/digitalcollegebr/projeto-backend)
