
// Import Terminal
const config = require("./config.json");

// Import domino-db
const domino = require('@domino/domino-db');

// Create server object
domino.useServer(config.serverConfig).then(async server => {

    // Create Collaboration Today database to connect
    const database = await server.useDatabase(config.databaseConfig);
    
    // DQL Search for the latest news
    const latestNews = await database.bulkReadDocuments({

        // Query for the approved news
        query: `form = 'News' 
                    and nstate = 'approved' 
                    and npublicationdate > @dt('2019-05-01')`,

        // Return these fields
        itemNames: [
            'npublicationdate', 'tid', 'ntitle', 
            'pid', 'nlink', 'nabstract'
        ],
    });

    console.log(JSON.stringify(latestNews, null, 2));

}).catch(error => {
    console.error(error);
});
