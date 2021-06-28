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
  number: 100,
  age: 20,
};

const checks = {
  age: {
    optional: [0, undefined, null],
    type: "number",
    min: 20,
  },
};

checc(data, checks, { keepSchema: false }).then((result) => {
  console.log(JSON.stringify(result));
});
