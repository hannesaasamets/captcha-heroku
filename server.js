const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {PORT = 3333} = process.env;
const app = express();
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const uaParser = require('ua-parser-js');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/go-verify', async (req, res) => {

  const body = `secret=${process.env.CAPTCHA_SECRET}&response=${req.body.response}`;
  console.log('💼 body:', body.split('&'));

  try {

    const ua = uaParser(req.headers['user-agent']);
    console.log('user-agent', ua);

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
    });
    const json = await response.json();
    console.log('---', 'json', json, '---');

    json.success && MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
      if (err) throw err;
      const dbo = db.db(process.env.MONGODB_DATABASE);
      const visit = {
        score: json.score,
        browser: `${ua.browser.name} ${ua.browser.major}`,
        browser_version: ua.browser.version,
        os: `${ua.os.name} ${ua.os.version}`,
        engine: `${ua.engine.name} ${ua.engine.version}`,
        ua: req.headers['user-agent'],
        challenge_timestamp: json.challenge_ts,
      };
      dbo.collection("visits").insertOne(visit, function(err, res) {
        if (err) throw err;
        console.log("1 document inserted");
        db.close();
      });
    });

    return await res.json(json);
  } catch (error) {
    console.log('error', error);

    return await res.json({ error: error });
  }

});

app.use('/', (req, res) =>
  res.sendFile(path.join(__dirname, './index.html'))
);

app.use('/scores', (req, res) =>
  res.text('some text')
);

app.listen(PORT, () => {
  console.log(`🍏 Listening on ${PORT}`);
});
