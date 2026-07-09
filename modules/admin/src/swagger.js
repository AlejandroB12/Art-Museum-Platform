/**
 * @swagger
 * /registrar-admin:
 *   post:
 *     summary: Registra un nuevo administrador
 *     tags: [Admin - Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - correo
 *               - password
 *               - nombre
 *               - apellido
 *             properties:
 *               correo:
 *                 type: string
 *                 format: email
 *                 example: admin@museo.com
 *               password:
 *                 type: string
 *                 example: claveAdmin123
 *               nombre:
 *                 type: string
 *                 example: Carlos
 *               apellido:
 *                 type: string
 *                 example: Méndez
 *     responses:
 *       302:
 *         description: Redirecciona al login
 *       500:
 *         description: Error en el servidor
 */

/**
 * @swagger
 * /api/todos-los-usuarios:
 *   get:
 *     summary: Lista todos los usuarios del sistema
 *     tags: [Admin - Usuarios]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id_usuario:
 *                     type: integer
 *                   Email:
 *                     type: string
 *                   Rol:
 *                     type: string
 *                   Estatus:
 *                     type: integer
 *                   PuedeAdquirir:
 *                     type: integer
 *                   MembresiaActiva:
 *                     type: integer
 */

/**
 * @swagger
 * /api/usuarios-pendientes:
 *   get:
 *     summary: Lista los usuarios pendientes de aprobación
 *     tags: [Admin - Usuarios]
 *     responses:
 *       200:
 *         description: Usuarios pendientes
 */

/**
 * @swagger
 * /aprobar-usuario/{id}:
 *   patch:
 *     summary: Aprueba un usuario pendiente
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario aprobado
 *       500:
 *         description: Error al aprobar
 */

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Activa o desactiva un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - Estatus
 *             properties:
 *               Estatus:
 *                 type: integer
 *                 enum: [0, 1]
 *                 example: 1
 *     responses:
 *       200:
 *         description: Usuario activado/desactivado
 *   delete:
 *     summary: Elimina un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */

/**
 * @swagger
 * /api/usuarios/{id}/toggle-adquirir:
 *   put:
 *     summary: Habilita o deshabilita la capacidad de compra de un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - PuedeAdquirir
 *             properties:
 *               PuedeAdquirir:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Compra habilitada/deshabilitada
 */

/**
 * @swagger
 * /api/buscar-comprador:
 *   post:
 *     summary: Busca un comprador por email o cédula
 *     tags: [Admin - Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               cedula:
 *                 type: string
 *     responses:
 *       200:
 *         description: Resultado de la búsqueda
 */

/**
 * @swagger
 * /api/solicitudes-pago:
 *   get:
 *     summary: Lista las solicitudes de pago pendientes
 *     tags: [Admin - Membresías]
 *     responses:
 *       200:
 *         description: Solicitudes pendientes
 */

/**
 * @swagger
 * /aprobar-pago:
 *   post:
 *     summary: Aprueba una solicitud de pago de membresía
 *     tags: [Admin - Membresías]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_solicitud
 *               - id_usuario
 *             properties:
 *               id_solicitud:
 *                 type: integer
 *               id_usuario:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Membresía activada
 */

/**
 * @swagger
 * /registrar-nuevo-pago:
 *   post:
 *     summary: Registra un nuevo pago de membresía manualmente
 *     tags: [Admin - Membresías]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *             properties:
 *               id_usuario:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Membresía renovada
 */

/**
 * @swagger
 * /api/obras-admin:
 *   get:
 *     summary: Lista todas las obras (desde MongoDB)
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Lista de obras
 *   post:
 *     summary: Crea una nueva obra
 *     tags: [Admin - Catálogo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *             properties:
 *               nombre:
 *                 type: string
 *               fecha_creacion:
 *                 type: string
 *                 format: date
 *               precio:
 *                 type: number
 *               estado_obra:
 *                 type: string
 *                 enum: [Disponible, Reservado, Vendida]
 *               genero_nombre:
 *                 type: string
 *               autores_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               fotografia_base64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Obra creada
 */

/**
 * @swagger
 * /api/obras-admin/{id}:
 *   put:
 *     summary: Actualiza una obra
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - precio
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: number
 *               estado_obra:
 *                 type: string
 *                 enum: [Disponible, Reservado, Vendida]
 *     responses:
 *       200:
 *         description: Obra actualizada
 *   delete:
 *     summary: Elimina una obra
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Obra eliminada
 */

