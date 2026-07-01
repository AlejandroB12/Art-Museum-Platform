const { createProxyMiddleware } = require('http-proxy-middleware');
const { generateToken } = require('../../shared/middlewares/auth_jwt');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
const USER_URL = process.env.USER_SERVICE_URL || 'http://localhost:3003';
const CHECKOUT_URL = process.env.CHECKOUT_SERVICE_URL || 'http://localhost:3004';
const RECOMMENDATIONS_URL = process.env.RECOMMENDATIONS_SERVICE_URL || 'http://localhost:3005';
const CHATBOT_URL = process.env.CHATBOT_SERVICE_URL || 'http://localhost:3006';
const ADMIN_URL = process.env.ADMIN_SERVICE_URL || 'http://localhost:3007';

const apiProxy = createProxyMiddleware({

    changeOrigin: true,
    proxyTimeout: 30000,
    timeout: 30000,

    onProxyReq: (proxyReq, req) => {
        if (req.session?.id_usuario && req.session?.usuario) {
            const token = generateToken(req.session.usuario);
            proxyReq.setHeader('x-user-token', token);
        }
    },

    router: (req) => {

        const { path } = req;

        if (
            path === '/login-auth' ||
            path === '/recuperar-pw' ||
            path === '/update-password' ||
            path === '/registrar' ||
            path === '/guardar-seguridad' ||
            path === '/verificar-preguntas' ||
            path === '/logout' ||
            path === '/api/usuario-actual' ||
            path === '/api/estado-usuario'

        ) return AUTH_URL;

        if (
            path === '/api/precio-membresia' ||
            path === '/api/membresia-usuario' ||
            path === '/solicitar-pago' ||
            path === '/mis-compras' ||
            path === '/api/datos-envio-pago'

        ) return USER_URL;

        if (
            path.startsWith('/api/autores') ||
            path.startsWith('/api/obras-filtradas') ||
            path.startsWith('/api/autor-detalle') ||
            path.startsWith('/api/artistas-catalogo') ||
            path.startsWith('/api/obras-destacadas')

        ) return CATALOG_URL;

        if (
            path.startsWith('/api/recomendaciones') ||
            path.startsWith('/api/grafo') ||
            path.startsWith('/api/actividad') ||
            path === '/api/auth/guest-login'

        ) return RECOMMENDATIONS_URL;

        if (path.startsWith('/api/buscar') && !path.startsWith('/api/buscar-comprador'))
            return RECOMMENDATIONS_URL;

        if (
            path === '/confirmar-reserva' ||
            path.startsWith('/api/estados') ||
            path.startsWith('/api/municipios') ||
            path.startsWith('/api/parroquias') ||
            path.startsWith('/api/direcciones')

        ) return CHECKOUT_URL;

        if (
            path === '/api/chat'

        ) return CHATBOT_URL;

        return ADMIN_URL;
    }
});

const shouldProxy = (pathname) => {
    
    return (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/login-') ||
        pathname.startsWith('/registrar') ||
        pathname.startsWith('/logout') ||
        pathname.startsWith('/recuperar-') ||
        pathname.startsWith('/update-') ||
        pathname.startsWith('/guardar-') ||
        pathname.startsWith('/verificar-') ||
        pathname.startsWith('/solicitar-') ||
        pathname.startsWith('/mis-') ||
        pathname.startsWith('/confirmar-') ||
        pathname.startsWith('/consultas/') ||
        pathname.startsWith('/generar-') ||
        pathname.startsWith('/cassandra/') ||
        pathname.startsWith('/aprobar-')
    );
};

module.exports = { apiProxy, shouldProxy };
