const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

// constants
const app = express();
const PORT = 8080; // default port 8080
const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// data
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "abc",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "abc",
  },
};

const users = {
  abc: {
    id: "abc",
    email: "user@example.com",
    password: "$2a$10$qdrhL7wJNX/UWzL1pT5UeOHGCvKrdJHpdDG9bVOR3/6FngIUxNVjK", //123
  },
  def: {
    id: "def",
    email: "user2@example.com",
    password: "$2a$10$5.y8C5kcw3JEx2IvPgbdxOtcwc2uIjnHyP52xbSFqnp6zwR.8fYJO", //456
  },
};

// configuration
app.set("view engine", "ejs");


// functions
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

// middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true })); // populates req.body
app.use(cookieSession({
  name: 'session', // name we see in our cookie
  keys: [
    generateRandomString(),
    generateRandomString(),
    generateRandomString(),
    generateRandomString()
  ], // doesn't matter what this is

  // Cookie options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: urls page
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/urls", (req, res) => {
  const userID = req.session.user_id.id;
  // determine if user
  if (userID === undefined) {
    res.redirect('/login');
  }

  const templateVars = {
    urls: urlsForUser(userID),
    user_id: req.session.user_id
  };
  
  res.render("urls_index", templateVars);
});

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: new URLs page
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/urls/new", (req, res) => {
  // check if user
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  }

  const templateVars = {
    user_id: req.session.user_id
  };
  
  res.render("urls_new", templateVars);
});

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: shortened URL page
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/urls/:id", (req, res) => {
  // check if user
  if (req.session.user_id === undefined) {
    res.redirect('/login');
  }

  let userID = req.session.user_id.id;
  let url = urlDatabase[req.params.id];

  // check if url belongs to user
  let templateVars = {};
  if (userID !== url.userID) {
    return res.status(400).send("TinyURL does not belong to you");
  }

  templateVars = {
    id:req.params.id,
    longURL: url.longURL,
    user_id: req.session.user_id
  };

  res.render("urls_show", templateVars);
});

////////////////////////////////////////////////////////////////////////////////////////////
// READ: short URL >> redirect to URL
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (longURL === undefined) {
    return res.status(400).send("TinyURL does not exist");
  }
  res.redirect(longURL);
});

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: homepage
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/", (req, res) => {
  res.send("Hello!");
});

// CREATE: show urls as json string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// CREATE: show hello words with bolded html
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

////////////////////////////////////////////////////////////////////////////////////////////
// SAVE: create TinyURL (submit button in Create TinyURL)
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/urls/new", (req, res) => {
  // check user if user
  if (req.session.user_id === undefined) {
    return res.status(400).send("you must login or register to create TinyURL");
  }

  const body = req.body;
  console.log(body); // Log the POST request body to the console
  const newURL = body.longURL;
  const newStr = generateRandomString();
  urlDatabase[newStr] = {
    longURL: newURL,
    userID: req.session.user_id.id
  };

  res.redirect(`/urls/${newStr}`);
});

////////////////////////////////////////////////////////////////////////////////////////////
// DELETE: url entry
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/urls/:id/delete", (req, res) => {
  
  // check user if user
  if (req.session.user_id === undefined) {
    return res.status(400).send("you must login or register to create TinyURL");
  }

  let userID = req.session.user_id.id;
  let url = urlDatabase[req.params.id];

  // check if url belongs to user
  if (userID !== url.userID) {
    return res.status(400).send("TinyURL does not belong to you");
  }

  if (url.longURL === undefined) {
    return res.status(400).send("TinyURL does not exist");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////////////////
// EDIT: url entry
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

////////////////////////////////////////////////////////////////////////////////////////////
// UPDATE: url entry
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/urls/:id", (req, res) => {
  const body = req.body;
  console.log(body); // Log the POST request body to the console
  const newURL = body.longURL;
  urlDatabase[req.params.id] = {
    longURL: newURL,
    userID: req.session.user_id.id
  };

  res.redirect(`/urls/${req.params.id}`);
});

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: log in page
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/login", (req, res) => {
  res.render('login');
});

////////////////////////////////////////////////////////////////////////////////////////////
// Handle Log In button in /urls
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/linkToLogin", (req, res) => {
  res.redirect("/login");
});

////////////////////////////////////////////////////////////////////////////////////////////
// SAVE: login
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(400).send("no user with that name found");
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(400).send("passwords do not match");
  }

  req.session.user_id = user;
  console.log(req.session);
  
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////////////////
// DELETE: logout
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/login");
});

////////////////////////////////////////////////////////////////////////////////////////////
// CREATE: register page
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/register", (req, res) => {
  res.render('register');
});

// Handle register button in /urls
app.post("/linkToReg", (req, res) => {
  res.redirect("/register");
});

////////////////////////////////////////////////////////////////////////////////////////////
//SAVE: registration
////////////////////////////////////////////////////////////////////////////////////////////
app.post("/register", (req, res) => {
  // grab info from body
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  // handle required fields
  if (!email || !password) {
    return res.status(400). send("you must provide a username and password");
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);

  // look for existing email
  if (!user) {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: email,
      password: hash
    };
    req.session.user_id = users[id];
    res.redirect('/urls');
  }
  return res.status(400).send("email already registered");
});

// listener
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});