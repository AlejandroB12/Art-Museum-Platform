const express = require('express');
const router = express.Router();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// 1. Obtener autores para los filtros del catálogo
router.get('/autores', (req, res) => {
    db.query('SELECT id_Autor, Nombre, Apellido FROM Autor', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. Obtener obras filtradas para el catálogo principal
router.get('/obras-filtradas', (req, res) => {
    const { genero, artista, orden } = req.query;
    
    let sql = `
        SELECT
            o.id_Obra,
            o.Nombre,
            o.Fecha_creacion,
            o.Precio,
            o.Estado_obra,
            o.Fotografia as imagen_url,
            a.Nombre as AutorNombre, 
            a.Apellido as AutorApellido, 
            g.Nombre as GeneroNombre, 
            a.id_Autor,
            a.Fotografia as autor_foto_url,
            -- Pintura
            p.Tecnica_Principal,
            p.Soporte_Base,
            p.Requiere_Enmarcado,
            -- Escultura
            e.Material_Predominante,
            e.Requiere_Pedestal,
            e.Clasificacion_Espacio,
            -- Fotografia
            f.Formato_Origen,
            f.Tipo_Impresion_Estandar,
            f.Requiere_Revelado_Quimico,
            -- Orfebreria
            oo.Metal_Base_Dominante,
            oo.Kilataje_Estandar,
            oo.Requeres_Certificado_Autenticidad,
            -- Ceramica
            c.Tecnica_Acabado,
            c.Tipo_Arcilla_Base,
            c.Temperatura_Coccion_Promedio_Celsius
        FROM Obra o
        INNER JOIN Obra_autor oa ON o.id_Obra = oa.id_Obra
        INNER JOIN Autor a ON oa.id_Autor = a.id_Autor
        INNER JOIN Genero g ON o.id_Genero = g.id_Genero
        LEFT JOIN Pintura p ON o.id_Obra = p.id_Obra
        LEFT JOIN Escultura e ON o.id_Obra = e.id_Obra
        LEFT JOIN Fotografia f ON o.id_Obra = f.id_Obra
        LEFT JOIN Orfebreria oo ON o.id_Obra = oo.id_Obra
        LEFT JOIN Ceramica c ON o.id_Obra = c.id_Obra
        WHERE o.Estado_obra = 'Disponible'
    `;

    if (genero && genero !== 'all') sql += ` AND g.Nombre = ${db.escape(genero)}`;
    if (artista && artista !== 'all') sql += ` AND a.id_Autor = ${db.escape(artista)}`;
    
    sql += (orden === 'desc') ? " ORDER BY o.Precio DESC" : " ORDER BY o.Precio ASC";

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error en consulta de catálogo:", err);
            return res.status(500).json({ error: "Error en la base de datos", detalles: err });
        }

        res.json(results);
    });
});


// 3. Detalle de Autor (Perfil individual con obras detalladas)
router.get('/autor-detalle/:id', (req, res) => {
    const id = req.params.id;
    const { ordenDate } = req.query;

       const sqlAutor = `
        SELECT a.*, n.Descripcion as NacionalidadDesc 
        FROM Autor a
        LEFT JOIN Nacionalidad n ON a.id_Nacionalidad = n.id_Nacionalidad
        WHERE a.id_Autor = ?
    `;

    let sqlObras = `
        SELECT 
            o.id_Obra,
            o.Nombre,
            o.Fecha_creacion,
            o.Precio,
            o.Estado_obra,
            o.Fotografia as imagen,
            g.Nombre as GeneroNombre,
            p.Tecnica_Principal,
            p.Soporte_Base,
            e.Material_Predominante,
            e.Requiere_Pedestal,
            f.Formato_Origen,
            oo.Metal_Base_Dominante,
            oo.Kilataje_Estandar,
            c.Tecnica_Acabado,
            c.Tipo_Arcilla_Base
        FROM Obra o 
        INNER JOIN Obra_autor oa ON o.id_Obra = oa.id_Obra 
        INNER JOIN Genero g ON o.id_Genero = g.id_Genero
        LEFT JOIN Pintura p ON o.id_Obra = p.id_Obra
        LEFT JOIN Escultura e ON o.id_Obra = e.id_Obra
        LEFT JOIN Fotografia f ON o.id_Obra = f.id_Obra
        LEFT JOIN Orfebreria oo ON o.id_Obra = oo.id_Obra
        LEFT JOIN Ceramica c ON o.id_Obra = c.id_Obra
        WHERE oa.id_Autor = ? AND o.Estado_obra = 'Disponible'
    `;

    sqlObras += (ordenDate === 'asc') ? " ORDER BY o.Fecha_creacion ASC" : " ORDER BY o.Fecha_creacion DESC";

    db.query(sqlAutor, [id], (err, autorRes) => {
        if (err) {
            console.error("Error al obtener autor:", err);
            return res.status(500).json({ error: "Error en la base de datos", detalles: err });
        }
        
        if (autorRes.length === 0) {
            return res.status(404).json({ error: "Autor no encontrado" });
        }
        
        const autor = autorRes[0];
        
        // Cargar imagen del autor desde assets/images/authors/
        let autorImagenBase64 = null;
        if (autor.Fotografia && autor.Fotografia !== 'NULL' && autor.Fotografia !== '') {
            const rutaImagen = path.join(__dirname, '..', 'assets', 'images', 'authors', path.basename(autor.Fotografia));
            console.log(`Buscando imagen del autor en: ${rutaImagen}`);
            
            if (fs.existsSync(rutaImagen)) {
                try {
                    const imageBuffer = fs.readFileSync(rutaImagen);
                    autorImagenBase64 = imageBuffer.toString('base64');
                    console.log(`✅ Imagen del autor cargada: ${autor.Nombre} ${autor.Apellido}`);
                } catch (err) {
                    console.error("Error leyendo imagen del autor:", err);
                }
            } else {
                console.log(`❌ No se encontró la imagen del autor: ${rutaImagen}`);
            }
        }
        autor.Fotografia = autorImagenBase64;
        
        db.query(sqlObras, [id], (err, obrasRes) => {
            if (err) {
                console.error("Error al obtener obras:", err);
                return res.status(500).json({ error: "Error en la base de datos", detalles: err });
            }
            
            // Convertir imágenes de las obras a base64 desde assets/images/art_previews/
            obrasRes.forEach(obra => {
                if (obra.imagen && obra.imagen !== 'NULL' && obra.imagen !== '') {
                    const rutaImagen = path.join(__dirname, '..', 'assets', 'images', 'art_previews', path.basename(obra.imagen));
                    if (fs.existsSync(rutaImagen)) {
                        try {
                            const imageBuffer = fs.readFileSync(rutaImagen);
                            obra.imagen = imageBuffer.toString('base64');
                        } catch (err) {
                            console.error("Error leyendo imagen de obra:", err);
                            obra.imagen = null;
                        }
                    } else {
                        obra.imagen = null;
                    }
                } else {
                    obra.imagen = null;
                }
            });

            res.json({ autor: autor, obras: obrasRes });
        });
    });
});

