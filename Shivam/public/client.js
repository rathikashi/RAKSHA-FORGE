// var bigInt = require("big-integer");
// var CryptoJS = require("crypto-js");
const crypto = require('crypto');

var label_length = 256;  //Length of each label in bits
var array_length = 8; // Length of Uint16Array to represent a label
//var max_labelValue = bigInt(2).pow(label_length).minus(1); // Max value a label can hold(to be used to generate random label)
var R = random_label(array_length); //Common random label
R[array_length-1] = R[array_length-1] | 1; // Rightmost bit of R should always be 1 so that the labels corresponding to opposite input bits of a wire have opposite point and permute bits

/***************TODO*********************/

function bytesTobigInt(bytes){
	var big = 0n;
	for (let i = 0; i < bytes.length; i++){
		big = big << 16n;
		big = big + BigInt(bytes[i]); 
	}

	return big;
}

//Only converts to Uint16Array of length of a label
function bigIntToBytes(big){
	var bytes = new Uint16Array(array_length);
	for (let i = 0; i < bytes.length; i++){
		bytes[i] = big & 65535n;
		big = big >> 16; 
	}

	return bytes;
}


// Function to generate a random label of length size*16 bits
function random_label(size){
	var label = new Uint16Array(size);
	var random = crypto.randomBytes(size*2);
	console.log(random);
	//generate a number between 0-65536 to store in a 2 byte element
	for (let i = 0; i < size; i++) {
		label[i] = random[2*i] ;
		label[i] = label[i] << 8;
		label[i] += random[2*i + 1];
	}

	return label;
}
//Funcion to xor two Uint16Array variables
function xor(label_a, label_b){

	//Initialize array to store xor output
	var output = new Uint16Array(array_length);

	//Perform element-wise xor for the input arrays and store in output array
	for (let i = 0; i < array_length; i++) {
		output[i] = label_a[i] ^ label_b[i];
	}

	return output;
}

//Function to calculate hash of a given value (Need to make sure if it has circular correlation robustness)
function hash(key, id){

	
	var k = new Uint16Array(array_length);
	var temp_id = id;
	
	for (let i = 0; i < array_length; i++) {
		k[i] = 2*key[i] ^ id;
		temp_id = temp_id >> 16;
		if(temp_id == 0){
			temp_id = id;
		}
	}

	//permutation array stores a random permutation of k
	var permutation = new Uint16Array(array_length);
	permutation[0] = k[array_length-1];

	for (let i = 1; i < array_length; i++) {
		permutation[i] = (k[i-1] >> 8) + (k[i-1] << 8);
	}

	return xor(permutation, k);
}


function garble_generator_half_gate(bit_a, label_b, gate_id, alpha){
	//const p_b = new Array(2);
	const hashes = new Array(2);
	//const label_c = new Array(2);
	let garbled_table = new Uint16Array(array_length);

	// /********** Extract point and permute bits from the label **********/

	const p_b = label_b[array_length - 1] & 1;
	//p_b[1] = 1 - p_b[0];

	// /******************************************************************/

	
	// /********* Calculate the required Hashes **********/

	// hashes[p_b[0]] = hash(label_b, gate_id);
	// hashes[p_b[1]] = hash(xor(label_b, R));

	// /*************************************************/

	
	// /********** Set output label values based on the hash table and point and permute bits *********/

	// //Label corresponding to the first row in hash table takes the values of the hash stored in that row
	// if(bit_a == 0){
	// 	label_c[0] = Uint16Array.from(hash[0]);
	// 	label_c[1] = xor(label_c[0], R);
	// }

	// else{
	// 	if(p_b[0] == 1){
	// 		label_c[1] = Uint16Array.from(hash[0]);
	// 		label_c[0] = xor(label_c[1], R);
	// 	}

	// 	else{
	// 		label_c[0] = Uint16Array.from(hash[0]);
	// 		label_c[1] = xor(label_c[0], R);
	// 	}
	// }

	// /***********************************************************************************************/

	
	// /********** Finish encryption using xor **********/

	// hashes[p_b[0]] = xor(hashes[p_b[0]], label_c[0]);

	// if(bit_a == 0){
	// 	hashes[p_b[1]] = xor(hashes[p_b[1]], label_c[0]);
	// }
	// else{
	// 	hashes[p_b[1]] = xor(hashes[p_b[1]], label_c[1]);
	// }

	// /************************************************/

	// garbled_table = hashes[1];

	// return garbled_table;

	const b_labels = [Uint16Array.from(label_b), xor(label_b, R)];
	console.log("p_b: " + p_b);
	hashes[0] = hash(label_b, gate_id);
	hashes[1] = hash(xor(label_b, R), gate_id);

	let label_c = hashes[p_b];
	if(( (p_b ^ alpha[0]) & (bit_a ^ alpha[1]) ) ^ alpha[2] ){
		label_c = xor(label_c, R)
	} 

	console.log("label_c0: ", label_c.toString());
	console.log("label_c1: ", xor(label_c, R).toString());

	garble_gate = xor(hashes[0], hashes[1]);
	if(bit_a ^ alpha[1]){
		garble_gate = xor(garble_gate, R);
	}

	return garble_gate

}

