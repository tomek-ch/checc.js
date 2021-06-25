function getErrors(arrOfPromises) {
  return arrOfPromises
    .filter((p) => p.status === "rejected")
    .map((p) => p.reason);
}

const defaultMessages = {
  minLength: (limit, field, val) =>
    `Minimum length of ${field} is ${limit}. "${val}" is too short`,
  maxLength: "Too long",
  pattern: "Incorrect format",
};

function getValidatorContext({ validator, limit, value, field, data }) {
  // Check if custom message was provided
  // And if it is not an array of custom validators
  if (Array.isArray(limit) && validator !== "custom") {
    return {
      limit: limit[0],
      message: limit[1],
      data,
      field,
    };
  }
  // If there is no custom message, use the default one
  const defaultMessage = defaultMessages[validator];
  return {
    limit,
    message:
      // Handle custom default messages
      typeof defaultMessage === "function"
        ? defaultMessage(limit, field, value)
        : defaultMessage,
    data,
    field,
  };
}

const validators = {
  minLength: (str, context) => {
    if (str.length < context.limit) {
      return Promise.reject(context.message);
    }
  },
  maxLength: (str, context) => {
    if (str.length > context.limit) {
      return Promise.reject(context.message);
    }
  },
  pattern: (str, context) => {
    if (!context.limit.test(str)) {
      return Promise.reject(context.message);
    }
  },
  custom: async (value, ctx) => {
    const validator = ctx.limit;
    // Check if there are multiple custom validators
    if (Array.isArray(validator)) {
      // Run all of them
      return Promise.reject(
        getErrors(Promise.allSettled(validator.map((fn) => fn(value, ctx))))
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
                })
              )
            )
          )
        )
      )
    );
  },
  field: async (objToCheck, ctx) => {
    const fieldsToCheck = ctx.limit;
    return Promise.reject(
      getErrors(
        await Promise.allSettled(
          Object.keys(fieldsToCheck).flatMap((field) =>
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
        )
      )
    );
  },
};

module.exports = {
  validators,
  getValidatorContext,
  getErrors,
};
