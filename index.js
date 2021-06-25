const { validators, getValidatorContext, getErrors } = require("./setup");

async function checc(data, checks) {
  // Get every field that was submitted for validation
  return await Promise.all(
    Object.keys(checks).map(async (field) => {
      const currentField = checks[field];
      const value = data[field];
      return {
        field,
        // Run all validators for a given field
        errors: getErrors(
          await Promise.allSettled(
            Object.keys(currentField).map((check) =>
              validators[check](
                value,
                getValidatorContext({
                  validator: check,
                  limit: currentField[check],
                  value,
                  field,
                  data,
                })
              )
            )
          )
        ).flat(),
      };
    })
  );
}

module.exports = checc;
