# Getting Started
Start by making a folder for where your project is going to live:  
`$ mkdir full-stack-workshop`

Make two folders for both the frontend and backend:  
`$ mkdir backend`
`$ mkdir frontend`

# Backend
## Initialization
Lets start with building the backend API that our app is going to communicate with.

In `backend` run  
`$ npm init`   
and answer the various questions.

Next, create `index.js` in the root of the project.  This will serve as the entry point for the backend:  
`$ touch index.js`

Next, install the following packages:  
`$ npm install --save express nodemon cors pg sequelize body-parser`

The function of these different packages will be explained as we build out the backend.

In `index.js` add the following code which will setup the express server to accept incoming http requests, as well as configure some other important settings:
```javascript
const express = require('express')
const bodyParser = require('body-parser')
var cors = require('cors')

const port = process.env.PORT || "3000"

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(port, () => {
    console.log(`Server started.  Listening on port ${port}`)
})

app.get("/", (req, res) => {
    res.json({message: "Welcome to the TikTak REST API"}) 
})
```

## Database Initialization
Next, we are going to set up the database to store users, posts, and comments.

This project will make use of the `sequelize` library.  This lets our node application communicate with a sql-based database without having to write raw sql queries ourselves.  

Sequelize comes with a cli that automatically generates model and migration files to communicate with the database. 

To initialize sequelize:  
`$ npx sequelize-cli init`

This will create several folders, as well as a config file which tells sequelize how to connect to the database.

In `config/config.json` write the following:

```json
{
  "development": {
    "database": "tiktak",
    "host": "127.0.0.1",
    "dialect": "postgres"
  }
}
```

### Creating Models
Now we will create the actual tables in the database.  We can use `sequelize-cli` for that too, starting with the User object:
`$ npx sequelize-cli model:generate --name user --attributes username:string`

This creates `user.js` in `models/`, and a migration file in `migrations/`.  

The model file tells node what to expect the object to look like as it's stored in the database.  The migration file deals with actually creating the table in the database, and includes several other fields by default including when the object was created, last edited, etc. 

Next we will create models for comments and posts:  
`$ npx sequelize-cli model:generate --name comment --attributes contents:string,postID:integer,userID:integer`  
`$ npx sequelize-cli model:generate --name post --attributes contents:string,userID:integer`  

### Defining Relationships
Note that for the post and comment models we added a `userID` field and a `postID` field.  These fields will be used to establish a relationship between a post and a user, and between a comment and a post.  That way, we can figure out who wrote what comment or post, and what comments belong to a specific post.  

In `models/post.js` add the following code inside `static associate(models) { }`:  

```javascript
...
    static associate(models) {
      // define association here
      post.belongsTo(models.user, {
        foreignKey: 'userID',
        onDelete: 'CASCADE'
      })

      post.hasMany(models.comment, {
        foreignKey: 'postID'
      })
    }
...
```

This tells sequelize that each post belongs to a specific user through the `userID` field.  It also says that a post has many comments, defined through the comment's `postID` field

Next, in `models/comment.js`:

```javascript
...
static associate(models) {
    // define association here
    comment.belongsTo(models.user, {
    foreignKey: 'userID',
    onDelete: 'CASCADE'
    })

    comment.belongsTo(models.post, {
    foreignKey: 'postID',
    onDelete: 'CASCADE'
    })
}
...
```

We still have to make changes to the migration files as well.  

In the `create-post.js` migration, add the following information to the `userID` field:

```javascript
userID: {
    type: Sequelize.INTEGER,
    onDelete: 'CASCADE',
    references: {
        model: 'users',
        key: 'id',
        as: 'userID'
    }
},
```

In the `create-comment.js` migration, add the following to the `userID` and `postID` fields:

```javascript
postID: {
    type: Sequelize.INTEGER,
    onDelete: 'CASCADE',
    references: {
        model: 'posts',
        key: 'id',
        as: 'postID'
    }
},
userID: {
    type: Sequelize.INTEGER,
    onDelete: 'CASCADE',
    references: {
        model: 'users',
        key: 'id',
        as: 'userID'
    }
},
```

