const Log = require('../models/Log');

module.exports = async function actionLogger(req, res, next) {
  // Attach a helper to req to be able to log later in controllers
  req.logAction = async (action, meta = {}) => {
    try {
      await Log.create({ user: req.user ? req.user.id : null, action, meta, ip: req.ip });
    } catch (err) {
      console.error('Log error', err.message);
    }
  };
  next();
};
