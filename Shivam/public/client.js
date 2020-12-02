// var bigInt = require("big-integer");
// var CryptoJS = require("crypto-js");

var label_length = 256;  //Length of each label in bits
var max_labelValue = bigInt(2).pow(label_length).minus(1); // Max value a label can hold(to be used to generate random label)
var R = bigInt.randBetween(0, max_labelValue.minus(1)).multiply(2).add(1);

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
function new_garble_gate(key_a, key_b, output_values) {
	
	var label_a = new Array(2);
	var label_b = new Array(2);
	var label_c = new Array(2);
	var p_a = new Array(2);
	var p_b = new Array(2);
	var garbled_table = new Array(3);
	var hashes = new Array(4);

	/********** extract point and permite bits from the given labels **********/

	//extract point and permute bits for input a
	label_a[0] = bigInt(key_a);  //label = {bbb.....bb||p_a0}
	p_a[0] = (label_a[0]).mod(2).valueOf();
	console.log("permute bit a0: " + p_a[0]);
	p_a[1] = 1-p_a[0];  //p_a1 has the opposite value of p_a0
	label_a[1] = (label_a[0]).xor(R);

	//extract point and permute bit for input b
	label_b[0] = bigInt(key_b);
	p_b[0] = label_b[0].mod(2).valueOf();
	p_b[1] = 1-p_b[0];
	label_b[1] = label_b[0].xor(R);

	/**************************************************************************/

	
	/********* Calculating the required Hashes **********/

	hashes[2*p_a[0] + p_b[0]] = bigInt(CryptoJS.SHA3(label_a[0].shiftLeft(label_length).add(label_b[0]).toString(), { outputLength: label_length }).toString(), 16);
	hashes[2*p_a[0] + p_b[1]] = bigInt(CryptoJS.SHA3(label_a[0].shiftLeft(label_length).add(label_b[1]).toString(), { outputLength: label_length }).toString(), 16);
	hashes[2*p_a[1] + p_b[0]] = bigInt(CryptoJS.SHA3(label_a[1].shiftLeft(label_length).add(label_b[0]).toString(), { outputLength: label_length }).toString(), 16);
	hashes[2*p_a[1] + p_b[1]] = bigInt(CryptoJS.SHA3(label_a[1].shiftLeft(label_length).add(label_b[1]).toString(), { outputLength: label_length }).toString(), 16);

	/****************************************************/

	
	/********** Set the corresponding C label to the hash at index 0 **********/

	// 2*p_a[0] + p_b[0] is the index of the output that will be at index 0 of the garble table
	if(output_values[2*p_a[0] + p_b[0]] == 0){
		label_c[0] = bigInt(hashes[0]);
		label_c[1] = bigInt(label_c[0]).xor(R);
	}
	else{
		label_c[1] = bigInt(hashes[0]);
		label_c[0] = bigInt(label_c[1]).xor(R);
	}

	console.log("label_c0: " + label_c[0].toString());
	console.log("label_c1: " + label_c[1].toString());

	/*************************************************************************/



	/********** Construct the garble table **********/

	hashes[2*p_a[0] + p_b[0]] = hashes[2*p_a[0] + p_b[0]].xor(label_c[output_values[0]]).toString(16);
	hashes[2*p_a[0] + p_b[1]] = hashes[2*p_a[0] + p_b[1]].xor(label_c[output_values[1]]).toString(16);
	hashes[2*p_a[1] + p_b[0]] = hashes[2*p_a[1] + p_b[0]].xor(label_c[output_values[2]]).toString(16);
	hashes[2*p_a[1] + p_b[1]] = hashes[2*p_a[1] + p_b[1]].xor(label_c[output_values[3]]).toString(16);

	garbled_table[0] = hashes[1];
	garbled_table[1] = hashes[2];
	garbled_table[2] = hashes[3];

	/************************************************/

	console.log(hashes[0]);

	return garbled_table;

}

function new_evaluate_gate(key_a, key_b, garbled_table){
	/********** extract point and permite bits from the given keys **********/

	var p_a = key_a.mod(2).valueOf();
	var p_b = key_b.mod(2).valueOf();

	var hash = bigInt(CryptoJS.SHA3(key_a.shiftLeft(label_length).add(key_b).toString(), { outputLength: label_length }).toString(), 16);

	index = 2*p_a + p_b;

	if(index == 0){
		return hash.toString();
	}

	else{
		return bigInt(garbled_table[index-1],16).xor(hash).toString();
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

var r_a = Math.floor(Math.random() * 2); //random bit for point and permute for party a
var r_b = Math.floor(Math.random() * 2); //random bit for point and permute for party b

//Generate random labels (range is inclusive of both values)
var label_a0 = bigInt.randBetween(0, max_labelValue-1).multiply(2).add(r_a ^ 0);
var label_a1 = bigInt.randBetween(0, max_labelValue-1).multiply(2).add(r_a ^ 1);
var label_b0 = bigInt.randBetween(0, max_labelValue-1).multiply(2).add(r_b ^ 0);
var label_b1 = bigInt.randBetween(0, max_labelValue-1).multiply(2).add(r_b ^ 1);

var gate1 = garble_gate(label_a0, label_a1, label_b0, label_b1, 0, "999", 0, 0);

evaluate_gate(label_a0, label_b1, gate1);

var gate2 = new_garble_gate(label_a0, label_b0, [0,0,0,1]);

var result = new_evaluate_gate(label_a0.xor(R), label_b0.xor(R), gate2);

console.log("result: " + result);