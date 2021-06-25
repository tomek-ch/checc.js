const checc = require("./index");

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
  },
};

const checks = {
  address: {
    field: {
      city: {
        minLength: 2,
        maxLength: 10,
      },
      code: {
        minLength: 4,
        maxLength: 5,
      },
    },
  },
};

checc(data, checks).then(console.log);
