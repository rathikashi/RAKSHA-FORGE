import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import styled from "styled-components";
import ReactFileReader from "react-file-reader";
import sha256 from 'crypto-js/sha256';
import {Copy} from '@styled-icons/fa-solid';
import {Download} from '@styled-icons/bootstrap';
import {ViewShow} from '@styled-icons/zondicons/'; 
import {PersonFill} from '@styled-icons/bootstrap';
import {Send} from '@styled-icons/ionicons-sharp';
import logo from '/Users/rathikashi/RAKSHA-FORGE/Communication/client/src/routes/RAKSHA-FORGE.png.png';

let circuit_gate = require('./circuit.js');
const Circuit =  circuit_gate.Circuit;
const Gate = circuit_gate.Gate;
var role;
let circuitFile;
let inputfile;
let u_input;
let garble_input;
let eval_input;
const fileChunks = [];
let file;
let encrypted;
let garbOutput;
let evalOutput;
let base;

var OT = require("./OT.js");
var main = require("./main.js");

var test_circuit = new Circuit();
var sendChannel;

const Container = styled.div`
    width: 100vw;
    height: 100vh;
    display: grid;
    grid-template-rows: 1fr 8fr 1fr;
    grid-template-areas:
    "h h h"
    "s m m"
    "f f f";
    min-height: 0; 
    min-width: 0;   
`;

const Header = styled.div`
grid-area: h;
margin-top:1%;
color: #e3dcd2;
font-size: 1.5em;
font-weight: bold;
display: flex;
justify-content: center;
float: left;
`;

const Sidebar = styled.div`
grid-area: s;
min-width: 0;
overflow: hidden;
text-overflow: ellipsis;
`;

const Maincontent = styled.div`
background: #f7f1f0;
margin-top: 5%;
margin-bottom: 5%;
margin-right: 35px;
grid-area: m;
color: #2d394e;
border-radius: 10px;
`;

const Footer = styled.div`
grid-area: f;
align-self: end;
color: #e3dcd2;
background: #2d394e;
`;

const Card = styled.div`
width: 500px;
background: #e3dcd2;
color: #2d394e;
margin: auto;
border-radius: 10px;
word-wrap: break-word;
overflow: hidden;
text-overflow: ellipsis;
padding-left: 10px;
padding-right: 10px;
padding-bottom: 15px;
`;


const CardSpace = styled.div`
height: 10%;
background: #2d394e;

`;

const CardSpace2 = styled.div`
height: 4%;
background: #2d394e;

`;

const Messages = styled.div`
    width: 450px;
    height: 450px;
    margin-left: auto;
    margin-right: auto;
    margin-top: 10px;
    overflow: auto;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-content: space-between;
`;

const MessageBox = styled.textarea`
    width: 80%;
    height: 15%;

`;

const Button = styled.div`
    width: 40%;
    border-radius: 5px;
    cursor: pointer;
    background-color: #3b8ac4;
    color: #e3dcd2;
    font-size: 18px;
    font-weight: bold;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 50px;
    padding-right: 50px;
    margin: auto;
`;

const FileButton = styled.div`
    width: 40%;
    border-radius: 5px;
    cursor: pointer;
    background-color: #b1b3b5;
    font-size: 1em;
    padding-top: 10px;
    padding-bottom: 10px;
    margin: 0 10px;
`;

const RunButton = styled.div`
    width: 40%;
    border-radius: 5px;
    cursor: pointer;
    background-color:#b1b3b5;
    color: #2d394e;
    font-size: 18px;
    font-weight: bold;
    padding-top: 10px;
    padding-bottom: 10px;
    padding-left: 5px;
    padding-right: 5px;
    margin: auto;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  float: left;
  margin-top: 10px;
`;


const MyMessage = styled.div`
padding: 10px;
background-color: #786FA2;
width: 80%;
margin: auto;
text-align: center;
font: 400 1.1em 'Open Sans', sans-serif;
color: white;
border: 1px solid #97C6E3;
border-radius: 10px;
display: inline-block;
height: auto;
word-wrap: break-word;
}
`;



function messageQueue() {
    this.queue = {};
    this.tail = 0;
    this.head = 0;
  }
  
  // Add an element to the end of the queue.
  messageQueue.prototype.enqueue = function(element) {
    this.queue[this.tail++] = element;
  }
  
  // Delete the first element of the queue.
  messageQueue.prototype.dequeue = function() {
    if (this.tail === this.head)
        return undefined
    //console.log("inside dequeue");
    //console.log("queue: ");
    //console.log(this.queue);
    //console.log("head: ");
    //console.log(this.head); 
    var element = this.queue[this.head];
    delete this.queue[this.head++];
    return element;
  }

