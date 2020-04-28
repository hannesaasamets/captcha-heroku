const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {PORT = 3333} = process.env;
const app = express();
const got = require('got');

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/go-verify', async (req, res) => {

  const payload = {
    secret: '6LcmG-8UAAAAAP8fnWQFegWmC-vOc2Es8tVwF2OQ',
    ...req.body, // response token
  };
  console.log('💼 payload', payload);

  try {
    const response = await got.post('https://www.google.com/recaptcha/api/siteverify', {
      json: payload,
      responseType: 'json',
    });

    console.log('response', response);
    return res.json({ response });
  } catch (error) {
    console.log('error', error);
    return res.json({ error: error });
  }

});

app.use('/', (req, res) =>
  res.sendFile(path.join(__dirname, './index.html'))
);

app.listen(PORT, () => {
  console.log(`🍏 Listening on ${PORT}`);
});
