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
    height: 100vh;
    width: 50%;
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Messages = styled.div`
    width: 100%;
    height: 60%;
    border: 1px solid black;
    margin-top: 10px;
    overflow: scroll;
`;

const MessageBox = styled.textarea`
    width: 100%;
    height: 30%;
`;

const Button = styled.div`
    width: 50%;
    border: 1px solid black;
    margin-top: 15px;
    height: 5%;
    border-radius: 5px;
    cursor: pointer;
    background-color: black;
    color: white;
    font-size: 18px;
`;

const MyRow = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const MyMessage = styled.div`
  width: 45%;
  background-color: blue;
  color: white;
  padding: 10px;
  margin-right: 5px;
  text-align: center;
  border-top-right-radius: 10%;
  border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
  justify-content: flex-start;
`;

const PartnerMessage = styled.div`
  width: 45%;
  background-color: grey;
  color: white;
  border: 1px solid lightgray;
  padding: 10px;
  margin-left: 5px;
  text-align: center;
  border-top-left-radius: 10%;
  border-bottom-left-radius: 10%;
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
        socketRef.current = io.connect("http://10.1.37.203:8000");
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
        if(role === "Garbler"){
            // circuitFile.arrayBuffer()
            // .then(buffer => {
            //   /**
            //    * A chunkSize (in Bytes) is set here
            //    * I have it set to 16KB
            //    */
            //   const chunkSize = 16 * 1024;
        
            //   // Keep chunking, and sending the chunks to the other peer
            //   while(buffer.byteLength) {
            //     const chunk = buffer.slice(0, chunkSize);
            //     buffer = buffer.slice(chunkSize, buffer.byteLength);
                
            //     // Off goes the chunk!
            //     // peer1.send(chunk);
            //     outsendMessage(chunk)
            //   }
        
            //   // End message to signal that all chunks have been sent
            //   outsendMessage('All chunks sent!');
            // //   return new Promise(function (resolve){
            // //     resolve();
            // // })
            // });
        
            // outsendMessage(JSON.stringify(circuitFile));
            let parsedCircuit = main.parsecircuit(circuitFile);
            console.log(parsedCircuit);
            parsedCircuit.generateLabels();
            setMessages(messages => [...messages, {yours: false, value: "circuit parsed"}]);
            setText("");
            let input = [1,1];
            setMessages(messages => [...messages, {yours: false, value: "Sending input labels through Oblivious transfer"}]);
            setText("");
            await parsedCircuit.send_labels(garble_input);
            setMessages(messages => [...messages, {yours: true, value: "Received the input labels"}]);
            setText("");
            console.log("This should print later");
            setMessages(messages => [...messages, {yours: false, value: "Evaluating Circuit"}]);
            setText("");
            let output = await parsedCircuit.garble();
            output = parseInt(output,2);
            setMessages(messages => [...messages, {yours: false, value: "Output is " + output}]);
            setText("");
            console.log("Done");
        }
        else if (role === "Evaluator"){
                // let circuitFile = await Receive();
                // if(circuitFile == 'All chunks sent!'){
                //      file = new Blob(fileChunks);
                //      console.log(file);
                // }
                // else{
                //     fileChunks.push(circuitFile);
                // }
                let parsedCircuit = main.parsecircuit(circuitFile);
                console.log(parsedCircuit);
                let input = [1,0];
                await parsedCircuit.receive_labels(eval_input);
                console.log("this should print later");
                console.log(parsedCircuit);
                await parsedCircuit.evaluate();
                console.log("Done");
            
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
            <Messages>
                {messages.map(renderMessage)}
            </Messages>
            <MessageBox value={text} onChange={handleChange} placeholder="Say something....." />
            <div>
                <input type="file" onChange={(e) => 
                    handleFiles(e)} />
            </div>
            <div onChange = {assignRole}>
                <input type="radio" value="Garbler" name="role" /> Garbler
                <input type="radio" value="Evaluator" name="role" /> Evaluator
            </div>
            <Button onClick={testFile}>Send..</Button>
            
        </Container>
    );
};

export default Room;