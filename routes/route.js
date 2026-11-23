import express from 'express';
import { getUser, createUser, login, alterUser, deleteUser } from '../repositories/userRepositorie.js';
import { searchCategories, getCategory, createCategory, alterCategory, deleteCategory } from '../repositories/categoryRepositorie.js';
import { searchProducts, getProduct, createProduct, alterProduct, deleteProduct } from '../repositories/productRepositorie.js';
import { authenticate } from '../middleware/authenticate.js';
import { openapi } from '../docs/openapi.js';

const router = express.Router();

router.route('/health').get((req, res) => res.json({ status: 'ok' }));
router.route('/openapi.json').get((req, res) => res.json(openapi));

router.route('/v1/user/token').post(login);
router.route('/v1/user').post(createUser);
router.route('/v1/user/:id')
    .get(getUser)
    .put(authenticate, alterUser)
    .delete(authenticate, deleteUser);

router.route('/v1/category/search').get(searchCategories);
router.route('/v1/category').post(authenticate, createCategory);
router.route('/v1/category/:id')
    .get(getCategory)
    .put(authenticate, alterCategory)
    .delete(authenticate, deleteCategory);

router.route('/v1/product/search').get(searchProducts);
router.route('/v1/product').post(authenticate, createProduct);
router.route('/v1/product/:id')
    .get(getProduct)
    .put(authenticate, alterProduct)
    .delete(authenticate, deleteProduct);

export default router;
