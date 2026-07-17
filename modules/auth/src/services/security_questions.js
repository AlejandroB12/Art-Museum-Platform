const auditRepo = require('../repositories/audit_repository');
const { SecurityQuestionsRequest } = require('../schemas/security_questions');
const { PreguntaSeguridad } = require('../models');

async function saveSecurityQuestions(userId, datos, req) {
    const validated = SecurityQuestionsRequest.parse(datos);

    await PreguntaSeguridad.destroy({ where: { id_usuario: Number(userId) } });

    for (const p of validated) {
        await PreguntaSeguridad.create({
            pregunta: p.pregunta,
            respuesta: p.resp,
            id_usuario: Number(userId)
        });
    }

    await auditRepo.registrarEvento(userId, 'GUARDAR_SEGURIDAD', 'Preguntas de seguridad guardadas', req);
}

module.exports = { saveSecurityQuestions };
