const http = require('http');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = 'minimax-m3:cloud';

const SYSTEM_PROMPT = `Eres un asistente experto del Museo de Arte Contemporáneo llamado DoArt Magic.
Ayudas a los visitantes con información sobre obras, artistas, géneros, membresías y la colección del museo.
Sé amable, conciso y responde siempre en español.`;

async function chat(mensaje) 
{
    const url = new URL('/api/chat', OLLAMA_HOST);

    const body = JSON.stringify({
        model: MODEL,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: mensaje }
        ],
        stream: false
    });

    return new Promise((resolve, reject) => {
        
        const req = http.request(url, {

            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }

        }, (res) => {

            let data = '';

            res.on('data', chunk => data += chunk);
            res.on('end', () => {

                try 
                {
                    const parsed = JSON.parse(data);
                    resolve(parsed.message?.content || 'Sin respuesta.');
                } catch {
                    reject(new Error('Error al procesar respuesta de Ollama'));
                }
            });
        });
        
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

module.exports = { chat };
