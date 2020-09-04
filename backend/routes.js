const express = require('express');

module.exports = (app) => {
    const controller = require('./controller');

    var router = express.Router();

    router.post('/signup', controller.signUpUser)
    router.post('/login', controller.loginUser)
    
    router.post('/posts', controller.createPost)
    router.get('/posts', controller.getPosts)
    router.post('/posts/:id', controller.addComment)

    app.use('/api', router)
}