const { z } = require('zod');

/**
 * @openapi
 * /confirmar-reserva:
 *   post:
 *     tags: [Checkout]
 *     summary: Confirmar reserva de una obra
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_obra]
 *             properties:
 *               id_obra: { type: integer }
 *     responses:
 *       200:
 *         description: Reserva confirmada
 */

const reservaSchema = z.object({
    id_obra: z.number().int().positive("ID de obra inválido")
});

module.exports = { reservaSchema };
