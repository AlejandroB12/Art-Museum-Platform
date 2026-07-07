/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica el estado del servicio de autenticación
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Servicio activo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 service:
 *                   type: string
 *                   example: auth
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */

/**
 * @swagger
 * /login-auth:
 *   post:
 *     summary: Inicia sesión con correo y contraseña
 *     tags: [Auth - Login]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: miClave123
 *     responses:
 *       302:
 *         description: Redirecciona al dashboard correspondiente según el rol
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *             examples:
 *               admin:
 *                 value: /admin/admin-dashboard.html
 *               comprador:
 *                 value: /private/user-dashboard.html?email=usuario@ejemplo.com
 *       500:
 *         description: Error en el servidor
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Error en el servidor
 */

/**
 * @swagger
 * /registrar:
 *   post:
 *     summary: Registra un nuevo comprador
 *     tags: [Auth - Registro]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *               - correo
 *               - password
 *               - cedula
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario
 *                 example: Pérez
 *               telefono:
 *                 type: string
 *                 description: Teléfono del usuario
 *                 example: +584141234567
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *                 example: juan@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña (mínimo 4 caracteres)
 *                 example: claveSegura
 *               cedula:
 *                 type: string
 *                 description: Cédula de identidad
 *                 example: V12345678
 *               parroquia:
 *                 type: string
 *                 description: ID de la parroquia
 *                 example: 1
 *               calle:
 *                 type: string
 *                 description: Dirección de la calle
 *                 example: Av. Principal
 *     responses:
 *       302:
 *         description: Redirecciona a la página de registro exitoso
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /public/register.html?success=1&nombre=Juan&correo=juan@ejemplo.com
 *       500:
 *         description: Error al crear usuario
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error al crear usuario: La cédula es obligatoria para compradores."
 */

/**
 * @swagger
 * /recuperar-pw:
 *   post:
 *     summary: Envía un enlace de recuperación de contraseña al correo
 *     tags: [Auth - Recuperación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico registrado
 *                 example: usuario@ejemplo.com
 *     responses:
 *       302:
 *         description: Redirecciona indicando éxito en el envío
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /private/password-recovery.html?success=1
 *       404:
 *         description: Correo no encontrado
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               example: "<h2>Correo no encontrado</h2>"
 */

/**
 * @swagger
 * /update-password:
 *   post:
 *     summary: Actualiza la contraseña del usuario
 *     tags: [Auth - Recuperación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newPassword
 *             properties:
 *               userId:
 *                 oneOf:
 *                   - type: string
 *                   - type: integer
 *                 description: ID del usuario
 *                 example: 1
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña (mínimo 4 caracteres)
 *                 example: nuevaClave123
 *     responses:
 *       302:
 *         description: Redirecciona a la página de recuperación
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /private/password-recovery.html
 *       500:
 *         description: Error al actualizar
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Error al actualizar
 */

/**
 * @swagger
 * /guardar-seguridad:
 *   post:
 *     summary: Guarda las preguntas de seguridad del usuario autenticado
 *     tags: [Auth - Seguridad]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             minItems: 1
 *             items:
 *               type: object
 *               required:
 *                 - pregunta
 *                 - resp
 *               properties:
 *                 pregunta:
 *                   type: string
 *                   description: Pregunta de seguridad
 *                   example: ¿Cuál es el nombre de tu primera mascota?
 *                 resp:
 *                   type: string
 *                   description: Respuesta a la pregunta
 *                   example: Firulais
 *     responses:
 *       200:
 *         description: Preguntas guardadas exitosamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Preguntas guardadas con éxito
 *       401:
 *         description: No autenticado
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Debes iniciar sesión para guardar esto.
 *       500:
 *         description: Error al guardar
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Error al guardar: mensaje"
 */

/**
 * @swagger
 * /api/estado-usuario:
 *   get:
 *     summary: Obtiene el estado de autenticación y membresía del usuario
 *     tags: [Auth - Sesión]
 *     responses:
 *       200:
 *         description: Estado del usuario
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 autenticado:
 *                   type: boolean
 *                   example: true
 *                 puedeAdquirir:
 *                   type: boolean
 *                   example: true
 *                 id_usuario:
 *                   type: integer
 *                   example: 1
 *                 rol:
 *                   type: string
 *                   example: comprador
 */

/**
 * @swagger
 * /api/usuario-actual:
 *   get:
 *     summary: Obtiene los datos del usuario autenticado en la sesión actual
 *     tags: [Auth - Sesión]
 *     responses:
 *       200:
 *         description: Datos del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id_usuario:
 *                   type: integer
 *                   example: 1
 *                 Nombre:
 *                   type: string
 *                   example: Juan
 *                 Email:
 *                   type: string
 *                   example: juan@ejemplo.com
 *                 Rol:
 *                   type: string
 *                   example: comprador
 *       401:
 *         description: No autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: No autenticado
 */

/**
 * @swagger
 * /logout:
 *   get:
 *     summary: Cierra la sesión del usuario
 *     tags: [Auth - Sesión]
 *     responses:
 *       302:
 *         description: Redirecciona a la página principal
 *         headers:
 *           Location:
 *             schema:
 *               type: string
 *               example: /
 *       500:
 *         description: Error al cerrar sesión
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: No se pudo cerrar la sesión
 */
