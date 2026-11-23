import express from 'express';
import { fileURLToPath } from 'node:url';
import { HttpError, respondError } from './middleware/http.js';
import router from './routes/route.js';

const app = express();
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',').map(origin => origin.trim());

app.use((req, res, next) => {
    const origin = req.get('Origin');
    res.vary('Origin');
    if (origins.includes(origin)) {
        res.set('Access-Control-Allow-Origin', origin);
        res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        if (req.method === 'OPTIONS') return res.status(204).end();
    }
    next();
});
app.use(express.json({ limit: '8mb' }));

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
app.use('/public', express.static(publicDir, { index: false, redirect: false }));

app.use(router);

app.use((req, res, next) => next(new HttpError(404, 'Rota não encontrada.')));
app.use(respondError);

export { app };
