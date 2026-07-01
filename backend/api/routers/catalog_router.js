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
        const { genero, artista, orden } = req.query;
        const obras = await catalogService.listObrasFiltradas(genero, artista, orden);
        res.json(obras);
    } catch (err) {
        console.error("Error en obras-filtradas:", err);
        res.status(500).json({ error: "Error en la base de datos", detalles: err });
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

module.exports = router;
