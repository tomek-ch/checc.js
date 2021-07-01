const { validators, getValidatorContext, getErrors } = require("./setup");

function removeEmpty(obj) {
  return Object.keys(obj).reduce((result, key) => {
    // It is a validated field
    if (Array.isArray(obj[key])) {
      // There are errors
      if (obj[key].length) {
        return { ...result, [key]: obj[key] };
      }
      // There are no errors
      return result;
    }

    // It is a nested object
    // Recursively check all of its properties
    const nestedObj = removeEmpty(obj[key]);
    // There are errors somewhere inside the object
    if (Object.keys(nestedObj).length) {
      return { ...result, [key]: nestedObj };
    }
    // There are no errors insde the object
    return result;
  }, {});
}

async function checc(data = {}, checks, options) {
  // Get every field that was submitted for validation
  const arr = await Promise.all(
    Object.keys(checks).map(async (field) => {
      const currentField = checks[field];
      const value = data[field];

      // Skip validation for optional fields
      const { optional } = currentField;
      if (optional) {
        // Check if custom ignored values were provided
        if (Array.isArray(optional)) {
          // Check if it's one of these values
          if (optional.includes(value)) {
            return {
              field,
              errors: [],
            };
          }
          // If no custom ignored values were provided,
          // check if the value is undefined
        } else if (value === undefined) {
          return {
            field,
            errors: [],
          };
        }
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
        errors: [
          // Remove duplicate messages from array validation
          ...new Set(
            getErrors(
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
              // Handle nested arrays of custom validator
              // and array of objects validation messages
            ).flat(Infinity)
          ),
        ],
      };
    })
  );

  // Transform [{ field: "foo", errors: [] }]
  // into { foo: [] }
  const obj = arr.reduce((result, obj) => {
    return {
      ...result,
      [obj.field]: obj.errors,
    };
  }, {});

  // Get rid of fields with no errors
  const clean = removeEmpty(obj);
  // Check if any validation failed
  const isValid = !Object.keys(clean).length;
  // The keepSchema option determines
  // whether to return only the errors
  // or all of the validated fields
  return { errors: options?.keepSchema ? obj : clean, isValid };
}

module.exports = checc;
