var express = require("express");
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

//for encrypted cookies
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

//--------------database-----------------
var urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    id: "ua9d12"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    id: "ua9d12"
  },
  "1saDxK": {
    longURL: "http://www.youtube.com",
    id: "ua9d12"
  },
  "1s4DFc": {
    longURL: "http://www.youtube.ca",
    id: "userRandomID"
  },
  "9Sm5aK": {
    longURL: "http://www.google.com",
    id: "aW9d1E"
  },
  "12aDCt": {
    longURL: "http://www.youtube.com",
    id: "aW9d1E"
  },
}

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2a$10$/JqMr7l5VZ7o0sgkNnkm9O.mPxB5lPeATwMFhWwEJ1S9TwFhiGzcy"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2a$10$zePPV0qW.NE24xE7aF9voOLGbiEVt7jr51.TNBuRrL5hbW8zMj5P6"
  },
  "ua9d12": {
    id: "ua9d12",
    email: "jjlee16@gmail.com",
    password: "$2a$10$WRXlTuvJrlgVVzj/FmPPzen/6OTaTbk49bCc1/ehHfbaDbhscf2Qi"
  },
  "aW9d1E": {
    id: "aW9d1E",
    email: "JohnDoe@gmail.com",
    password: "$2a$10$y1Jz6KYlqgtl/kcDB5KGhuhRkCV6dNIwqEog7Ab6bkOposvHTpG/."
  }
}

//---------------Global functions------------
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
//finds the logging user in the database
function urlsForUser(id){
  let userURL = {};

  for(var url in urlDatabase){
    if(id === urlDatabase[url].id){
      userURL[url] = urlDatabase[url];
    }
  }
  return userURL;
}

//-------------server requests----------

//response for root directory
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
    if(bcrypt.compareSync(req.body.password, users[user].password) && users[user].email === req.body.email){
      match++;
    }
  }

  if(match !== 1){ //if it doesn't match then return 403
    res.status(403).send("incorrect password");
    return;
  }

  req.session.user_id = id; //writes cookie for current user
  res.redirect("urls");
});

app.get("/login",(req, res) => {
  res.render("login");
});

app.post("/logout", (req, res) => {
  req.session = null; //deletes cookie on logout
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

  const hashedPassword = bcrypt.hashSync(req.body.password, 10);//encrypts the password being passed in

  users[id] = {id: id, email: req.body.email, password: hashedPassword};//adds new user to DB
  req.session.user_id = id; //writes cookie to current user ID
  res.redirect("urls");
});

//-------------URLS--------------------
app.get("/urls", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.session.user_id];
  let userURL = urlsForUser(req.session.user_id);
  let templateVars = { urls: userURL, user: user };
  res.render("urls_index", templateVars);//takes urls associated with the user and user information to urls_indexs
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = {longURL: req.body.longURL, id: req.session.user_id};//writes new url to the database
  res.redirect("/urls");
});

app.get("/urls/new", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.session.user_id];
  if(!user){//checks if the user is logged in
    res.redirect("/login");
  } else {
    let templateVars = {user: user};
    res.render("urls_new", templateVars);//redirects user to create a new url
  }
});

app.get("/urls/:id", (req, res) => { //returns the cookie back to _header.ejs
  let user = users[req.session.user_id];
  if(!user){//if not logged in redirect to login
    res.redirect("/login");
  } else if(urlDatabase[req.params.id].id !== user.id) {//if this url doesn't belong to the current user redirect to urls
    res.redirect("/urls");
  } else {
    let templateVars = { shortURLs: req.params.id, fullURLs: urlDatabase[req.params.id].longURL, user: user};
    res.render("urls_show", templateVars); //loads long, short urls and user info into urls_show
  }
});

app.get("/u/:shortURL", (req, res) => {
  if(req.session.user_id){//if the user is logged in
    let longURL = urlDatabase[req.params.shortURL].longURL;
    if(!longURL.startsWith("http://")){//if the url doesn't start with http:// this will add it to the url
      longURL = "http://" + longURL;
    }
    res.redirect(longURL);
  } else { //if the user isn't logged in
    res.redirect("/login");
  }
});
//displays the entire url database
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//--------------Ediing URLS------------------
//updates url
app.post("/urls/:id/update", (req, res) => {
  if(urlDatabase[req.params.id].id ===  req.session.user_id){//checks if this url belongs to this user
    urlDatabase[req.params.id].longURL = req.body.fullURL;
    res.redirect("/urls");
  } else {
    res.redirect("/urls");
  }
});
//deletes url
app.post("/urls/:id/delete", (req, res) => {
  if(urlDatabase[req.params.id].id ===  req.session.user_id){//checks if this url belongs to this user
    delete urlDatabase[req.params.id];
    res.redirect(`/urls`);
  } else {
    res.redirect(`/urls`);
  }
});
//displays which port the server is running on
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});