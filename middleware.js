const checc = require(".");
const { config } = require("./setup");

function checcMiddleware(field, schema, options) {
  return async (req, res, next) => {
    // Make sure not to overwrite the results of previous validations
    if (!req.checc) {
      req.checc = {};
    }

    config({
      customCtx: { req, res, next },
    });

    req.checc[field] = await checc(req[field], schema, options);
    next();
  };
}

module.exports = checcMiddleware;
