var Helper = require('./Helper.js');
var seedrandom = require('seedrandom');
var helper = new Helper();

var GC = require('./garbling.js');
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

Gate.prototype.garble = function(label_a, label_b){
    
    if (this.operation == "XOR"){
        return gc.garble_XOR_gate(label_a, label_b);
    }

    else if (this.operation == "LOR"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [1,1,1]);
    }

    else if (this.operation == "AND"){
        return gc.garble_AND_gate(label_a, label_b, this.id, [0,0,0]);
    }

    else if (this.operation == "NOT"){
        return gc.garble_NOT_gate(label_a);
    }
}

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
    this.gates = [];
  }

Circuit.prototype.generateLabels = function(){
    
    const numInputWires = this.garbler_input_size + this.evaluator_input_size;
    
    for (var i = 0; i < numInputWires; i++){
        this.wire_labels[i] = helper.random_label(8)
    }
}

Circuit.prototype.garble_gate = function(gate_number){

    //Get the gate object corresponding to the gate number
    gate = this.gates[gate_number];
    
    //Extract input labels from the gate
    label_a = this.wire_labels[gate.input_wires[0]];
    label_b = 0;
    if(gate.input_wires.length == 2){
        label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    garble_output = gate.garble(label_a, label_b);

    
    if(!HAS_NO_GARBLED_TABLE.includes(gate.operation)  ){  //gate.operation != 'NOT' && gate.operation != 'XOR'
        garbled_table = garble_output[0];
        output_wire_label = garble_output[1];

        this.wire_labels[gate.output_wire] = output_wire_label;
        console.log("Output label");
        console.log(output_wire_label);
        return garbled_table;
    }
    else{
        output_wire_label = garble_output;
        console.log("Output label");
        console.log(output_wire_label);
        this.wire_labels[gate.output_wire] = output_wire_label;
        return 0; // In gates where no garbled table is generated
    }

}

Circuit.prototype.evaluate_gate = function(gate_number, garbled_table){

    //Get the gate object corresponding to the gate number
    gate = this.gates[gate_number];
    
    //Extract input labels from the gate
    label_a = this.wire_labels[gate.input_wires[0]];
    label_b = 0;
    if(gate.input_wires.length == 2){
        label_b = this.wire_labels[gate.input_wires[1]];
    }
    
    output_wire_label = gate.evaluate(label_a, label_b, garbled_table);

    this.wire_labels[gate.output_wire] = output_wire_label;

    return output_wire_label;

}

Circuit.prototype.garble = function(){
    number_of_gates = this.gates.length;
    for( i = 0; i < number_of_gates; i++){
        garbled_table = this.garble_gate(i);

        if(garbled_table != 0){
            //Send that Shit!!!
        }
        
        //Code to test
        gate = this.gates[i];
        label_a = this.wire_labels[gate.input_wires[0]];
        label_b = 0;
        if(gate.operation != 'NOT' && gate.operation != 'XOR'){
            label_b = this.wire_labels[gate.input_wires[1]];
        }
        output_wire_label = this.evaluate_gate(i, garbled_table);
        console.log("Output Label");
        console.log(output_wire_label);
        //Code to test
    }
}

Circuit.prototype.evaluate = function(){
    number_of_gates = this.gates.length;
    for( i = 0; i < number_of_gates; i++){
        garbled_table = 0;
        if(this.gates[i] != 'NOT' && this.gates[i] != 'XOR'){
            //Recieve Garbled table
        }

        this.evaluate_gate(i, garbled_table);
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