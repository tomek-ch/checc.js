# Checc.js

A portable and extensible library for data validation in JavaScript. Offers a declarative API built with code reuse in mind.

- [React example](https://github.com/tomek-ch/checc-example-react)
- [Express example](https://github.com/tomek-ch/checc-example-express)

## Table of contents

- [Basics](#basics)
- [Custom validators](#custom-validators)
- [Arrays](#arrays)
- [Objects](#objects)
- [Optional fields](#optional-fields)
- [Config](#config)
- [Express middleware](#express-middleware)
- [Available validators](#available-validators)

## Basics

### Installation

Npm:

```
npm i checc
```

Yarn:

```
yarn add checc
```

### Usage

To perform validation, the asynchronous `checc` function is used. It accepts an object of data, on which the checks will be performed, and a validation schema.

```
import checc from 'checc';

const data = { username: 'bob' };
const schema = {
  username: {
    type: 'string',
    minLength: 2,
    maxLength: [20, 'Way too long mate'],
  },
};

const { isValid, errors } = await checc(data, schema);
```

You can set a specific message by passing a two element array to the validator. The return value of the above invocation is `{ isValid: true, errors: {} }`.

### Maintaining schema

To maintain the schema even for fields with no errors set `keepSchema` to `true`:

`checc(data, schema, { keepSchema: true })`

In this case `errors` will be `{ username: [] }`. This can be useful for when you want to map over the errors to display them in a UI.

## Custom validators

You can perform any sort of validation you want by using a custom validator:

```
const schema = {
  repeatPassword: {
    custom: (repeat, { data }) => {
	  if (repeat !== data.password)
	    return Promise.reject('Passwords must match');
    },
  },
};
```

The first argument passed to a validator is the value of the field that is being validated (in this case `repeatPassword`). The second argument is a context object from which you can access all of the data. To fail a check, return a rejected `Promise` and pass your error message to it.

### Multiple custom validators

To use multiple custom validators on a field, put them in an array:

```
const schema = {
  username: {
    custom: [
      username => {},
      username => {},
    ],
  },
};
```

## Arrays

You can use the `all` validator to check all elements in an array:

```
const schema = {
  items: {
    // Checks for the array itself
    isArray: true,
    minLength: 1,
    maxLength: 5,
    all: {
      // Checks for elements in the array
      type: 'string',
      minLength: 2,
      maxLength: 20,
    },
  },
};
```

To check whether the passed value is an array, use the `isArray` validator. To validate the length of the array, use `minLength` and `maxLength`.

## Objects

To validate object fields, use the `field` validator:

```
const schema = {
  user: {
    field: {
      address: {
        field: {
          street: {
            type: 'string',
          },
          city: {
            type: 'string',
          },
        },
      },
      username: {
        type: 'string',
      },
    },
  },
};
```

As you can see, this works with nested objects. The error output is in the following format:

```
{
  user: {
    address: {
      street: [],
      city: [],
    },
    username: [],
  },
}
```

### Array of objects

You can combine `all` and `field` to validate an array of objects:

```
const data = {
  users: [
    { username: 'bob' },
    { username: 'bob2' },
  ],
};

const schema = {
  users: {
    isArray: true,
    minLength: 1,
    all: {
      field: {
        username: {
          type: 'string',
          minLength: 2,
        },
      },
    },
  };
```

Note that the error format for `all` is always a flat array like this: `{ users: [] }`, even for objects. This allows for validation of the array's length and preventing duplicate messages for multiple elements.

## Optional fields

You can mark fields as optional to skip their validation if they are `undefined` or one of the values provided in an array:

```
const schema = {
  lastName: {
    minLength: 2,
    optional: true,
  },
  description: {
    minLength: 2,
    optional: ['', null],
  },
};
```

In this case `minLength` won't check `lastName` if it's `undefined`. It also won't check `description` if it's an empty string or `null`.

## Config

### Custom default messages

You can customize the default messages by running `config` before the validations. The message can be either a string or a function returning a string:

```
import { config } from 'checc/setup';

config({
  defaultMessages: {
    minLength: 'Not long enough',
    maxLength: (max, field, val) => {
      return (
        `Max length for ${field} is ${max}. "${val}" is too long`,
      );
    },
  },
});
```

### Embedding custom validators

You can embed your own validators into the library to reuse them across your application:

```
config({
  validators: {
    sameAs: [
      (val, { limit, message, data }) => {
        if (val !== data[limit])
          return Promise.reject(message);
      },
      (limit, field) => `${field} is different than ${limit}`,
    ],
  },
});
```

You need to specify a name for the validator and pass a two element array to it. The first element is the validator. It accepts the value that is being checked and a context object. The second element is a default message which can be a function or a string.

When failing a validation, use `message` from the context object as the rejection reason. It will be either the default message, or a message specified in the validation schema.

You can then use your validator like any other:

```
const data = {
  password: '123',
  repeatPassword: '1234',
};

const schema = {
  repeatPassword: {
    sameAs: ['password', 'Passwords must match'],
  },
};
```

### Custom validator context

To add your own values to validator context you can do:

```
config({
  customCtx: {
    answer: 'yes',
  },
});
```

Then you can access them inside any custom validator:

```
const schema = {
  answer: {
    custom: (val, { answer } => {
      if (val !== answer)
        return Promise.reject('Wrong answer');
    },
  },
};
```

## Express middleware

You can easily integrate checc with an express app using the middleware provided by the library:

```
const checc = require('checc/middleware');

app.post('/', [
  checc('body', {
    username: {
      custom: async (username, { next }) => {
        const user = await User
          .findOne({ username })
          .catch(next);
        if (user)
          return Promise.reject('Username taken');
      },
    },
  }, { keepSchema: false }),

  (req, res) => {
    const { isValid, errors } = req.checc.body;

    if (!isValid)
      return res
        .status(400)
        .json(errors);

    res.sendStatus(200);
  },
]);
```

This function returns the middleware. It works the same as the regular `checc`, but instead of a data object, it accepts the name of the field inside `req` that you want to validate.

With checc middleware you can access `req`, `res` and `next` from validator context. Validation results are saved to `req.checc.<validated object>`.

## Available validators

- `type` - checks if the JavaScript type of a value matches the provided one. Accepts either a string or an object with the `in` property containing an array of strings.

  ```
  {
    name: {
      type: 'string',
    },
    age: {
      type: { in: ['string', 'number'] },
    },
  }
  ```

  While checking the type on the front-end is not necessary because that is something that should be handled by appropriate input types, you should always check the type on the back-end.

- `minLength` - fails if the length is lower than the provided number. Skips validation for values that are neither a string nor an array.

  ```
  {
    name: {
      minLength: 2,
    },
    items: {
      minLength: 1,
    },
  }
  ```

- `maxLength` - fails if the length is greater than the provided number. Skips validation for values that are neither a string nor an array.

  ```
  {
    name: {
      maxLength: 20,
    },
    items: {
      maxLength: 5,
    },
  }
  ```

- `pattern` - tests a string against the provided regular expression. Skips validation for values that are not a string.

  ```
  {
    password: {
      pattern: [/\d/, 'Must include a digit'],
    },
  }
  ```

- `isArray` - fails if the value is or isn't an array depending on the provided boolean constraint.

  ```
  {
    items: {
      isArray: true,
    },
  }
  ```

- `min` - fails if a number is lower than the provided one. Skips validation for values that are not a number.

  ```
  {
    age: {
      min: 15,
    },
  }
  ```

- `max` - fails if a number is greater than the provided one. Skips validation for values that are not a number.

  ```
  {
    age: {
      max: 18,
    },
  }
  ```
