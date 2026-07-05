const membershipRepo = require('../repositories/membership_repository');

async function getMembresiaUsuario(idUsuario) {
  const detalles = await membershipRepo.findMembershipDetails(idUsuario);
  const totalRow = detalles.find(d => d.Tipo === 'total');
  if (!totalRow) return null;

  return {
    Concepto: 'Membresía Premium',
    FechaInicio: totalRow.FechaInicio,
    TotalPagado: totalRow.TotalPagado,
    FechaVencimiento: totalRow.FechaVencimiento,
    EstadoPago: totalRow.EstadoPago,
    DiasRestantes: totalRow.DiasRestantes
  };
}

module.exports = { getMembresiaUsuario };
