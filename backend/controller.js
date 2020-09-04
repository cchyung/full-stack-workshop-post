const {
    user,
    post,
    comment
} = require('./models');

const signUpUser = async (req, res) => {
    newUser = await user.create({username: req.body.username})
    res.send(`user ${newUser.username} successfully created!`)
}

const loginUser = async (req, res) => {
    try {
        loggedInUser = await user.findOne({where: {username: req.body.username}})
        res.status(200).send({message: "login successful"})
    } catch (err) {
        res.status(500).send({message: "could not log in with supplied username"})
    }
    
}

const createPost = async (req, res) => {
    const reqUser = await user.findOne({where: {username: req.body.username}})
    await post.create({userID: reqUser.id, contents: req.body.contents})
    res.send({message: "post successfully created!"})
}

const getPosts = async (req, res) => {
    posts = await post.findAll({include: [{model: user}, {model: comment, include: {model: user}}],})
    res.send(posts)
}

const addComment = async (req, res) => {
    const reqUser = await user.findOne({ where: { username: req.body.username } })
    const newComment = await comment.create({ userID: reqUser.id, postID: req.params.id, contents: req.body.contents })
    res.send({message: "comment successfully added!"})
}

module.exports = {
    signUpUser,
    loginUser,
    createPost,
    getPosts,
    addComment
}