`onDelete: 'CASCADE'` tells the database that when a parent object is deleted, it should cascade down to child objects as well. In this case, that means that if a user is deleted, all the associated comments and posts will also be removed from the database.

Finally, now that our database is complete, let's make the database accessible to the rest of the app by adding the following to the top of `index.js`
```javascript
const db = require('./models')
```

Now that our database is defined, we can initialize and run migrations to actually create these tables in postgres:
`$ npx sequelize-cli db:init`
`$ npx sequelize-cli db:migrate`

If we run  
`$ psql tiktak` 
we can look at the tables that we created with  
`tiktak=# \dt`

### Seeders
If we want to prepopulate the database with dummy data to work with, we can use a seeder.  To generate one, run:  
`$ npx sequelize-cli seed:generate --name init`

This will create a file in `seeders/`

If we open that file up, we can add the following code to populate our database:
```javascript
'use strict';
const { user, post, comment } = require('../models')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const user1 = await user.create({
      username: "cchyung"
    })

    const user2 = await user.create({
      username: "johndoe123"
    })

    const post1 = await post.create({
      contents: 'hello world',
      userID: user1.id
    })

    const post2 = await post.create({
      contents: 'this is a second post',
      userID: user2.id
    })

    const comment1 = await comment.create({
      contents: "wow!",
      userID: user1.id,
      postID: post2.id
    })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users')
    await queryInterface.bulkDelete('posts')
    await queryInterface.bulkDelete('comments')
  }
};
```

## Controller
Next we will move onto controller logic for the API.

Create `controller.js` in the root of the project.  This file deals with handling incoming connections, running business logic, and making queries to the database.

In `controller.js` lets add the following code:

```javascript
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
```

First, we are importing the models which will let us query the database.  In `signUpUser()` we take the username from the body of the http request, and create a new user object.  Note, because database queries are asynchronous we use `await`.  You can also uses promises instead! 

Next, we can add controller logic for creating and fetching posts and comments, as well as export each method from the module.

```javascript
...
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
```

## Routes
Finally, we can define routes.  These will be the actual paths that you will make HTTP requests to.

Create a `routes.js` file:  
`$ touch routes.js`

And add the following code:
```javascript
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
```

Finally, add the following to the bottom of `index.js`
```javascript
require("./routes")(app);
```


## Testing
Now that we have our API fully built, we can use a tool like postman to actually test our API out.

### Getting All Posts
By hitting `api/posts` with a `GET` request, we can get the feed of all posts:
[](blog-assets/get%20posts%20postman.png)

By posting to `api/posts` with `username` and `contents` fields, we can create a new post:
[](blog-assets/create%20post%20postman.png)


# Frontend
With the backend API complete, we are able to start working on the frontend interface that users will interact with. 

We'll start with creating a static version that reads from hardcoded data, and then connect the two pieces together.

## Initialization
We will use `create-react-app` to generate boilerplate code for our front end:

`$ npx create-react-app frontend`  

To start running the app, we can run
`$ npm start`  
from inside the newly created project.

Let's install the following packages:
`$ npm install --save react-router-dom styled-components axios`

`react-router-dom` is the library that deals with navigation in our app
`axios` is the HTTP client we will use to make AJAX calls to the backend
`styled-components` is a library that allows for styling jsx elements in javascript efficiently

## Navigation
Let's start with configuring navigation for our app.  We will need to have two separate screens, one for signup/login and one for the main feed.

First let's create two files `Feed.js` and `SignUp.js`:


```javascript
//Feed.js
import  React, { useEffect, useState } from "react";
import styled from "styled-components";

const Feed = () => {
    return(<p>This is the feed</p>)
}

export default Feed
```

```javascript
//Feed.js
import  React, { useEffect, useState } from "react";
import styled from "styled-components";

const SignUp = () => {
    return(<p>This is where you will sign up</p>)
}

export default SignUp
```
These will just be placeholders while we build out the rest of our app.


