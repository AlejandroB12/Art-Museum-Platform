// Función para formatear el precio de una obra, agregando el símbolo de moneda y asegurando dos decimales.
function formatPrice(price) 
{
    if (price == null) return null;
    return Number(price).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
}

// Función para mapear una obra a un formato adecuado para el frontend, incluyendo información del artista y del género.
function mapObraToFrontend(obra) 
{
    const detalles = obra.genero && obra.genero.detalles ? obra.genero.detalles : {};
    const artista = obra.artista || null;

    const BASE_KEYS = ['id_obra', 'nombre', 'fecha_creacion', 'precio_formateado', 'estatus',
        'fotografia', 'artista_nombre', 'artista_apellido', 'genero_nombre',
        'id_artista', 'artista_fotografia'];

    return {
        id_obra: obra._id,
        nombre: obra.nombre,
        fecha_creacion: obra.fecha_creacion ? obra.fecha_creacion.toISOString().split('T')[0] : null,
        precio_formateado: formatPrice(obra.precio),
        estatus: obra.estatus,
        fotografia: obra.fotografia,
        artista_nombre: artista ? artista.nombre : null,
        artista_apellido: artista ? artista.apellido : null,
        genero_nombre: obra.genero ? obra.genero.nombre : null,
        id_artista: artista ? artista._id : null,
        artista_fotografia: artista ? artista.fotografia : null,
        ...Object.fromEntries(
            Object.entries(detalles).filter(([key]) => !BASE_KEYS.includes(key))
        )
    };
}

// Función para mapear los detalles de una obra, incluyendo información del género.
function mapObraDetailToFrontend(obra) 
{
    const detalles = obra.genero && obra.genero.detalles ? obra.genero.detalles : {};

    const BASE_KEYS = ['id_obra', 'nombre', 'fecha_creacion', 'precio_formateado', 'estatus',
        'fotografia', 'genero_nombre'];

    return {
        id_obra: obra._id,
        nombre: obra.nombre,
        fecha_creacion: obra.fecha_creacion ? obra.fecha_creacion.toISOString().split('T')[0] : null,
        precio_formateado: formatPrice(obra.precio),
        estatus: obra.estatus,
        fotografia: obra.fotografia || null,
        genero_nombre: obra.genero ? obra.genero.nombre : null,
        ...Object.fromEntries(
            Object.entries(detalles).filter(([key]) => !BASE_KEYS.includes(key))
        )
    };
}

// Función para mapear los resultados de búsqueda, incluyendo el nombre del artista.
function mapSearchResult(obra, nombreArtista) 
{
    return {

        id_obra: obra._id,
        nombre: obra.nombre,
        precio_formateado: formatPrice(obra.precio),
        fotografia: obra.fotografia || '',
        artista_nombre: nombreArtista || '',
        genero_nombre: obra.genero?.nombre || '',
        id_artista: obra.artista || null,
        tipo: 'exacta'
    };
}

module.exports = { formatPrice, mapObraToFrontend, mapObraDetailToFrontend, mapSearchResult };
