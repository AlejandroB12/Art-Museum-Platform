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
    const res = await fetch('/solicitar-pago', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al solicitar pago');
    return res.json();
  },

  async getMyPurchases() {
    const res = await fetch('/mis-compras');
    if (!res.ok) throw new Error('Error al obtener compras');
    return res.json();
  },

  async getShippingPaymentData() {
    const res = await fetch('/api/datos-envio-pago');
    if (!res.ok) throw new Error('Error al obtener datos de envío y pago');
    return res.json();
  }
};
