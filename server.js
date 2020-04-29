const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {PORT = 3333} = process.env;
const app = express();
const fetch = require('node-fetch');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/go-verify', async (req, res) => {

  const secret = '6LcmG-8UAAAAAP8fnWQFegWmC-vOc2Es8tVwF2OQ';
  const body = `secret=${secret}&response=${req.body.response}`;
  console.log('💼 body:', body.split('&'));

  try {

    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body,
    });
    const json = await response.json();
    console.log('---', 'json', json, '---');

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
