const FavoritosUtils = {
  STORAGE_KEY: 'doart_favoritos',

  get() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  save(ids) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(ids));
  },

  add(id_obra) {
    const ids = this.get();
    if (!ids.includes(id_obra)) {
      ids.push(id_obra);
      this.save(ids);
    }
  },

  remove(id_obra) {
    const ids = this.get().filter(id => id !== id_obra);
    this.save(ids);
  },

  has(id_obra) {
    return this.get().includes(id_obra);
  },

  async syncFromServer() {
    if (typeof UserController === 'undefined') return;
    try {
      const ids = await UserController.getFavoritos();
      if (Array.isArray(ids)) {
        const localIds = this.get();
        const merged = [...new Set([...ids.map(i => (typeof i === 'object' ? i.id_obra : i)), ...localIds])];
        this.save(merged);
        return merged;
      }
    } catch { /* silently fail, keep local data */ }
    return this.get();
  },

  async toggle(id_obra, liked) {
    if (liked) {
      this.add(id_obra);
    } else {
      this.remove(id_obra);
    }
    if (typeof UserController !== 'undefined') {
      try {
        await UserController.toggleFavorito(id_obra, liked);
      } catch { /* server sync failed, keep local state */ }
    }
  },

  syncUI(containerSelector) {
    const ids = this.get();
    const hearts = containerSelector
      ? document.querySelectorAll(`${containerSelector} .heart-icon`)
      : document.querySelectorAll('.heart-icon');
    hearts.forEach(heart => {
      const id = parseInt(heart.dataset.idObra);
      if (ids.includes(id)) {
        heart.classList.add('liked');
      } else {
        heart.classList.remove('liked');
      }
    });
  }
};