function evaluate_generator_half_gate(label_b, garbled_table, gate_id){

	//Hash the input label
	const hash_value = hash(label_b, gate_id);

	//Extract point and permute bit
	const p_b = label_b[array_length-1] & 1;

	/********* Return output label based on point and permite bit **********/

	if(p_b == 0){
		return hash_value;
	}

	else{
		return xor(hash_value, garbled_table);
	}

	/**********************************************************************/

}

function garble_evaluator_half_gate(label_a, label_b, gate_id, alpha){
	const hashes = new Array(2);
	let garbled_table = new Uint16Array(array_length);
	const p_b = label_b[array_length - 1] & 1;

	hashes[0] = hash(label_b, gate_id);
	hashes[1] = hash(xor(label_b, R), gate_id);

	let label_c = hashes[p_b];

	garbled_table = xor(xor(hashes[0], hashes[1]), label_a);

	if(alpha[0] == 1){
		garbled_table = xor(garbled_table, R);
	}

	return garble_gate;

}

function evaluate_evaluator_half_gate(label_b, label_a, bit_b,garbled_table, gate_id){
	const hash_value = hash()
}

/****************************************/

//function to garble a gate given input labels and the values produced as output
//Leftmost bit of each label is a permute bit, not to be used for encryption
function garble_gate(val_a0, val_a1, val_b0, val_b1, val_00, val_01, val_10, val_11) {
	
	/********** separate label values and point and permite bits from the given labels **********/
	
	//label||bit
	var temp = val_a0.divmod(2);  //label, bit
	var label_a0 = temp.quotient; // label
	var p_a0 = temp.remainder;    //bit

	temp = val_a1.divmod(2);
	var label_a1 = temp.quotient;
	var p_a1 = temp.remainder;

	temp = val_b0.divmod(2);
	var label_b0 = temp.quotient;
	var p_b0 = temp.remainder;

	temp = val_b1.divmod(2);
	var label_b1 = temp.quotient;
	var p_b1 = temp.remainder;

	/*********************************************************************************************/

	/********** Table Generation **********/

	var garbled_table = [4]; //array to store the grbled gate

	//Encrypting using the labels as AES keys, position of ciphertext is based on point and permute
	garbled_table[2*p_a0 + p_b0] = CryptoJS.AES.encrypt(val_00, label_a0.shiftLeft(label_length).add(label_b0).toString()).toString();
	garbled_table[2*p_a0 + p_b1] = CryptoJS.AES.encrypt(val_01, label_a0.shiftLeft(label_length).add(label_b1).toString()).toString();
	garbled_table[2*p_a1 + p_b0] = CryptoJS.AES.encrypt(val_10, label_a1.shiftLeft(label_length).add(label_b0).toString()).toString();
	garbled_table[2*p_a1 + p_b1] = CryptoJS.AES.encrypt(val_11, label_a1.shiftLeft(label_length).add(label_b1).toString()).toString();

	/*************************************/
	
	console.log("label_a0 " + label_a0.toString());
	console.log("label_a1 " + label_a1.toString());
	console.log("label_b0 " + label_b0.toString());
	console.log("label_b1 " + label_b1.toString());

	console.log(garbled_table);

	return garbled_table;

}


