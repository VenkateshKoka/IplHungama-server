const {gql} = require('apollo-server-express')

module.exports = gql`

    type SeriesMeta {
        start_date: String
        end_date: String
        name: String
        series_category: String
        id: String
    }
    type SeriesTab {
        id: String
        header: String
        url: String
        default: String
    }
    
    type Series {
        _id: ID!
        id: String!
        series: SeriesMeta!
        tabs: [SeriesTab]
    }
    
    input SeriesMetaInput {
        start_date: String
        end_date: String
        name: String
        series_category: String
        id: String
    }
    
    input SeriesTabInput {
        id: String
        header: String
        url: String
        default: String
    }
    
    # input type
    input SeriesCreateInput {
        id: String!
        series: SeriesMetaInput!
        tabs: [SeriesTabInput]
    }
    
    type Query {
        seriesDetails(seriesId:String!): Series!
    }
    
    type Mutation {
        seriesCreate(input: SeriesCreateInput!): Series!
    }
    
`;