Inside `App.js`, the main screen for our app, add the following code:
```javascript
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import styled from "styled-components";

import Feed from "./Feed"
import SignUp from "./SignUp"

const AppTitle = styled.h1`
  text-align: center;
`

function App() {
  return (
    <Router>
      <AppTitle>
        TikTak
      </AppTitle>
      <Switch>
        <Route path='/signup'>
          <SignUp />
        </Route>
        <Route path='/'>
          <Feed />
        </Route>
      </Switch>
    </Router>
  );
}
```

Here, we setup routing inside our app, import necessary libraries as well as the dummy screens we created before.  
Note `const AppTitle`.  This is using styled-components to style a title that goes at the top of the page.  We can define the type of html element we want the object to be, and then reference it as if were just a regular react component.

This is what you should see as of now:
[](blog-assets/frontend%20screenshot%20initial.png)

## Building out the Feed
Now we can start building out the presentational components of the feed.  

First we are going to add some dummy data that we can reference.  This was pulled straight from the `api/posts` response from the API.

```javascript
const dummyPosts = [
    {
        "id": 2,
        "contents": "this is a second post",
        "userID": 2,
        "score": 1,
        "createdAt": "2020-08-31T22:09:29.756Z",
        "updatedAt": "2020-08-31T22:09:29.756Z",
        "user": {
            "id": 2,
            "username": "johndoe123",
            "createdAt": "2020-08-31T22:09:29.752Z",
            "updatedAt": "2020-08-31T22:09:29.752Z"
        },
        "comments": [
            {
                "id": 1,
                "contents": "wow!",
                "postID": 2,
                "userID": 1,
                "createdAt": "2020-08-31T22:09:29.758Z",
                "updatedAt": "2020-08-31T22:09:29.758Z",
                "user": {
                    "id": 1,
                    "username": "cchyung",
                    "createdAt": "2020-08-31T22:09:29.719Z",
                    "updatedAt": "2020-08-31T22:09:29.719Z"
                }
            }
        ]
    },
    {
        "id": 1,
        "contents": "hello world",
        "userID": 1,
        "score": 1,
        "createdAt": "2020-08-31T22:09:29.754Z",
        "updatedAt": "2020-08-31T22:09:29.754Z",
        "user": {
            "id": 1,
            "username": "cchyung",
            "createdAt": "2020-08-31T22:09:29.719Z",
            "updatedAt": "2020-08-31T22:09:29.719Z"
        },
        "comments": []
    }
]
```

Next we can define what an individual post is going to look like:
```javascript
const StyledPost = styled.div`
    display: flex;
    margin: 20px 0;
    .see-more {
        margin: 0 20px;
        p {
            font-size: 30px;
            margin: 0;
            height: 100%;
            display: block;
            cursor: pointer;
        }
    }

    .details {
        .contents {
            font-size: 20px;
            margin: 0px;
        }

        .username {
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
        }

        .comments {
            margin-left: 20px;
            color: slategray;
        }
    }

    input {
        margin: 10px 0;
    }
`

const Post = ({id, contents, username, comments}) => {
    const [showComments, setShowComments] = useState(false)

    return (
        <StyledPost>
            <div className='details'>
                <p className='contents'>{ contents }</p>
                <p className='username'>{ username }</p>
            </div>
        </StyledPost>
    )
}
```

We want to be able to hide and show each post's comments, so let's use react hooks to establish that functionality.

First we'll create a `CommentList` component inside the same file:  
```javascript
const Comment = ({contents, username}) => {
    return (
        <StyledComment>
            {username} says: {contents}
        </StyledComment>
    )
}

const CommentList = ({comments}) => {
    if(comments.length == 0) {
        return (
            <>
                <h3>Comments</h3>
                <p>No comments for this post.</p>
            </>
        )
    }
    else {
        return (
            <>
                <h3>Comments</h3>
                { comments.map((comment) => (
                    <Comment contents={ comment.contents } username={ comment.user.username }/>
                )) }
            </>
        )
    }
}
```

