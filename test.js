const checc = require("./index");
const { config } = require("./setup");

config({
  defaultMessages: {
    minLength: "TOO SHORT",
    maxLength: (limit, field, val) => `${val} BAD`,
  },

  validators: {
    sameAs: [
      (val, { limit, message }) =>
        val === limit ? null : Promise.reject(message),
      (limit, field, val) => `${field} is different than ${limit}`,
    ],
  },
});

const data = {
  username: "bob aaaaaaaaaaaa",
  firstName: "B",
  lastName: 42,
  password: "123",
  repeatPassword: "1234",
  email: "bob@bob.com",
  tags: ["1", "2", "42aaaaaaaaaaaaaaaa"],
  address: {
    city: "a",
    code: "b",
    street: {
      name: "a",
      number: {
        number: "a",
        letter: "b",
      },
    },
  },
  things: [{ name: "a" }, { name: "b" }],
};

const checks = {
  username: {
    minLength: 2,
  },
  firstName: {
    minLength: 1,
  },
  address: {
    field: {
      street: {
        field: {
          number: {
            field: {
              letter: {
                minLength: 1,
              },
            },
          },
        },
      },
    },
  },
};

checc(data, checks, { keepSchema: false }).then((result) => {
  console.log(JSON.stringify(result));
});
