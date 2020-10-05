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