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
    custom: () => Promise.reject("bad"),
    minLength: [100, "aaa"],
  },
  address: {
    field: {
      city: {
        minLength: 2,
      },
      code: {
        minLength: 2,
      },
      street: {
        field: {
          number: {
            field: {
              number: {
                minLength: 2,
              },
              letter: {
                minLength: [2, "wrong letter"],
                maxLength: [0, "wrong length"],
                custom: [() => Promise.reject("a"), () => Promise.reject("b")],
              },
            },
          },
          name: {
            minLength: 2,
            custom: () => Promise.reject("wrong"),
          },
        },
      },
    },
  },
};

checc(data, checks).then((result) => {
  console.log(JSON.stringify(result));
});
