const express = require('express');
const path = require('path');
const app = express();
const cors = require('cors');
const hookJWTStrategy = require('./app/services/passportStrategy');
const useragent = require('express-useragent');
const bodyParser = require('body-parser');
const { appConfig } = require("./app/helpers/app");
const passport = require('passport');
app.use(useragent.express());
app.use(cors());

app.use(bodyParser.json({limit: '1024mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '8192mb'}));

require('./app/services/passportStrategy')(passport);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(passport.initialize());
hookJWTStrategy(passport);

app.all('*', (req, res, next) => {
  if (appConfig.debug_url) {
    const url_parts = url.parse(req.url, true);
    const query = url_parts.query;
    fs.appendFile('log_request.log', req.url + ': ' + JSON.stringify(query) + "\n", (err) => {
      if (err) throw err;
    });
  }

  req.header("Authorization");
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization ,Accept');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Expose-Headers', 'Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// Add the CSP header   app.use(     helmet.contentSecurityPolicy({       directives: {

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use('/', require('./app/routes/api')(passport));

app.get('/', (req, res) => {
  res.send('backend connected');
});

app.use('/', require('./app/telco_api_services/api')(passport))

app.listen(3001, () => {
});
