const body_parser = require('body-parser');
const cors = require('cors');
const appRouter = require('./router.js');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);

app.use(express.json());
app.use(body_parser.urlencoded({ extended: true }));
app.use(body_parser.json());
app.use(cors());
app.use('/api', appRouter);


app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
});

var port = process.env.PORT || 8084;
app.listen(port);
console.log('Tracking Link Node Running: ' + port);


//USE MONGODB DATABASE
const config = require('./config_mongo')
config.connectDB();


//USE ENV 
require('dotenv').config({ path: './config.env' });
// console.log(process.env)