//function to garble a gate given input labels and the values produced as output
//Leftmost bit of each label is also used as the permute bit
function new_garble_gate(key_a, key_b, output_values, gate_id) {
	
	const label_a = new Array(2);
	const label_b = new Array(2);
	const label_c = new Array(2);
	const p_a = new Array(2);
	const p_b = new Array(2);
	const garbled_table = new Array(3);
	const hashes = new Array(4);

	/********** extract point and permite bits from the given labels **********/

	//extract point and permute bits for input a
	label_a[0] = Uint16Array.from(key_a); //label = {bbb.....bb||p_a0}
	p_a[0] = (label_a[0][array_length-1]) & 1;
	p_a[1] = 1-p_a[0];  //p_a1 has the opposite value of p_a0
	label_a[1] = xor(label_a[0],R);

	//extract point and permute bit for input b
	label_b[0] = Uint16Array.from(key_b);
	p_b[0] = (label_b[0][array_length-1]) & 1;
	p_b[1] = 1-p_b[0];
	label_b[1] = xor(label_b[0],R);

	/**************************************************************************/

	
	/********* Calculating the required Hashes **********/

	hashes[2*p_a[0] + p_b[0]] = hash(xor(label_a[0], label_b[0]), gate_id);
	hashes[2*p_a[0] + p_b[1]] = hash(xor(label_a[0], label_b[1]), gate_id);
	hashes[2*p_a[1] + p_b[0]] = hash(xor(label_a[1], label_b[0]), gate_id);
	hashes[2*p_a[1] + p_b[1]] = hash(xor(label_a[1], label_b[1]), gate_id);

	/****************************************************/

	
	/********** Set the corresponding C label to the hash at index 0 **********/

	// 2*p_a[0] + p_b[0] is the index of the output that will be at index 0 of the garble table
	if(output_values[2*p_a[0] + p_b[0]] == 0){
		label_c[0] = Uint16Array.from(hashes[0]);
		label_c[1] = xor(label_c[0], R);
	}
	else{
		label_c[1] = Uint16Array.from(hashes[0]);
		label_c[0] = xor(label_c[1], R);
	}

	console.log("label_c0: " + label_c[0].toString());
	console.log("label_c1: " + label_c[1].toString());

	/*************************************************************************/



	/********** Construct the garble table **********/

	hashes[2*p_a[0] + p_b[0]] = xor(hashes[2*p_a[0] + p_b[0]],(label_c[output_values[0]]));
	hashes[2*p_a[0] + p_b[1]] = xor(hashes[2*p_a[0] + p_b[1]],(label_c[output_values[1]]));
	hashes[2*p_a[1] + p_b[0]] = xor(hashes[2*p_a[1] + p_b[0]],(label_c[output_values[2]]));
	hashes[2*p_a[1] + p_b[1]] = xor(hashes[2*p_a[1] + p_b[1]],(label_c[output_values[3]]));

	garbled_table[0] = hashes[1];
	garbled_table[1] = hashes[2];
	garbled_table[2] = hashes[3];

	/************************************************/

	console.log(hashes[0]);

	return garbled_table;

}

function new_evaluate_gate(key_a, key_b, garbled_table, gate_id){
	/********** extract point and permite bits from the given keys **********/

	var p_a = key_a[array_length-1] & 1;
	var p_b = key_b[array_length-1] & 1;

	var hash_value = hash(xor(key_a, key_b), gate_id); 

	index = 2*p_a + p_b;

	if(index == 0){
		return hash_value;
	}

	else{
		return xor(garbled_table[index-1],hash_value);
	}
}

function evaluate_gate(val_a, val_b, garbled_table){

	/********** separate label values and point and permite bits from the given labels **********/
	
	//label||bit
	var temp = val_a.divmod(2);  //label, bit
	var label_a = temp.quotient; // label
	var p_a = temp.remainder;    //bit

	var temp = val_b.divmod(2);
	var label_b = temp.quotient;
	var p_b = temp.remainder;

	/*********************************************************************************************/

	// Decrypt
	var bytes  = CryptoJS.AES.decrypt(garbled_table[2*p_a + p_b], label_a.shiftLeft(label_length).add(label_b).toString());
	var originalText = bigInt(bytes.toString(CryptoJS.enc.Utf8));

	console.log(originalText);

	return originalText;

}

