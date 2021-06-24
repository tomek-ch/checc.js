const defaultMessages = {
  minLength: (limit, field, val) =>
    `Minimum length of ${field} is ${limit}. "${val}" is too short`,
  maxLength: "Too long",
  pattern: "Incorrect format",
};

function getValidatorContext(validator, limit, value, field) {
  // Check if custom message was provided
  if (Array.isArray(limit)) {
    return { limit: limit[0], message: limit[1] };
  }

  const defaultMessage = defaultMessages[validator];
  return {
    limit,
    message:
      typeof defaultMessage === "function"
        ? defaultMessage(limit, field, value)
        : defaultMessage,
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
};

async function checc(data, checks) {
  // Get every field that was submitted for validation
  return await Promise.all(
    Object.keys(checks).map(async (field) => {
      const currentField = checks[field];
      const value = data[field];
      return {
        field,
        // Run all validators for a given field
        errors: (
          await Promise.allSettled(
            Object.keys(currentField).map((check) =>
              validators[check](
                value,
                getValidatorContext(check, currentField[check], value, field)
              )
            )
          )
        )
          // Get failed validations
          .filter((promise) => promise.status === "rejected")
          // // Extract error messages
          .map((promise) => promise.reason),
      };
    })
  );
}

module.exports = checc;
