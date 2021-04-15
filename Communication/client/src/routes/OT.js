const crypto = require('crypto');
var sodium = require('libsodium-wrappers-sumo');
var Room = require('./Room.js');
var Helper = require('./Helper.js');
var helper = new Helper();

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

export const OT_send = async (gate_id,m0, m1) => { 
	const c = 0;
	const a = sodium.crypto_core_ristretto255_scalar_random();
	//console.log("m0: " + m0);
	//console.log("m1: " + m1);
	let A = sodium.crypto_scalarmult_ristretto255_base(a);
	// console.log("A: ");
	// console.log(A);
	// A = Uint8Array.from(A);

	//Send A
	Room.outsendMessage(helper.arrayToBuffer(A));

	//Recieve B
	let B = await Room.Receive()//.then(function (B){
		//B = JSON.parse(B);
		////console.log("Received: ");
		////console.log(B);

		// console.log("B: ");
		// console.log(B);

		B = new Uint8Array(B);
		// console.log("B after receiving: ");
		// console.log(B);
		////console.log("B after Uint16Array: ");
		////console.log(B);
		////console.log("a: " + a);
		////console.log("length of a: " + a.length);
		let k0 = sodium.crypto_scalarmult_ristretto255(a, B);
		let k1 = sodium.crypto_scalarmult_ristretto255(a, sodium.crypto_core_ristretto255_sub(B, A));

		k0 = sodium.crypto_generichash(16, k0);
		k1 = sodium.crypto_generichash(16, k1);

		const e0 = encrypt_generic(m0, k0, gate_id);
		const e1 = encrypt_generic(m1, k1, gate_id);

		let e = [e0,e1];

		//Send e
		Room.outsendMessage(helper.arrayToBuffer(e0));
		Room.outsendMessage(helper.arrayToBuffer(e1));
	//});


}

export const OT_receive = (c, gate_id) => {
  
	const b = sodium.crypto_core_ristretto255_scalar_random();
	let B = sodium.crypto_scalarmult_ristretto255_base(b);
  
	return new Promise(function (resolve) {
		let A = Room.Receive().then(function (A) {
		// A = JSON.parse(A);
		// A = Uint8Array.from(A);
		// console.log("A after receiving before converting to uint8array");
		// console.log(A);
		A = new Uint8Array(A);
		// console.log("A after receiving");
		// console.log(A);
		////console.log("A on being received: ");
		////console.log(A);
		//A = Uint8Array.from(A);
		////console.log("A after Uint16Array: ");
		////console.log(A);
		if (c === 1) {
		  B = sodium.crypto_core_ristretto255_add(A, B);
		}

		// console.log("B: ");
		// console.log(B);
		// B = Uint8Array.from(B);
  
		Room.outsendMessage(helper.arrayToBuffer(B));
		let e0 = Room.Receive().then(function (e0) {
			let e1 = Room.Receive().then(function (e1) {
			//e = JSON.parse(e);
			////console.log("Received e:");
			////console.log(e);
			e0 = new Uint16Array(e0);
			e1 = new Uint16Array(e1);
			var e = [e0,e1];
			let k = sodium.crypto_scalarmult_ristretto255(b, A);
			k = sodium.crypto_generichash(16, k);

			////console.log('C:' + c);
			////console.log('e[c]:');
			////console.log(e[c]);


			//console.log("OT output: " + encrypt_generic(e[c], k, gate_id));
			resolve(encrypt_generic(e[c], k, gate_id));
			});
		});
	  });
	});
}


sodium.ready.then(function () {
	let a = random_label(8);
	let b = random_label(8);
	// //console.log("a: " + a);
	// //console.log("b: " + b);
	//const ans = OT_send(a, b, 3);
	////console.log("ans: " + ans);
});
