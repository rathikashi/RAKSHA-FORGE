const crypto = require('crypto');
var sodium = require('libsodium-wrappers-sumo');

var array_length = 8;

// var R = random_label(array_length); //Common random label
// R[array_length-1] = R[array_length-1] | 1; // Rightmost bit of R should always be 1 so that the labels corresponding to opposite input bits of a wire have opposite point and permute bits

//Send R

// Function to generate a random label of length size*16 bits
function random_label(size){
	var label = new Uint16Array(size);
	var random = crypto.randomBytes(size*2);
	//generate a number between 0-65535 to store in a 2 byte element
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
function encrypt_generic(plaintext, key, id){

	
	var k = new Uint16Array(array_length);
	var temp_id = id;
	
	for (let i = 0; i < array_length; i++) {
		k[i] = 2*key[i] ^ id;
		temp_id = temp_id >> 8;
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

	return xor(plaintext,xor(permutation, k));
}

function OT_send(m0, m1, gate_id){
	const c = 0;
	const a = sodium.crypto_core_ristretto255_scalar_random();
	console.log("a: " + a);
	let A = sodium.crypto_scalarmult_ristretto255_base(a);
	console.log("A: " + A);

	//Send A

	//Server side

	B = Uint8Array.from(B);
	let k0 = sodium.crypto_scalarmult_ristretto255(a, B);
	let k1 = sodium.crypto_scalarmult_ristretto255(a, sodium.crypto_core_ristretto255_sub(B, A));

	k0 = sodium.crypto_generichash(16, k0);
	k1 = sodium.crypto_generichash(16, k1);

	const e0 = encrypt_generic(m0, k0, 3);
	const e1 = encrypt_generic(m1, k1, 3);

	e = [e0,e1];

	//Send e


}

function OT_receive(c, gate_id){

	//Receiver Side

	const b = sodium.crypto_core_ristretto255_scalar_random();
	let B = sodium.crypto_scalarmult_ristretto255_base(b);

	//Receive A
	
	A = Uint8Array.from(A);
	console.log("A UINT ARRAY: " + A);
	if (c === 1) {
		B = sodium.crypto_core_ristretto255_add(A, B);
	}

	//Receive e

	e = [e0,e1];
	let k = sodium.crypto_scalarmult_ristretto255(b, A);
	k = sodium.crypto_generichash(16, k);

	return encrypt_generic(e[c], k, 3);


}

sodium.ready.then(function () {
	a = random_label(8);
	b = random_label(8);
	console.log("a: " + a);
	console.log("b: " + b);
	const ans = OT_send(a, b, 3);
	console.log("ans: " + ans);
});