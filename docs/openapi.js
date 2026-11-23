const ref = name => ({ $ref: '#/components/schemas/' + name });
const str = { type: 'string' };
const integer = { type: 'integer' };
const boolean = { type: 'boolean' };
const number = { type: 'number' };
const list = items => ({ type: 'array', items });
const object = (properties, required = []) => ({ type: 'object', properties, required });
const json = schema => ({ 'application/json': { schema } });
const parameter = (name, schema, description, location = 'query') => ({
  name, in: location, required: location === 'path', schema, description
});
const pageParams = [
  parameter('limit', { ...integer, default: 12 }, 'Quantidade por página. -1 retorna todos.'),
  parameter('page', { ...integer, default: 1 }, 'Número da página.'),
  parameter('fields', str, 'Campos separados por vírgula.')
];
const id = parameter('id', integer, 'Identificador do registro.', 'path');
const errorDescriptions = {
  400: 'Dados inválidos', 401: 'Token ausente ou inválido', 403: 'Acesso negado',
  404: 'Registro não encontrado', 409: 'Registro duplicado', 500: 'Erro interno'
};

function operation(summary, status, { input, output, auth, errors = [400, 404], parameters } = {}) {
  return {
    summary,
    security: auth ? [{ bearerAuth: [] }] : [],
    ...(parameters && { parameters }),
    ...(input && { requestBody: { required: true, content: json(input) } }),
    responses: {
      [status]: {
        description: { 200: 'Sucesso', 201: 'Criado', 204: 'Sucesso sem corpo' }[status],
        ...(output && { content: json(output) })
      },
      ...Object.fromEntries([...new Set([...errors, ...(auth ? [401] : []), 500])].map(code =>
        [code, { description: errorDescriptions[code], content: json(ref('Error')) }]
      ))
    }
  };
}

const user = { firstname: str, surname: str, email: { type: 'string', format: 'email' } };
const password = { type: 'string', format: 'password', minLength: 6, example: 'SenhaExemplo123' };
const userInput = { ...user, password, confirmPassword: password };
const category = { name: { ...str, example: 'Tênis' }, slug: { ...str, example: 'tenis' }, use_in_menu: boolean };
const image = { enabled: boolean, path: { ...str, format: 'uri', description: 'URL HTTP ou HTTPS da imagem.', example: 'http://localhost:3000/public/imagem-teste.png' } };
const option = {
  title: { ...str, example: 'Tamanho' },
  shape: { ...str, enum: ['square', 'circle'] },
  radius: integer,
  type: { ...str, enum: ['text', 'color'] },
  values: list({ ...str, example: '40' })
};
const product = {
  enabled: boolean,
  name: { ...str, example: 'Tênis casual' },
  slug: { ...str, example: 'tenis-casual' },
  stock: integer,
  description: str,
  price: { ...number, example: 119.9 },
  price_with_discount: { ...number, example: 99.9 },
  category_ids: list(integer)
};
const productRelations = {
  images: list(object(image, ['path'])),
  options: list(object(option, ['title', 'values']))
};

function catalogPaths(resource, name, searchParams) {
  const path = '/v1/' + resource;
  const schema = ref(name);
  return {
    [path + '/search']: {
      get: operation('Pesquisar ' + resource, 200, {
        parameters: [...pageParams, ...searchParams],
        output: object({ data: list(schema), total: integer, limit: integer, page: integer }),
        errors: [400]
      })
    },
    [path]: {
      post: operation('Cadastrar ' + resource, 201, {
        input: ref(name + 'Create'), output: schema, auth: true, errors: [400, 409]
      })
    },
    [path + '/{id}']: {
      parameters: [id],
      get: operation('Consultar ' + resource, 200, { output: schema }),
      put: operation('Atualizar ' + resource, 204, {
        input: ref(name + 'Update'), auth: true, errors: [400, 404, 409]
      }),
      delete: operation('Excluir ' + resource, 204, { auth: true })
    }
  };
}

export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Digital Store API', version: '1.0.0' },
  paths: {
    '/health': { get: operation('Verificar se a API está no ar', 200, { output: object({ status: str }), errors: [] }) },
    '/v1/user': {
      post: operation('Cadastrar usuário', 201, { input: ref('UserCreate'), output: ref('User'), errors: [400, 409] })
    },
    '/v1/user/token': {
      post: operation('Obter token JWT', 200, {
        input: object({ email: user.email, password }, ['email', 'password']),
        output: object({ token: str }), errors: [400]
      })
    },
    '/v1/user/{id}': {
      parameters: [id],
      get: operation('Consultar usuário', 200, { output: ref('User') }),
      put: operation('Atualizar a própria conta', 204, {
        auth: true, input: ref('UserUpdate'), errors: [400, 403, 404, 409]
      }),
      delete: operation('Excluir a própria conta', 204, { auth: true, errors: [400, 403, 404] })
    },
    ...catalogPaths('category', 'Category', [parameter('use_in_menu', boolean, 'Filtra categorias do menu.')]),
    ...catalogPaths('product', 'Product', [
      parameter('match', str, 'Trecho do nome ou da descrição.'),
      parameter('category_ids', str, 'IDs separados por vírgula.'),
      parameter('price-range', str, 'Preço mínimo e máximo, por exemplo 50-200.'),
      parameter('option[1]', str, 'Substitua 1 pelo ID da opção. Separe os valores por vírgula.')
    ])
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: object({ message: str }, ['message']),
      User: object({ id: integer, ...user }),
      UserCreate: object(userInput, Object.keys(userInput)),
      UserUpdate: object(userInput),
      Category: object({ id: integer, ...category }),
      CategoryCreate: object(category, ['name', 'slug']),
      CategoryUpdate: object(category),
      Product: object({
        id: integer, ...product,
        images: list(object({ id: integer, ...image })),
        options: list(object({ id: integer, ...option }))
      }),
      ProductCreate: object({ ...product, ...productRelations }, ['name', 'slug', 'price', 'price_with_discount']),
      ProductUpdate: object({
        ...product,
        images: list(object({ id: integer, deleted: boolean, ...image })),
        options: list(object({ id: integer, deleted: boolean, ...option }))
      })
    }
  }
};
