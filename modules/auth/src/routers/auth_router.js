const express = require('express');
const router = express.Router();

const { register, EmailAlreadyExistsError, CedulaAlreadyExistsError } = require('../services/register');
const { login, InvalidCredentialsError, InactiveAccountError } = require('../services/login');
const { logout, LogoutError } = require('../services/logout');
const { updatePassword, InvalidCurrentPasswordError, UserNotFoundError } = require('../services/update_password');
const { RegisterRequest, RegisterResponse } = require('../schemas/register');
const { LoginRequest, LoginResponse } = require('../schemas/login');
const { UpdatePasswordRequest, UpdatePasswordResponse } = require('../schemas/update_password');

router.post('/register', async (req, res) => {
    try {
        const result = await register(req.body, req);
        const response = RegisterResponse.parse(result);
        res.status(201).json({ success: true, ...response });
    } catch (err) {
        if (err?.issues) {
            return res.status(400).json({ success: false, error: err.issues });
        }
        if (err instanceof EmailAlreadyExistsError) {
            return res.status(409).json({ success: false, error: err.message });
        }
        if (err instanceof CedulaAlreadyExistsError) {
            return res.status(409).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const credentials = LoginRequest.parse(req.body);
        const result = await login(credentials, req);
        const response = LoginResponse.parse(result);
        res.json({ success: true, ...response });
    } catch (err) {
        if (err?.issues) {
            return res.status(400).json({ success: false, error: err.issues });
        }
        if (err instanceof InvalidCredentialsError) {
            return res.status(401).json({ success: false, error: err.message });
        }
        if (err instanceof InactiveAccountError) {
            return res.status(403).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/logout', async (req, res) => {
    try {
        await logout(req);
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ success: true });
    } catch (err) {
        if (err instanceof LogoutError) {
            return res.status(500).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/update-password', async (req, res) => {
    try {
        const parsed = UpdatePasswordRequest.parse(req.body);
        await updatePassword(parsed, req);
        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (err) {
        if (err?.issues) {
            return res.status(400).json({ success: false, error: err.issues });
        }
        if (err instanceof InvalidCurrentPasswordError) {
            return res.status(400).json({ success: false, error: err.message });
        }
        if (err instanceof UserNotFoundError) {
            return res.status(404).json({ success: false, error: err.message });
        }
        res.status(500).json({ success: false, error: err.message });
    }
});

router.use(require('./recuperar_pw'));
router.use(require('./guardar_seguridad'));
router.use(require('./usuario_actual'));
router.use(require('./estado_usuario'));

module.exports = router;
