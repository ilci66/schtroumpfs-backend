const express = require ('express');
require('dotenv').config();
const mongoose = require('mongoose');
const routes = require('./routes/index.js')
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({"extended":true}))

app.use('/', routes);

const port = process.env.PORT || 5000;

mongoose.connect(process.env.URI, {
    useNewUrlParser:true,
    useUnifiedTopology: true,
  }
).then(() => app.listen(port, () => console.log(`App is listening on port: ${port}`))).catch((error) => console.log(error))