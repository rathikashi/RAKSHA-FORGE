var bigInt = require("big-integer");
var CryptoJS = require("crypto-js");
var express = require('express');
var sizeof = require('object-sizeof');
const random = require('random-bigint');
const sodium = require('libsodium-wrappers-sumo');

// var app = express();
// var server = app.listen(3000);

// app.use(express.static('public'))

var length = bigInt(2).pow(128).minus(1);
var bitlength = length.bitLength();
console.log(length)
console.log(bitlength)

var a = bigInt.randBetween(0, length);
var b = bigInt.randBetween(0, length);

var hash = CryptoJS.SHA3(a.shiftLeft(128).add(b).toString(), { outputLength: 256 }).toString();

var hash = CryptoJS.SHA3(a.toString() + b.toString(), { outputLength: 256 }).toString();

console.log(hash);

console.log("sizeof bigint: " + sizeof(a));
console.log("sizeof string: " + sizeof(a.toString(32)));

console.log(a);
console.log(a.valueOf().toLocaleString());

var test = random(128);
console.log("sizeof bigInt test: " + sizeof(test));
console.log(test);

/****************************UINT 16 *********************/

var temp = new Uint16Array([0,2,3,4,5,6,7,65535]);

/******Convert to srring of size 16 bytes ***********/
const key = [];
for (let i = 0; i < 8; i++) {
	key[i] = String.fromCharCode(temp[i]);
}

var arr = key.join('');

/**************************************************/

console.log(arr);
console.log("sizeof key: " + sizeof(arr));
console.log("size of Uint16Array: " + sizeof(temp));

/*********** Convert String to Uint Array *********/
var new_temp = new Uint16Array(8);

for (let i = 0; i < 8; i++) {
	new_temp[i] = arr.charCodeAt(i);
} 

/***********************************************/
console.log(new_temp);