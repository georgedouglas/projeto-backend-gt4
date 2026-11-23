import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from 'sequelize';

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

function check(condition, message) {
    if (!condition) throw new HttpError(400, message);
}

function id(value) {
    check(/^\d+$/.test(String(value)) && Number(value) > 0 && Number(value) <= 4294967295, 'ID inválido.');
    return Number(value);
}

async function find(Model, value, options) {
    const record = await Model.findByPk(id(value), options);
    if (!record) throw new HttpError(404, 'Registro não encontrado.');
    return record;
}

function pick(body, fields) {
    return Object.fromEntries(fields.filter(field => Object.hasOwn(body, field)).map(field => [field, body[field]]));
}

function payload(body) {
    check(body && typeof body === 'object' && !Array.isArray(body), 'Envie um objeto JSON.');
    return body;
}

function string(value, field, max = 255) {
    check(typeof value === 'string' && value.trim().length > 0 && value.length <= max, field + ' inválido.');
}

function paginate(query, fields, defaults = fields) {
    const limit = Number(query.limit ?? 12);
    const page = Number(query.page ?? 1);
    check(Number.isInteger(limit) && (limit === -1 || limit > 0 && limit <= 1000), 'limit inválido.');
    check(Number.isSafeInteger(page) && page > 0 && Number.isSafeInteger(page * limit), 'page inválida.');
    const selected = query.fields === undefined ? defaults : String(query.fields).split(',').map(field => field.trim());
    check(selected.every(field => fields.includes(field)), 'fields contém um campo inválido.');
    return {
        limit, page, selected,
        options: { order: [['id', 'ASC']], ...(limit === -1 ? {} : { limit, offset: (page - 1) * limit }) }
    };
}

function respondError(error, req, res, next) {
    if (res.headersSent) return next(error);
    if (error instanceof UniqueConstraintError) return res.status(409).json({ message: 'Registro duplicado.' });
    if (error instanceof ValidationError || error instanceof ForeignKeyConstraintError) {
        return res.status(400).json({ message: 'Dados inválidos ou referência inexistente.' });
    }
    if (error instanceof HttpError) return res.status(error.status).json({ message: error.message });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'JSON inválido.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Corpo da requisição muito grande.' });
    console.error(error.name, error.original?.code || error.code || '');
    return res.status(500).json({ message: 'Erro interno do servidor.' });
}

export {
    HttpError,
    check,
    id,
    find,
    pick,
    payload,
    string,
    paginate,
    respondError,
};
