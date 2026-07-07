const { z } = require('zod');

const securityQuestionsSchema = z.array(z.object({
    pregunta: z.string().min(1, "La pregunta no puede estar vacía"),
    resp: z.string().min(1, "La respuesta no puede estar vacía")
})).min(1, "Debe proporcionar al menos una pregunta");

module.exports = { securityQuestionsSchema };
