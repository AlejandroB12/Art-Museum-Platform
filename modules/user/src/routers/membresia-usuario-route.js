const express = require('express');
const router = express.Router();
const { getMembresiaUsuario } = require('../services/get-membresia-usuario-service');

/**
 * @swagger
 * /api/membresia-usuario:
 *   get:
 *     summary: Retorna la información de membresía del usuario autenticado
 *     tags: [Usuario - Membresía]
 *     responses:
 *       200:
 *         description: Lista de membresías y solicitudes del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Concepto:
 *                     type: string
 *                   FechaInicio:
 *                     type: string
 *                     format: date
 *                   TotalPagado:
 *                     type: number
 *                   FechaVencimiento:
 *                     type: string
 *                     format: date
 *                     nullable: true
 *                   EstadoPago:
 *                     type: string
 *                   DiasRestantes:
 *                     type: number
 *                     nullable: true
 *                   Tipo:
 *                     type: string
 *                     enum: [solicitud, detalle, total]
 *                   estadoColor:
 *                     type: string
 *                   estiloFila:
 *                     type: string
 *                   diasLabel:
 *                     type: string
 *       401:
 *         description: Sesión no iniciada
 */
router.get('/api/membresia-usuario', async (req, res) => {
    const idUsuario = req.session.id_usuario;
    if (!idUsuario) return res.status(401).json({ error: "Sesión no iniciada" });
    try {
        const data = await getMembresiaUsuario(idUsuario);
        res.json(data);
    } catch (err) {
        console.error('Error en membresia-usuario:', err);
        res.status(500).json({ error: "Error de base de datos" });
    }
});

module.exports = router;
