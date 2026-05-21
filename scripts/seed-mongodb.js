const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const Autor = require('../models/Autor');
const Obra = require('../models/Obra');
const Genero = require('../models/Genero');
const Nacionalidad = require('../models/Nacionalidad');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB Atlas');

        const data = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'data', 'museo_seed.json'), 'utf-8')
        );

        await Autor.deleteMany({});
        await Obra.deleteMany({});
        await Genero.deleteMany({});
        await Nacionalidad.deleteMany({});

        const autores = await Autor.insertMany(data.autores);
        console.log(`Insertados ${autores.length} autores`);

        const obras = await Obra.insertMany(data.obras);
        console.log(`Insertadas ${obras.length} obras`);

        const generos = await Genero.insertMany(data.generos);
        console.log(`Insertados ${generos.length} géneros`);

        const nacionalidades = await Nacionalidad.insertMany(data.nacionalidades);
        console.log(`Insertadas ${nacionalidades.length} nacionalidades`);

        console.log('Seed completado exitosamente');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error en seed:', err);
        process.exit(1);
    }
};

seed();
