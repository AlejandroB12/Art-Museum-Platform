function errorHandler(err, req, res, next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    console.error(err.stack);

    if (err.name === 'ValidationError' || err.name === 'ZodError') {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: err.errors || err.issues || []
        });
    }

    if (err.name === 'NotFoundError') {
        return res.status(404).json({
            success: false,
            message: err.message
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Error interno del servidor'
    });
}

function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.path}`
    });
}

module.exports = { errorHandler, notFoundHandler };