And we'll reference that in the `Post` component
```javascript
const Post = ({id, contents, username, comments}) => {
    const [showComments, setShowComments] = useState(false)

    return (
        <StyledPost>
            <div className='see-more'>
                <p onClick={ toggleShowComments }>{showComments ? "-" : "+"}</p>
            </div>
            <div className='details'>
                <p className='contents'>{ contents }</p>
                <p className='username'>{ username }</p>
                <div className='comments'>
                    { showComments ? 
                        <>
                            <CommentList comments={ comments }/>                            
                        </> :
                        ""
                    }
                </div>
            </div>
        </StyledPost>
    )
}
```

When the user clicks on the +, the state is toggled to true, and comments are displayed.


Now, to make the actual feed that will hold all of these posts:
```javascript
const StyledFeed = styled.div`
    width: 50%;
    max-width: 750px;
    margin: 0 auto;

    .top-msg {
        display: block;
        margin: 0 auto;
        text-align: center;
    }
`

const Feed = () => {
    const [posts, setPosts] = useState(dummyPosts)
    
    return (
        <StyledFeed>
            <h2>
                Posts
            </h2>
            
            {
                posts.map((post) => (
                    <Post key={ post.id } id={ post.id } contents={ post.contents } username={ post.user.username } comments={ post.comments }/>
                ))
            }
        </StyledFeed>
    )
}
```
Note, we use `useState(dummyPosts)` to initialize the posts to the dummy data we have hardcoded above.  Later, we will change this to be populated by an API call.

Here's what we should have so far:
[](blog-assets/frontend%20screenshot%20initial.png)

## Connecting the API
Let's create the client for connecting to the API.
Create a new folder called `util` and create a file called `client.js`.

```javascript
// client.js
import axios from "axios";

const ROOT_URL = 'http://localhost:3000/api'

export default class Client {
    static getPosts = () => {
        return axios.get(ROOT_URL + '/posts')
    }

    static createPost = (contents, username) => {
        const body = {
            contents: contents,
            username: username
        }

        return axios.post(ROOT_URL + '/posts', body)
    }

    static addComment = (contents, postID, username) => {
        const body = {
            contents: contents,
            username: username
        }
        return axios.post(ROOT_URL + '/posts/' + postID, body)
    }

    static signUp = (username) => {
        return axios.post(ROOT_URL + '/signup', {username: username})
    }

    static login = (username) => {
        return axios.post(ROOT_URL + '/login', {username: username})
    }
}
```

Here, we create API calls to get posts from the API, create posts and add comments to posts.  We've also created two more calls for sign up and login at the bottom.  This is the library code we will use to reach out to the API from react.

### Fetching Posts from the API
To start fetching posts from the API, add the following code to the `Feed` compnoent
```javascript
// Feed.js
const Feed = () => {
    ...
    useEffect(() => {
        getPosts()
    }, [])

    const getPosts = () => {
        Client.getPosts().then((res) => {
            setPosts(res.data)
        })
    }
    ...
}
```

`getPosts()` makes a call to the API, and uses the `setState` hook to populate the post data from the API. 

`useEffect()` is a hook that gets called everytime the UI is updated, including the first time the component loads.  We call `getPosts()` inside of use effect so that when the component is loaded for the first time, we fetch posts and populate them on the UI.

### Creating Posts
To allow the user to start creating posts, we want to add some form elements and a new state variable to track what the user has typed in.  We will also want to create a new method to call the `createPost()` method in `Client.js`:

