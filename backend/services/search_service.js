const Obra = require('../models/obra_model');
const Autor = require('../models/autor_model');

async function buscar(q) {
    if (!q || q.length < 2) return [];

    const regex = { $regex: q, $options: 'i' };

    // Autores que coinciden
    const autoresMatch = await Autor.find({
        $or: [{ nombre: regex }, { apellido: regex }]
    }).select('_id').lean();
    const autorIds = autoresMatch.map(a => a._id);

    // Obras por nombre, género o autor
    const filter = {
        estado_obra: 'Disponible',
        $or: [
            { nombre: regex },
            { 'genero.nombre': regex }
        ]
    };
    if (autorIds.length > 0) {
        filter.$or.push({ autores: { $in: autorIds } });
    }

    const obras = await Obra.find(filter).limit(15).lean();

    // Nombres de autores
    const todosIds = obras.flatMap(o => o.autores || []);
    const todosAutores = await Autor.find({ _id: { $in: todosIds } }).select('_id nombre apellido').lean();
    const autorMap = {};
    todosAutores.forEach(a => { autorMap[a._id] = a.nombre + ' ' + a.apellido; });

    return obras.map(o => ({
        id_Obra: o._id,
        Nombre: o.nombre,
        Precio: o.precio,
        imagen_url: o.fotografia || '',
        AutorNombre: (o.autores || []).map(id => autorMap[id] || '').join(', '),
        GeneroNombre: o.genero?.nombre || '',
        id_Autor: o.autores?.[0] || null,
        PrecioFormateado: '$' + Number(o.precio).toLocaleString(),
        tipo: 'exacta'
    }));
}

module.exports = { buscar };