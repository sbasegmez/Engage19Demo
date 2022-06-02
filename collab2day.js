
// Not used for now. Due to a bug in the FP1 stream, we can't use date parameters.
function getCutOffDateString(daysBefore) {
    const today = new Date();
    const cutOffDate = new Date(today.getTime() - (daysBefore * 24 * 60 * 60 * 1000));

    return cutOffDate.toISOString();
}

// This is to get the latest news from the CollaborationToday
module.exports.getLatestNews = async function (database, request, response) {
    try {
        const newsItems = await database.bulkReadDocuments({

            // DQL Query for approved news
            query: `    form = 'News' 
                            and nstate = 'approved' 
                            and npublicationdate > @dt('2020-01-01')`,
            
            // Query Args is not used for now, as the date parameters will be available on FP2.
            // queryArgs: [ { name: 'cutOff', value: { type: 'datetime', data: getCutOffDateString(30) } } ],

            // Return these items
            itemNames: [
                'nid', 'npublicationdate', 'tid', 
                'ntitle', 'pid', 'nlink', 'nabstract'
            ],
        });

        // return the final list back after further processing.
        response.send(processNewsItems(newsItems.documents));

    } catch (error) {
        console.log(error);
        throw (error);
    }
};

// Internal function to process news item before sending back. 
// docs is the list of documents, incoming from the DQL Response.
const processNewsItems = function (docs) {

    // First step: we map each resulting field to a more suitable field name.
    // External consumers do not need to see the internal names of these fields.
    const result = docs.map(element => {
        return {
            id: element.nid,
            date: element.npublicationdate.data,
            tags: (Array.isArray(element.tid) ? element.tid : [element.tid]),
            title: element.ntitle,
            authorId: element.pid,
            link: element.nlink,
            abstract: element.nabstract
        };
    });

    // Now sorting them in descending date order. This has to be done inside DQL in the future.
    return result.sort(function (first, second) {
        return (new Date(second.date)).getTime() - (new Date(first.date)).getTime();
    });
}

// This is to get all tags from the CollaborationToday.
module.exports.getTags = async function (database, request, response) {
    try {
        const tagItems = await database.bulkReadDocuments({

            // DQL Query for approved news
            query: "form = 'Type'",

            // Return these items
            itemNames: ['tid', 'cid', 'tdisplayname'],
        });

        // Send response after renaming field names to a more suitable ones. 
        response.send(tagItems.documents.map(element => {
            return {
                id: element.tid,
                displayName: element.tdisplayname,
                categoryId: element.cid
            }
        }));

    } catch (error) {
        console.log(error);
        throw (error);
    }
};

// This is to get author objects from the CollaborationToday.
module.exports.getAuthors = async function (database, request, response) {

    // This function has dual mode. Normally it returns all person's. 
    var query = "form = 'person'";
    var queryArgs = [];

    // In case it's called in "/authors/:id" form, there will be 
    // id parameter in the request object. So the query will change.
    if (request.params.id) {
        
        // Always use this format to prevent (D)QL injection...
        query += " and pid = ?id";
        queryArgs.push({ name: 'id', value: request.params.id });
    }

    try {
        const authorItems = await database.bulkReadDocuments({
            query: query,
            queryArgs: queryArgs,
            itemNames: [
                'pid', 'pdisplayname', 'ppicturetype', 'ppictureurl', 'pchampion', 'ptwitter'
            ],
        });

        // Rename field names.
        var result = authorItems.documents.map(processPersonItem);

        // Most developers prefer single item in the JSON if a specific one requested.
        if (request.params.id) {
            if (result.length > 0) {
                result = result[0];
            } else {
                result = null;
            }
        }

        // Send back the response.
        response.send(result);
    } catch (error) {
        console.log(error);
        throw (error);
    }
}

// Processing person items.
var processPersonItem = function (element) {

    // Rename field names.
    return {
        id: element.pid,
        displayName: element.pdisplayname,
        pictureUrl: getPictureUrl(element),
        twitter: element.ptwitter,
        isChampion: (element.pchampion == '1')
    }
}

// Collaboration Today supports different methods for the picture.
// Not implemented.
var getPictureUrl = function (personItem) {
    // FUTURE process others
    return personItem.ppictureurl || '';
}