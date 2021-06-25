const checc = require("./index");

const data = {
  username: "bob aaaaaaaaaaaa",
  firstName: "B",
  lastName: 42,
  password: "123",
  repeatPassword: "1234",
  email: "bob@bob.com",
  tags: ["1", "2", "42aaaaaaaaaaaaaaaa"],
};

const checks = {
  tags: {
    all: {
      minLength: 2,
      maxLength: 10,
    },
  },
};

checc(data, checks).then(console.log);
