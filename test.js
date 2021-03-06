const checc = require("./index");
const { config } = require("./setup");

config({
  defaultMessages: {
    minLength: "TOO SHORT",
    maxLength: (limit, field, val) => `${val} BAD`,
  },

  validators: {
    sameAs: [
      (val, { limit, message, data }) =>
        val === data[limit] ? null : Promise.reject(message),
      (limit, field, val) => `${field} is different than ${limit}`,
    ],
  },

  customCtx: {
    answer: 42,
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
  tags: ["a"],
  number: 100,
  age: 20,
  users: [{}],
};

const checks = {
  username: {
    custom: (str, { answer }) => str !== answer && Promise.reject("not 42"),
  },
};

checc(data, checks, { keepSchema: true }).then((result) => {
  // console.log(JSON.stringify(result));
  console.log(result);
});
