/**
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { isAuthenticated } = require('../middlewares/auth.middleware');

// POST /api/auth/login - Iniciar sesión
router.post('/login', authController.login);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authController.logout);

// GET /api/auth/me - Obtener usuario actual (requiere autenticación)
router.get('/me', isAuthenticated, authController.getCurrentUser);

// GET /api/auth/check - Verificar si hay sesión activa
router.get('/check', authController.checkAuth);

module.exports = router;