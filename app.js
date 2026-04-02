const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');

// Importar middlewares de error
const { errorHandler, notFound } = require('./middlewares/error.middleware');

dotenv.config();

const app = express();

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS para desarrollo (frontend Angular en otro puerto)
app.use(cors({
    origin: ['http://localhost:4200', 'https://symphonious-marshmallow-d0ad26.netlify.app/'],
    credentials: true
}));

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const cajaRoutes = require('./routes/caja.routes');
const adminRoutes = require('./routes/admin.routes');

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api', productosRoutes);
app.use('/api', pedidosRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'ControlBar Backend funcionando' });
});

// Rutas (se agregarán en fases posteriores)
// app.use('/api', mesasRoutes);
// app.use('/api', productosRoutes);
// etc.

// Middleware para rutas no encontradas (404)
app.use(notFound);

// Middleware de manejo de errores centralizado
app.use(errorHandler);

module.exports = app;