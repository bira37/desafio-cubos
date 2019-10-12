'use strict';

const express = require('express');
const app = express();
const rulesRoutes = require('./routes/rules');
const bodyParser = require('body-parser');
const cors = require('cors');
const DataHandler = require('./data/data_handler');

// Startup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//Adding endpoints
app.use('/api/rules', rulesRoutes);

//Start database
DataHandler.startDatabase();

// Start server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`Server listening on port ${PORT}...`));

module.exports = server;