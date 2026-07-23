const AdminController = {
  // ============================================================
  // USUARIOS
  // ============================================================
  async getAllUsers(page = 1, limit = 10) {
    const res = await fetch(`/api/todos-los-usuarios?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener usuarios');
    return res.json();
  },

  async getPendingUsers(page = 1, limit = 10) {
    const res = await fetch(`/api/usuarios-pendientes?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener usuarios pendientes');
    return res.json();
  },

  async approveUser(id) {
    const res = await fetch(`/aprobar-usuario/${id}`, { method: 'PATCH' });
    if (!res.ok) throw new Error('Error al aprobar usuario');
    return res.json();
  },

  async toggleUserStatus(id, estatus) {
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      ...(estatus !== undefined ? { body: JSON.stringify({ Estatus: estatus }) } : {})
    });
    if (!res.ok) throw new Error('Error al cambiar estado del usuario');
    return res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar usuario');
    return res.json();
  },

  async deleteUserReservations(id) {
    const res = await fetch(`/api/eliminar-reservas-usuario/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar reservas');
    return res.json();
  },

  async deleteUserMemberships(id) {
    const res = await fetch(`/api/eliminar-membresias-usuario/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar membresías');
    return res.json();
  },

  async deleteBuyer(id) {
    const res = await fetch(`/api/eliminar-comprador/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar comprador');
    return res.json();
  },

  async searchBuyer(data) {
    const res = await fetch('/api/buscar-comprador', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al buscar comprador');
    return res.json();
  },

  async getPendingPayments(page = 1, limit = 10) {
    const res = await fetch(`/api/solicitudes-pago?page=${page}&limit=${limit}`);
    if (!res.ok) throw new Error('Error al obtener solicitudes de pago');
    return res.json();
  },

  async approvePayment(data) {
    const res = await fetch('/aprobar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al aprobar pago');
    return res.json();
  },

  async registerNewPayment(data) {
    const res = await fetch('/registrar-nuevo-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al registrar pago');
    return res.json();
  },

  // ============================================================
  // OBRAS (Admin CRUD)
  // ============================================================
  async getArtworks() {
    const res = await fetch('/api/obras-admin');
    if (!res.ok) throw new Error('Error al obtener obras');
    return res.json();
  },

  async createArtwork(data) {
    const res = await fetch('/api/obras-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al crear obra');
    return res.json();
  },

  async updateArtwork(id, data) {
    const res = await fetch(`/api/obras-admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar obra');
    return res.json();
  },

  async deleteArtwork(id) {
    const res = await fetch(`/api/obras-admin/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar obra');
    return res.json();
  },

  async getReservedArtworks() {
    const res = await fetch('/api/obras-reservadas');
    if (!res.ok) throw new Error('Error al obtener obras reservadas');
    return res.json();
  },

  // ============================================================
  // GÉNEROS
  // ============================================================
  async getGenres() {
    const res = await fetch('/api/generos');
    if (!res.ok) throw new Error('Error al obtener géneros');
    return res.json();
  },

  async createGenre(data) {
    const res = await fetch('/api/generos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al crear género');
    return res.json();
  },

  async updateGenre(id, data) {
    const res = await fetch(`/api/generos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar género');
    return res.json();
  },

  async deleteGenre(id) {
    const res = await fetch(`/api/generos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar género');
    return res.json();
  },

  // ============================================================
  // AUTORES
  // ============================================================
  async getAuthors() {
    const res = await fetch('/api/artistas-admin');
    if (!res.ok) throw new Error('Error al obtener artistas');
    return res.json();
  },

  async createAuthor(data) {
    const res = await fetch('/api/artistas-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al crear artista');
    return res.json();
  },

  async deleteAuthor(id) {
    const res = await fetch(`/api/artistas-admin/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error al eliminar artista');
    return res.json();
  },

  // ============================================================
  // REPORTES
  // ============================================================
  async getSoldArtworks(fechaInicio, fechaFin) {
    const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    const res = await fetch(`/consultas/obras-vendidas?${params}`);
    if (!res.ok) throw new Error('Error al obtener obras vendidas');
    return res.json();
  },

  async getBillingSummary(fechaInicio, fechaFin) {
    const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    const res = await fetch(`/consultas/resumen-facturacion?${params}`);
    if (!res.ok) throw new Error('Error al obtener resumen de facturación');
    return res.json();
  },

  async getMembershipSummary(fechaInicio, fechaFin) {
    const params = new URLSearchParams({ fecha_inicio: fechaInicio, fecha_fin: fechaFin });
    const res = await fetch(`/consultas/resumen-membresias?${params}`);
    if (!res.ok) throw new Error('Error al obtener resumen de membresías');
    return res.json();
  },

  // ============================================================
  // FACTURAS
  // ============================================================
  async generateInvoice(data) {
    const res = await fetch('/generar-factura', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al generar factura');
    return res.json();
  },

  async getInvoice(id) {
    const res = await fetch(`/api/factura/${id}`);
    if (!res.ok) throw new Error('Error al obtener factura');
    return res.json();
  },

  // ============================================================
  // ENVÍO
  // ============================================================
  async registerShipping(data) {
    const res = await fetch('/api/registrar-envio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al registrar envío');
    return res.json();
  },

  // ============================================================
  // SEGURIDAD / LOGS
  // ============================================================
  async getSecurityLogs() {
    const res = await fetch('/api/logs-seguridad');
    if (!res.ok) throw new Error('Error al obtener logs de seguridad');
    return res.json();
  },

  // ============================================================
  // CASSANDRA (Historial)
  // ============================================================
  async getArtworksWithHistory() {
    const res = await fetch('/cassandra/obras-con-historial');
    if (!res.ok) throw new Error('Error al obtener obras con historial');
    return res.json();
  },

  async getArtworkStatusHistory(id) {
    const res = await fetch(`/cassandra/historial-estatus-obra?id_obra=${id}`);
    if (!res.ok) throw new Error('Error al obtener historial de estatus');
    return res.json();
  },

  // ============================================================
  // ATRIBUTOS PRECARGADOS
  // ============================================================
  async getPreloadedAttributes() {
    const res = await fetch('/api/precargas-atributos');
    if (!res.ok) throw new Error('Error al obtener atributos precargados');
    return res.json();
  },

  // ============================================================
  // NACIONALIDADES
  // ============================================================
  async getNationalities() {
    const res = await fetch('/api/nacionalidades');
    if (!res.ok) throw new Error('Error al obtener nacionalidades');
    return res.json();
  }
};
