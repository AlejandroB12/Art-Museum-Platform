function validate(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validación',
                    errors: result.error.issues.map(i => ({
                        field: i.path.join('.'),
                        message: i.message
                    }))
                });
            }
            req.body = result.data;
            next();
        } catch (err) {
            next(err);
        }
    };
}

function validateQuery(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.query);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validación',
                    errors: result.error.issues.map(i => ({
                        field: i.path.join('.'),
                        message: i.message
                    }))
                });
            }
            req.query = result.data;
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = { validate, validateQuery };
