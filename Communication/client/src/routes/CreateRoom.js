import React from "react";
import { v1 as uuid } from "uuid";
import ReactDOM from 'react-dom';
import styled from "styled-components";
import './../App.css'
import App from "../App";
// import {Button} from '@material-ui/core';

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: 1fr 8fr 1fr;
    grid-template-areas:
    "h h"
    "m1 m2"
    "f f";
`;

const Header = styled.div`
grid-area: h;
margin-top:1%;
color: #e3dcd2;
font-size: 3em;
font-weight: bold;
background: #2d394e;
`;


const Maincontent1 = styled.div`
background: #f7f1f0;
margin: 40px;
grid-area: m1;
color: #2d394e;
border-radius: 10px;
text-align: center;
padding: 40px;
font-size: 20px;
`;

const Space = styled.div`
background: #f7f1f0;
color: #2d394e;
width: 20px;
height: 50px;
`;

const Maincontent2 = styled.div`
background: #f7f1f0;
margin: 40px;
grid-area: m2;
color: #2d394e;
border-radius: 10px;
text-align: center;
padding: 40px;
font-size: 20px;
`;

const Footer = styled.div`
grid-area: f;
align-self: end;
color: #e3dcd2;
background: #2d394e;
`;

const Button = styled.div`
    width: 40%;
    border-radius: 5px;
    cursor: pointer;
    background-color: #2d394e;
    color: #e3dcd2;
    font-size: 18px;
    font-weight: bold;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 50px;
    padding-right: 50px;
    margin: auto;
`;

const TitleElement = styled.div`
    width: 40%;
    border-radius: 5px;
    cursor: pointer;
    background-color: #2d394e;
    color: #e3dcd2;
    font-weight: bold;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 50px;
    padding-right: 50px;
    margin: auto;
    font-weight: bold;
    font-size: 20px;
    heigth: auto;
`;

const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

const CreateRoom = (props) => {
    function choose() {
        // const id = uuid();
        props.history.push(`/choosecircuit`);
    }

    return (
        <Container>
            <Header>
                RAKSHA-FORGE
            </Header>
            <Maincontent1>
                <TitleElement>What is RAKSHA-FORGE?</TitleElement>
                <Space></Space>
                RAKSHA-FORGE is a fast online runtime for Garbled Circuit execution. Garbled Circuit is a cryptographic
                protocol that enables two-party secure computation in which two mistrusting parties can jointly evaluate 
                a function over their private inputs without the presence of a trusted third party. The function is described
                as a Boolean circuit. There exist several compilers that transform a program into its corresponding boolean
                circuit, connecting such compilers with our runtime will enable parties to perform a complete two-party secure
                computation. 
                <Space></Space>
                <Button onClick={() => openInNewTab('https://www.esat.kuleuven.be/cosic/blog/introduction-to-garbled-circuit/')}>Read More</Button>
            </Maincontent1>
            <Maincontent2>
                <TitleElement>How does it work?</TitleElement>
                <Space></Space>
                We assume that the users have the boolean circuits for the function they would like to evaluate.
                Once users enter our platform, they can connect with the other user that they want to evaluate the function with by joining 
                a room that the other user created, or by creating a room. A room is a peer to peer connection between two users and does not involve a server intermediary.
                Once the users enter a room, they are guided through three steps: Choosing the role i.e. Garbler or Evaluator, Uploading the circuit file
                and Entering the input. Once this is done, press the 'Execute' button and watch the magic happen!
                <Space></Space>
                <Button onClick={choose}>Available Rooms</Button>
            </Maincontent2>
            <Footer>
            © Garbled Circuit Execution by Rathi Kashi and Shivam Agarwal
            </Footer>
        </Container>
        
    );
}

export default CreateRoom;