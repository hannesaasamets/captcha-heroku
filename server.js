const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {PORT = 3333} = process.env;
const app = express();
const fetch = require('node-fetch');
const { MongoClient } = require('mongodb');
const uaParser = require('ua-parser-js');
const afterLastSlash = /[^/]+$/;
const MONGODB_DATABASE = process.env.MONGODB_URI.match(afterLastSlash)[0];

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

const collapseDuplicates = (arrOfObj) => {
  const objWithUniqueKeys = arrOfObj.reduce((acc, obj) => {
    const {_id, challenge_timestamp, ...staticEntries} = obj;
    const key = JSON.stringify(staticEntries);

    acc[key] = {
      ...staticEntries,
      _id: obj._id,
      challenge_timestamp: obj.challenge_timestamp,
      duplicates: (acc[key] && acc[key].duplicates + 1) || 1,
    };

    return acc;
  }, {});

  return Object.values(objWithUniqueKeys);
};
app.get('/scores', (req, res) =>
  MongoClient.connect(process.env.MONGODB_URI, function(err, db) {
    if (err) throw err;
    var dbo = db.db(MONGODB_DATABASE);
    dbo.collection("visits").find().toArray((err, visits) => {
      if (err) throw err;
      const collapsedVisits = collapseDuplicates(visits);
      const resJson = collapsedVisits.map(({ score, browser, os, duplicates }) =>
        ({
          score,
          browser,
          os,
          ...(duplicates > 1 && {
            duplicates,
          }),
        })
      );
      res.json(resJson);
      db.close();
    });
  })
);

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
      const dbo = db.db(MONGODB_DATABASE);
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

app.listen(PORT, () => {
  console.log(`🍏 Listening on ${PORT}`);
});
