const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const { urlDatabase } = require('./databases.js');

const generateRandomString = function() {
  let result = '';
  const length = 6;
  for (let i = 0; i < length; i++) {
    // code referenced from https://www.programiz.com/javascript/examples/generate-random-strings
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const getUserByEmail = function(email, users) {
  let isFound = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      // already exists
      isFound = user;
    }
  }
  return isFound;
};

const urlsForUser = function(id) {
  const urls = {};
  
  for (let key of Object.keys(urlDatabase)) {
    let url = urlDatabase[key];
    if (url.userID === id) {
      const longURL = url.longURL;
      urls[key] = longURL;
    }
  }
  return urls;
};

module.exports = {
  generateRandomString,
  getUserByEmail,
  urlsForUser
};