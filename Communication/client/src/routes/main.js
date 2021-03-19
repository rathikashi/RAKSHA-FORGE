import Room from "./Room";
import {outsendMessage} from "./Room";
let gate_circuit = require('./circuit.js');
const Circuit = gate_circuit.Circuit;
const Gate = gate_circuit.Gate;

const RECOGNIZED_OPERATIONS = ['AND', 'XOR', 'INV', 'NOT', 'LOR'];    //Valid operaations in the Bristol Format circuit
const HAS_NO_GARBLED_TABLE = ['XOR', 'NOT'];    // Can be used for readability

function parsecircuit(circuit_path){
    text = require('fs').readFileSync(circuit_path, {encoding:'utf8'});

    const rows = text.split('\n').filter(function (line) {
        const tmp = line.trim();
        return !(tmp.startsWith('#') || tmp.length === 0);
    }).map(function (line) {
        if (line.indexOf('#') > -1) {
        line = line.substring(0, line.indexOf('#')).trim();
        }
    
        return line.split(' ').map(function (token) {
        return token.trim();
        });
    });

    const wire_count = parseInt(rows[0][1]);
    const inputs = rows[1];
    inputs.shift();
    const outputs = rows[2];
    outputs.shift();

    // console.log('rows' + rows[0]);

    const circuit = new Circuit(wire_count, parseInt(inputs[0]), parseInt(inputs[1]), parseInt(outputs[0]));

    for (var i=3; i<rows.length; i++){
        const val = rows[i];
        // console.log('val' + val[val.length-1]);
        const input_count = parseInt(val[0]);
        const output_count = parseInt(val[1]);
        const op = val[val.length-1];
        // console.log('op: ' + op);

        if(output_count != 1){
            throw Error('Gate' + i +  'does not have only 1 output');
        }

        if ((op === 'INV' || op === 'NOT') && (input_count !== 1)) {
            throw new Error(op + ' Gate ' + r + ' does not have exactly 1 input!');
          }
        if ((op === 'AND' || op === 'LOR' || op === 'XOR') && (input_count !== 2)) {
            throw new Error('Gate ' + r + ' does not have exactly 2 inputs!');
          }
        
        if (RECOGNIZED_OPERATIONS.indexOf(op) === -1) {
            throw new Error('Unrecognized gate: ' + op)
          }

        const output = parseInt(val[2 + input_count]);
        const inputs = val.slice(2, 2 + input_count).map(function (e) {
          return parseInt(e);
        });

        // console.log('inputs: ' + [inputs]);

        const gate = new Gate(i - 3, op, inputs, output);
        circuit.gates.push(gate);

    }
    //console.log(circuit.gates);
    // console.log(circuit.wires_count);
    // console.log(circuit.garbler_input_size);
    // console.log(circuit.evaluator_input_size);
    return circuit;

}


test_circuit = parsecircuit('circuits/bristol/my_circuit.txt');
//console.log(test_circuit);
test_circuit.generateLabels();
// console.log(test_circuit.wire_labels);
//console.log(test_circuit.gates[0].input_wires);

test_circuit.test();