/**
 * @swagger
 * /api/obras-admin/{id}/detalles:
 *   put:
 *     summary: Actualiza los detalles específicos de una obra (según género)
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               detalles:
 *                 type: object
 *     responses:
 *       200:
 *         description: Detalles actualizados
 */

/**
 * @swagger
 * /api/obras-reservadas:
 *   get:
 *     summary: Lista obras en estado Reservado
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Obras reservadas
 */

/**
 * @swagger
 * /api/obras:
 *   get:
 *     summary: Lista obras desde MySQL
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Lista de obras (MySQL)
 *   put:
 *     summary: Actualiza una obra en MySQL
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Obra actualizada
 *   delete:
 *     summary: Elimina una obra en MySQL
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Obra eliminada
 */

/**
 * @swagger
 * /api/artistas-admin:
 *   get:
 *     summary: Lista todos los artistas
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Lista de artistas
 *   post:
 *     summary: Crea un nuevo artista
 *     tags: [Admin - Catálogo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *               - apellido
 *             properties:
 *               nombre:
 *                 type: string
 *               apellido:
 *                 type: string
 *               nacionalidad:
 *                 type: string
 *               biografia:
 *                 type: string
 *               fotografia_base64:
 *                 type: string
 *     responses:
 *       200:
 *         description: Artista creado
 */

/**
 * @swagger
 * /api/artistas-admin/{id}:
 *   delete:
 *     summary: Elimina un artista
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Artista eliminado
 */

/**
 * @swagger
 * /api/generos:
 *   get:
 *     summary: Lista todos los géneros artísticos
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Lista de géneros
 *   post:
 *     summary: Crea un nuevo género
 *     tags: [Admin - Catálogo]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nombre
 *             properties:
 *               nombre:
 *                 type: string
 *               atributos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nombre:
 *                       type: string
 *                     tipo:
 *                       type: string
 *                       enum: [string, number, boolean]
 *                     requerido:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Género creado
 */

/**
 * @swagger
 * /api/generos/{id}:
 *   put:
 *     summary: Actualiza un género
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Género actualizado
 *   delete:
 *     summary: Elimina un género
 *     tags: [Admin - Catálogo]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Género eliminado
 */

/**
 * @swagger
 * /api/nacionalidades:
 *   get:
 *     summary: Lista las nacionalidades
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Lista de nacionalidades
 */

/**
 * @swagger
 * /api/precargas-atributos:
 *   get:
 *     summary: Retorna los atributos predefinidos por género
 *     tags: [Admin - Catálogo]
 *     responses:
 *       200:
 *         description: Atributos predefinidos
 */

/**
 * @swagger
 * /generar-factura:
 *   post:
 *     summary: Genera una factura por una obra reservada
 *     tags: [Admin - Facturación]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_obra
 *               - precio_neto
 *               - porcentaje_comision
 *             properties:
 *               id_obra:
 *                 type: integer
 *               id_admin:
 *                 type: integer
 *               precio_neto:
 *                 type: number
 *               porcentaje_comision:
 *                 type: number
 *               buyer_nombre:
 *                 type: string
 *               buyer_apellido:
 *                 type: string
 *               buyer_email:
 *                 type: string
 *                 format: email
 *               buyer_cedula:
 *                 type: string
 *     responses:
 *       200:
 *         description: Factura generada
 */

/**
 * @swagger
 * /api/factura/{id}:
 *   get:
 *     summary: Obtiene los datos de una factura
 *     tags: [Admin - Facturación]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Datos de la factura
 */

/**
 * @swagger
 * /api/registrar-envio:
 *   post:
 *     summary: Registra un envío para una factura
 *     tags: [Admin - Envíos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_factura
 *               - municipio
 *               - parroquia
 *               - direccion_detallada
 *             properties:
 *               id_factura:
 *                 type: integer
 *               municipio:
 *                 type: string
 *               parroquia:
 *                 type: string
 *               direccion_detallada:
 *                 type: string
 *               numero_guia:
 *                 type: string
 *     responses:
 *       200:
 *         description: Envío registrado
 */

/**
 * @swagger
 * /consultas/obras-vendidas:
 *   get:
 *     summary: Reporte de obras vendidas en un rango de fechas
 *     tags: [Admin - Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-01-01"
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: Reporte de obras vendidas
 */

