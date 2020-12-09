//Receive R

function garble_XOR_gate(label_a, label_b){
	return xor(label_a, label_b);
}

function garble_NOT_gate(label_a){
	return xor(label_a, R);
}


//Function to evaluate a garbled gate
function evaluate_AND_gate(label_a, label_b, gate_id){

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

	// console.log("recieved_table0: " + garbled_table[0]);
	// console.log("recieved_table1: " + garbled_table[1]);

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