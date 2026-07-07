const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
dns.setServers(['1.1.1.1', '8.8.8.8']);

const Artist = require('../modules/catalog/src/models/artist_model');
const Artwork = require('../modules/catalog/src/models/artwork_model');
const Genre = require('../modules/catalog/src/models/genre_model');
const Nationality = require('../modules/catalog/src/models/nationality_model');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB Atlas');

        const basePath = path.join(__dirname, '..', 'data', 'json');
        const data1 = JSON.parse(fs.readFileSync(path.join(basePath, 'museo_seed.json'), 'utf-8'));
        const data2 = JSON.parse(fs.readFileSync(path.join(basePath, '1000_obras_seed.json'), 'utf-8'));

        const artistas = [...data1.autores, ...data2.autores];
        const obras = [...data1.obras, ...data2.obras].map(o => ({
            ...o,
            genero: o.genero ? {
                nombre: o.genero.nombre,
                detalles: o.genero.detalles || o.genero.detallesSchema || {}
            } : undefined
        }));

        await Promise.all([
            Artist.deleteMany({}),
            Artwork.deleteMany({}),
            Genre.deleteMany({}),
            Nationality.deleteMany({})
        ]);
        console.log('Colecciones limpiadas');

        const [artistasInsert, obrasInsert, generosInsert, nacionesInsert] = await Promise.all([
            Artist.insertMany(artistas),
            Artwork.insertMany(obras),
            Genre.insertMany(data1.generos || []),
            Nationality.insertMany(data1.nacionalidades || [])
        ]);

        console.log(`Insertados ${artistasInsert.length} artistas`);
        console.log(`Insertadas ${obrasInsert.length} obras`);
        console.log(`Insertados ${generosInsert.length} géneros`);
        console.log(`Insertadas ${nacionesInsert.length} nacionalidades`);
        console.log('Seed completado exitosamente');

        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error en seed:', err.message);
        process.exit(1);
    }
}

seed();
