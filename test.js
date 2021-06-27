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
  thing: {
    things: ["a"],
    thing: {
      thing: "a",
    },
  },
};

const checks = {
  username: {
    minLength: 2,
  },
  firstName: {
    minLength: 1,
  },
  address: {
    field: {
      street: {
        field: {
          number: {
            field: {
              letter: {
                minLength: 0,
              },
              number: {
                minLength: 0,
              },
            },
          },
        },
      },
    },
  },
  things: {
    all: {
      field: {
        name: {
          minLength: 0,
        },
      },
    },
  },
  thing: {
    field: {
      things: {
        all: {
          minLength: 2,
        },
      },
      thing: {
        field: {
          thing: {
            minLength: 2,
          },
        },
      },
    },
  },
  tags: {
    all: {
      minLength: 2,
    },
    minLength: [5, "there must be at least 5 tags"],
  },
};

checc(data, checks, { keepSchema: false }).then((result) => {
  console.log(JSON.stringify(result));
});
