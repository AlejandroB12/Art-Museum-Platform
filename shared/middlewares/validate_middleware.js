function validate(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.body);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validacion',
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
                    message: 'Error de validacion',
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

function validateParams(schema) {
    return (req, res, next) => {
        try {
            const result = schema.safeParse(req.params);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: 'Error de validacion',
                    errors: result.error.issues.map(i => ({
                        field: i.path.join('.'),
                        message: i.message
                    }))
                });
            }
            req.params = result.data;
            next();
        } catch (err) {
            next(err);
        }
    };
}

module.exports = { validate, validateQuery, validateParams };
