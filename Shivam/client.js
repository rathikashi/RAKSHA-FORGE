var bigInt = require("big-integer");
var CryptoJS = require("crypto-js");

var label_length = 80;  //Length of each label in bits
var max_labelValue = bigInt(2).pow(label_length).minus(1); // Max value a label can hold(to be used to generate random label)

//function to garble a gate given input labels and the values produces as output
//Leftmost bit of each label is a permute bit, not to be used for encryption
function garble_gate(val_00, val_01, val_10, val_11) {
	//Generate random labels (range is inclusive of both values)
	var label_a0 = bigInt.randBetween(0, max_labelValue);
	var label_a1 = bigInt.randBetween(0, max_labelValue);
	var label_b0 = bigInt.randBetween(0, max_labelValue);
	var label_b1 = bigInt.randBetween(0, max_labelValue);

	console.log(label_a0);
	console.log(label_a1);
	console.log(label_b0);
	console.log(label_b1);

	var r = Math.floor(Math.random() * 2); //random bit for point and permute

	var garbled_table = [4];

	garbled_table[2*(r^0) + r^0] = CryptoJS.AES.encrypt(val_00, label_a0.xor(label_b0).toString()).toString();
	garbled_table[2*(r^0) + r^1] = CryptoJS.AES.encrypt(val_01, label_a0.xor(label_b1).toString()).toString();
	garbled_table[2*(r^1) + r^0] = CryptoJS.AES.encrypt(val_10, label_a1.xor(label_b0).toString()).toString();
	garbled_table[2*(r^1) + r^1] = CryptoJS.AES.encrypt(val_11, label_a1.xor(label_b1).toString()).toString();
	
	console.log(garbled_table);

}

garble_gate(0,0,0,0);