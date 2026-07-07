/**
 * @swagger
 * /api/precio-membresia:
 *   get:
 *     summary: Retorna la configuración de precios de membresía
 *     tags: [Usuario - Membresía]
 *     responses:
 *       200:
 *         description: Configuración de membresía
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 precio:
 *                   type: number
 *                   example: 10
 *                 moneda:
 *                   type: string
 *                   example: USD
 *                 concepto:
 *                   type: string
 *                   example: Suscripción Digital
 */

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

/**
 * @swagger
 * /api/solicitar-pago:
 *   post:
 *     summary: Envía una solicitud de pago de membresía
 *     tags: [Usuario - Membresía]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *                 description: Monto a pagar
 *                 example: 10
 *     responses:
 *       200:
 *         description: Solicitud enviada exitosamente
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Solicitud enviada
 *       401:
 *         description: No autorizado
 */

/**
 * @swagger
 * /api/mis-compras:
 *   get:
 *     summary: Retorna el historial de compras del usuario autenticado
 *     tags: [Usuario - Compras]
 *     responses:
 *       200:
 *         description: Historial de compras y reservas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   Nombre:
 *                     type: string
 *                     description: Nombre de la obra
 *                   Precio:
 *                     type: number
 *                   Fecha_emision:
 *                     type: string
 *                     format: date
 *                   Genero:
 *                     type: string
 *                   Estado:
 *                     type: string
 *                     enum: [Pagado, Reservado]
 *       401:
 *         description: Sesión no válida
 */

/**
 * @swagger
 * /api/datos-envio-pago:
 *   get:
 *     summary: Retorna los datos de envío y pago del usuario autenticado
 *     tags: [Usuario - Envío/Pago]
 *     responses:
 *       200:
 *         description: Datos de envío y pago
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 *               properties:
 *                 Nombre:
 *                   type: string
 *                 Apellido:
 *                   type: string
 *                 Calle:
 *                   type: string
 *                   nullable: true
 *                 Parroquia:
 *                   type: string
 *                   nullable: true
 *                 Municipio:
 *                   type: string
 *                   nullable: true
 *       401:
 *         description: No iniciado
 */
