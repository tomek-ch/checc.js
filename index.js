const { validators, getValidatorContext, getErrors } = require("./setup");

async function checc(data, checks) {
  // Get every field that was submitted for validation
  const arr = await Promise.all(
    Object.keys(checks).map(async (field) => {
      const currentField = checks[field];
      const value = data[field];

      // Don't validate optional fields that are undefined
      if (currentField.optional && value === undefined) {
        return {
          field,
          errors: [],
        };
      }

      // If it is an object that is being validated,
      // using the field validator,
      // return an error object from the validator
      // instead of an array of errors
      if (currentField.field) {
        return {
          field,
          errors: await validators.field(
            value,
            getValidatorContext({
              validator: "field",
              limit: currentField.field,
              value,
              data,
            })
          ),
        };
      }

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
          // Handle nested arrays of custom validator messages
        ).flat(),
      };
    })
  );

  // Transform [{ field: "foo", errors: [] }]
  // into { foo: [] }
  return arr.reduce((result, obj) => {
    return {
      ...result,
      [obj.field]: obj.errors,
    };
  }, {});
}

module.exports = checc;
