const { assert } = require('chai');

const { getUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

const testDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "abc",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "abc",
  },
};



describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.deepEqual(user.id, expectedUserID);
  });
});

describe('urlsForUser', function() {
  it('should return urls for user', function() {
    const urls = urlsForUser("abc", testDatabase)
    const expectedURLS = {
      b6UTxQ: "https://www.tsn.ca",
      i3BoGr: "https://www.google.ca"
    }
    // Write your assert statement here
    assert.deepEqual(urls, expectedURLS);
  });
});