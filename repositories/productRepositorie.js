import { Op } from 'sequelize';
import { sequelize } from '../connection.js';
import Category from '../models/categoryModel.js';
import { Product, ProductCategory, ProductImage, ProductOption } from '../models/productModel.js';
import { check, find, HttpError, id, paginate, payload, pick, string } from '../middleware/http.js';

const baseFields = ['id', 'enabled', 'name', 'slug', 'stock', 'description', 'price', 'price_with_discount'];
const fields = [...baseFields, 'category_ids', 'images', 'options'];
const include = [
    { association: 'images', separate: true, attributes: ['id', 'enabled', 'path'], order: [['id', 'ASC']] },
    { association: 'options', separate: true, attributes: ['id', 'title', 'shape', 'radius', 'type', 'values'], order: [['id', 'ASC']] },
    { association: 'categories', attributes: ['id'], through: { attributes: [] } }
];

function present(record, selected = fields) {
    const data = record.get({ plain: true });
    data.price = Number(data.price);
    data.price_with_discount = Number(data.price_with_discount);
    data.category_ids = data.categories.map(category => category.id).sort((a, b) => a - b);
    return pick(data, selected);
}

function productData(body, creating) {
    const values = pick(payload(body), baseFields.slice(1));
    for (const field of ['name', 'slug']) {
        if (creating || Object.hasOwn(values, field)) string(values[field], field);
    }
    for (const field of ['price', 'price_with_discount']) {
        if (creating || Object.hasOwn(values, field)) {
            const value = values[field];
            check(typeof value === 'number' && /^\d{1,8}(\.\d{1,2})?$/.test(String(value)), field + ' inválido.');
        }
    }
    if (Object.hasOwn(values, 'enabled')) check(typeof values.enabled === 'boolean', 'enabled inválido.');
    if (Object.hasOwn(values, 'stock')) {
        check(Number.isInteger(values.stock) && values.stock >= 0 && values.stock <= 4294967295, 'stock inválido.');
    }
    if (Object.hasOwn(values, 'description')) {
        check(values.description === null || (typeof values.description === 'string' &&
            Buffer.byteLength(values.description) <= 65535), 'description inválida.');
    }
    check(fields.slice(1).some(field => Object.hasOwn(body, field)), 'Informe os dados do produto.');
    return values;
}

