const RecommendationsController = {
  async getFeatured() {
    const res = await fetch('/api/recomendaciones/obras-destacadas');
    if (!res.ok) throw new Error('Error al obtener obras destacadas');
    return res.json();
  },

  async getBySimilarity(obraId) {
    const res = await fetch(`/api/recomendaciones/por-similitud-ia/${obraId}`);
    if (!res.ok) throw new Error('Error al obtener recomendaciones por similitud');
    return res.json();
  },

  async getByGenre(genero) {
    const res = await fetch(`/api/recomendaciones/obras-por-genero/${encodeURIComponent(genero)}`);
    if (!res.ok) throw new Error('Error al obtener obras por género');
    return res.json();
  },

  async getSameGenre(userId) {
    const res = await fetch(`/api/recomendaciones/mismo-genero/${userId}`);
    if (!res.ok) throw new Error('Error al obtener recomendaciones del mismo género');
    return res.json();
  },

  async getCollaborative(userId) {
    const res = await fetch(`/api/recomendaciones/colaborativo/${userId}`);
    if (!res.ok) throw new Error('Error al obtener recomendaciones colaborativas');
    return res.json();
  },

  async getForYou(userId) {
    const res = await fetch(`/api/recomendaciones/para-ti/${userId}`);
    if (!res.ok) throw new Error('Error al obtener recomendaciones personalizadas');
    return res.json();
  },

  async getPopularArtists() {
    const res = await fetch('/api/recomendaciones/artistas-populares');
    if (!res.ok) throw new Error('Error al obtener artistas populares');
    return res.json();
  },

  async getPopularGenres() {
    const res = await fetch('/api/recomendaciones/generos-populares');
    if (!res.ok) throw new Error('Error al obtener géneros populares');
    return res.json();
  },

  async registerActivity(data) {
    const res = await fetch('/api/actividad/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getGraphStats() {
    const res = await fetch('/api/grafo/estadisticas');
    if (!res.ok) throw new Error('Error al obtener estadísticas del grafo');
    return res.json();
  },

  async guestLogin() {
    const res = await fetch('/api/auth/guest-login');
    if (!res.ok) throw new Error('Error al crear sesión de invitado');
    return res.json();
  }
};
