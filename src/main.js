const db = require('better-sqlite3')('root.db');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')
const exphbs = require('express-handlebars');
const bcrypt = require('bcrypt');

db.exec('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY ASC, name TEXT, password TEXT)');
db.exec('CREATE TABLE IF NOT EXISTS sessions(id INTEGER PRIMARY KEY ASC, uid INTEGER, FOREIGN KEY(uid) REFERENCES users(id))');
db.exec('CREATE TABLE IF NOT EXISTS characters (id INTEGER PRIMARY KEY, owner INTEGER, name TEXT, details TEXT, FOREIGN KEY(owner) REFERENCES users(id))');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('./static/'));

function createSession(userid) {
  return db.prepare('INSERT INTO sessions(uid) VALUES(?)').run(userid).lastInsertRowid;
}

function validSession(sid) {
  if (!sid) {
    return false;
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id=?').get(sid);
  
  return session ? {
    uid: session.uid
  } : undefined;
}

app.get('/', function(req, res) {
  console.log('Get root');
  console.log(req.cookies); 
  if (!req.cookies.sid) {
    res.redirect('/login');
  } else {
    res.redirect('/main');
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

  if (row) {
    console.log('[+] Login found user');
    bcrypt.compare(targetPassword, row.password, (err, correct) => {
      if (correct) {
        console.log('[+] Logged In ' + targetUsername);
        res.cookie('sid', createSession(row.id), { maxAge: 900000 });
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

  const targetUsername = req.body.username;
  const targetPassword = req.body.password;

  const row = db.prepare('SELECT id, name, password FROM users WHERE name=? LIMIT 1').get(targetUsername);
  let user = undefined;

  if (!row) {
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

app.get('/main', function(req, res) {

  if (!validSession(req.cookies.sid)) {
    res.redirect('/');
    return;
  }

  res.render('base');
});

app.get('/new_character', function(req, res) {
  res.render('new_character');
});

app.get('/view_character', function(req, res) {
  res.render('view_character');
});

app.get('/character', function(req, res) {

  const session = validSession(req.cookies.sid);

  if (!session) {
    res.send(JSON.stringify({error: 'Bad Session'}));
    return;
  }
  if (req.query.id) {
    res.send(db.prepare('SELECT * FROM characters WHERE owner=? AND id=?').get(session.uid, req.query.id));
  } else {
    res.send(db.prepare('SELECT * FROM characters WHERE owner=?').all(session.uid));
  }
});

app.post('/character', function(req, res) {
  const session = validSession(req.cookies.sid);
  
  if (!session) {
    res.send({error: 'Bad Session'});
    return;
  }

  if (!req.body.name) {
    res.send({error: 'Bad Name'});
    return;
  }

  let query = null;

  if (req.body.id) {
    //Update
    query = db.prepare('UPDATE characters SET name=?, details=? WHERE id=? AND owner=?')
      .run(req.body.name, JSON.stringify(req.body), req.body.id, session.uid);
  } else {
    //Insert
    query = db.prepare('INSERT INTO characters(owner, name, details) VALUES(?, ?, ?)')
      .run(session.uid, req.body.name, JSON.stringify(req.body));
  }

  console.log('[+]' + req.body.name);

  res.send({ id: query.lastInsertRowid });
});

var server = app.listen(8080, function () {
  const host = server.address().address
  const port = server.address().port
  console.log("[+] Listening at http://%s:%s", host, port)
});
