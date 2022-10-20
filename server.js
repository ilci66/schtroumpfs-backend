const express = require ('express');
require('dotenv').config();
const mongoose = require('mongoose');
const userRoutes = require('./routes/user/index');
const genericRoutes = require('./routes/generic/index');
const amiRoutes = require('./routes/ami/index');
const cors = require('cors');
var bodyParser = require('body-parser')

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(cors());

app.use('/user', userRoutes);
app.use('/ami', amiRoutes);
app.use('/', genericRoutes);

const port = process.env.PORT || 5000;

mongoose.connect(process.env.URI, {
    useNewUrlParser:true,
    useUnifiedTopology: true,
  }
).then(() => app.listen(port, () => console.log(`App is listening on port: ${port}`))).catch((error) => console.log(error))