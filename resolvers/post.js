const {gql} = require('apollo-server-express');
const {authCheck} = require('../helpers/auth');
const posts = require('../temp');
const {DateTimeResolver} = require('graphql-scalars');
const User = require('../models/user');
const Post = require('../models/post');

// subscriptions
const POST_ADDED = 'POST_ADDED';
const POST_UPDATED = 'POST_UPDATED';
const POST_DELETED = 'POST_DELETED';

// queries
const singlePost = async (parent, args) => {
    return await Post.findById({_id: args.postId})
        .populate('postedBy', '_id username')
        .exec();
}

const postsByUser = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    }).exec();

    return await Post.find({postedBy: currentUserFromDb._id})
        .populate('postedBy', '_id username')
        .sort({createdAt: -1})
        .exec();

};

const allPosts = async (parent, args) => {
    const currentPage = args.page || 1;
    const perPage = 3;
    return await Post.find({})
        .skip((currentPage-1) * perPage)
        .populate('postedBy', '_id username')
        .limit(perPage)
        .sort({createdAt: -1})
        .exec();
}

const totalPosts = async (parent, args) => {
    return await Post.find({}).estimatedDocumentCount().exec();
}

const searchPosts = async (parent, args) => {
    return await Post.find({$text: {$search: args.query}})
        .populate('postedBy', 'username')
        .exec();
}

// mutations
const postCreate = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);

    // validation
    if(args.input.content.trim() === '') throw new Error('Content is required');

    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    });
    let newPost = await new Post({
            ...args.input,
            postedBy: currentUserFromDb._id
        })
        .save()
        .then(post => post.populate('postedBy', '_id username').execPopulate());

    await context.pubsub.publish(POST_ADDED, {postAdded: newPost});

    return newPost;
}

const postUpdate = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    // validation
    if(args.input.content.trim() === '') throw new Error('Content is required');
    // get current user mongodb _id based on email
    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    }).exec();
    // _id of post to update
    const postToUpdate = await Post.findById({_id: args.input._id}).exec();
    // if currentuser id and id of the post's postedBy user id is same, allow update
    if(currentUserFromDb._id.toString() !== postToUpdate.postedBy._id.toString()) {
        throw new Error('Unauthorized update of the post')
    }
    let updatedPost = await Post
        .findByIdAndUpdate(args.input._id, {...args.input}, {new: true})
        .exec()
        .then(post => post.populate('postedBy', '_id username').execPopulate());

    await context.pubsub.publish(POST_UPDATED, {postUpdated: updatedPost});

    return updatedPost;
}

const postDelete = async (parent, args, context) => {
    const currentUser = await authCheck(context.req);
    // get current user mongodb _id based on email
    const currentUserFromDb = await User.findOne({
        email: currentUser.email
    }).exec();
    const postToDelete = await Post
        .findById({_id: args.postId})
        .exec()
        .then(post => post.populate('postedBy', '_id username').execPopulate());
    // if currentuser id and id of the post's postedBy user id is same, allow update
    if(currentUserFromDb._id.toString() !== postToDelete.postedBy._id.toString()) {
        throw new Error('Unauthorized deletion of the post')
    }

    await context.pubsub.publish(POST_DELETED, {postDeleted: postToDelete});

    return await Post.findByIdAndDelete({_id: args.postId}).exec();
}

module.exports = {
    Query: {
        allPosts,
        postsByUser,
        singlePost,
        totalPosts,
        searchPosts
    },
    Mutation: {
        postCreate,
        postUpdate,
        postDelete
    },
    Subscription: {
        postAdded: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator([POST_ADDED])
        },
        postUpdated: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator([POST_UPDATED])
        },
        postDeleted: {
            subscribe: (parent, args, {pubsub}) => pubsub.asyncIterator([POST_DELETED])
        },

    }
}