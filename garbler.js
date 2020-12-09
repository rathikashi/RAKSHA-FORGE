var R = random_label(array_length); //Common random label
R[array_length-1] = R[array_length-1] | 1; // Rightmost bit of R should always be 1 so that the labels corresponding to opposite input bits of a wire have opposite point and permute bits

//Send R

//function to garble a gate given input labels and the values produced as output
//Leftmost bit of each label is also used as the permute bit
//[0,0,0] AND
//[1,1,1] LOR
function garble_XOR_gate(label_a, label_b){
	return xor(label_a, label_b);
}

function garble_NOT_gate(label_a){
	return xor(label_a, R);
}



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

	// console.log("output_label0: " + output_label);
	// console.log("output_label1: " + xor(output_label,R));

	/**********************************************/

	
	/********** Sending the table to the evaluator **********/
	
	//Converting the garbled table entries to a string
	var table_entries = [];
	for (let i = 0; i < array_length; i++) {
		table_entries[i] = String.fromCharCode(garbled_table[0][i]);
	}

	table_enteries = [];
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