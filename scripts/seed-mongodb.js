const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const Autor = require('../backend/models/autor_model');
const Obra = require('../backend/models/obra_model');
const Genero = require('../backend/models/genero_model');
const Nacionalidad = require('../backend/models/nacionalidad_model');
const Especializacion = require('../backend/models/especializacion_model');

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Conectado a MongoDB Atlas');

        const data1 = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'data', 'museo_seed.json'), 'utf-8')
        );

        const data2 = JSON.parse(
            fs.readFileSync(path.join(__dirname, '..', 'data', '1000_obras_seed.json'), 'utf-8')
        );

        const autores = [...data1.autores, ...data2.autores];
        const obras = [...data1.obras, ...data2.obras];

        await Autor.deleteMany({});
        await Obra.deleteMany({});
        await Genero.deleteMany({});
        await Nacionalidad.deleteMany({});
        await Especializacion.deleteMany({});

        const autoresInsert = await Autor.insertMany(autores);
        console.log(`Insertados ${autoresInsert.length} autores`);

        const obrasInsert = await Obra.insertMany(obras);
        console.log(`Insertadas ${obrasInsert.length} obras`);

        const generos = await Genero.insertMany(data1.generos);
        console.log(`Insertados ${generos.length} géneros`);

        const nacionalidades = await Nacionalidad.insertMany(data1.nacionalidades);
        console.log(`Insertadas ${nacionalidades.length} nacionalidades`);

        const especializaciones = await Especializacion.insertMany(data1.especializaciones);
        console.log(`Insertadas ${especializaciones.length} especializaciones`);

        console.log('Seed completado exitosamente');
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('Error en seed:', err);
        process.exit(1);
    }
};

seed();
