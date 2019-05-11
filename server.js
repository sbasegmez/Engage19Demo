// express.js stuff...
const express = require('express');
const app = express();

// Get domino-db and related stuff with the configuration...
const domino = require('@domino/domino-db');
const config = require("./config.json");
const ct = require('./collab2day.js');

// Simple templated access for domino. Runs callback function with the database object.
function executeOnDb(callback, errCallback) {
    domino.useServer(config.serverConfig).then(async server => {
        const database = await server.useDatabase(config.databaseConfig);
        callback(database);
    }).catch(error => {
       errCallback(error);
    });
}

// We define a route from a function which takes database, request and response.
// Route function will be defined in the connector module.
function defineRoute(func) {
    return ((req, res) => {
        executeOnDb(async database => {
            await func(database, req, res);
        }, function (error) {
            res.error(error);
        });
    });
}

// Bind each URI to a route.
app.get('/tags', defineRoute(ct.getTags));
app.get('/news', defineRoute(ct.getLatestNews));
app.get('/authors', defineRoute(ct.getAuthors));
app.get('/authors/:id', defineRoute(ct.getAuthors));

// Start the server.
app.listen(config.servicePort);

console.log('API server started on: ' + config.servicePort);
