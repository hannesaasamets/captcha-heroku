const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const {PORT = 3333} = process.env;
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());

app.post('/go-verify', (req, res) => {
  return res.json({requestBody: req.body});
});

app.use('/', (req, res) =>
  res.sendFile(path.join(__dirname, './index.html'))
);

app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});