```javascript
// Feed.js
const Feed = () => {
    const [postContents, setPostContents] = useState("");

    const createPost = () => {
        if(postContents !== "") {
            Client.createPost(postContents, "dummyUsername").then(() => {
                setPostContents("")
                getPosts()
            })
        } 
    }
    ...
    return (
        <StyledFeed>
            <h2>
                Posts
            </h2>
            <input placeholder='New post' value={ postContents } onChange={ (event) => {setPostContents(event.target.value)} }></input>
            <button onClick={ createPost }>Submit</button>
            {
                posts.map((post) => (
                    <Post key={ post.id } id={ post.id } contents={ post.contents } username={ post.user.username } comments={ post.comments } getPosts={ getPosts }/>
                ))
            }
        </StyledFeed>
    )
}
```

We add the `postContents` state variable which will track what the user enters into the input field.

When the user clicks submit, `createPost()` gets called which tells the API to create a new post in the database. 

Note, we have hardcoded the username in our call to `Client.createPost()` - we will change that once we implement signing in functionality!

We are also passing down `getPosts()` as a prop to the `Post` component. This will allow us to update the feed when the user adds a comment to a specific post.  This is easier than having to rewrite that logic in a lower component.

You should now be able to submit a new post and have it show up in the feed!

### Adding Comments
Now, let's add functionality for the user to add comments to a post.

We will follow a similar pattern where we add an input field, a submit button, and a new state variable to track user input.  We will also add a new method to call `Client.addComment()`

Let's add the following code to the `Post` component:
```javascript
//Feed.js
...
const Post = ({id, contents, username, comments, getPosts}) => {

    const [commentContents, setCommentContents] = useState("")
    
    const createComment = () => {
        if(commentContents !== "") {
            Client.addComment(commentContents, id, "dummyUsername").then(() => {
                getPosts();
            })
        } 
    }

    ...

    return (
        <StyledPost>
            <div className='see-more'>
                <p onClick={ toggleShowComments }>{showComments ? "-" : "+"}</p>
            </div>
            <div className='details'>
                <p className='contents'>{ contents }</p>
                <p className='username'>{ username }</p>
                <div className='comments'>
                    { showComments ? 
                        <>
                            <CommentList comments={ comments }/>
                            <input placeholder="Add a comment" value={ commentContents } onChange={ (event) => { setCommentContents(event.target.value) } }/>
                            <button onClick={ createComment }>Submit</button>
                        </> :
                        ""
                    }
                </div>
            </div>
        </StyledPost>
    )
}
...
```

Note the call to `getPosts()` in the callback after adding a comment.  This will cause the UI to refetch all posts, and thus our latest comment - refreshing the feed.  As mentioned above, this method was passed in as a prop to the `Post` component.

Again, we hardcode the `username` field because we haven't implemented signup/login.  We will do this next!

### Signup / Login
Let's return to the `SignUp.js` file we made at the beginning.  Now we can finally implement user login to tie in the final pieces of functionality!

```javascript
// SignUp.js
import  React, { useEffect, useState } from "react";
import styled from "styled-components";
import Client from "./util/client.js"
import { useHistory } from "react-router-dom";

const SignUpForm = styled.div`
    width: 400px;
    margin: 0 auto;

    input {
        width: 100%;
        margin: 20px 0;
    }

    button {
        margin-right: 10px;
    }
`

const SignUp = () => {
    const [username, setUsername] = useState("");
    const [errorMessage, setErrorMessage] = useState("")
    const history = useHistory();
    
    const SignUp = () => {
        if(username !== "")
        Client.signUp(username).then(() => {
            localStorage.setItem('username', username)
            history.push('/')     
        })
    }

    const Login = () => {
        if(username !== "")
        Client.signUp(username).then(() => {
            localStorage.setItem('username', username)
            setErrorMessage("")
            history.push('/')
        }).catch(() => {
            setErrorMessage(`Could not login with username ${username}`)
        })
    }

    return (
        <SignUpForm>
            <h2>Sign Up / Login</h2>
            <p className='error'>{ errorMessage }</p>
            <input placeholder="username" value={ username } onChange={ (event) => {setUsername(event.target.value)} }></input>
            <button onClick={ SignUp }>Sign Up</button>
            <button onClick={ Login }>Login</button>
        </SignUpForm>
    )
}

```

