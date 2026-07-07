const CheckoutController = {
  async confirmReservation(data) {
    const res = await fetch('/confirmar-reserva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Error al confirmar reserva');
    return res.json();
  },

  async getEstados() {
    const res = await fetch('/api/estados');
    if (!res.ok) throw new Error('Error al obtener estados');
    return res.json();
  },

  async getMunicipios(idEstado) {
    const res = await fetch(`/api/municipios/${idEstado}`);
    if (!res.ok) throw new Error('Error al obtener municipios');
    return res.json();
  },

  async getParroquias(idMunicipio) {
    const res = await fetch(`/api/parroquias/${idMunicipio}`);
    if (!res.ok) throw new Error('Error al obtener parroquias');
    return res.json();
  }
};
