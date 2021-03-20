var Helper = require('./Helper.js');
var seedrandom = require('seedrandom');
var helper = new Helper();
var array_length = 8;
var R;

function gc(role){
	this.test = true;
	if(role == 'garbler'){
		R = helper.random_label(array_length); //Common random label
		R[array_length-1] = R[array_length-1] | 1; // Rightmost bit of R should always be 1 so that the labels corresponding to opposite input bits of a wire have opposite point and permute bits

	}
   }

//Send R

//function to garble a gate given input labels and the values produced as output
//Leftmost bit of each label is also used as the permute bit
//[0,0,0] AND
//[1,1,1] LOR
gc.prototype.garble_XOR_gate = function(label_a, label_b){
	return helper.xor(label_a, label_b);
}

gc.prototype.garble_NOT_gate = function(label_a){
	return helper.xor(label_a, R);
}

gc.prototype.evaluate_XOR_gate = function(label_a, label_b){
	return helper.xor(label_a, label_b);
}

//Label has been XORd with R by the garbler so the gate has been evaluated
gc.prototype.evaluate_NOT_gate = function(label_a){
	return label_a;
}

gc.prototype.garble_AND_gate = function(label_a, label_b, gate_id, alphas){
	
	const label_c = new Array(2);
	const garbled_table = new Array(2);
	const hashes_a = new Array(2);
	const hashes_b = new Array(2);

	
	/********* Extracting point and permute bits **********/

	const p_a = (label_a[array_length-1]) & 1;
	const p_b = (label_b[array_length-1]) & 1;

	/******************************************************/

	
	/********** Known constant for hashing **********/

	const j1 = gate_id*2;
	const j2 = gate_id*2 + 1;

	/***********************************************/

	
	/********** First half table *********/

	hashes_a[0] = helper.hash(label_a, j1);
	hashes_a[1] = helper.hash( helper.xor(label_a, R), j1);

	garbled_table[0] = helper.xor(hashes_a[0], hashes_a[1] );
	if((p_b ^ alphas[1]) == 1){
		garbled_table[0] = helper.xor(garbled_table[0], R);
	}
	label_c[0] = hashes_a[p_a];
	if((p_a ^ alphas[0]) & (p_b ^ alphas[1]) ^ alphas[2] == 1){
		label_c[0] = helper.xor(label_c[0], R);
	}

	/*************************************/

	
	/********** Second half table **********/

	hashes_b[0] = helper.hash(label_b, j2);
	hashes_b[1] = helper.hash( helper.xor(label_b, R), j2);

	garbled_table[1] = helper.xor(hashes_b[0], hashes_b[1] );
	garbled_table[1] = helper.xor(garbled_table[1], label_a);
	if(alphas[0] == 1){
		garbled_table[1] = helper.xor(garbled_table[1], R);
	}
	if(p_b == 1){
		label_c[1] = hashes_b[1];
	}
	else{
		label_c[1] = hashes_b[0];
	}

	/***************************************/

	
	/********** Combining the two halves **********/

	const output_label = helper.xor(label_c[0], label_c[1]);

	// console.log("output_label0: " + output_label);
	// console.log("output_label1: " + xor(output_label,R));

	/**********************************************/

	
	/********** Sending the table to the evaluator **********/
	
	//Converting the garbled table entries to a string
	var table_entries = [];
	for (let i = 0; i < array_length; i++) {
		table_entries[i] = String.fromCharCode(garbled_table[0][i]);
	}

	// table_entries = [];
	for (let i = array_length; i < array_length * 2; i++) {
		table_entries[i] = String.fromCharCode(garbled_table[1][i-array_length]);
	}

	table_entries = table_entries.join(''); //send this

	// console.log("table_entries: " + table_entries);

	/*******************************************************/

	// console.log("garbled_table0: " + garbled_table[0]);
	// console.log("garbled_table1: " + garbled_table[1]);

	return [table_entries, output_label];



}

//Function to evaluate a garbled gate
gc.prototype.evaluate_AND_gate= function(label_a, label_b, table_entries, gate_id){

	const label_c = new Array(2);
	const garbled_table = new Array(2);
	
	/********* Extracting point and permute bits **********/

	const s_a = (label_a[array_length-1]) & 1;
	const s_b = (label_b[array_length-1]) & 1;

	/*****************************************************/

	
	/********** Known constant for hashing **********/

	const j1 = gate_id*2;
	const j2 = gate_id*2 + 1;

	/***********************************************/
	
	
	/********** Recieve garbled table **********/

	//var table_entries; // Recieve this

	var entry1 = new Uint16Array(8);

	for (let i = 0; i < array_length; i++) {
		entry1[i] = table_entries.charCodeAt(i);
	}

	garbled_table[0] = entry1;

	var entry2 = new Uint16Array(8);

	for (let i = array_length; i < array_length * 2; i++) {
		entry2[i - array_length] = table_entries.charCodeAt(i);
	}

	garbled_table[1] = entry2;

	// console.log("recieved_table0: " + garbled_table[0]);
	// console.log("recieved_table1: " + garbled_table[1]);

	/******************************************/

	
	/********** Evaluate first half-gate **********/

	label_c[0] = helper.hash(label_a, j1);
	if(s_a == 1){
		label_c[0] = helper.xor( label_c[0], garbled_table[0]);
	}

	/**********************************************/

	/********** Evaluate second half-gate **********/

	label_c[1] = helper.hash(label_b, j2);
	if(s_b == 1){
		label_c[1] = helper.xor( label_c[1], helper.xor(garbled_table[1], label_a));
	}

	/***********************************************/

	//Combine the two halves

	const output_label = helper.xor(label_c[0], label_c[1]);

	return output_label;


}


module.exports = gc;