const checc = require("./index");

const data = {
  username: "bob aaaaaaaaaaaa",
  firstName: "B",
  lastName: "Bo$bby",
  password: "123",
  repeatPassword: "123",
  email: "bob@bob.com",
};

const checks = {
  username: {
    minLength: 2,
    maxLength: [12, "you silly"],
    pattern: /^\w+$/,
  },
  firstName: {
    minLength: 2,
    maxLength: [12, "way too frickin long mate"],
    pattern: /^\w+$/,
  },
  lastName: {
    minLength: 2,
    maxLength: 12,
    pattern: /^\w+$/,
    custom: [
      (val, ctx) => (val === 42 ? null : Promise.reject("is not 42")),
      (val, ctx) => (val === 43 ? null : Promise.reject("is not 43")),
    ],
  },
};

checc(data, checks).then(console.log);
