const AuthController = {
  async checkSession() {
    const res = await fetch('/api/estado-usuario');
    if (!res.ok) throw new Error('Error al verificar sesión');
    return res.json();
  },

  async getCurrentUser() {
    const res = await fetch('/api/usuario-actual');
    if (!res.ok) throw new Error('Error al obtener usuario actual');
    return res.json();
  },

  async login(credentials) {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return res.json();
  },

  async register(data) {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async saveSecurityQuestions(data) {
    const res = await fetch('/guardar-seguridad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async recoverPassword(email) {
    const res = await fetch('/recuperar-pw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  async updatePassword(data) {
    const res = await fetch('/update-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async logout() {
    const res = await fetch('/logout', { method: 'POST' });
    if (!res.ok) throw new Error('Error al cerrar sesión');
    return res.json();
  },

  async logoutUser(event) {
    if (event) event.preventDefault();
    localStorage.clear();
    sessionStorage.clear();
    try { await this.logout(); } catch {}
    window.location.href = '/';
  }
};
