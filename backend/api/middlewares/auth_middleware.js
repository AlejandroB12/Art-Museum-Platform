function requireAuth(req, res, next) 
{
    if (!req.session?.id_usuario) 
    {
        return res.status(401).json({ error: "No autenticado" });
    }

    next();
}

function requireAdmin(req, res, next) 
{
    if (!req.session?.usuario?.Rol || req.session.usuario.Rol !== 'administrador') 
    {
        return res.status(403).json({ error: "Acceso denegado. Se requieren permisos de administrador." });
    }

    next();
}

function optionalAuth(req, res, next) 
{
    next();
}

module.exports = { requireAuth, requireAdmin, optionalAuth };
