import  React, { useEffect, useState } from "react";
import styled from "styled-components";
import Client from "./util/client"

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

const Post = ({id, contents, username, comments, currentUsername, getPosts}) => {
    const [showComments, setShowComments] = useState(false)
    const [commentContents, setCommentContents] = useState("")
    
    const createComment = () => {
        if(commentContents !== "") {
            Client.addComment(commentContents, id, currentUsername).then(() => {
                getPosts();
            })
        } 
    }

    const toggleShowComments = () => {
        if (showComments) {
            setShowComments(false)
        } else {
            setShowComments(true)
        }
    }

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
            </div>
        </StyledPost>
    )
}

const StyledComment = styled.div`
    margin: 10px 0;
`

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
    let currentUsername = null
    try {
        currentUsername = localStorage.getItem('username')
    } catch (error) {
        currentUsername = null
    } 

    const [postContents, setPostContents] = useState("");
    const [posts, setPosts] = useState([])

    useEffect(() => {
        getPosts()
    }, [])

    const getPosts = () => {
        Client.getPosts().then((res) => {
            setPosts(res.data)
        })
    }

    const createPost = () => {
        if(postContents !== "") {
            Client.createPost(postContents, currentUsername).then(() => {
                setPostContents("")
                getPosts()
            })
        } 
    }
    
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
}

export default Feed