//function to garble a gate given input labels and the values produced as output
//Leftmost bit of each label is also used as the permute bit
function garble_AND_gate(label_a, label_b, gate_id, alphas){
	
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

	hashes_a[0] = hash(label_a, j1);
	hashes_a[1] = hash( xor(label_a, R), j1);

	garbled_table[0] = xor(hashes_a[0], hashes_a[1] );
	if((p_b ^ alphas[1]) == 1){
		garbled_table[0] = xor(garbled_table[0], R);
	}
	label_c[0] = hashes_a[p_a];
	if((p_a ^ alphas[0]) & (p_b ^ alphas[1]) ^ alphas[2] == 1){
		label_c[0] = xor(label_c[0], R);
	}

	/*************************************/

	
	/********** Second half table **********/

	hashes_b[0] = hash(label_b, j2);
	hashes_b[1] = hash( xor(label_b, R), j2);

	garbled_table[1] = xor(hashes_b[0], hashes_b[1] );
	garbled_table[1] = xor(garbled_table[1], label_a);
	if(alphas[0] == 1){
		garbled_table[1] = xor(garbled_table[1], R);
	}
	if(p_b == 1){
		label_c[1] = hashes_b[1];
	}
	else{
		label_c[1] = hashes_b[0];
	}

	/***************************************/

	
	/********** Combining the two halves **********/

	const output_label = xor(label_c[0], label_c[1]);

	/**********************************************/

	
	/********** Sending the table to the evaluator **********/
	
	//Converting the garbled table entries to a string
	var table_entries = [];
	for (let i = 0; i < array_length; i++) {
		table_entries[i] = String.fromCharCode(garbled_table[0][i]);
	}

	table_enteries = [];
	for (let i = array_length; i < array_length * 2; i++) {
		table_entries[i] = String.fromCharCode(garbled_table[1][i]);
	}

	table_entries = table_entries.join(''); //send this

	/*******************************************************/

	return garbled_table;



}

function evaluate_AND_gate(label_a, label_b, gate_id, garbled_table){

	const label_c = new Array(2);
	//const garbled_table = new Array(2);
	
	/********* Extracting point and permute bits **********/

	const s_a = (label_a[array_length-1]) & 1;
	const s_b = (label_b[array_length-1]) & 1;

	/*****************************************************/

	
	/********** Known constant for hashing **********/

	const j1 = gate_id*2;
	const j2 = gate_id*2 + 1;

	/***********************************************/
	
	
	/********** Recieve garbled table **********/

	var table_entries; // Recieve this

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

	/******************************************/

	
	/********** Evaluate first half-gate **********/

	label_c[0] = hash(label_a, j1);
	if(s_a == 1){
		label_c[0] = xor( label_c[0], garbled_table[0]);
	}

	/**********************************************/

	/********** Evaluate second half-gate **********/

	label_c[1] = hash(label_b, j2);
	if(s_b == 1){
		label_c[1] = xor( label_c[1], xor(garbled_table[1], label_a));
	}

	/***********************************************/

	//Combine the two halves

	const output_label = xor(label_c[0], label_c[1]);

	return output_label;


}


var r_a = Math.floor(Math.random() * 2); //random bit for point and permute for party a
var r_b = Math.floor(Math.random() * 2); //random bit for point and permute for party b

//Generate random labels (range is inclusive of both values)
var label_a0 = random_label(array_length);
var label_b0 = random_label(array_length);

//var gate1 = garble_gate(label_a0, label_a1, label_b0, label_b1, 0, "999", 0, 0);

//evaluate_gate(label_a0, label_b1, gate1);

var gate2 = new_garble_gate(label_a0, label_b0, [0,0,0,1], 3);

var result = new_evaluate_gate(xor(label_a0, R), label_b0, gate2, 3);

console.log("result: " + result);

var gate3 = garble_AND_gate(label_a0, label_b0,2, [1,1,1]);

result = evaluate_AND_gate(label_a0, label_b0, 2, gate3);

console.log("result_label: " + result.toString());

export default Garbler;