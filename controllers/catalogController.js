const CatalogController = {
  async getFiltered(filters = {}) {
    const params = new URLSearchParams();
    if (filters.genero && filters.genero !== 'all') params.set('genero', filters.genero);
    if (filters.artista && filters.artista !== 'all') params.set('artista', filters.artista);
    params.set('orden', filters.orden || 'desc');
    params.set('pagina', String(filters.pagina || 1));
    params.set('limite', String(filters.limite || 12));
    const res = await fetch(`/api/artworks/filtered?${params}`);
    if (!res.ok) throw new Error('Error al obtener obras filtradas');
    return res.json();
  },

  async getFeatured() {
    const res = await fetch('/api/artworks/featured');
    if (!res.ok) throw new Error('Error al obtener obras destacadas');
    return res.json();
  },

  async search(query) {
    const res = await fetch(`/api/artworks/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Error al buscar obras');
    return res.json();
  },

  async getById(id) {
    const res = await fetch(`/api/artworks/${id}`);
    if (!res.ok) throw new Error('Error al obtener obra');
    return res.json();
  },

  async getArtists() {
    const res = await fetch('/api/artists');
    if (!res.ok) throw new Error('Error al obtener artistas');
    return res.json();
  },

  async getArtistDetail(id, order = 'desc') {
    const res = await fetch(`/api/artists/${id}/detail?orden_fecha=${order}`);
    if (!res.ok) throw new Error('Error al obtener detalle del artista');
    return res.json();
  },

  async getArtistsCatalog() {
    const res = await fetch('/api/artists/catalog');
    if (!res.ok) throw new Error('Error al obtener catálogo de artistas');
    return res.json();
  },

  async getArtistByName(name) {
    const res = await fetch(`/api/artists/by-name/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Error al obtener detalle del artista por nombre');
    return res.json();
  }
};