function imageData(item, creating) {
    const values = pick(item, ['enabled']);
    if (Object.hasOwn(values, 'enabled')) check(typeof values.enabled === 'boolean', 'enabled inválido.');
    check(!Object.hasOwn(item, 'content') && !Object.hasOwn(item, 'type'), 'Envie apenas a URL da imagem no campo path.');
    if (creating || Object.hasOwn(item, 'path')) {
        const message = 'Informe uma URL HTTP ou HTTPS válida no campo path.';
        check(typeof item.path === 'string' && /^https?:\/\//i.test(item.path), message);
        const url = URL.parse(item.path);
        check(url && url.hostname && !url.username && !url.password, message);
        values.path = url.href;
    }
    return values;
}

function optionData(item, creating) {
    const values = pick(item, ['title', 'shape', 'radius', 'type', 'values']);
    if (creating || Object.hasOwn(values, 'title')) string(values.title, 'Título da opção');
    if (Object.hasOwn(values, 'shape')) check(['square', 'circle'].includes(values.shape), 'shape inválido.');
    if (Object.hasOwn(values, 'type')) check(['text', 'color'].includes(values.type), 'type inválido.');
    if (Object.hasOwn(values, 'radius')) {
        check(Number.isInteger(values.radius) && values.radius >= 0 && values.radius <= 4294967295, 'radius inválido.');
    }
    if (creating || Object.hasOwn(values, 'values')) {
        check(Array.isArray(values.values) && values.values.length > 0, 'Informe os valores da opção.');
        for (const value of values.values) string(value, 'Valor da opção');
    }
    return values;
}

async function saveChildren(Model, items, productId, parse, transaction, creating) {
    check(Array.isArray(items), 'Imagens e opções devem ser listas.');
    for (const item of items) {
        payload(item);
        if (Object.hasOwn(item, 'deleted')) check(typeof item.deleted === 'boolean', 'deleted deve ser booleano.');
        if (item.id === undefined) {
            check(!item.deleted, 'Informe o ID do item a excluir.');
            await Model.create({ ...parse(item, true), product_id: productId }, { transaction });
            continue;
        }
        check(!creating, 'IDs de imagens e opções são aceitos apenas na edição.');
        const record = await Model.findOne({ where: { id: id(item.id), product_id: productId }, transaction });
        if (!record) throw new HttpError(404, 'Imagem ou opção não encontrada neste produto.');
        if (item.deleted) await record.destroy({ transaction });
        else await record.update(parse(item, false), { transaction });
    }
}

async function save(body, productId) {
    const creating = productId === undefined;
    const values = productData(body, creating);
    return sequelize.transaction(async transaction => {
        const product = creating
            ? await Product.create(values, { transaction })
            : await find(Product, productId, { transaction, lock: true });
        if (!creating) await product.update(values, { transaction });
        if (Object.hasOwn(body, 'category_ids')) {
            check(Array.isArray(body.category_ids), 'category_ids deve ser uma lista.');
            const ids = [...new Set(body.category_ids.map(id))];
            const count = await Category.count({ where: { id: ids }, transaction });
            check(count === ids.length, 'Uma ou mais categorias não existem.');
            await product.setCategories(ids, { transaction });
        }
        if (Object.hasOwn(body, 'images')) {
            await saveChildren(ProductImage, body.images, product.id, imageData, transaction, creating);
        }
        if (Object.hasOwn(body, 'options')) {
            await saveChildren(ProductOption, body.options, product.id, optionData, transaction, creating);
        }
        return product.id;
    });
}

function optionFilters(query) {
    const entries = Object.entries(query).filter(([key]) => key.startsWith('option['));
    const filters = [];
    for (const [key, raw] of entries) {
        const match = /^option\[(\d+)\]$/.exec(key);
        check(match && typeof raw === 'string' && raw.trim(), 'Filtro de opção inválido.');
        const values = raw.split(',').map(value => value.trim());
        filters.push({
            id: id(match[1]),
            [Op.or]: values.map(value => sequelize.where(
                sequelize.fn('JSON_CONTAINS', sequelize.col('values'), JSON.stringify(value)), 1
            ))
        });
    }
    return filters;
}

const searchProducts = async (req, res) => {
    const { limit, page, selected, options } = paginate(req.query, fields);
    const where = { [Op.and]: [] };
    if (req.query.match !== undefined) {
      check(typeof req.query.match === 'string', 'match inválido.');
      const match = '%' + req.query.match.replace(/[\\%_]/g, '\\$&') + '%';
      where[Op.or] = [{ name: { [Op.like]: match } }, { description: { [Op.like]: match } }];
    }
    if (req.query['price-range'] !== undefined) {
      const range = /^(\d{1,8}(?:\.\d{1,2})?)-(\d{1,8}(?:\.\d{1,2})?)$/.exec(req.query['price-range']);
      check(range && Number(range[1]) <= Number(range[2]), 'price-range inválido.');
      where.price = { [Op.between]: [Number(range[1]), Number(range[2])] };
    }
    const filters = optionFilters(req.query);
    if (req.query.category_ids !== undefined) {
      check(typeof req.query.category_ids === 'string', 'category_ids inválido.');
      const categoryIds = req.query.category_ids.split(',').map(value => id(value.trim()));
      const links = await ProductCategory.findAll({
        attributes: ['product_id'], where: { category_id: categoryIds }, raw: true
      });
      where[Op.and].push({ id: { [Op.in]: [...new Set(links.map(link => link.product_id))] } });
    }
    if (filters.length) {
      const matches = await ProductOption.findAll({
        attributes: ['id', 'product_id'], where: { [Op.or]: filters }, raw: true
      });
      for (const filter of filters) {
        where[Op.and].push({ id: { [Op.in]: matches.filter(row => row.id === filter.id).map(row => row.product_id) } });
      }
    }
    const total = await Product.count({ where });
    const rows = await Product.findAll({ ...options, where, include });
    res.json({ data: rows.map(row => present(row, selected)), total, limit, page });
};

const getProduct = async (req, res) => {
    res.json(present(await find(Product, req.params.id, { include })));
};

const createProduct = async (req, res) => {
    const productId = await save(req.body);
    res.status(201).json(present(await find(Product, productId, { include })));
};

const alterProduct = async (req, res) => {
    await save(req.body, req.params.id);
    res.status(204).end();
};

const deleteProduct = async (req, res) => {
    await (await find(Product, req.params.id)).destroy();
    res.status(204).end();
};

export {
    searchProducts,
    getProduct,
    createProduct,
    alterProduct,
    deleteProduct
};
