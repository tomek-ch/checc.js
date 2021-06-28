function getErrors(arrOfPromises) {
  return arrOfPromises
    .filter((p) => p.status === "rejected")
    .map((p) => p.reason);
}

let defaultMessages = {
  minLength: (limit, field, val) =>
    `Minimum length of ${field} is ${limit}. "${val}" is too short`,
  maxLength: "Too long",
  pattern: "Incorrect format",
};

function getValidatorContext({
  validator,
  limit,
  value,
  field,
  data,
  returnArr,
}) {
  // Check if custom message was provided
  // And if it is not an array of custom validators
  if (Array.isArray(limit) && validator !== "custom") {
    return {
      limit: limit[0],
      message: limit[1],
      data,
      field,
      returnArr,
    };
  }

  // If there is no custom message, use the default one
  const defaultMessage = defaultMessages[validator];
  return {
    limit,
    // Handle custom default messages
    message:
      typeof defaultMessage === "function"
        ? defaultMessage(limit, field, value || "")
        : defaultMessage,
    data,
    field,
    returnArr,
  };
}

const validators = {
  minLength: (val, context) => {
    // Fail validation if value is not a string or array
    if (!Array.isArray(val) && typeof val !== "string") {
      return Promise.reject(context.message);
    }
    if (str.length < context.limit) {
      return Promise.reject(context.message);
    }
  },
  maxLength: (val, context) => {
    // Do not validate if the type of value
    // is other than string or array
    if (!Array.isArray(val) && typeof val !== "string") {
      return null;
    }
    if (str.length > context.limit) {
      return Promise.reject(context.message);
    }
  },
  pattern: (val, context) => {
    // Test an empty string if the value is of different type
    if (!context.limit.test(typeof val === "string" ? val : "")) {
      return Promise.reject(context.message);
    }
  },
  custom: async (value, ctx) => {
    const validator = ctx.limit;
    // Check if there are multiple custom validators
    if (Array.isArray(validator)) {
      // Run all of them
      return Promise.reject(
        getErrors(
          await Promise.allSettled(validator.map((fn) => fn(value, ctx)))
        )
      );
    }
    // Or only one
    return validator(value, ctx);
  },
  all: async (items, ctx) => {
    // These are the validators that will run on every item in the array
    const checks = ctx.limit;
    return Promise.reject(
      getErrors(
        await Promise.allSettled(
          // Run every validator on every item and return a flat array
          Object.keys(checks).flatMap((check) =>
            items.map((item) =>
              validators[check](
                item,
                getValidatorContext({
                  validator: check,
                  limit: checks[check],
                  value: item,
                  field: ctx.field,
                  data: ctx.data,
                  returnArr: true,
                })
              )
            )
          )
        )
      )
    );
  },
  field: async (val, ctx) => {
    // Handle invalid types
    const objToCheck = typeof val !== "object" || val === null ? {} : val;
    const fieldsToCheck = ctx.limit;

    // Handle validation of array of objects
    if (ctx.returnArr) {
      return Promise.reject(
        getErrors(
          await Promise.allSettled(
            Object.keys(fieldsToCheck).map((field) =>
              Object.keys(fieldsToCheck[field]).map((check) =>
                validators[check](
                  objToCheck[field],
                  getValidatorContext({
                    validator: check,
                    limit: fieldsToCheck[field][check],
                    value: objToCheck[field],
                    field,
                    data: ctx.data,
                    returnArr: true,
                  })
                )
              )
            )
          )
        )
      );
    }

    // Errors for individual fields will be stored here
    const objErrors = {};

    await Promise.allSettled(
      Object.keys(fieldsToCheck).flatMap(async (field) => {
        // Handle validation of deeply nested objects
        if (fieldsToCheck[field].field) {
          const error = await validators.field(
            objToCheck[field],
            getValidatorContext({
              validator: "field",
              limit: fieldsToCheck[field].field,
              value: objToCheck[field],
              data: ctx.data,
            })
          );

          objErrors[field] = error;
          return null;
        }

        // If the field is not a nested object, run validators as usual
        // and put errors in an array
        const errors = getErrors(
          await Promise.allSettled(
            Object.keys(fieldsToCheck[field]).map((check) =>
              validators[check](
                objToCheck[field],
                getValidatorContext({
                  validator: check,
                  limit: fieldsToCheck[field][check],
                  value: objToCheck[field],
                  field,
                  data: ctx.data,
                })
              )
            )
          )
        );

        // Flatten multiple custom validator messages
        objErrors[field] = errors.flat();
      })
    );

    // Result will look like this
    // { field: [], nestedObj: { field: [] } }
    return objErrors;
  },
  optional: () => {},
};

function config(options) {
  if (options.defaultMessages) {
    defaultMessages = {
      ...defaultMessages,
      ...options.defaultMessages,
    };
  }

  if (options.validators) {
    Object.keys(options.validators).forEach((validatorName) => {
      validators[validatorName] = options.validators[validatorName][0];
      defaultMessages[validatorName] = options.validators[validatorName][1];
    });
  }
}

module.exports = {
  validators,
  getValidatorContext,
  getErrors,
  config,
};
