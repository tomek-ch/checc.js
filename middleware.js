const checc = require(".");

function checcMiddleware(field, schema, options) {
  return async (req, res, next) => {
    req.checc = await checc(req[field], schema, options);
    next();
  };
}

module.exports = checcMiddleware;
