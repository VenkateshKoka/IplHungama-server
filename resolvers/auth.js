const {gql} = require('apollo-server-express');
const shortid = require('shortid');
const {authCheck} = require('../helpers/auth');
const User = require('../models/user');
const {DateTimeResolver} = require('graphql-scalars');

const profile = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    return await User.findOne({email: currentUser.email}).exec();
};

const publicProfile = async (parent, args, context) => {
    return await User.findOne({username: args.username}).exec();
};

const allUsers = async (parent, args) => await User.find({}).exec();

const userCreate = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    const user = await User.findOne({email:currentUser.email});
    // If a pre-existing user is found, return that user or else create a new user and save it in database
    return user ? user : new User({
        email: currentUser.email,
        username: shortid.generate()
    }).save();
};

const userUpdate = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    const updatedUser = await User.findOneAndUpdate(
        {email: currentUser.email},
        {...args.input},
        {new: true}).exec();
    return updatedUser;
};

module.exports = {
    Query: {
        profile,
        publicProfile,
        allUsers
    },
    Mutation: {
        userCreate,
        userUpdate
    }
}