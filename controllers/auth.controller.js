/**
 * Controlador de autenticación
 * Maneja login, logout y obtención de usuario actual
 */

const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { AppError } = require('../middlewares/error.middleware');

// Login de usuario
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validar campos obligatorios
        if (!username || !password) {
            throw new AppError('Usuario y contraseña son obligatorios', 400);
        }

        // Buscar usuario en la base de datos
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT id, username, password_hash, rol FROM usuarios WHERE username = ? AND activo = 1',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                }
            );
        });

        // Verificar si usuario existe
        if (!user) {
            throw new AppError('Usuario o contraseña incorrectos', 401);
        }

        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new AppError('Usuario o contraseña incorrectos', 401);
        }

        // Guardar información en sesión
        req.session.userId = user.id;
        req.session.userName = user.username;
        req.session.userRole = user.rol;

        // Enviar respuesta
        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                username: user.username,
                rol: user.rol
            }
        });

    } catch (error) {
        next(error);
    }
};

// Logout de usuario
const logout = async (req, res, next) => {
    try {
        // Destruir la sesión
        req.session.destroy((err) => {
            if (err) {
                throw new AppError('Error al cerrar sesión', 500);
            }
            res.json({
                success: true,
                message: 'Sesión cerrada correctamente'
            });
        });
    } catch (error) {
        next(error);
    }
};

// Obtener usuario actual (sesión activa)
const getCurrentUser = async (req, res, next) => {
    try {
        if (!req.session || !req.session.userId) {
            throw new AppError('No hay sesión activa', 401);
        }

        res.json({
            success: true,
            user: {
                id: req.session.userId,
                username: req.session.userName,
                rol: req.session.userRole
            }
        });

    } catch (error) {
        next(error);
    }
};

// Verificar si hay sesión activa (para frontend)
const checkAuth = async (req, res, next) => {
    try {
        const isAuthenticated = !!(req.session && req.session.userId);
        res.json({
            success: true,
            authenticated: isAuthenticated,
            user: isAuthenticated ? {
                id: req.session.userId,
                username: req.session.userName,
                rol: req.session.userRole
            } : null
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login,
    logout,
    getCurrentUser,
    checkAuth
};