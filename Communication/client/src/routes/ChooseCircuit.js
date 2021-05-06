import React, { useRef, useEffect, useState } from "react";
import { v1 as uuid } from "uuid";
import styled from "styled-components";
import './../App.css'
import io from "socket.io-client";
// import {Button} from '@material-ui/core';

const openInNewTab = (url) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer')
    if (newWindow) newWindow.opener = null
  }

const Container = styled.div`
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-rows: 1fr 8fr 1fr;
  grid-template-areas:
  "h"
  "m"
  "f";
`;

const Header = styled.div`
grid-area: h;
margin-top:1%;
color: #e3dcd2;
font-size: 3em;
font-weight: bold;
background: #2d394e;
`;


const Maincontent = styled.div`
background: #2d394e;
margin: 40px;
grid-area: m;
color: #2d394e;
overflow-x: scroll;
border-radius: 10px;
text-align: center;
padding: 40px;
font-size: 20px;
display: flex;
flex-direction: row;
`;

const Space = styled.div`
background: #f7f1f0;
color: #2d394e;
width: 20px;
height: 50px;
`;

const Card = styled.div`
background: #f7f1f0;
width: 20%;
margin: 10px;
color: #2d394e;
border-radius: 10px;
text-align: center;
padding-left: 40px;
padding-right: 40px;
font-size: 20px;
word-wrap: break-word;
`;

const CardOff = styled.div`
background:  #b1b3b5;
width: 20%;
margin: 10px;
color: #2d394e;
border-radius: 10px;
text-align: center;
padding-left: 40px;
padding-right: 40px;
font-size: 20px;
word-wrap: break-word;
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
const Button2 = styled.div`
  width: 40%;
  border-radius: 5px;
  cursor: pointer;
  background-color: #e3dcd2;
  color: #2d394e;
  font-size: 18px;
  font-weight: bold;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 50px;
  padding-right: 50px;
  margin: auto;
`;

const TitleElement = styled.div`
  border-radius: 5px;
  cursor: pointer;
  background-color: #2d394e;
  color: #e3dcd2;
  font-weight: bold;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 50px;
  padding-right: 50px;
  font-weight: bold;
  font-size: 20px;
`;

const TitleElementOff = styled.div`
  border-radius: 5px;
  cursor: pointer;
  background-color: #808080;
  color: #e3dcd2;
  font-weight: bold;
  padding-top: 10px;
  padding-bottom: 10px;
  padding-left: 50px;
  padding-right: 50px;
  font-weight: bold;
  font-size: 20px;
`;

const MessageBox = styled.textarea`
    width: 80%;
    height: 20%;

`;

// let rooms = {};
let user_temp = [];
// let rnames = [];
function waitForElement(){
    if(typeof someVariable !== "undefined"){
        //variable exists, do what you want
    }
    else{
        setTimeout(waitForElement, 250);
    }
}

const ChooseCircuit = (props) => {
    const socketRef = useRef();
    // rooms.state = {
    //     roomID: '', 
    //     userIDs: []
    // };
    let [rooms, setRooms] = useState([]);
    // let [roomnames, setName] = useState([]);
    let [users, setUsers] = useState({});
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);
    console.log('hi');
    console.log(socketRef);

    useEffect(() => {
        socketRef.current = io.connect("http://localhost:8000");
        console.log(socketRef.current);
        socketRef.current.on("connect", ()=>{
            console.log(socketRef.current.id);
            socketRef.current.emit("get rooms", socketRef.current.id);
        });
        
        socketRef.current.on("get rooms", (data)=>{
            console.log(data);
            setRooms(Object.keys(data));
            Object.keys(data).map(function(key, value){
                user_temp.push(data[key]);
            })
            setUsers(user_temp);
            console.log(rooms.length);
        })

    }, []);

    function create() {
        const id = uuid();
        // setName(roomnames => [...roomnames, text]);
        // console.log(text);
        // console.log(roomnames);
        props.history.replace(`/room/${id}`);
    }

    // function updateName(input){
    //     setText(input.target.value);
    //     // setName(rnames);
    // }

    return (
        <Container>
            <Header>RAKSHA-FORGE</Header>
            <Maincontent>
                <Card>
                    <p></p>
                    <div style={{fontWeight: "bold"}}>Create Room or Join an existing Room!</div>
                    <p></p>
                    <Button onClick={create}>Create Room</Button>
                </Card>
                {rooms.map(function render(i, index){
                    // users[index];
                    if(users[index]!== undefined){
                        if(users[index].length >= 2){
                            return <CardOff>
                            <TitleElementOff>ROOM {index}:</TitleElementOff>
                            <p></p>
                            <div style={{fontWeight: "bold"}}>ROOM IS FULL!</div>
                            <p></p>
                            <p>User IDs:</p>
                            {JSON.stringify(users[index])}
                            </CardOff>
                            
                        }
                        else{
                            return <Card>
                            <TitleElement>ROOM {index}:</TitleElement>
                            <p></p>
                            <p>User IDs:</p>
                            {JSON.stringify(users[index])}
                            <p></p>
                            <p></p>
                            <Button onClick={() => openInNewTab('http://localhost:3000/room/' + i)}>Join Room</Button>
                            </Card>
                            
                        }
                    }
                    else{
                        setTimeout(render, 250);
                    }
                    
                })} 
            </Maincontent>
            <Footer>
            <Button2 onClick={() => openInNewTab('https://homes.esat.kuleuven.be/~nsmart/MPC/')}>Choose Circuit</Button2>
                <p></p>© Garbled Circuit Execution by Rathi Kashi and Shivam Agarwal
            </Footer>
        </Container>
        
        
                    
               

       
                
        
        
       
    );
}

export default ChooseCircuit;