// 4. Agregar rutas de autenticación
router.get('/estado-usuario', (req, res) => {
    res.json({ autenticado: !!req.session.usuario });
});

router.get('/usuario-actual', (req, res) => {
    if (req.session.usuario) {
        res.json(req.session.usuario);
    } else {
        res.status(401).json({ error: "No autenticado" });
    }
});


// 5. Catálogo general de artistas
router.get('/artistas-catalogo', (req, res) => {
    console.log("=== SOLICITUD A /artistas-catalogo ===");
    
    const query = `
        SELECT 
            a.id_Autor, 
            a.Nombre, 
            a.Apellido, 
            a.Fecha_nacimiento, 
            a.Fotografia as foto_url,
            a.Biografia,
            n.Descripcion as Nacionalidad,
            GROUP_CONCAT(DISTINCT g.Nombre SEPARATOR ', ') AS Especialidades
        FROM Autor a
        LEFT JOIN Nacionalidad n ON a.id_Nacionalidad = n.id_Nacionalidad
        LEFT JOIN Obra_autor oa ON a.id_Autor = oa.id_Autor
        LEFT JOIN Obra o ON oa.id_Obra = o.id_Obra
        LEFT JOIN Genero g ON o.id_Genero = g.id_Genero
        GROUP BY a.id_Autor, n.Descripcion
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error("Error en query:", err);
            return res.status(500).json({ error: "Error en la base de datos", detalles: err });
        }

        console.log(`Se encontraron ${results.length} artistas en la BD`);

        const processedResults = results.map(artista => {
            let imagenBase64 = null;
            
            // RUTAS CORREGIDAS - verifica dónde están realmente tus imágenes
            if (artista.foto_url && artista.foto_url !== 'NULL' && artista.foto_url !== '') {
                try {
                    // Opción 1: Si la foto_url es solo el nombre del archivo
                    let rutasPosibles = [
                        path.join(__dirname, '..', 'public', 'Estilos', 'Imagenes', path.basename(artista.foto_url)),
                        path.join(__dirname, '..', 'assets', 'images', 'authors', path.basename(artista.foto_url)),
                        path.join(__dirname, '..', 'uploads', 'autores', path.basename(artista.foto_url)),
                        artista.foto_url // Si es ruta absoluta
                    ];
                    
                    let imagenEncontrada = false;
                    for (let rutaImagen of rutasPosibles) {
                        if (fs.existsSync(rutaImagen)) {
                            console.log(`✅ Imagen encontrada en: ${rutaImagen}`);
                            const imageBuffer = fs.readFileSync(rutaImagen);
                            imagenBase64 = imageBuffer.toString('base64');
                            imagenEncontrada = true;
                            break;
                        }
                    }
                    
                    if (!imagenEncontrada) {
                        console.log(`❌ Imagen no encontrada para: ${artista.Nombre} ${artista.Apellido}`);
                        console.log(`Rutas buscadas:`, rutasPosibles);
                    }
                } catch (err) {
                    console.error(`Error leyendo imagen:`, err.message);
                }
            }
            
            return {
                id_Autor: artista.id_Autor,
                Nombre: artista.Nombre,
                Apellido: artista.Apellido,
                Fecha_nacimiento: artista.Fecha_nacimiento,
                Fotografia: imagenBase64,
                Especialidades: artista.Especialidades || 'Sin especialidades',
                Nacionalidad: artista.Nacionalidad || 'Nacionalidad no especificada',
                Biografia: artista.Biografia || ''
            };
        });
        
        res.json(processedResults);
    });
});

module.exports = router;