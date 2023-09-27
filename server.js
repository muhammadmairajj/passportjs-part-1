const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: "./config.env" });
const { v4: uuidv4 } = require("uuid");
const session = require("express-session");
const passport = require("passport");
const User = require("./models/userSchema");
const LocalStrategy = require("passport-local").Strategy;


const app = express();

// Database:
mongoose
  .connect(
    process.env.MONGODB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("DATABASE SUCCESSFULLY CONNECTED");
  })
  .catch((error) => {
    console.log(error);
  });

// Middleware
app.use(express.json());
app.use(
  session({
    secret: "a private key", // secret password
    resave: false, // means kis way sa ap session ko resave or wapis generate kro gy
    saveUninitialized: true, //
    cookie: { secure: false, maxAge: 60000 },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  // console.log("in serialize user: ", user);
  if (user) {
    return done(null, user.id);
  } else {
    return done(null, false);
  }
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(null, false);
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
});

passport.use(
  new LocalStrategy(async function (username, password, done) {
    console.log(username, password);
    try {
      const user = await User.findOne({ username: username });

      if (!user) {
        return done(null, false, { message: "User not found" });
      }

      if (!(user.password === password)) {
        return done(null, false, { message: "Invalid Password" });
      }
      console.log("user", user);
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

app.post("/register", async (req, res) => {
  try {
    const existingUser = await User.findOne({ username: req.body.username });
    if (existingUser) {
      return res.redirect("/");
    }

    const newUser = await User.create({
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    if (!newUser) {
      return res.status(500).send("Registration failed");
    }
    req.login(newUser, (err) => {
      if (err) {
        return res.status(500).send("Login failed after registration");
      }
      // return res.redirect("/");
      return res
        .status(201)
        .json({ message: "User Successfully Registered", user: { newUser } });
    });
  } catch (err) {
    return res.status(500).send("Registration error: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.get("/test", isAuthenticated, (req, res) => {
  req.session.test ? req.session.test++ : (req.session.test = 1);
  res.send(req.session.test.toString() + " " + req.user.username);
});

app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    // res.redirect("/");
    res.send("Logged out");
  });
});

function isAuthenticated(req, res, done) {
  if (req.user) {
    return done();
  } else {
    return res.redirect("/");
  }
}

app.post("/login", passport.authenticate("local"), function (req, res) {
  // res.redirect("/");
  // res.json(req.user);
  return res
    .status(200)
    .json({ message: "User Successfully LoggedIn", user: req.user });
});

app.listen(4000, () => {
  console.log("listening on port 4000");
});
