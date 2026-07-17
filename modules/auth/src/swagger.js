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
 * /register:
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
 *               - confirmPassword
 *               - cedula
 *             properties:
 *               nombre:
 *                 type: string
 *                 description: Nombre del usuario (solo letras y espacios)
 *                 minLength: 2
 *                 maxLength: 80
 *                 example: Juan
 *               apellido:
 *                 type: string
 *                 description: Apellido del usuario (solo letras y espacios)
 *                 minLength: 2
 *                 maxLength: 80
 *                 example: Pérez
 *               correo:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico
 *                 example: juan@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña (mínimo 12 caracteres, máximo 64)
 *                 minLength: 12
 *                 maxLength: 64
 *                 example: MiClaveSegura2024
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmación de la contraseña
 *                 example: MiClaveSegura2024
 *               cedula:
 *                 type: string
 *                 description: Cédula de identidad (solo dígitos, opcional prefijo V/E)
 *                 example: V12345678
 *               telefono:
 *                 type: string
 *                 description: Teléfono venezolano (opcional)
 *                 example: 04121234567
 *               parroquia:
 *                 type: string
 *                 description: ID de la parroquia (opcional)
 *                 example: 1
 *               calle:
 *                 type: string
 *                 description: Dirección de la calle (opcional)
 *                 example: Av. Principal
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id_usuario:
 *                   type: integer
 *                   example: 1
 *                 nombre:
 *                   type: string
 *                   example: Juan
 *                 correo:
 *                   type: string
 *                   example: juan@ejemplo.com
 *       400:
 *         description: Error de validación (Zod)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         example: Las contraseñas no coinciden
 *                       path:
 *                         type: array
 *                         items:
 *                           type: string
 *                           example: confirmPassword
 *       409:
 *         description: Conflicto (correo o cédula ya existen)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: El correo electrónico ya está registrado
 */

/**
 * @swagger
 * /login:
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: usuario@ejemplo.com
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *                 example: MiClaveSegura2024
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id_usuario:
 *                   type: integer
 *                   example: 1
 *                 nombre:
 *                   type: string
 *                   example: Juan
 *                 email:
 *                   type: string
 *                   example: juan@ejemplo.com
 *                 rol:
 *                   type: string
 *                   example: comprador
 *       400:
 *         description: Error de validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       message:
 *                         type: string
 *                         example: El correo es requerido
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Credenciales inválidas
 *       403:
 *         description: Cuenta inactiva
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: La cuenta no está activa
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
 *     summary: Actualiza la contraseña del usuario autenticado
 *     tags: [Auth - Recuperación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *             properties:
 *               userId:
 *                 oneOf:
 *                   - type: string
 *                   - type: integer
 *                 description: ID del usuario
 *                 example: 1
 *               currentPassword:
 *                 type: string
 *                 description: Contraseña actual del usuario
 *                 example: MiViejaClave123
 *               newPassword:
 *                 type: string
 *                 description: Nueva contraseña (mínimo 12 caracteres, máximo 64)
 *                 minLength: 12
 *                 maxLength: 64
 *                 example: MiNuevaClave456
 *               confirmNewPassword:
 *                 type: string
 *                 description: Confirmación de la nueva contraseña
 *                 example: MiNuevaClave456
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Contraseña actualizada exitosamente
 *       400:
 *         description: Error de validación o contraseña actual incorrecta
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   oneOf:
 *                     - type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           message:
 *                             type: string
 *                             example: Las contraseñas nuevas no coinciden
 *                     - type: string
 *                       example: La contraseña actual no es correcta
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Usuario no encontrado
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
 *   post:
 *     summary: Cierra la sesión del usuario
 *     tags: [Auth - Sesión]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Error al cerrar sesión
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: No se pudo cerrar la sesión
 */