/**
 * @swagger
 * /consultas/resumen-facturacion:
 *   get:
 *     summary: Reporte de facturación en un rango de fechas
 *     tags: [Admin - Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumen de facturación
 */

/**
 * @swagger
 * /consultas/resumen-membresias:
 *   get:
 *     summary: Reporte de membresías pagadas en un rango de fechas
 *     tags: [Admin - Reportes]
 *     parameters:
 *       - in: query
 *         name: fecha_inicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: fecha_fin
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Resumen de membresías
 */

/**
 * @swagger
 * /cassandra/obras-vendidas:
 *   get:
 *     summary: Consulta obras vendidas en Cassandra por mes
 *     tags: [Admin - Cassandra]
 *     parameters:
 *       - in: query
 *         name: anio_mes
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *         example: "2024-03"
 *     responses:
 *       200:
 *         description: Datos de Cassandra
 */

/**
 * @swagger
 * /cassandra/obras-vendidas-rango:
 *   get:
 *     summary: Consulta obras vendidas en Cassandra por múltiples meses
 *     tags: [Admin - Cassandra]
 *     parameters:
 *       - in: query
 *         name: meses
 *         required: true
 *         schema:
 *           type: string
 *         example: "2024-01,2024-02,2024-03"
 *     responses:
 *       200:
 *         description: Datos de Cassandra
 */

/**
 * @swagger
 * /cassandra/resumen-facturacion:
 *   get:
 *     summary: Consulta resumen de facturación mensual en Cassandra
 *     tags: [Admin - Cassandra]
 *     parameters:
 *       - in: query
 *         name: anio_mes
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *     responses:
 *       200:
 *         description: Resumen de facturación
 */

/**
 * @swagger
 * /cassandra/bitacora-seguridad:
 *   get:
 *     summary: Consulta la bitácora de seguridad en Cassandra
 *     tags: [Admin - Cassandra]
 *     parameters:
 *       - in: query
 *         name: id_usuario
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipo_evento
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Eventos de seguridad
 */

/**
 * @swagger
 * /api/logs-seguridad:
 *   get:
 *     summary: Obtiene todos los logs de seguridad con nombres de usuario
 *     tags: [Admin - Cassandra]
 *     responses:
 *       200:
 *         description: Logs de seguridad
 */

/**
 * @swagger
 * /cassandra/obras-con-historial:
 *   get:
 *     summary: Lista obras con historial de cambios de estatus
 *     tags: [Admin - Cassandra]
 *     responses:
 *       200:
 *         description: Obras con historial
 */

/**
 * @swagger
 * /cassandra/historial-estatus-obra:
 *   get:
 *     summary: Obtiene el historial de cambios de estatus de una obra
 *     tags: [Admin - Cassandra]
 *     parameters:
 *       - in: query
 *         name: id_obra
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Historial de estatus
 */

/**
 * @swagger
 * /cassandra/registrar-evento-seguridad:
 *   post:
 *     summary: Registra un evento en la bitácora de seguridad
 *     tags: [Admin - Cassandra]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_usuario
 *               - tipo_evento
 *             properties:
 *               id_usuario:
 *                 type: integer
 *               tipo_evento:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       200:
 *         description: Evento registrado
 */

/**
 * @swagger
 * /cassandra/registrar-cambio-estatus:
 *   post:
 *     summary: Registra un cambio de estatus de obra en Cassandra
 *     tags: [Admin - Cassandra]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_obra
 *               - estatus_anterior
 *               - estatus_nuevo
 *             properties:
 *               id_obra:
 *                 type: integer
 *               estatus_anterior:
 *                 type: string
 *               estatus_nuevo:
 *                 type: string
 *               modificado_por:
 *                 type: integer
 *               motivo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cambio registrado
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica el estado del servicio admin
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
 *                   example: admin
 */

/**
 * @swagger
 * /api/eliminar-reservas-usuario/{id}:
 *   delete:
 *     summary: Elimina todas las reservas de un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Reservas eliminadas
 */

/**
 * @swagger
 * /api/eliminar-membresias-usuario/{id}:
 *   delete:
 *     summary: Elimina todas las membresías de un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Membresías eliminadas
 */

/**
 * @swagger
 * /api/eliminar-comprador/{id}:
 *   delete:
 *     summary: Elimina el perfil comprador de un usuario
 *     tags: [Admin - Usuarios]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Comprador eliminado
 */
