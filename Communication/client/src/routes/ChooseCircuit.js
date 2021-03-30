import React from "react";
import { v1 as uuid } from "uuid";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import './../App.css'
import App from "../App";
// import {Button} from '@material-ui/core';

const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

const Button = styled.button`
  /* Adapt the colors based on primary prop */
  background: ${props => props.primary ? "palevioletred" : "white"};
  color: ${props => props.primary ? "white" : "palevioletred"};

  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid palevioletred;
  border-radius: 3px;
`;

const Container = styled.div`
    height: 100vh;
    width: 50%;
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const mydiv = styled.div`
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "blue"
    
`;

const ChooseCircuit = (props) => {
    function create() {
        const id = uuid();
        props.history.replace(`/room/${id}`);
    }



    return (
        //<Container>
        <div className="App">
        <header className="App-header">
                <h1 className="App-title">RAKSHA-FORGE</h1>
                </header>
                <div
                style={{
                    position: 'absolute', left: '50%', top: '50%',
                    transform: 'translate(-50%, -50%)'
                }}>
                    {/* <h3>Try it out!</h3> */}
                    <h1 className="App-title">Try it out!</h1>
                    <Button primary onClick={() => openInNewTab('https://homes.esat.kuleuven.be/~nsmart/MPC/')}>Choose Circuit</Button>
                    <Button primary onClick={create}>Create Room</Button>
                </div>
                </div>
            
                
        
        
        //</Container>
        
    );
}

export default ChooseCircuit;