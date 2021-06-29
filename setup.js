function getErrors(arrOfPromises) {
  return arrOfPromises
    .filter((p) => p.status === "rejected")
    .map((p) => p.reason);
}

let defaultMessages = {
  minLength: (limit) => `Must be at least ${limit} characters`,
  maxLength: (limit) => `Must be less than ${limit} characters`,
  pattern: "Incorrect format",
  type: (limit) =>
    // Check if multiple types were provided
    `Must be of type ${limit.in ? limit.in.join(", ") : limit}`,
  isArray: (shouldBeArray) => `${shouldBeArray ? "Must" : "Can't"} be an array`,
  min: (min) => `Must be at least ${min}`,
  max: (max) => `Must be lower than ${max}`,
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
  type: (val, context) => {
    // Check if multiple types were provided
    if (context.limit.in) {
      if (!context.limit.in.includes(typeof val)) {
        return Promise.reject(context.message);
      }
    } else if (typeof val !== context.limit) {
      return Promise.reject(context.message);
    }
  },
  isArray: (val, context) => {
    const shouldBeArray = context.limit;
    const isArray = Array.isArray(val);

    if (isArray !== shouldBeArray) {
      return Promise.reject(context.message);
    }
  },
  minLength: (val, context) => {
    // Skip validation for bad types
    if (!Array.isArray(val) && typeof val !== "string") {
      return null;
    }
    if (val.length < context.limit) {
      return Promise.reject(context.message);
    }
  },
  maxLength: (val, context) => {
    // Do not validate if the type of value
    // is other than string or array
    if (!Array.isArray(val) && typeof val !== "string") {
      return null;
    }
    if (val.length > context.limit) {
      return Promise.reject(context.message);
    }
  },
  pattern: (val, context) => {
    if (typeof val !== "string") {
      return null;
    }
    if (!context.limit.test(val)) {
      return Promise.reject(context.message);
    }
  },
  min: (val, context) => {
    if (typeof val !== "number") {
      return null;
    }
    if (val < context.limit) {
      return Promise.reject(context.message);
    }
  },
  max: (val, context) => {
    if (typeof val !== "number") {
      return null;
    }
    if (val > context.limit) {
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
    // Skip validation if it is not an array
    if (!Array.isArray(items)) {
      return null;
    }
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
        // Skip validation for optional fields
        const { optional } = fieldsToCheck[field];
        if (optional) {
          // Check if custom ignored values were provided
          if (Array.isArray(optional)) {
            // Check if it's one of these values
            if (optional.includes(objToCheck[field])) {
              objErrors[field] = [];
              return null;
            }
            // If no custom ignored values were provided,
            // check if the value is undefined
          } else if (objToCheck[field] === undefined) {
            objErrors[field] = [];
            return null;
          }
        }

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
