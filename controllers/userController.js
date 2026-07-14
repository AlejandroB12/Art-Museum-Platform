const UserController = {
  async getMembershipPrice() {
    const res = await fetch('/api/precio-membresia');
    if (!res.ok) throw new Error('Error al obtener precio de membresía');
    return res.json();
  },

  async getMyMembership() {
    const res = await fetch('/api/membresia-usuario');
    if (!res.ok) throw new Error('Error al obtener membresía');
    return res.json();
  },

  async requestPayment(data) {
    const res = await fetch('/api/solicitar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al solicitar pago');
    return res.json();
  },

  async getMyPurchases() {
    const res = await fetch('/api/mis-compras');
    if (!res.ok) throw new Error('Error al obtener compras');
    return res.json();
  },

  async getShippingPaymentData() {
    const res = await fetch('/api/datos-envio-pago');
    if (!res.ok) throw new Error('Error al obtener datos de envío y pago');
    return res.json();
  },

  async getFavoritos() {
    const res = await fetch('/api/favoritos');
    if (!res.ok) throw new Error('Error al obtener favoritos');
    return res.json();
  },

  async toggleFavorito(id_obra, agregar) {
    const method = agregar ? 'POST' : 'DELETE';
    const res = await fetch('/api/favoritos', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_obra })
    });
    if (!res.ok) throw new Error('Error al actualizar favorito');
    return res.json();
  },

  async getPerfil() {
    const res = await fetch('/api/perfil');
    if (!res.ok) throw new Error('Error al obtener perfil');
    return res.json();
  },

  async updatePerfil(data) {
    const res = await fetch('/api/perfil', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al actualizar perfil');
    return res.json();
  },

  async getTarjeta() {
    const res = await fetch('/api/tarjeta');
    if (!res.ok) throw new Error('Error al obtener tarjeta');
    return res.json();
  },

  async guardarTarjeta(data) {
    const res = await fetch('/api/guardar-tarjeta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al guardar tarjeta');
    return res.json();
  }
};
