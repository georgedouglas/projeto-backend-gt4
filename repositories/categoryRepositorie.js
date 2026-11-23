import Category from '../models/categoryModel.js';
import { check, find, paginate, payload, pick, string } from '../middleware/http.js';

const fields = ['id', 'name', 'slug', 'use_in_menu'];

function categoryData(body, creating = false) {
    const values = pick(payload(body), fields.slice(1));
    for (const field of ['name', 'slug']) {
        if (creating || Object.hasOwn(values, field)) string(values[field], field);
    }
    if (Object.hasOwn(values, 'use_in_menu')) {
        check(typeof values.use_in_menu === 'boolean', 'use_in_menu deve ser booleano.');
    }
    check(Object.keys(values).length, 'Informe os dados da categoria.');
    return values;
}

const searchCategories = async (req, res) => {
    const { limit, page, selected, options } = paginate(req.query, fields);
    const where = {};
    if (req.query.use_in_menu !== undefined) {
      check(['true', 'false', '1', '0'].includes(req.query.use_in_menu), 'use_in_menu inválido.');
      where.use_in_menu = ['true', '1'].includes(req.query.use_in_menu);
    }
    const { rows, count } = await Category.findAndCountAll({ ...options, where, attributes: selected });
    res.json({ data: rows, total: count, limit, page });
};

const getCategory = async (req, res) => {
    res.json(await find(Category, req.params.id, { attributes: fields }));
};

const createCategory = async (req, res) => {
    const record = await Category.create(categoryData(req.body, true));
    res.status(201).json(pick(record.get(), fields));
};

const alterCategory = async (req, res) => {
    const record = await find(Category, req.params.id);
    await record.update(categoryData(req.body));
    res.status(204).end();
};

const deleteCategory = async (req, res) => {
    await (await find(Category, req.params.id)).destroy();
    res.status(204).end();
};

export {
    searchCategories,
    getCategory,
    createCategory,
    alterCategory,
    deleteCategory
};
