const express = require('express');
const router = express.Router();
const { chat } = require('./witcher_service');

router.post('/chat', async (req, res) => {
    try 
    {
        const { mensaje } = req.body;

        if (!mensaje || !mensaje.trim()) 
        {
            return res.status(400).json({ error: 'El mensaje es requerido' });
        }
        
        const respuesta = await chat(mensaje);
        res.json({ respuesta });
    } 
    
    catch (err) 
    {
        console.error('Error en Cortex:', err.message);
        res.status(500).json({ error: 'Error al procesar el mensaje' });
    }
});

module.exports = router;
