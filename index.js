var WAAConnector = require('./lib/WAAConnector')
module.exports = WAAConnector
if (typeof window !== 'undefined') window.WAAConnector = WAAConnector