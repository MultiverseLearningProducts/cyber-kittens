const express = require('express');
const bcrypt = require('bcrypt');
require('dotenv').config();
const app = express();
const { User, Kitten } = require('./db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;


app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.get('/', async (req, res, next) => {
  try {
    res.send(`
      <h1>Welcome to Cyber Kittens!</h1>
      <p>Cats are available at <a href="/kittens/1">/kittens/:id</a></p>
      <p>Create a new cat at <b><code>POST /kittens</code></b> and delete one at <b><code>DELETE /kittens/:id</code></b></p>
      <p>Log in via POST /login or register via POST /register</p>
    `);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// Verifies token with jwt.verify and sets req.user
// TODO - Create authentication middleware
const setUser = async (req, res, next) => {
  try{
  const auth = req.header("Authorization");

  if (!auth) {
       res.sendStatus(401);
    next();
  } else {
    const [, token] = auth.split(" ");
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    
    next();
  }
}   catch (error) {
  console.error(error);
  next(error);
}}
// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password

app.post('/register', async (req, res) => {
try {
  let salt = 10;
  const {username, password} = req.body;
  const hashPw = await bcrypt.hash(password, salt);
  const createUser = await User.create({username, password: hashPw});
  const token = jwt.sign( {id: createUser.id, username: createUser.username}, JWT_SECRET);
  res.send({message: "success", token });
} catch (error) {
  console.error(error);
  next(error);
}
});



// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB
app.post('/login', setUser, async (req, res, next) => {
  try {
    const {username, password} = req.body;
    const findUser = await User.findOne( {where: {username}} );
    // We want the password to match findUser password
    const passwordMatches = await bcrypt.compare(password, findUser.password);
    
  if (passwordMatches) {
    const {id, username } = findUser;
    const token = jwt.sign( {id, username}, JWT_SECRET);
    res.send( {message: "success", token});
  }else {
    res.sendStatus(401).send("user not found");
  }
  
  } catch (error) {
    console.error(error);
    next(error);
  }
  });
// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get("/kittens/:id", setUser, async (req, res, next) => {
  const kittenId = req.params.id;
  try {
    const kitten = await Kitten.findByPk(kittenId);

    if (!req.user) {
      res.statusCode(401);
    } else {
      res.send(kitten);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});

// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post("/kittens", setUser, async (req, res, next) => {
  try {
    if (!req.user) {
      res.statusCode(401);
    } else {
      const ownerId = req.user.id;
      const { name, age, color } = req.body;
      const newKitten = await Kitten.create({ name, age, color, ownerId });

      res.status(201).send(newKitten);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});
// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete("/kittens/:id", setUser, async (req, res, next) => {
  try {
    const kitten = await Kitten.findByPk(req.params.id);

    if (req.user.id != kitten.ownerId) {
      res.statusCode(401);
    } else {
      await kitten.destroy();
      res.sendStatus(204);
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
});
// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
