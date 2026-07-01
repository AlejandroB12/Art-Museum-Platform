const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_me';

const generateToken = (user) => {
    return jwt.sign(
        { id: user.id_usuario, email: user.Email, rol: user.Rol, nombre: user.Nombre },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

const sessionFromToken = (req, _res, next) => {
    const token = req.headers['x-user-token'];
    if (token) {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.session = req.session || {};
            req.session.id_usuario = decoded.id;
            req.session.usuario = {
                id_usuario: decoded.id,
                Email: decoded.email,
                Rol: decoded.rol,
                Nombre: decoded.nombre
            };
        } catch (_err) { }
    }
    next();
};

module.exports = { generateToken, sessionFromToken, JWT_SECRET };
