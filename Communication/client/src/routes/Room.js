import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import styled from "styled-components";
import ReactFileReader from "react-file-reader";

let circuit_gate = require('./circuit.js');
const Circuit =  circuit_gate.Circuit;
const Gate = circuit_gate.Gate;
var role;
let circuitFile;
let garble_input;
let eval_input;
const fileChunks = [];
let file;

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
`;

const Header = styled.div`
grid-area: h;
margin-top:1%;
color: #e3dcd2;
font-size: 3em;
font-weight: bold;
background: #2d394e;
`;

const Sidebar = styled.div`
grid-area: s;
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
height: 20%;
width: 80%;
background: #e3dcd2;
color: #2d394e;
margin: auto;
justify-self: stretch;
align-self: auto;
border-radius: 10px;
`;


const CardSpace = styled.div`
height: 10%;
margin: auto;
background: #2d394e;
justify-self: stretch;
align-self: auto;
`;

const VertCardG = styled.div`
  padding: 20px;
  border: 2px solid rgb(96, 139, 168);
  border-radius: 5px;
  background-color: #b1b3b5;
  width: 5%;
  height: 80%;
  margin-left: 10px;
`;

const VertCardE = styled.div`
padding: 20px;
border: 2px solid rgb(96, 139, 168);
border-radius: 5px;
background-color: #37399a;
width: 5%;
height: 80%;
margin-right: 10px;
`;

const Messages = styled.div`
    width: 100%;
    height: 100%;
    margin-top: 10px;
    overflow-y: scroll;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    align-content: space-between;
`;

const MessageBox = styled.textarea`
    width: 80%;
    height: 20%;

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

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
`;

const MyMessage = styled.div`
padding: 10px;
background-color: #786FA2;
width: 50%;
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

const PartnerRow = styled(MyRow)`
  justify-content: center;
`;

const PartnerMessage = styled.div`
padding: 10px;
background-color: #b1b3b5;
width: 50%;
text-align: center;
font: 400 1.1em 'Open Sans', sans-serif;
border: 1px solid #dfd087;
border-radius: 10px;
display: inline-block;
height: auto;
word-wrap: break-word;
`;

const fileButton = styled.div`
   width:100px;
   height:40px;
   position:relative;
`;



// export const testFunc = () => {
//     console.log('Works!');
// }



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
    // setMessages(messages => [...messages, {yours: false, value: e.data}]);
    //console.log("received" + e.data);
    if(listener!=null){
        listener(e.data);
        listener = null;
    }
    else{
        messages.enqueue(e.data);
    }
}

export const outsendMessage = (message) => {
    // Room.sendMessage();
    //console.log("sending" + message + sendChannel);
    sendChannel.current.send(message);
    // setMessages(messages => [...messages, {yours: true, value: text}]);
    // setText("");
}

