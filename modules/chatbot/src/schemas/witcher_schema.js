const { z } = require('zod');

const chatSchema = z.object({
    mensaje: z.string().min(1, 'El mensaje es requerido')
});

module.exports = { chatSchema };
