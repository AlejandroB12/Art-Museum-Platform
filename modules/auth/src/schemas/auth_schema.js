const { LoginRequest, LoginResponse } = require('./login');
const { PasswordRecoveryRequest, PasswordRecoveryResponse } = require('./recovery');
const { UpdatePasswordRequest, UpdatePasswordResponse } = require('./update_password');
const { RegisterRequest, RegisterResponse } = require('./register');
const { SecurityQuestionsRequest } = require('./security_questions');
const {
    UsuarioActualRequest,
    EstadoUsuarioRequest,
    LogoutRequest,
    SessionUserSchema,
    EstadoUsuarioResponse
} = require('./session');
const { TIPOS_EVENTO, RegistrarEventoSeguridadInput } = require('./bitacora');
const { ESTATUS_OBRA, RegistrarCambioEstatusInput } = require('./historial_estatus');

module.exports = {
    LoginRequest, LoginResponse,
    PasswordRecoveryRequest, PasswordRecoveryResponse,
    UpdatePasswordRequest, UpdatePasswordResponse,
    RegisterRequest, RegisterResponse,
    SecurityQuestionsRequest,
    UsuarioActualRequest, EstadoUsuarioRequest, LogoutRequest,
    SessionUserSchema, EstadoUsuarioResponse,
    TIPOS_EVENTO, RegistrarEventoSeguridadInput,
    ESTATUS_OBRA, RegistrarCambioEstatusInput
};
