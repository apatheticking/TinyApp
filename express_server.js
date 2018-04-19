var express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");


var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "ua9d12": {
    id: "ua9d12",
    email: "jjlee16@gmail.com",
    password: "password"
  },
  "aW9d1E": {
    id: "aW9d1E",
    email: "JohnDoe@gmail.com",
    password: "password"
  }
}

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

app.get("/", (req, res) => {
  res.end("Hello!");
});


//-------------Login-------------------
app.post("/login", (req, res) => {
  let id = "";
  let match = 0;

  if(!req.body.email || !req.body.password){ //checks if email or password is empty
    res.status(400).send("your email or password field is empty string");
    return;
  }

  for(user in users){ //checks the userDB for email
    if(users[user].email === req.body.email){
      id = users[user].id
    }
  }

  if(id === "") { //if cannot find email return 403
    res.status(403).send("this email cannot be found");
    return;
  }

  for(user in users){ //checks if password matches user's password
    if(users[user].password === req.body.password && users[user].email === req.body.email){
      match++;
    }
  }

  if(match !== 1){ //if it doesn't match then return 403
    res.status(403).send("incorrect password");
    return;
  }

  res.cookie("user_id", id);
  res.redirect("/");
});

app.get("/login",(req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
})

//-------------Registering------------

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  let id = generateRandomString();

  if(!req.body.email || !req.body.password){ // checks if email or password is empty
    res.status(400).send("your email or password field is empty string");
    return;
  }

  for(user in users){ //checks if registering email already exists
    if(users[user].email === req.body.email){
      res.status(400).send("this email is already registered");
      return;
    }
  }

  users[id] = {id: id, email: req.body.email, password: req.body.password};//adds new user to DB
  res.cookie('user_id', id);
  res.redirect("urls");
});

//-------------URLS--------------------
app.get("/urls", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.cookies["user_id"]];
  let templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.cookies["user_id"]];
  let templateVars = {user: user};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.cookies["user_id"]];
  let templateVars = { shortURLs: req.params.id, fullURLs: urlDatabase[req.params.id], user: user};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  if(!longURL.startsWith("http://")){
    longURL = "http://" + longURL;
  }
  res.redirect(longURL);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//--------------Ediing URLS------------------
app.post("/urls/:id/update", (req, res) => {
  urlDatabase[req.params.id] = req.body.fullURL;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});