We've already seen the pattern of creating state objects for input, and creating methods for API calls, but there are a few important things to note in this file.  

Once the user signs up or logs in, if the process is successful, we store the username in `localstorage`:

```javascript
const SignUp = () => {
    ...
    Client.signUp(username).then(() => {
        localStorage.setItem('username', username)
        history.push('/')     
    })
}
```

This helps the browser keep track of who is logged in across the entire application. 

Also note `history.push('/)`.  This is a function in `react-router-dom` which allows for programmatic redirects to different components.  After we log in, the user would want to be navigated back to the feed, which this line of code achieves.

#### A note on Authentication
The authentication piece of this project is very light and not secure at all.  

Normally, instead of storing a username, applications would store an encrypted token which authenticates the user is stored instead.  Additionally, on the backend, we would be storing salted password hashes instead of authenticating solely on a username.  For a more indepth tutorial on implementing authentication, you can look into `passport.js` which provides middleware than can handle authentication on the backend. [see more here] (http://www.passportjs.org/packages/passport-jwt/)

### Finishing Up
Now that we have the ability to login and store the username in the browser, we can add the finishing pieces to our application.  

In the `Feed` component we can add code which fetches a stored username if the user has logged in:
```javascript
// Feed.js
const Feed = () => {
    let currentUsername = null
    try {
        currentUsername = localStorage.getItem('username')
    } catch (error) {
        currentUsername = null
    } 
    ...
}
```

Now we can replace 
```javascript
Client.createPost(postContents, "dummyUsername")
```
with
```javascript
Client.createPost(postContents, currentUsername)
```

Lets also pass this username down to the `Post` component as a prop by adding `currentUsername={ currentUsername }`:
```javascript
    <Post key={ post.id } id={ post.id } contents={ post.contents } username={ post.user.username } comments={ post.comments } currentUsername={ currentUsername } getPosts={ getPosts }/>
```

Next, we can update the `Post` component to accept this prop, and update the call to `addComment()` to user `currentUsername`
```javascript
const Post = ({id, contents, username, comments, currentUsername, getPosts}) => {
    ...
    const createComment = () => {
        if(commentContents !== "") {
            Client.addComment(commentContents, id, currentUsername).then(() => {
                getPosts();
            })
        } 
    }
}
```

Finally, since we don't want people who are not signed in to make posts or comments, we can wrap the forms in conditionals to prevent them from being used if `currentUsername` is null:

```javascript
// Post:
return(
    <div className='comments'>
        { showComments ? 
            <>
                <CommentList comments={ comments }/>
                {
                    currentUsername ? <>
                        <input placeholder="Add a comment" value={ commentContents } onChange={ (event) => { setCommentContents(event.target.value) } }/>
                        <button onClick={ createComment }>Submit</button>
                    </> : ""
                }
                
            </> :
            ""
        }
    </div>
)

// Feed:
return (
    <StyledFeed>
        {
            currentUsername ? <p className='top-msg'>Welcome, { currentUsername }</p> : <a className='top-msg' href='signup'>Sign Up/Login</a>
        }
        <h2>
            Posts
        </h2>
        {
            currentUsername ? <>
                <input placeholder='New post' value={ postContents } onChange={ (event) => {setPostContents(event.target.value)} }></input>
                <button onClick={ createPost }>Submit</button>
                </> 
                : ""
        }
        
        {
            posts.map((post) => (
                <Post key={ post.id } id={ post.id } contents={ post.contents } username={ post.user.username } comments={ post.comments } currentUsername={ currentUsername } getPosts={ getPosts }/>
            ))
        }
    </StyledFeed>
)
```

In feed, we also added a line at the top to welcome the user if they've logged in!

# Conclusion
At this point, your application should be fully connected with the backend API.  You should be able to SignUp as a new user and create posts and add comments.  

I hope this tutorial was useful.  While this application is not something you could ship to production, hopefully it provided enough useful background for you to start building your own full-stack applications!
