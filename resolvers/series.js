const Series = require('../models/series');
const request = require('request');


// queries
const seriesDetails = async (parent, args) => {
    const series =  await Series.findOne({id: args.seriesId}).exec();
    if(!series.id) {
        request(
            { url: `https://mapps.cricbuzz.com/cbzios/series/${args.seriesId}` },
            (error, response, body) => {
                if (error || response.statusCode !== 200) {
                    return res.status(500).json({ type: 'error', message: error });
                }
                return (JSON.parse(body));
            }
        )
    } else {
        return series;
    }
};


// mutations
const seriesCreate = async (parent, args, context) => {
    // validation
    //     id: String!
    //     seriesMeta: SeriesMetaInput!
    //     tabs: [SeriesTabInput]
    if(args.input.id === '') throw new Error('Series id is required');

    let newSeries = await new Series(
        {
        ...args.input
        })
        .save();

    // await context.pubsub.publish(POST_ADDED, {postAdded: newPost});

    return newSeries;
}

module.exports = {
    Query: {
        seriesDetails,
    },
    Mutation: {
        seriesCreate,
    }
}