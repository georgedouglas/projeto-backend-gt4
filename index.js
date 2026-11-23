import { app } from './app.js';
import { connect, sequelize } from './connection.js';
import { jwtSecret } from './middleware/jwtSecret.js';

const port = Number(process.env.PORT || 3000);
try {
    jwtSecret();
    await connect();
    app.listen(port, () => {
        console.log('Digital Store API em http://localhost:' + port);
    });
} catch (error) {
    console.error('Falha ao iniciar a API:', error.message);
    await sequelize.close();
    process.exitCode = 1;
}
