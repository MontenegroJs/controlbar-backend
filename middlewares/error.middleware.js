/**
 * Middleware de manejo de errores centralizado
 */

// Clase personalizada para errores de API
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Manejador de errores para rutas no encontradas (404)
const notFound = (req, res, next) => {
    const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
    next(error);
};

// Manejador central de errores
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    console.error('❌ Error:', error.message);
    if (err.stack) {
        console.error('Stack trace:', err.stack);
    }

    // Error de SQLite - llave foránea violada
    if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        error = new AppError('Violación de integridad referencial. El recurso está en uso.', 400);
    }

    // Error de SQLite - único duplicado
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        error = new AppError('El valor ya existe. Debe ser único.', 400);
    }

    // Error de SQLite - NOT NULL
    if (err.code === 'SQLITE_CONSTRAINT_NOTNULL') {
        error = new AppError('Campo obligatorio no proporcionado.', 400);
    }

    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';

    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    AppError,
    notFound,
    errorHandler
};