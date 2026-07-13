const { z } = require('zod');

const PREGUNTAS_PERMITIDAS = [
    '¿Cuál es el nombre de tu mascota?',
    '¿Cuál es tu comida favorita?',
    '¿Cuál es el nombre de tu mejor amigo?',
    '¿Cuál fue el nombre de tu primera escuela?',
    '¿Cuál es tu libro favorito?',
    '¿Cuál es el nombre de tu ciudad natal?'
];

const PreguntaSeguridadSchema = z.object({
    id_pregunta: z.number().int().positive().optional(),
    pregunta: z.string()
        .trim()
        .min(1, 'La pregunta no puede estar vacía')
        .max(200, 'La pregunta no puede exceder 200 caracteres'),
    resp: z.string()
        .trim()
        .min(1, 'La respuesta no puede estar vacía')
        .max(100, 'La respuesta no puede exceder 100 caracteres')
        .transform(val => val.toLowerCase())
}).strict();

const SecurityQuestionsRequest = z.array(PreguntaSeguridadSchema)
    .min(1, 'Debe proporcionar al menos una pregunta de seguridad')
    .max(3, 'Puede proporcionar máximo 3 preguntas de seguridad');

module.exports = { SecurityQuestionsRequest, PreguntaSeguridadSchema, PREGUNTAS_PERMITIDAS };
