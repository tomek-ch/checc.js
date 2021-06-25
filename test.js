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
  things: [{ name: "a", name: "b" }],
};

const checks = {
  things: {
    all: {
      field: {
        name: {
          minLength: 2,
        },
      },
    },
  },
};

checc(data, checks).then(console.log);
