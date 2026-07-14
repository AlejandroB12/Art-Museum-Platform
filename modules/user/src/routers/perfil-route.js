const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/api/perfil', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    try {
        const usuario = await query(
            "SELECT u.nombre, u.apellido, u.email, c.telefono, c.calle, c.id_parroquia, p.id_municipio, m.id_estado FROM usuario u LEFT JOIN comprador c ON u.id_usuario = c.id_usuario LEFT JOIN parroquia p ON c.id_parroquia = p.id_parroquia LEFT JOIN municipio m ON p.id_municipio = m.id_municipio WHERE u.id_usuario = $1",
            [req.session.id_usuario]
        );
        if (usuario.length === 0) return res.json(null);
        const u = usuario[0];
        res.json({
            nombre: u.nombre,
            apellido: u.apellido,
            email: u.email,
            telefono: u.telefono,
            calle: u.calle,
            id_parroquia: u.id_parroquia,
            id_municipio: u.id_municipio,
            id_estado: u.id_estado
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/api/perfil', async (req, res) => {
    if (!req.session.id_usuario) return res.status(401).json({ error: "No autenticado" });
    const { nombre, apellido, telefono, calle, id_parroquia } = req.body;
    try {
        await query(
            "UPDATE usuario SET nombre = $1, apellido = $2 WHERE id_usuario = $3",
            [nombre, apellido, req.session.id_usuario]
        );
        await query(
            `UPDATE comprador SET telefono = $1, calle = $2, id_parroquia = $3 WHERE id_usuario = $4`,
            [telefono, calle, id_parroquia, req.session.id_usuario]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
