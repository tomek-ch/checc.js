const checc = require("./index");

const data = {
  username: "bob aaaaaaaaaaaa",
  firstName: "B",
  lastName: "Bobby",
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
  },
};

checc(data, checks).then(console.log);