const Room = (props) => {
    const peerRef = useRef();
    const socketRef = useRef();
    const otherUser = useRef();
    sendChannel = useRef();
    const [text, setText] = useState("");
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        socketRef.current = io.connect("http://localhost:8000");
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

    // function handleReceiveMessage(e){
    //     setMessages(messages => [...messages, {yours: false, value: e.data}]);
    // }

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
        let u_input = e.target.value.split('').map(Number);
        console.log(u_input);
        u_input = u_input.reverse();
        console.log(u_input);
        if(role === 'Garbler'){
            garble_input = u_input;
            console.log('input:');
            console.log(garble_input);
        }
        else{
            eval_input = u_input;
            console.log('input:');
            console.log(eval_input);
        }
        
        setText(e.target.value);
    }

    function sendMessage() {
        console.log("call to send message");
        outsendMessage(sendChannel.current);
        //sendChannel.current.send('hey');
        setMessages(messages => [...messages, {yours: true, value: text}]);
        setText("");
    }

    function circuitsend(){
        test_circuit.testSend();
    }

    function assignRole(e){
        console.log(e.target.value);
        role = e.target.value;
    }
    
    const handleFiles = (e) => {
        var reader = new FileReader();
        console.log(e);
        reader.onload = (e) => {
          // Use reader.result
        //   this.setState({ data: Papa.parse(reader.result, { header: true }) });
          circuitFile = (e.target.result)
          console.log(circuitFile)
        };
        // if(role == "Garbler"){
        //     outsendMessage(text);
        // }
        // else{
        //     let file = Receive(file).then(function(){
        //         console.log(file);
        //     });
        // }
        reader.readAsText(e.target.files[0]);
      };

    //   this.handleFiles = this.handleFiles.bind(this);

    async function testFile(){
        sendChannel.current.binaryType = "arraybuffer";
        if(role === "Garbler"){
            var startTime = new Date().getTime();
            let parsedCircuit = main.parsecircuit(circuitFile);
            console.log(parsedCircuit);
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
            // output = parseInt(output,2);
            console.log(output);
            console.log(typeof output);
            output = output.split("").reverse().join("");
            console.log(output);
            setMessages(messages => [...messages, {yours: true, value: "Output is " + output}]);
            setText("");
            var endTime = new Date().getTime();
            setMessages(messages => [...messages, {yours: true, value: "Time taken: " + ((endTime-startTime)/1000.0).toString() + " seconds"}]);
            setText("");
            console.log("Time taken: " + endTime-startTime);
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
                setMessages(messages => [...messages, {yours: false, value: "Output received by Garbler"}]);
                setText("");
            
        }
    }

    function testOT(){
        messages.queue = {};
        console.log("role is " + role);
        if(role === "Garbler"){
            OT.OT_send(2);
        }

        else{
            let OT_output = OT.OT_receive(1,2).then(function (OT_output){
            console.log("ot_output:");
            console.log(OT_output);
            });
        }
    }

    function renderMessage(message, index) {
        // console.log(JSON.parse(message.value));
        if (message.yours) {
            return (
                <MyRow key={index}>
                    <MyMessage>
                        {message.value}
                    </MyMessage>
                </MyRow>
            )
        }

        return (
            <PartnerRow key={index}>
                <PartnerMessage>
                    {message.value}
                </PartnerMessage>
            </PartnerRow>
        )
    }

    return (
        <Container>
        <Header>
        {/* <img src="raksha-logo.png"></img> */}
        RAKSHA-FORGE
        </Header>
        <Sidebar>
            <CardSpace></CardSpace>
            <Card>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>Step 1: Choose Role</div>
                <p></p>
                <p></p>
                <div onChange = {assignRole}>
                    <input id="GarblerChoice" type="radio" value="Garbler" name="role"/>
                    <label for="GarblerChoice">Garbler</label>
                    <input id="EvalChoice" type="radio" value="Evaluator" name="role"/>
                    <label for="EvalChoice">Evaluator</label>
                </div>
            </Card>
            <CardSpace></CardSpace>
            <Card>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>Step 2: Pick A Circuit</div>
                <p></p>
                <p></p>
                <div><input id= "circuitfile" type="file" onChange={(e) => 
                    handleFiles(e)} />
                </div>
            </Card>
            <CardSpace></CardSpace>
            <Card>
                <div style={{fontWeight: "bold", fontSize: "1.5em"}}>Step 3: Enter Input</div>
                <p></p>
                <MessageBox value={text} onChange={handleChange} placeholder="Enter the input string in Binary" />
            </Card>
            <CardSpace></CardSpace>
            <Button onClick={testFile}>Execute</Button>
        </Sidebar>
        <Maincontent>
            <div style={{fontWeight: "bold", fontSize: "1.5em"}}>
                Progress Update
            </div>
            <Messages>
                    {messages.map(renderMessage)}
            </Messages> 
        </Maincontent>
        <Footer>
        
        
        © Garbled Circuit Execution by Rathi Kashi and Shivam Agarwal
        </Footer>
            
        </Container>
    );
};

export default Room;