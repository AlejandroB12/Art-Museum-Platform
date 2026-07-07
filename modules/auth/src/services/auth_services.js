const { login } = require('./login');
const { recoverPassword } = require('./recover_password');
const { updatePassword } = require('./update_password');
const { register } = require('./register');
const { saveSecurityQuestions } = require('./security_questions');
const { getUsuarioActual, getEstadoUsuario } = require('./session');
const { logout } = require('./logout');

module.exports = {
    login,
    recoverPassword,
    updatePassword,
    register,
    saveSecurityQuestions,
    getUsuarioActual,
    getEstadoUsuario,
    logout
};
