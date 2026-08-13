const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({

    image:{
        type: String,
        default: 'image.png'
    },
  
    username: {
        type: String,
        unique:true,

    },
    email: {
        type: String,
        unique:true,
    },
    password: String,
    avatar: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verified:{
        type:Boolean,
        default:false
    },
    postCount: {
        type: Number,
        default: 0
    },
    followersCount: {
        type: Number,
        default: 0
    },
    followingCount: {
        type: Number,
        default: 0
    }
});

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;