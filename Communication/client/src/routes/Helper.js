const crypto = require('crypto');
var seedrandom = require('seedrandom');

var label_length = 128;  //Length of each label in bits
var array_length = 8; // Length of Uint16Array to represent a label
//var max_labelValue = bigInt(2).pow(label_length).minus(1); // Max value a label can hold(to be used to generate random label)
//var R = random_label(array_length); //Common random label
//R[array_length-1] = R[array_length-1] | 1; // Rightmost bit of R should always be 1 so that the labels corresponding to opposite input bits of a wire have opposite point and permute bits

function Helper(){
	this.test = true;
 	this.label_length = 128;  //Length of each label in bits
	this.array_length = 8; // Length of Uint16Array to represent a label
}

Helper.prototype.randomBytes = function (width) {
	var out = new Uint8Array(width);
	(global.crypto || global.msCrypto).getRandomValues(out);
	return out;
  }

// Function to generate a random label of length size*16 bits
// Helper.prototype.random_label = function (size, rng){
// 	var label = new Uint16Array(size);
// 	//console.log(random);
// 	//generate a number between 0-65535 to store in a 2 byte element
// 	for (let i = 0; i < size; i++) {
// 		label[i] = Math.floor(rng() * 65535);
// 	}

// 	return label;
// }

Helper.prototype.random_label = function (size){
    var label = new Uint16Array(size);
    var random = crypto.randomBytes(size*2);
    //console.log(random);
	
    //generate a number between 0-65535 to store in a 2 byte element
    for (let i = 0; i < size; i++) {
        label[i] = random[2*i] ;
        label[i] = label[i] << 8;
        label[i] += random[2*i + 1];
    }

    return label;
	//return new Uint8Array(random);
}

//Funcion to xor two Uint16Array variables
Helper.prototype.xor = function (label_a, label_b){

	//Initialize array to store xor output
	var output = new Uint16Array(array_length);

	//Perform element-wise xor for the input arrays and store in output array
	for (let i = 0; i < array_length; i++) {
		output[i] = label_a[i] ^ label_b[i];
	}

	return output;
}

//Function to calculate hash of a given value (Need to make sure if it has circular correlation robustness)
Helper.prototype.hash = function (key, id){

	
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

	return this.xor(permutation, k);
}

//Converts given typed array to an arraybuffer
Helper.prototype.arrayToBuffer = function (arr){
	var buffer = arr.buffer.slice(arr.byteOffset, arr.byteLength + arr.byteOffset);
	return buffer
}

module.exports = Helper;