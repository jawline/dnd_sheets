const db = require('better-sqlite3')('root.db');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const bcrypt = require('bcrypt');

db.exec('CREATE TABLE IF NOT EXISTS users (id PRIMARY KEY, name TEXT, password TEXT)');
db.exec('CREATE TABLE IF NOT EXISTS sessions(id PRIMARY KEY, uid KEY)');
db.exec('CREATE TABLE IF NOT EXISTS characters (id PRIMARY KEY, owner KEY, name TEXT, details TEXT)');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('./web'));

function createSession(userid) {
  return db.prepare('INSERT INTO sessions(uid) VALUES(?)').run(userid).id;
}

app.get('/', function(req, res) {
  console.log('Get root');
  console.log(req.cookies); 
  if (!req.cookies.sid) {
    res.redirect('/login');
  } else {
    res.render('main');
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {

  console.log('PUT HIT ' + JSON.stringify(req.body));

  const targetUsername = req.body.username;
  const targetPassword = req.body.password;

  const row = db.prepare('SELECT id, name, password FROM users WHERE name=? LIMIT 1').get(targetUsername);
  let user = undefined;

  if (row) {
    console.log('[+] Login found user');
    bcrypt.compare(targetPassword, row.password, (err, correct) => {
      if (correct) {
        console.log('[+] Logged In ' + targetUsername);
        res.cookie('sid', createSession(user.id), { maxAge: 900000 });
        res.redirect('/main');
      } else {
        console.log('[+] Bad password on: ' + targetUsername);
        res.redirect('/login?bad=1');
      }
    });
  } else {
    console.log('[+] Not Found: ' + targetUsername);
    res.redirect('/login?bad=1');
  }
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {

  console.log('Registering');

  const targetUsername = req.body.username;
  const targetPassword = req.body.password;

  const row = db.prepare('SELECT id, name, password FROM users WHERE name=? LIMIT 1').get(targetUsername);
  let user = undefined;

  if (!row) {
    console.log('Registering');
    bcrypt.hash(targetPassword, 16, function(err, hash) {
      if (err) {
        console.log('Bcrypt hash error');
        res.redirect('/register?bad=1');
      }
      const uid = db.prepare('INSERT INTO users(name, password) VALUES(?, ?)').run(targetUsername, hash).id;
      res.cookie('sid', createSession(uid), {maxAge: 900000});
      res.redirect('/main');
    });

  } else {
    console.log('[+] User Already Exists: ' + targetUsername);
    res.redirect('/register?bad=1');
  }
});


app.get('/characters', function(req, res) {
  const characters = db.prepare('SELECT * FROM characters').get();
  res.send(JSON.stringify(characters));
});

var server = app.listen(8080, function () {
  const host = server.address().address
  const port = server.address().port
  console.log("[+] Listening at http://%s:%s", host, port)
});
