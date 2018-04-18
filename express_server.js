var express = require("express");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser())
app.set("view engine", "ejs");

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for(var i = 0; i < 6; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.end("Hello!");
});


//-------------Login-------------------
app.post("/login", (req, res) => {
  var loginName = req.body.username;
  res.cookie('username',{ username: loginName});
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/urls");
})

//-------------URLS--------------------
app.get("/urls", (req, res) => {
  let username = req.cookies["username"];
  let urls = { urls: urlDatabase, username: username };
  //console.log(username);
  res.render("urls_index", urls);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

app.get("/urls/new", (req, res) => {
  let username = req.cookies["username"];
  let name = {username: username};
  res.render("urls_new", name);
});

app.get("/urls/:id", (req, res) => {
  let username = req.cookies["username"];
  let templateVars = { shortURLs: req.params.id, fullURLs: urlDatabase[req.params.id], username: username};
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