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

export default SignUp