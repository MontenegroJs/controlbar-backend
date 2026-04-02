/**
 * Middleware de autenticación para ControlBar
 * Verifica que el usuario tenga sesión activa
 */

// Verificar si el usuario está autenticado
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ error: 'No autenticado. Inicie sesión primero.' });
};

// Verificar rol específico
const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ error: 'No autenticado.' });
        }

        if (!allowedRoles.includes(req.session.userRole)) {
            return res.status(403).json({
                error: `Acceso denegado. Se requiere rol: ${allowedRoles.join(' o ')}`
            });
        }

        next();
    };
};

// Verificar que sea mozo
const isMozo = hasRole(['mozo']);

// Verificar que sea cajero
const isCajero = hasRole(['cajero']);

// Verificar que sea admin
const isAdmin = hasRole(['admin']);

// Verificar que sea cajero o admin
const isCajeroOrAdmin = hasRole(['cajero', 'admin']);

// Verificar que sea mozo o admin
const isMozoOrAdmin = hasRole(['mozo', 'admin']);

module.exports = {
    isAuthenticated,
    hasRole,
    isMozo,
    isCajero,
    isAdmin,
    isCajeroOrAdmin,
    isMozoOrAdmin
};