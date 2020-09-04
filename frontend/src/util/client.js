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