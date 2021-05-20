import React, { useRef, useEffect, useState } from "react";
import { v1 as uuid } from "uuid";
import styled from "styled-components";
import './../App.css'
import io from "socket.io-client";
import logo from '/Users/rathikashi/RAKSHA-FORGE/Communication/client/src/routes/RAKSHA-FORGE.png.png';
// import "dotenv/config"
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
font-size: 1.5em;
font-weight: bold;
background: #2d394e;
display: flex;
justify-content: center;
float: left;
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
  width: 100%;
  border-radius: 5px;
  height: 35px;
  border-color: transparent;
  text-align: center;

`;
let user_temp = [];
let rolecard = [];

const ChooseCircuit = (props) => {
    const socketRef = useRef();
    let [rooms, setRooms] = useState([]);
    let [users, setUsers] = useState({});
    const [text, setText] = useState("");
    const [role, setRole] = useState("");
    let [rolearr, setRolearr] = useState([]);
    console.log(socketRef);

    useEffect(() => {
        socketRef.current = io.connect("http://localhost:8000");
        console.log(socketRef.current);

        socketRef.current.on("connect", ()=>{
            console.log(socketRef.current.id);
            socketRef.current.emit("get rooms", socketRef.current.id);
            socketRef.current.emit("get roles", socketRef.current.id);
        });
        
        socketRef.current.on("get rooms", (data)=>{
            console.log(data);
            setRooms(Object.keys(data));
            Object.keys(data).map(function(key, value){
                user_temp.push(data[key]);
            })
            setUsers(user_temp);
            console.log(rooms.length);
        });

        socketRef.current.on("get roles", (data)=>{
            console.log(data);
            setRolearr(data);
            
        });

    }, []);

    function create() {
        if(role == ''){
            alert('Choose a role!');
        }
        else{
            const id = uuid();
            socketRef.current.emit("update roles", role);
            console.log(role);
            props.history.replace(`/room/${id}/${role}`);
        }
       
    }

    function handlePasscode(e){
        setText(e.target.value);
    }

    function joinRoom(i, userrole) {
        console.log(text);
        console.log(i.value);

        if(userrole == 'Garbler'){
            userrole = 'Evaluator'
        }
        else{
            userrole = 'Garbler'
        }

        if(text == i){
            window.open('http://localhost:3000/room/' + i + '/' + userrole, "_self");
        }
        else{
            alert('Wrong Passcode');
        }
        
    }

    function assignRole(e){
        console.log(e.target.value);
        setRole(e.target.value);
    }


    return (
        <Container>
            <Header>
                <img src={logo} alt="RAKSHA-FORGE logo" height="100px" width="110px"></img>
                <div style={{marginTop: "30px"}}>Fast Online Runtime for GC Evaluation</div>
            </Header>
            <Maincontent>
                <Card>
                    <p></p>
                    <div style={{fontWeight: "bold"}}>Create Room or Join an existing Room!</div>
                    <Space></Space>
                    <Space></Space>
                    <div style={{fontWeight: "bold"}}>Choose your role</div>
                            <div onChange = {assignRole}>
                                <input id="GarblerChoice" type="radio" value="Garbler" name="role"/>
                                <label for="GarblerChoice">Garbler</label>
                                <input id="EvalChoice" type="radio" value="Evaluator" name="role"/>
                                <label for="EvalChoice">Evaluator</label>
                            </div>
                    <Space></Space>
                    <Space></Space>
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
                            <MessageBox value={text} onChange = {handlePasscode} placeholder="Enter the room passcode" />
                            <p></p>
                            <p></p>
                            <Button onClick={() => joinRoom(i, rolearr[index])}>Join Room</Button>
                            <p></p>
                            <p></p>
                            <div>
                                Note: {JSON.stringify(rolearr[index])} already taken!
                            </div>
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