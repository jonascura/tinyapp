const express = require('express');
const app = express();
const PORT = 8080; // default port 8080
const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

function generateRandomString() {
  let result = '';
  const length = 6;
  for (let i = 0; i < length; i++) {
    // code referenced from https://www.programiz.com/javascript/examples/generate-random-strings
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// console.log(generateRandomString());

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// render urks page
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render("urls_index", templateVars);
});

// render new page
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// show individual id
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: "http://localhost:8080/urls/b2xVn2" };
  res.render("urls_show", templateVars);
});

// redirect request
app.get("/u/:id", (req, res) => {
  const longURL = generateRandomString();
  res.redirect(longURL);
});

// homepage
app.get("/", (req, res) => {
  res.send("Hello!");
});

// show urls as json string
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// show hello words with bolded html
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// SAVE: create TinyURL
app.post("/urls", (req, res) => {
  const body = req.body;
  console.log(body); // Log the POST request body to the console
  const newURL = body.longURL;
  const newStr = generateRandomString();
  urlDatabase[newStr] = newURL;

  console.log("updated urls:", urlDatabase);

  res.redirect(`/urls/:id`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});