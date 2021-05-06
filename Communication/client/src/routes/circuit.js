// import Room from "./Room";
//import {outsendMessage} from "./Room";
var Room = require('./Room.js');
var Helper = require('./Helper.js');
var seedrandom = require('seedrandom');
var helper = new Helper();
var OT = require("./OT.js");

var GC = require('./garbling.js');
const { OT_receive } = require('./OT.js');
var gc = new GC('garbler');      //Cant say garbler universally

var recieveTime;
var startTime;
var endTime;

const RECOGNIZED_OPERATIONS = ['AND', 'XOR', 'INV', 'NOT', 'LOR'];    //Valid operaations in the Bristol Format circuit
const HAS_NO_GARBLED_TABLE = ['XOR', 'NOT'];    // Can be used for readability

//Data structure to store a gate
function Gate(id, operation, input_wires, output_wire, garbled_table){
    this.id = id;
    this.operation = operation;
    this.input_wires = input_wires;        //Stores the wire numbers of the wires that form the input to the gate
    this.output_wire = output_wire;
    this.garbled_table = garbled_table;

    if (this.operation === 'INV') {
      this.operation = 'NOT';
    }
}

//function to garble a gate, returns the wire label for output wire and a garbled table for gates that require garbled table
Gate.prototype.garble = function(label_a, label_b){
    
    if (this.operation === "XOR"){
        return gc.garble_XOR_gate(label_a, label_b);
    }

    else if (this.operation === "LOR"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [1,1,1]);  //The last parameter makes it a LOR gate
    }

    else if (this.operation === "AND"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [0,0,0]);
    }

    else if (this.operation === "NOT"){
        return gc.garble_NOT_gate(label_a);
    }
}

//function to evaluate a gate, returns the wire label for the output wire corresponding with the result of evaluating the gate
Gate.prototype.evaluate = function(label_a, label_b, garbled_table){
    if (this.operation === "XOR"){
        return gc.evaluate_XOR_gate(label_a, label_b);
    }

    else if (this.operation === "LOR"){
        return gc.evaluate_AND_gate(label_a, label_b, garbled_table, this.id);
    }

    else if (this.operation === "AND"){
        return gc.evaluate_AND_gate(label_a, label_b, garbled_table, this.id);
    }

    //Nothing to be done to evaluate NOT gate
    else if (this.operation === "NOT"){
        return label_a;
    }

}

function Circuit(wires_count, garbler_input_size, evaluator_input_size, output_size, label_size) {
    this.wires_count = wires_count;
    this.garbler_input_size = garbler_input_size;
    this.evaluator_input_size = evaluator_input_size;
    this.output_size = output_size;
    this.label_size = label_size;
    
    this.wire_labels = [];
    
    // TESTING
    //this.garbler_wire_labels = []
    // TESTING

    this.gates = [];
  }

Circuit.prototype.testSend = function(){
    Room.outsendMessage("hey");
}

//Generate labels for all input wires in the circuit
Circuit.prototype.generateLabels = function(){
    
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;
    
    for (let i = 0; i < numInputWires; i++){
        this.wire_labels[i] = helper.random_label(8)    //8 is the default array length. Need to connect it to a config file
    }


    // TESTING
    //this.garbler_wire_labels = this.wire_labels.map((x) => x);
    // TESTING
}

Circuit.prototype.send_labels = async function(input){
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;

    //Sending garbler input directly
    for (let i = 0; i < this.garbler_input_size; i++){
        let label = this.wire_labels[i];
        
        if(input[i] === 1){
            label = gc.garble_NOT_gate(label);
        }

        console.log("directly sending: " + label);
        Room.outsendMessage(helper.arrayToBuffer(label));
    }

    //Sending evaluator input through OT
    for (let i = this.garbler_input_size; i < numInputWires; i++){
        let label = this.wire_labels[i];
        await OT.OT_send(i,label,gc.garble_NOT_gate(label));
    }
    console.log("This should print first");
    return new Promise(function (resolve){
        resolve();
    })
}

