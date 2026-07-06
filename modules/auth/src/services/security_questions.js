const userRepo = require('../repositories/user_repository');
const auditRepo = require('../repositories/audit_repository');
const { securityQuestionsSchema } = require('../schemas/security_questions');

async function saveSecurityQuestions(userId, datos, req) {
    const validated = securityQuestionsSchema.parse(datos);

    await userRepo.queryRaw("DELETE FROM CodigoSeguridad WHERE id_usuario = ?", [userId]);
    const valores = validated.map(p => [p.pregunta, p.resp, userId]);
    await userRepo.queryRaw("INSERT INTO CodigoSeguridad (Pregunta, Respuesta, id_usuario) VALUES ?", [valores]);
    await auditRepo.registrarEvento(userId, 'GUARDAR_SEGURIDAD', 'Preguntas de seguridad guardadas', req);
}

module.exports = { saveSecurityQuestions };
