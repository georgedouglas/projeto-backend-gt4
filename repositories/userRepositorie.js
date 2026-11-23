import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { jwtSecret } from '../middleware/jwtSecret.js';
import { check, find, HttpError, id, payload, pick, string } from '../middleware/http.js';

const publicFields = ['id', 'firstname', 'surname', 'email'];

async function userData(body, creating = false) {
    const data = pick(payload(body), ['firstname', 'surname', 'email', 'password']);
    for (const field of ['firstname', 'surname', 'email']) {
        if (creating || Object.hasOwn(data, field)) {
            string(data[field], field);
            data[field] = data[field].trim();
        }
    }
    if (data.email !== undefined) {
        check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email), 'Email inválido.');
        data.email = data.email.toLowerCase();
    }
    if (creating || Object.hasOwn(data, 'password') || Object.hasOwn(body, 'confirmPassword')) {
        check(typeof data.password === 'string' && data.password.length >= 6 &&
            Buffer.byteLength(data.password) <= 72, 'A senha deve ter ao menos 6 caracteres e até 72 bytes.');
        check(data.password === body.confirmPassword, 'As senhas precisam coincidir.');
        data.password = await bcrypt.hash(data.password, 10);
    }
    check(Object.keys(data).length, 'Informe os dados do usuário.');
    return data;
}

const getUser = async (req, res) => {
    res.json(await find(User, req.params.id, { attributes: publicFields }));
};

const createUser = async (req, res) => {
    const user = await User.create(await userData(req.body, true));
    res.status(201).json(pick(user.get(), publicFields));
};

const login = async (req, res) => {
    const { email, password } = payload(req.body);
    string(email, 'Email');
    string(password, 'Senha', 72);
    check(Buffer.byteLength(password) <= 72, 'Senha inválida.');
    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new HttpError(400, 'Email ou senha inválidos.');
    }
    res.json({ token: jwt.sign({}, jwtSecret(), { subject: String(user.id), expiresIn: '1h' }) });
};

const alterUser = async (req, res) => {
    if (id(req.params.id) !== req.userId) throw new HttpError(403, 'Você só pode editar a própria conta.');
    const user = await find(User, req.params.id);
    await user.update(await userData(req.body));
    res.status(204).end();
};

const deleteUser = async (req, res) => {
    if (id(req.params.id) !== req.userId) throw new HttpError(403, 'Você só pode excluir a própria conta.');
    await (await find(User, req.params.id)).destroy();
    res.status(204).end();
};

export {
    getUser,
    createUser,
    login,
    alterUser,
    deleteUser
};
