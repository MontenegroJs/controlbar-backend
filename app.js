const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:4200',
            'https://controlbar-frontend.netlify.app'
        ];
        const isNetlifySubdomain = origin && /^https:\/\/.*\.netlify\.app$/.test(origin);
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || isNetlifySubdomain) {
            callback(null, true);
        } else {
            console.log(`CORS bloqueado: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const pedidosRoutes = require('./routes/pedidos.routes');
const cajaRoutes = require('./routes/caja.routes');
const adminRoutes = require('./routes/admin.routes');

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'ControlBar Backend funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api', productosRoutes);
app.use('/api', pedidosRoutes);
app.use('/api/caja', cajaRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;