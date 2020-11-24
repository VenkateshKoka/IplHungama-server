const express = require('express');
const {ApolloServer, PubSub} =  require('apollo-server-express');
const http = require('http');
const path = require('path');
const mongoose = require('mongoose');
const { makeExecutableSchema} = require('graphql-tools');
const {loadFilesSync} = require('@graphql-tools/load-files');
const {mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');
const {authCheck, authCheckMiddleware} = require('./helpers/auth');
const cors = require('cors');
const bodyParser = require('body-parser');
const cloudinary = require('cloudinary');
const axios = require('axios');
const request = require('request');

require('dotenv').config();

const pubsub = new PubSub();


// express server
const app = express();

// db connection with mongoDB atlas instance
const db = async () => {
    try {
        const success = await mongoose.connect(process.env.DATABASE, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: true
        });
        console.log('connected to MongoDB atlas');
    } catch (error) {
        console.log('DB connection error', error);
    }
};

//excecute database connection
db();

// middlewares
app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.get('/cbzios/match/schedule', (req, res) => {
    request(
        { url: 'https://mapps.cricbuzz.com/cbzios/series/3130/matches' },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

const upcomingSeriesUrl = "https://dev132-cricket-live-scores-v1.p.rapidapi.com/series.php";
const matchesBySeriesUrl = "https://dev132-cricket-live-scores-v1.p.rapidapi.com/matchseries.php";
const matchLiveUrl = "https://dev132-cricket-live-scores-v1.p.rapidapi.com/matchdetail.php";
const matchUrl = "https://dev132-cricket-live-scores-v1.p.rapidapi.com/match.php";
const commentaryUrl = "https://dev132-cricket-live-scores-v1.p.rapidapi.com/comments.php";

const rapidHeaders = {
    'x-rapidapi-host': "dev132-cricket-live-scores-v1.p.rapidapi.com",
    'x-rapidapi-key': "c77724d1abmsh2c7edfca6d9694ap1d6206jsn2a73b4a5f688"
};

app.get('/rapidapi/matchSeries', (req, res) => {
    var options = {
        method: 'GET',
        url: 'https://dev132-cricket-live-scores-v1.p.rapidapi.com/matchseries.php',
        qs: {seriesid: '2514'},
        headers: {
            ...rapidHeaders,
            useQueryString: true
        },
    };
    console.log('matcheseries rapidapi');
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            return res.status(500).json({ type: 'error', message: error });
        }
        res.json(JSON.parse(body));
    });
    // axios({
    //     "method":"GET",
    //     "url":"https://dev132-cricket-live-scores-v1.p.rapidapi.com/matchseries.php",
    //     "headers":{
    //         "content-type":"application/octet-stream",
    //         "useQueryString":true,...rapidHeaders
    //     },"params":{
    //         "seriesid":"2141",
    //     }})
    //     .then((response)=>{
    //         console.log(response)
    //     }).catch((error)=>{
    //         console.log(error)
    //     })
});

app.get('/rapidapi/match/:matchid', (req, res) => {
    var options = {
        method: 'GET',
        url: matchUrl,
        qs: {seriesid: '2514', matchid:`${req.params.matchid}`},
        headers: {
            ...rapidHeaders,
            useQueryString: true
        },
    };
    console.log(req.params.matchid);
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            return res.status(500).json({ type: 'error', message: error });
        }
        res.json(JSON.parse(body));
    });
});

app.get('/rapidapi/match/:matchid/commentary', (req, res) => {
    var options = {
        method: 'GET',
        url: matchLiveUrl,
        qs: {seriesid: '2514', matchid:`${req.params.matchid}`},
        headers: {
            ...rapidHeaders,
            useQueryString: true
        },
    };
    request(options, (error, response, body) => {
        if (error || response.statusCode !== 200) {
            return res.status(500).json({ type: 'error', message: error });
        }
        res.json(JSON.parse(body));
    });
});

app.get('/cbzios/series/:seriesid', (req, res) => {
    request(
        { url: `https://mapps.cricbuzz.com/cbzios/series/${req.params.seriesid}` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error });
            }
            res.json(JSON.parse(body));
        }
    )
});


app.get('/cbzios/pointtable', (req, res) => {
    request(
        { url: req.headers.pointtableurl },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/series/:seriesid/matches', (req, res) => {
    request(
        { url: req.headers.seriesmatchesurl },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/series/:seriesid/teams', (req, res) => {
    request(
        { url: `https://mapps.cricbuzz.com/cbzios/series/${req.params.seriesid}/teams` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/series/:seriesid/teams/:teamid', (req, res) => {
    request(
        { url: `http://mapps.cricbuzz.com/cbzios/series/${req.params.seriesid}/teams/${req.params.teamid}` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/series/:seriesid/teams/:teamid/squads', (req, res) => {
    request(
        { url: `http://mapps.cricbuzz.com/cbzios/series/${req.params.seriesid}/teams/${req.params.teamid}/squads` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/series/:seriesid/teams/:teamid/matches', (req, res) => {
    request(
        { url: `http://mapps.cricbuzz.com/cbzios/series/${req.params.seriesid}/teams/${req.params.teamid}/matches` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/livematches', (req, res) => {
    request(
        { url: 'https://mapps.cricbuzz.com/cbzios/match/livematches' },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/match/:matchid', (req, res) => {
    request(
        { url: `https://mapps.cricbuzz.com/cbzios/match/${req.params.matchid}` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error.message });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.get('/cbzios/match/:matchid/commentary', (req, res) => {
    request(
        { url: `https://mapps.cricbuzz.com/cbzios/match/${req.params.matchid}/commentary` },
        (error, response, body) => {
            if (error || response.statusCode !== 200) {
                return res.status(500).json({ type: 'error', message: error });
            }

            res.json(JSON.parse(body));
        }
    )
});

app.use(bodyParser.json({limit:'5mb'}));

// graphql types query / mutation / subscription
const typeDefs = mergeTypeDefs(loadFilesSync(path.join(__dirname, './typeDefs')));

// resolvers
const resolvers = mergeResolvers(
    loadFilesSync(path.join(__dirname, "./resolvers"))
);

// Apollo server(graphQL server)
const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({req, res}) => ({req, res, pubsub})
});

// applyMiddleware method connects ApolloServer to a specific HTTP framework ie: express
apolloServer.applyMiddleware({ app });

// server
const httpserver = http.createServer(app);
apolloServer.installSubscriptionHandlers(httpserver);

// rest endpoint
app.get('/rest', authCheckMiddleware, function (req, res) {
    res.json({
        data: 'you hit the rest endpoint'
    });
});

// cloudinary config
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

// upload image
app.post('/uploadimages', authCheckMiddleware, (req, res) => {
    cloudinary.uploader.upload(req.body.image,
        result => {
            console.log(result);
            res.send({
                url: result.secure_url,
                public_id: result.public_id
            })
        },
        {
        public_id: `${Date.now()}`, //public name
        resource_type: 'auto' //JPEG, PNG
        });
});

// remove image
app.post('/removeimage', authCheckMiddleware, (req, res) => {
    let image_id = req.body.public_id

    cloudinary.uploader.destroy(image_id, (error, result) => {
        if(error) return res.json({success: false, error});
        res.send('ok');
    })
})

//port
httpserver.listen(process.env.PORT, function (){
    console.log(`server is ready at http://localhost:${process.env.PORT}`);
    console.log(`graphql server is ready at http://localhost:${process.env.PORT}${apolloServer.graphqlPath}`);
    console.log(`subscription is ready at http://localhost:${process.env.PORT}${apolloServer.subscriptionsPath}`);
});