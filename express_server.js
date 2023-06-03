const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { get } = require('request');

// constants
const app = express();
const PORT = 8080; // default port 8080
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

// data
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  abc: {
    id: "abc",
    email: "user@example.com",
    password: "123",
  },
  def: {
    id: "def",
    email: "user2@example.com",
    password: "456",
  },
};

// configuration
app.set("view engine", "ejs");

// middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

const getUserByEmail = function(email) {
  let isFound = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      // already exists
      isFound = user;
    }
  }
  return isFound;
}

// CREATE: urls page
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user_id: req.cookies["user_id"]
  };
  if (req.cookies["user_id"] === undefined){
    res.redirect('/login');
  }
  res.render("urls_index", templateVars);
});

// CREATE: new URLs page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user_id: req.cookies["user_id"]
  };
  if (req.cookies["user_id"] === undefined){
    res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

// CREATE: shortened URL page
app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id, 
    longURL: urlDatabase[req.params.id],
    user_id: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

// READ: short URL >> redirect to URL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  if (longURL === undefined) {
    return res.status(400).send("TinyURL does not exist");
  }
  res.redirect(longURL);
});

// CREATE: homepage
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

// SAVE: create TinyURL (submit button in Create TinyURL)
app.post("/urls/new", (req, res) => {
  // get user if user
  if (req.cookies['user_id'] === undefined) {
    return res.status(400).send("you must login or register to create TinyURL");
  }
  const body = req.body;
  console.log(body); // Log the POST request body to the console
  const newURL = body.longURL;
  const newStr = generateRandomString();
  urlDatabase[newStr] = newURL;

  res.redirect(`/urls/${newStr}`);
});

// DELETE: url entry
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// EDIT: url entry
app.post("/urls/:id/edit", (req, res) => {
  res.redirect(`/urls/${req.params.id}`);
});

// UPDATE: url entry
app.post("/urls/:id", (req, res) => {
  const body = req.body;
  console.log(body); // Log the POST request body to the console
  const newURL = body.longURL;
  urlDatabase[req.params.id] = newURL;

  res.redirect(`/urls/${req.params.id}`);
});

// CREATE: log in page
app.get("/login", (req, res) => {
  res.render('login');
});

// Handle Log In button in /urls
app.post("/linkToLogin", (req, res) => {
  res.redirect("/login");
})
////////////////////////////////////////////////////////////////////////////////////////////
// SAVE: login 
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user) {
    return res.status(400).send("no user with that name found");
  } 

  if (user.password !== password) {
    return res.status(400).send("passwords do not match");
  }

  res.cookie("user_id", user);
  console.log(req.cookies);
  
  res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////////////////
// DELETE: logout
app.post("/logout", (req, res) => {
  const user_id = req.body.user;
  res.clearCookie('user_id', user_id);
  res.redirect("/login");
});

// CREATE: register page
app.get("/register", (req, res) => {
  res.render('register');
});

// Handle register button in /urls
app.post("/linkToReg", (req, res) => {
  res.redirect("/register");
});

////////////////////////////////////////////////////////////////////////////////////////////
//SAVE: registration
app.post("/register", (req, res) => {
  // grab info from body
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!email || !password) {
    return res.status(400). send("you must provide a username and password");
  }

  console.log("before users", users);
  // console.log(req.body);

  // look for existing email
  if (!user) {
    const id = generateRandomString();
    users[id] = {
      id: id,
      email: email,
      password: password
      }
    res.cookie("user_id", users[id]);
    console.log(req.cookies);
  } else {
    return res.status(400).send("email already registered");
  }

  console.log("after users", users);

  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});