import React from 'react';
import { BrowserRouter, Route, Switch } from "react-router-dom";
import CreateRoom from "./routes/CreateRoom";
import Room from "./routes/Room";
import ChooseCircuit from "./routes/ChooseCircuit";
import './App.css';

function App() {
  // console.log(handleReceiveMessage());
  return (
    <div className="App">
      <BrowserRouter>
        <Switch>
          <Route path="/" exact component={CreateRoom} />
          <Route path="/choosecircuit" exact component = {ChooseCircuit} />
          <Route path="/room/:roomID" component={Room} />
        </Switch>
      </BrowserRouter>
    </div>
  );
}

export default App;
