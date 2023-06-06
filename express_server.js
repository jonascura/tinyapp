const express = require('express');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

// constants
const app = express();
const PORT = 8080; // default port 8080

// data
const {
  urlDatabase,
  users
} = require('./databases.js');

// configuration
app.set("view engine", "ejs");


// functions
const {
  generateRandomString,
  getUserByEmail,
  urlsForUser
 } = require('./helpers.js');

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
  // determine if user
  if (!req.session.user_id) {
    res.redirect('/login');
  }
  
  const userID = req.session.user_id.id;
  
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
  if (!req.session.user_id) {
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
  if (!req.session.user_id) {
    return res.status(400).send("You must login");
  }

  let user = getUserByEmail(req.session.user_id.email, users);
  let urls = urlsForUser(user.id);
  let urlToCheck = urlDatabase[req.params.id];

  // check if url exists
  if (urlToCheck === undefined) {
    return res.status(400).send("URL does not exist");
  }

  // check if url belongs to user
  let templateVars = {};
  let doesBelong = null;
  for (let url in urls) {
    if (urlToCheck.longURL === urls[url]) {
      templateVars = {
        id:req.params.id,
        longURL: url.longURL,
        user_id: user.id
      };
      doesBelong = true;
    }
  }

  if (!doesBelong) {
    return res.status(400).send("There is no existing URL in library");
  }
  res.render("urls_show", templateVars);

});

////////////////////////////////////////////////////////////////////////////////////////////
// READ: short URL >> redirect to URL
////////////////////////////////////////////////////////////////////////////////////////////
app.get("/u/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.status(400).send("You must login");
  }

  let user = getUserByEmail(req.session.user_id.email, users);
  let urls = urlsForUser(user.id);
  let urlToCheck = urlDatabase[req.params.id];

  // check if url exists
  if (urlToCheck === undefined) {
    return res.status(400).send("URL does not exist");
  }

  let doesBelong = null;
  for (let url in urls) {
    console.log(urls[url]);
    if (urlToCheck.longURL === urls[url]) {
      doesBelong = true;
    }
  }
  
  if (!doesBelong) {
    return res.status(400).send("There is no existing URL in library");
  }
  res.redirect(urlToCheck.longURL);

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
  if (!req.session.user_id) {
    return res.status(400).send("you must login or register to create TinyURL");
  }

  const body = req.body;
  console.log("body is:", body); // Log the POST request body to the console
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
  if (!req.session.user_id) {
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
  console.log("body is:", body); // Log the POST request body to the console
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