const userService = require('./user_service');
const obraService = require('./obra_service');
const reportService = require('./report_service');
const shippingService = require('./shipping_service');

module.exports = {
    ...userService,
    ...obraService,
    ...reportService,
    ...shippingService
};
