const ChatController = {
  async sendMessage(message) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });
    if (!res.ok) throw new Error('Error al enviar mensaje');
    return res.json();
  }
};