var messages = new messageQueue();

let listener = null;

export const Receive = () => {
    //console.log("going in receive");
    
    return new Promise(function (resolve) {
        sendToListener(resolve);
        });
};

function sendToListener(callback){
    //console.log("message queue length: " + Object.keys(messages.queue).length);
    //console.log(messages.queue);
    if(Object.keys(messages.queue).length !== 0){
        callback(messages.dequeue());
    }

    else if(listener == null){
        listener = callback;
    }

    else{
        console.log("Listener should be null but its not");
    }
};

export const handleReceiveMessage = (e) => {
    if(listener!=null){
        listener(e.data);
        listener = null;
    }
    else{
        messages.enqueue(e.data);
    }
}

export const outsendMessage = (message) => {
    sendChannel.current.send(message);
}

const Room = (props) => {
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    sendChannel = useRef();
    const [text, setText] = useState("");
    let [input, setInput] = useState([]);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socketRef.current = io.connect('http://localhost:8000');
        console.log('herenow');
        console.log(socketRef.current.id);
        socketRef.current.emit("join room", props.match.params.roomID);

        socketRef.current.on('other user', userID => {
            callUser(userID);
            otherUser.current = userID;
        });

        socketRef.current.on("user joined", userID => {
            otherUser.current = userID;
        });

        socketRef.current.on("offer", handleOffer);

        socketRef.current.on("answer", handleAnswer);

        socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

    }, []);


    function callUser(userID) {
        peerRef.current = createPeer(userID);
        sendChannel.current = peerRef.current.createDataChannel("sendChannel");
        sendChannel.current.onmessage = handleReceiveMessage;
        sendChannel.current.binaryType = "arraybuffer";
    }


    function createPeer(userID) {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.stunprotocol.org"
                },
                {
                    urls: 'turn:numb.viagenie.ca',
                    credential: 'muazkh',
                    username: 'webrtc@live.com'
                },
            ]
        });

        peer.onicecandidate = handleICECandidateEvent;
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

        return peer;
    }

    function handleNegotiationNeededEvent(userID) {
        peerRef.current.createOffer().then(offer => {
            return peerRef.current.setLocalDescription(offer);
        }).then(() => {
            const payload = {
                target: userID,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            };
            console.log('SOCKETREF');
            console.log(socketRef.current.id);
            socketRef.current.emit("offer", payload);
        }).catch(e => console.log(e));
    }

    function handleOffer(incoming) {
        peerRef.current = createPeer();
        peerRef.current.ondatachannel = (event) => {
            sendChannel.current = event.channel;
            sendChannel.current.onmessage = handleReceiveMessage;
        };
        const desc = new RTCSessionDescription(incoming.sdp);
        peerRef.current.setRemoteDescription(desc).then(() => {
        }).then(() => {
            return peerRef.current.createAnswer();
        }).then(answer => {
            return peerRef.current.setLocalDescription(answer);
        }).then(() => {
            const payload = {
                target: incoming.caller,
                caller: socketRef.current.id,
                sdp: peerRef.current.localDescription
            }
            socketRef.current.emit("answer", payload);
        })
    }

    function handleAnswer(message) {
        const desc = new RTCSessionDescription(message.sdp);
        peerRef.current.setRemoteDescription(desc).catch(e => console.log(e));
    }

    function handleICECandidateEvent(e) {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate,
            }
            socketRef.current.emit("ice-candidate", payload);
        }
    }

    function handleNewICECandidateMsg(incoming) {
        const candidate = new RTCIceCandidate(incoming);

        peerRef.current.addIceCandidate(candidate)
            .catch(e => console.log(e));
    }

    function handleChange(e) {
        let len = e.target.value.length;
        if(base == 'Decimal'){
            document.getElementById('bitscount').innerHTML = 'Entered ' + len + ' digits'
        }
        else{
            document.getElementById('bitscount').innerHTML = 'Entered ' + len + ' bits'
        }
        u_input = e.target.value
        setText(e.target.value)
        console.log(u_input);   
    }

    function handleBase(e) {
        base = e.target.value;   
        console.log(base);
    }

    function assignRole(e){
        console.log(e);
        role = e[0];
    }
    
    const handleFiles = (e) => {
        var reader = new FileReader();
        console.log(e.target.files[0].name);
        reader.onload = (e) => {
          circuitFile = (e.target.result)
          encrypted = sha256(circuitFile);
          console.log('encrypted: ' + encrypted);
          document.getElementById('encryptedFile').innerHTML = encrypted
        };
        reader.readAsText(e.target.files[0]);
      };

    const handleInput = (e) => {
        var reader = new FileReader();
        console.log(e);
        reader.onload = (e) => {
            u_input = (e.target.result)
           
        };
        reader.readAsText(e.target.files[0]);
        

        

    };

    function outputToFile(output){
        var atag = document.createElement("a");
        const blob = new Blob([output], {type: 'text/plain'});
        atag.href = URL.createObjectURL(blob);
        atag.download = "output.txt";
        document.body.appendChild(atag);
        atag.click();
        // URL.revokeObjectURL(fileDownloadUrl);  
    }

    function viewOutput(output, bool){
        setMessages(messages => [...messages, {yours: bool, value: "Output is: " + output}]);
        setText("");
    }

    function viewInput(input, bool){
        setMessages(messages => [...messages, {yours: bool, value: "Input is: " + input}]);
        setText("");
    }

    function copyPasscode(passcode){
        var dummy = document.createElement("textarea");
        // to avoid breaking orgain page when copying more words
        // cant copy when adding below this code
        // dummy.style.display = 'none'
        document.body.appendChild(dummy);
        //Be careful if you use texarea. setAttribute('value', value), which works with "input" does not work with "textarea". – Eduard
        dummy.value = passcode;
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }


    async function testFile(){
        sendChannel.current.binaryType = "arraybuffer";
        assignRole(props.location['pathname'].split('/').slice(3))
        let parsedCircuit = main.parsecircuit(circuitFile);
        console.log(parsedCircuit);
        if(role === 'Garbler'){
            if(base === 'Decimal'){
                let inp = Number(u_input);
                u_input = inp.toString(2);
                while(u_input.length < parsedCircuit.garbler_input_size) {
                        u_input = "0" + u_input;
                }
            }
            setMessages(messages => [...messages, {yours: false, value: "Input is: " + u_input.split("").reverse().join("")}]);
            setText("");
            u_input = u_input.split("").reverse().join("");
            garble_input = u_input.split('').map(Number);
            console.log('garbler input:');
            console.log(garble_input);
        }
        else{
            if(base === 'Decimal'){
                let inp = Number(u_input);
                u_input = inp.toString(2);
                while(u_input.length < parsedCircuit.evaluator_input_size) {
                        u_input = "0" + u_input;
                }
            }
            setMessages(messages => [...messages, {yours: false, value: "Input is: " + u_input.split("").reverse().join("")}]);
            setText("");
            u_input = u_input.split("").reverse().join("");
            eval_input = u_input.split('').map(Number);
            console.log('evaluator input:');
            console.log(eval_input);
        }
        console.log(role);
        if(role === "Garbler"){
            var startTime = new Date().getTime();
            parsedCircuit.generateLabels();
            setMessages(messages => [...messages, {yours: true, value: "Circuit parsed"}]);
            setText("");
            let input = [1,1];
            setMessages(messages => [...messages, {yours: true, value: "Sending input labels through Oblivious transfer"}]);
            setText("");
            await parsedCircuit.send_labels(garble_input);
            console.log("This should print later");
            setMessages(messages => [...messages, {yours: true, value: "Pipelined execution: Garbling taking place"}]);
            setText("");
            let output = await parsedCircuit.garble();
            var endTime = new Date().getTime();
            setMessages(messages => [...messages, {yours: true, value: "Time taken: " + ((endTime-startTime)/1000.0).toString() + " seconds"}]);
            setText("");
            console.log("Time taken: " + endTime-startTime);
            console.log(output);
            console.log(typeof output);
            // if(base == "Decimal"){
            //     garbOutput = parseInt(output.split("").reverse().join(""), 2).toString();
            // }
            // else{
            garbOutput = output.split("").reverse().join("");
            // }
            console.log(garbOutput);
            outsendMessage(garbOutput);
            setMessages(messages => [...messages, {yours: true, value: "Output obtained"}]);
            setText("");
            console.log("Done");
        }
        else if (role === "Evaluator"){
                let parsedCircuit = main.parsecircuit(circuitFile);
                console.log(parsedCircuit);
                setMessages(messages => [...messages, {yours: false, value: "Circuit parsed"}]);
                setText("");
                let input = [1,0];
                await parsedCircuit.receive_labels(eval_input);
                setMessages(messages => [...messages, {yours: false, value: "Received the input labels"}]);
                setText("");
                console.log("this should print later");
                console.log(parsedCircuit);
                setMessages(messages => [...messages, {yours: false, value: "Pipelined execution: Evaluation taking place"}]);
                setText("");
                await parsedCircuit.evaluate();
                console.log("Done");
                evalOutput = await Receive();
                if(evalOutput != undefined){
                    console.log(evalOutput);
                    setMessages(messages => [...messages, {yours: false, value: "Output obtained"}]);
                    setText("");
                }
            
        }
    }


    function renderMessage(message, index) {
        // console.log(JSON.parse(message.value));
        if (message.yours) {
            if(message.value == "Output obtained"){
                return(
                    <MyRow key={index}>
                                <FileButton onClick={() => outputToFile(garbOutput)}>Download Output <Download size="20"/></FileButton>
                                <FileButton onClick={() => viewOutput(garbOutput, true)}>View Output <ViewShow size="20"/></FileButton>
                    </MyRow>

                )
            }
            else{
                return (
                    <MyRow key={index}>
                        <MyMessage>
                            {message.value}
                        </MyMessage>
                    </MyRow>
                )
            }
        }

        else {
            if(message.value == "Output obtained"){
                return(
                    <MyRow key={index}>
                            <FileButton onClick={() => outputToFile(evalOutput)}>Download Output <Download size="20"/></FileButton>
                            <FileButton onClick={() => viewOutput(evalOutput, false)}>View Output <ViewShow size="20"/></FileButton>
                    </MyRow>
                )
            }
            else{
                return (
                    <MyRow key={index}>
                        <MyMessage>
                            {message.value}
                        </MyMessage>
                    </MyRow>
                )
            }
            
        

        }
    }

    return (
        <Container>
        <Header>
                <img src={logo} alt="RAKSHA-FORGE logo" height="100px" width="110px"></img>
                <div style={{marginTop: "30px"}}>Fast Online Runtime for GC Evaluation</div>
            
        </Header>
        <Sidebar>
            <CardSpace>
            <div style={{fontWeight: "bold", fontSize: "1.5em", color:"#b1b3b5", marginRight: "300px"}}><PersonFill size="25"></PersonFill> {props.location['pathname'].split('/').slice(3)} Mode</div> 
            </CardSpace>
            <Card>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>Step 2: Pick A Circuit</div>
                <p></p>
                <p></p>
                <div><input id= "circuitfile" type="file" onChange={(e) => 
                    handleFiles(e)} />
                </div>
                <p></p>
                <p></p>
                <div style={{fontWeight: "bold", fontSize: "1em"}}>SHA-256 hash of the file:</div>
                <p></p>
                <div id="encryptedFile" style={{width: "300px", margin: "auto"}}></div>
            </Card>
            <CardSpace></CardSpace>
            <Card>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>Step 3: Enter Input</div>
                <p></p>
                <div onChange={handleBase}>
                                <input id="DecimalChoice" type="radio" value="Decimal" name="base"/>
                                <label for="DecimalChoice">Decimal</label>
                                <input id="BinaryChoice" type="radio" value="Binary" name="base"/>
                                <label for="BinaryChoice">Binary</label>
                </div>
                <p></p>
                <MessageBox value={text} onChange={handleChange} placeholder="Enter the input string in Binary/Decimal" />
                <div id='bitscount' style={{fontSize: "10px"}}></div>
                <p></p>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>OR Upload Input</div>
                <p></p>
                <div>
                    <input id ="inputfile" type="file" onChange={(e) => 
                    handleInput(e)} />
                </div>
                
            </Card>
            <CardSpace2></CardSpace2>
            <RunButton onClick={testFile}>Execute  <Send size="15" /></RunButton>
            <CardSpace2></CardSpace2>
        </Sidebar>
        <Maincontent>
            <div style={{fontWeight: "bold", fontSize: "1.5em"}}>
                Progress Update
            </div>
            <Messages>
                    {messages.map(renderMessage)}
            </Messages> 
            <Button style={{background: "#2d394e"}} onClick={() => copyPasscode(props.location['pathname'].split('/').slice(2)[0])}>Passcode <Copy size="20" /></Button>
        </Maincontent>
        <Footer>
        © Garbled Circuit Execution by Rathi Kashi and Shivam Agarwal
        </Footer>
            
        </Container>
    );
};

export default Room;