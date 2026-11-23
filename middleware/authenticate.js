import jwt from 'jsonwebtoken';
import { jwtSecret } from './jwtSecret.js';
import User from '../models/userModel.js';
import { HttpError } from './http.js';

const authenticate = async (req, res, next) => {
    const token = /^Bearer (\S+)$/i.exec(req.get('authorization') || '')?.[1];
    if (!token) throw new HttpError(401, 'Informe o token Bearer.');
    const secret = jwtSecret();
    let claims;
    try {
        claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
    } catch {
        throw new HttpError(401, 'Token inválido ou expirado.');
    }
    req.userId = Number(claims.sub);
    if (!Number.isInteger(req.userId) || !await User.findByPk(req.userId, { attributes: ['id'] })) {
        throw new HttpError(401, 'Usuário do token não encontrado.');
    }
    next();
};

export {
    authenticate,
};
