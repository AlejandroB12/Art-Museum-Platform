const express = require('express');
const router = express.Router();
const catalogService = require('../../services/catalog_service');

router.get('/autores', async (req, res) => {
    try {
        const autores = await catalogService.listAutores();
        res.json(autores);
    } catch (err) {
        console.error("Error en /autores:", err);
        res.status(500).json(err);
    }
});

router.get('/obras-filtradas', async (req, res) => {
    try {
        const { genero, artista, orden, page = 1, limit = 12 } = req.query;
        const filter = { estado_obra: 'Disponible' };

        const GENRE_MAP = {
            'Pintura': 'Pintura', 'Escultura': 'Escultura', 'Fotografia': 'Fotografía',
            'Orfebreria': 'Orfebreria', 'Ceramica': 'Ceramica'
        };
        if (genero && genero !== 'all') filter['genero.nombre'] = GENRE_MAP[genero] || genero;
        if (artista && artista !== 'all') filter.autores = parseInt(artista);

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { precio: orden === 'desc' ? -1 : 1 };

        const Obra = require('../../../backend/models/obra_model');
        const Autor = require('../../../backend/models/autor_model');

        const [obras, total, autores] = await Promise.all([
            Obra.find(filter).sort(sort).skip(skip).limit(parseInt(limit)).lean(),
            Obra.countDocuments(filter),
            Autor.find().select('_id nombre apellido fotografia').lean()
        ]);

        // Índice de autores por ID
        const autoresMap = {};
        autores.forEach(a => { autoresMap[a._id] = a; });

        // Mapear con autores resueltos manualmente
        const result = obras.map(obra => {
            const autor = obra.autores?.[0] ? autoresMap[obra.autores[0]] : null;
            return catalogService.mapObraToFrontend({ ...obra, autores: autor ? [autor] : [] });
        });

        res.json({ obras: result, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/autor-detalle/:id', async (req, res) => {
    try {
        const { ordenDate } = req.query;
        const result = await catalogService.getAutorDetalle(req.params.id, ordenDate);
        if (!result) {
            return res.status(404).json({ error: "Autor no encontrado" });
        }
        res.json(result);
    } catch (err) {
        console.error("Error en autor-detalle:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

router.get('/artistas-catalogo', async (req, res) => {
    try {
        const artistas = await catalogService.listArtistasCatalogo();
        res.json(artistas);
    } catch (err) {
        console.error("Error en artistas-catalogo:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

router.get('/obras-destacadas', async (req, res) => {
    try {
        const obras = await catalogService.listObrasDestacadas();
        res.json(obras);
    } catch (err) {
        console.error("Error en obras-destacadas:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
    }
});

router.get('/obra/:id', async (req, res) => {
    try {
        const Obra = require('../../models/obra_model');
        const obra = await Obra.findById(parseInt(req.params.id))
            .populate('autores', 'nombre apellido fotografia')
            .lean();
        if (!obra) return res.status(404).json({ error: 'Obra no encontrada' });
        res.json(obra);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
