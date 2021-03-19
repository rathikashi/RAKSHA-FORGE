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
    
    if (this.operation == "XOR"){
        return gc.garble_XOR_gate(label_a, label_b);
    }

    else if (this.operation == "LOR"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [1,1,1]);  //The last parameter makes it a LOR gate
    }

    else if (this.operation == "AND"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [0,0,0]);
    }

    else if (this.operation == "NOT"){
        return gc.garble_NOT_gate(label_a);
    }
}

//function to evaluate a gate, returns the wire label for the output wire corresponding with the result of evaluating the gate
Gate.prototype.evaluate = function(label_a, label_b, garbled_table){
    if (this.operation == "XOR"){
        return gc.evaluate_XOR_gate(label_a, label_b);
    }

    else if (this.operation == "LOR"){
        return gc.evaluate_AND_gate(label_a, label_b, garbled_table, this.id);
    }

    else if (this.operation == "AND"){
        return gc.evaluate_AND_gate(label_a, label_b, garbled_table, this.id);
    }

    //Nothing to be done to evaluate NOT gate
    else if (this.operation == "NOT"){
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
    this.garbler_wire_labels = []
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
    this.garbler_wire_labels = this.wire_labels.map((x) => x);
    // TESTING
}

Circuit.prototype.send_labels_ot = function(){
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;

    //Sending labels through OT
    for (let i = 0; i < numInputWires; i++){
        OT.OT_send(i,this.wire_labels[i][0],this.wire_labels[i][1]);
    }
}

Circuit.prototype.receive_labels_ot = function(evaluatorInput){
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;

    //receiving labels through OT
    for (let i = 0; i < numInputWires; i++){
        OT.OT_receive(evaluatorInput[i],i);
    }
}

//garble a gate in the circuit
Circuit.prototype.garble_gate = function(gate_number){

    //Get the gate object corresponding to the gate number
    const gate = this.gates[gate_number];
    
    //Extract input labels from the gate
    //const label_a = this.wire_labels[gate.input_wires[0]];
    //TESTING
    const label_a = this.garbler_wire_labels[gate.input_wires[0]];
    //Testing

    let label_b = 0;
    //gates that have only one inpu wire have no label_b
    if(gate.input_wires.length == 2){
        //TESTING
        label_b = this.garbler_wire_labels[gate.input_wires[1]];                    //label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    const garble_output = gate.garble(label_a, label_b);

    //return garbled table if it is generated for the given gate operation
    if(!HAS_NO_GARBLED_TABLE.includes(gate.operation)  ){  //gate.operation != 'NOT' && gate.operation != 'XOR'
        const garbled_table = garble_output[0];
        const output_wire_label = garble_output[1];

        //TESTING
        this.garbler_wire_labels[gate.output_wire] = output_wire_label;             //this.wire_labels[gate.output_wire] = output_wire_label;
        return garbled_table;
    }
    else{
        const output_wire_label = garble_output;
        //TESTING
        this.garbler_wire_labels[gate.output_wire] = output_wire_label;                     //this.wire_labels[gate.output_wire] = output_wire_label;
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
    if(gate.input_wires.length == 2){
        label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    const output_wire_label = gate.evaluate(label_a, label_b, garbled_table);

    this.wire_labels[gate.output_wire] = output_wire_label;

    return output_wire_label;

}

//garble the circuit
Circuit.prototype.garble = function(){
    const number_of_gates = this.gates.length;
    for( let i = 0; i < number_of_gates; i++){
        let garbled_table = this.garble_gate(i);

        if(garbled_table != 0){
            //Send that Shit!!!
            Room.outsendMessage(garbled_table);
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
}

Circuit.prototype.evaluate = function(){
    const number_of_gates = this.gates.length;
    for( let i = 0; i < number_of_gates; i++){
        let garbled_table = 0;

        //Receive garbled table if the gate requires it
        if(!HAS_NO_GARBLED_TABLE.includes(this.gates[i].operation)){
            //Recieve Garbled table
            garbled_table = Room.Receive().then( function(garbled_table){
                this.evaluate_gate(i, garbled_table);
            });
        }
        else{
            this.evaluate_gate(i, garbled_table);
        }
    }
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

        if(this.wire_labels[gate.output_wire].toString() == this.garbler_wire_labels[gate.output_wire].toString()){
            console.log("Output: 0\n");
        }

        else{
            console.log("Output: 1\n");
        }
    }

    const startOfOutputWires = this.wires_count - this.output_size;
    for( let i = startOfOutputWires; i < this.wires_count; i++){
        console.log("output wire " + i);
        if(this.wire_labels[i].toString() == this.garbler_wire_labels[i].toString()){
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