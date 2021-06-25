const checc = require("./index");

const data = {
  username: "bob aaaaaaaaaaaa",
  firstName: "B",
  lastName: 42,
  password: "123",
  repeatPassword: "1234",
  email: "bob@bob.com",
};

const checks = {
  repeatPassword: {
    custom: (val, { data }) =>
      val === data.password ? null : Promise.reject("Passwords must match"),
  },
};

checc(data, checks).then(console.log);
