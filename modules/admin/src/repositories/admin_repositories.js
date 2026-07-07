const artistaRepository = require('./artista_repository');
const auditRepository = require('./audit_repository');
const billingRepository = require('./billing_repository');
const generoRepository = require('./genero_repository');
const geographyRepository = require('./geography_repository');
const invoiceRepository = require('./invoice_repository');
const membershipRepository = require('./membership_repository');
const nacionalidadRepository = require('./nacionalidad_repository');
const obraRepository = require('./obra_repository');
const userRepository = require('./user_repository');

module.exports = {
  artistaRepository,
  auditRepository,
  billingRepository,
  generoRepository,
  geographyRepository,
  invoiceRepository,
  membershipRepository,
  nacionalidadRepository,
  obraRepository,
  userRepository
};
