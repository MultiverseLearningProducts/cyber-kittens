const express = require('express');
const bcrypt = require('bcrypt');
const app = express();
const { User, Kitten } = require('./db');



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
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
require('dotenv').config();
// TODO - Create authentication middleware
const setUser = async (req, res, next) => {

  const auth = req.header("Authorization");

  if (!auth) {
    next();
  } else {
    const [, token] = auth.split(" ");
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    
    next();
  }

}
// POST /register
// OPTIONAL - takes req.body of {username, password} and creates a new user with the hashed password

app.post('/register', async (req, res, next) => {


  const {username, password} = req.body;
  const hashPw = await bcrypt.hash(password, 8);
  const createUser = await User.create({username, password: hashPw});
  const token = jwt.sign({id: createUser.id, username: createUser.username}, JWT_SECRET);
  res.send({message: "success", token});
} );



// POST /login
// OPTIONAL - takes req.body of {username, password}, finds user by username, and compares the password with the hashed version from the DB
app.post('/login', async (req, res, next) => {
 
    const {username, password} = req.body;
    const findUser = await User.findOne({where: {username}});
    // We want the password to match findUser password
    const passwordMatches = await bcrypt.compare(password, findUser.password);
    
  if (passwordMatches) {
    const {id, username } = findUser;
    const token = jwt.sign( {id, username}, JWT_SECRET);
    res.send( {message: "success", token});
  }else{
    res.sendStatus(401)
  
  
  
  }
  });
// GET /kittens/:id
// TODO - takes an id and returns the cat with that id
app.get("/kittens/:id",setUser,  async (req, res, next) => {
if (!req.user) {
      res.sendStatus(401);
      } else {  
        const kittenId = req.params.id;

        const kitten = await Kitten.findByPk(kittenId);
        
        const { age, color, name } = kitten
      
        if (!kitten || kitten.ownerId != req.user.id) {
          res.sendStatus(401)
        } else {
          res.send({
            age,
            color,
            name   		})
          }
        }
      })
// POST /kittens
// TODO - takes req.body of {name, age, color} and creates a new cat with the given name, age, and color
app.post("/kittens", setUser, async (req, res) => {

    if (!req.user) {
      res.sendStatus(401);
    } else {
      const { name, age, color } = req.body

      const newKitten = await Kitten.create({ name, age, color })
  
      res.status(201).send({
        name: newKitten.name,
        age: newKitten.age,
        color: newKitten.color
      })
    
  }
});
// DELETE /kittens/:id
// TODO - takes an id and deletes the cat with that id
app.delete("/kittens/:id", setUser, async (req, res, next) => {
	if (!req.user) {
		res.sendStatus(401)
	} else {
		const kittenID = req.params.id
		const foundKitten = await Kitten.findByPk(kittenID)

		if (!foundKitten || foundKitten.ownerId != req.user.id) {
			res.send(401)
		} else {
			await foundKitten.destroy()
			res.sendStatus(204)
    }
    }});

// error handling middleware, so failed tests receive them
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
