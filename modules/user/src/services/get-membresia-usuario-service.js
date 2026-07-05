const membershipRepo = require('../repositories/membership_repository');

async function getMembresiaUsuario(userId) {
    const membresia = await membershipRepo.findMembershipDetails(userId);
    const solicitudes = await membershipRepo.findPendingRequests(userId);
    const raw = [...solicitudes, ...membresia];
    return raw.map(p => {
        let estadoColor = '#ff0000';
        let estiloFila = '';
        let diasLabel = '-';

        if (p.Tipo === 'solicitud') {
            if (p.EstadoPago === 'Pendiente') estadoColor = '#ffaa00';
            else if (p.EstadoPago === 'Aprobado') estadoColor = '#00ff00';
        } else if (p.Tipo === 'total') {
            estiloFila = 'font-weight: bold; border-top: 2px solid #333;';
            estadoColor = p.EstadoPago === 'Activa' ? '#00ff00' : '#ff0000';
            diasLabel = (p.DiasRestantes > 0 ? p.DiasRestantes : 0) + ' días';
        } else if (p.Tipo === 'detalle') {
            estadoColor = '#00ff00';
            diasLabel = p.DiasRestantes + ' días';
        }

        return { ...p, estadoColor, estiloFila, diasLabel };
    });
}

module.exports = { getMembresiaUsuario };
