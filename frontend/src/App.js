import React from 'react';
import './App.css';
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

export default App;
