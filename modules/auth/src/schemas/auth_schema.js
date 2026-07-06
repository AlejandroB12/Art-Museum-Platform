const { loginSchema } = require('./login');
const { recoverySchema } = require('./recovery');
const { updatePasswordSchema } = require('./update_password');
const { registerSchema } = require('./register');
const { securityQuestionsSchema } = require('./security_questions');
const {
    usuarioActualSchema,
    estadoUsuarioSchema,
    logoutSchema,
    sessionUserSchema,
    estadoUsuarioResponseSchema
} = require('./session');

module.exports = {
    loginSchema,
    recoverySchema,
    updatePasswordSchema,
    registerSchema,
    securityQuestionsSchema,
    usuarioActualSchema,
    estadoUsuarioSchema,
    logoutSchema,
    sessionUserSchema,
    estadoUsuarioResponseSchema
};
