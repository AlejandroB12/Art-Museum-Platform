const { client } = require('../../config/database');

async function findObrasVendidasPorMes(anio_mes) {
    const result = await client.execute(
        'SELECT * FROM obras_vendidas_por_periodo WHERE anio_mes = ?', [anio_mes]
    );
    return result.rows;
}

async function findResumenFacturacion(anio_mes) {
    if (anio_mes) {
        const result = await client.execute(
            'SELECT * FROM resumen_facturacion_mensual WHERE anio_mes = ?', [anio_mes]
        );
        return result.rows;
    }
    const result = await client.execute('SELECT * FROM resumen_facturacion_mensual');
    return result.rows;
}

module.exports = { findObrasVendidasPorMes, findResumenFacturacion };
