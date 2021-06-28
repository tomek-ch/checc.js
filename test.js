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
  thing: {
    things: ["a"],
    thing: {
      thing: "a",
    },
  },
  tags: ["a"],
};

const checks = {
  tags: {
    isArray: true,
    minLength: [1, "Please provide at least 1 tag"],
    all: {
      minLength: [1, "Each tag must be at least 1 character long"],
    },
  },
};

checc(data, checks, { keepSchema: false }).then((result) => {
  console.log(JSON.stringify(result));
});
