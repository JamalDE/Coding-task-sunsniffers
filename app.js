// Import necessary dependencies
var express = require('express');
var app = express();
var fs = require('fs');
const path = require('path');
const compress = require('compression');
var tsv = require('tsv');
var parsedData = {};
var score = require('string-score');
const res = require('express/lib/response');


// Set /build as our static content directory
const publicPath = path.join(__dirname, 'build');

// Point the app to our static assets
app.use(express.static(publicPath));

// Automatically gzip compresses all of our HTTP body data
app.use(compress());

// Read in TSV and parse data
fs.readFile("./data/cities_canada-usa.tsv", "utf8", function(error, data) {
    parsedData = tsv.parse(data);
});

// saveData(parsedData);

const calculateDistance = (lat1,lat2,lon1,lon2)=> {
          
        lon1 =  lon1 * Math.PI / 180;
        lon2 = lon2 * Math.PI / 180;
        lat1 = lat1 * Math.PI / 180;
        lat2 = lat2 * Math.PI / 180;
   
        // Haversine formula
        let dlon = lon2 - lon1;
        let dlat = lat2 - lat1;
        let a = Math.pow(Math.sin(dlat / 2), 2)
                 + Math.cos(lat1) * Math.cos(lat2)
                 * Math.pow(Math.sin(dlon / 2),2);
               
        let c = 2 * Math.asin(Math.sqrt(a));
   
        // Radius of earth in kilometers. Use 3956
        // for miles
        let r = 6371;
   
        // calculate the result
        return(c * r);
}

// Get the string score
getScore = (data, term) => {
    var suggestions = [];

    // Create and push new object with score
    data.map(city => {
        suggestions.push ({
            name: city.name,
            latitude: city.lat,
            longitude: city.long,
            distance: calculateDistance(city.lat, data[0].lat, city.long, data[0].long),
        });
    });

    // Sort in asscending order
    suggestions.sort(function(a,b) {
        return a.score  -  b.score;
    });

    return  suggestions;
}

// GET: '/'
// Provides auto-complete suggestions for large cities
// in USA + Canada with a population above 5000 people
// CHECK: NOT COMPLETE
app.get('/suggestions/:q', (req, res, next) => {

    let searchTerm = req.params.q.trim();
    console.log(searchTerm);
    // console.log(parsedData);
    if (searchTerm.length > 0) {
        
        const filteredCities = parsedData.filter(city => {
            return ((city.population > 5000) && ((city.name.toLowerCase().includes(searchTerm) || city.alt_name.toLowerCase().split(",").includes(searchTerm))))
        });
        res.send(getScore(filteredCities, searchTerm));
    } else {
        res.send("Invalid search term");
    }
});

// Setup port
var port = process.env.PORT || 3000;
app.listen(port);
console.log('Server running at http://localhost:%d/', port);

module.exports = app;