Circuit.prototype.receive_labels = async function(evaluatorInput){
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;

    //receiving garbler input
    for (let i = 0; i < this.garbler_input_size; i++){
        this.wire_labels[i] = await Room.Receive();
        this.wire_labels[i] = new Uint16Array(this.wire_labels[i]);
        console.log("directly received: " + this.wire_labels[i]);
    }

    //receiving labels through OT
    for (let i = 0; i < numInputWires-this.garbler_input_size; i++){
        let index = i + this.garbler_input_size;
        console.log("wire label before: " + this.wire_labels[index]);
        this.wire_labels[index] = await OT.OT_receive(evaluatorInput[i],index);
        console.log("wire label after: " + this.wire_labels[index]);
    }
    console.log("This should print first");
    return new Promise(function (resolve){
        resolve();
    })
}

//garble a gate in the circuit
Circuit.prototype.garble_gate = function(gate_number){

    //Get the gate object corresponding to the gate number
    const gate = this.gates[gate_number];
    
    //Extract input labels from the gate
    const label_a = this.wire_labels[gate.input_wires[0]];
    // //TESTING
    // const label_a = this.wire_labels[gate.input_wires[0]];
    // //Testing

    let label_b = 0;
    //gates that have only one inpu wire have no label_b
    if(gate.input_wires.length === 2){
        label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    const garble_output = gate.garble(label_a, label_b);

    //return garbled table if it is generated for the given gate operation
    if(!HAS_NO_GARBLED_TABLE.includes(gate.operation)  ){  //gate.operation != 'NOT' && gate.operation != 'XOR'
        const garbled_table = garble_output[0];
        const output_wire_label = garble_output[1];

        this.wire_labels[gate.output_wire] = output_wire_label;
        return garbled_table;
    }
    else{
        const output_wire_label = garble_output;
        this.wire_labels[gate.output_wire] = output_wire_label;
        return 0; // In gates where no garbled table is generated
    }

}

//Evaluate a gate in the circuit
Circuit.prototype.evaluate_gate = function(gate_number, garbled_table){

    //Get the gate object corresponding to the gate number
    const gate = this.gates[gate_number];
    
    //Extract input labels from the gate
    const label_a = this.wire_labels[gate.input_wires[0]];
    let label_b = 0;                                         //gates that have only one inpu wire have no label_b
    if(gate.input_wires.length === 2){
        label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    const output_wire_label = gate.evaluate(label_a, label_b, garbled_table);

    this.wire_labels[gate.output_wire] = output_wire_label;

    return output_wire_label;

}

//garble the circuit
Circuit.prototype.garble = async function(){
    const number_of_gates = this.gates.length;
    for( let i = 0; i < number_of_gates; i++){
        let garbled_table = this.garble_gate(i);

        if(garbled_table !== 0){
            //Send that Shit!!!
            console.log("sending garbled table for gate " + i + ": " + garbled_table)
            
            Room.outsendMessage(helper.arrayToBuffer(garbled_table[0]));
            Room.outsendMessage(helper.arrayToBuffer(garbled_table[1]));

        }
        
        //Code to test
        // let gate = this.gates[i];
        // const label_a = this.wire_labels[gate.input_wires[0]];
        // let label_b = 0;
        // if(!HAS_NO_GARBLED_TABLE.includes(gate.operation)){
        //     label_b = this.wire_labels[gate.input_wires[1]];
        // }
        // const output_wire_label = this.evaluate_gate(i, garbled_table);
        //Code to test
    }

    //TESTING
    const startOfOutputWires = this.wires_count - this.output_size;
    console.log("Wire label: ");
    console.log(this.wire_labels);
    let outputWireLabel;
    let output = "";
    for( let i = startOfOutputWires; i < this.wires_count; i++){
        outputWireLabel = await Room.Receive();
        //outputWireLabel = JSON.parse(outputWireLabel);
		outputWireLabel = new Uint16Array(outputWireLabel);
        console.log("wire received from evaluator: ");
        console.log(outputWireLabel.toString());
        console.log('If output is 1');
        console.log((gc.garble_NOT_gate(this.wire_labels[i])).toString());
        console.log('If output is 0');
        console.log(this.wire_labels[i].toString());
        if(outputWireLabel.toString() === this.wire_labels[i].toString()){
            console.log("0\n");
            output = output + "0";
        }

        else if(outputWireLabel.toString() === (gc.garble_NOT_gate(this.wire_labels[i])).toString()) {
            console.log("1\n");
            output = output + "1";
        }

        else{
            console.log("error\n");
            output = output + "error";
        }
    }

    return new Promise(function (resolve){
        resolve(output);
    })
}

Circuit.prototype.evaluate = async function(){
    const number_of_gates = this.gates.length;
    console.log("number of gates: " + number_of_gates);
    var evaluatedLabel;
    recieveTime = 0;
    for( let i = 0; i < number_of_gates; i++){
        let garbled_table = 0;
        var garbled_table_0;
        var garbled_table_1;

        //Receive garbled table if the gate requires it
        console.log("Evaluating gate " + i + ": " + this.gates[i].operation);
        if(!HAS_NO_GARBLED_TABLE.includes(this.gates[i].operation)){
            startTime = new Date().getTime();
            //Recieve Garbled table
            garbled_table_0 = await Room.Receive()
            // garbled_table_0 = JSON.parse(garbled_table_0);
		    // garbled_table_0 = Uint16Array.from(garbled_table_0);
            garbled_table_0 = new Uint16Array(garbled_table_0);

            garbled_table_1 = await Room.Receive()
            // garbled_table_1 = JSON.parse(garbled_table_1);
		    // garbled_table_1 = Uint16Array.from(garbled_table_1);
            garbled_table_1 = new Uint16Array(garbled_table_1);

            endTime = new Date().getTime();
            
            recieveTime += endTime - startTime;

            garbled_table = [garbled_table_0, garbled_table_1];
            //garbled_table = JSON.parse(garbled_table);
            console.log("Received garbled table for gate " + i + ": " + garbled_table);
            evaluatedLabel = this.evaluate_gate(i, garbled_table);
            console.log("Evaluated gate " + i + " Output wire" + this.gates[i].output_wire + ": " + evaluatedLabel);
        }
        else{
            evaluatedLabel = this.evaluate_gate(i, garbled_table);
            console.log("Evaluated gate " + i + " Output wire" + this.gates[i].output_wire + ": " + evaluatedLabel);
        }
    }

    console.log("Time taken for recieving garbled tables: " + ((recieveTime)/1000.0).toString());

        //TESTING
        const startOfOutputWires = this.wires_count - this.output_size;
        console.log("Wire label: ");
        console.log(this.wire_labels);
        for( let i = startOfOutputWires; i < this.wires_count; i++){
            console.log("output wire " + i);
            Room.outsendMessage(helper.arrayToBuffer(this.wire_labels[i]));
            console.log(this.wire_labels[i]);
            // if(this.wire_labels[i].toString() == this.garbler_wire_labels[i].toString()){
            //     console.log("0\n");
            // }

            // else{
            //     console.log("1\n");
            // }
        }
        return new Promise(function (resolve){
            resolve();
        })
}

Circuit.prototype.test = function(){
    this.wire_labels[1] = gc.garble_NOT_gate(this.wire_labels[1]);
    this.wire_labels[0] = gc.garble_NOT_gate(this.wire_labels[0]);
    this.wire_labels[2] = gc.garble_NOT_gate(this.wire_labels[2]);
    const number_of_gates = this.gates.length;
    for( let i = 0; i < number_of_gates; i++){
        let gate = this.gates[i];
        
        console.log("Garbling gate " + i + ": " + gate.operation);
        let garbled_table = this.garble_gate(i);


        this.evaluate_gate(i, garbled_table);

        if(this.wire_labels[gate.output_wire].toString() === this.garbler_wire_labels[gate.output_wire].toString()){
            console.log("Output: 0\n");
        }

        else{
            console.log("Output: 1\n");
        }
    }

    const startOfOutputWires = this.wires_count - this.output_size;
    for( let i = startOfOutputWires; i < this.wires_count; i++){
        console.log("output wire " + i);
        if(this.wire_labels[i].toString() === this.garbler_wire_labels[i].toString()){
            console.log("0\n");
        }

        else{
            console.log("1\n");
        }
    }

}

  const gates = function(gate) {
      return gate;
  }

// test_circuit = parsecircuit('circuits/bristol/my_circuit.txt');
// test_circuit.generateLabels();

// test_circuit.garble();

module.exports = {
    Circuit : Circuit,
    Gate : Gate
};