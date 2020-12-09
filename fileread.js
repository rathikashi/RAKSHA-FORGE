
// const garbler = require('garbler.js');
// const helper = require('helper.js');

const RECOGNIZED_OPERATIONS = ['AND', 'XOR', 'INV', 'NOT', 'LOR'];

function Gate(id, operation, input_wires, output_wire, garbled_table){
    this.id = id;
    this.operation = operation;
    this.input_wires = input_wires;
    this.output_wire = output_wire;
    this.garbled_table = garbled_table;

    if (this.operation === 'INV') {
      this.operation = 'NOT';
    }
}

function Circuit(wires_count, garbler_input_size, evaluator_input_size, output_size, label_size) {
    this.wires_count = wires_count;
    this.garbler_input_size = garbler_input_size;
    this.evaluator_input_size = evaluator_input_size;
    this.output_size = output_size;
    this.label_size = label_size;
  
    this.gates = [];
  }

  const gates = function(gate) {
      return gate;
  }

function parsecircuit(text){
    const rows = text.split('\n').filter(function (line) {
        const tmp = line.trim();
        return !(tmp.startsWith('#') || tmp.length === 0);
    }).map(function (line) {
        if (line.indexOf('#') > -1) {
        line = line.substring(0, line.indexOf('#')).trim();
        }
    
        return line.split(' ').map(function (token) {
        return token.trim();
        });
    });

    const wire_count = parseInt(rows[0][1]);
    const inputs = rows[1];
    inputs.shift();
    const outputs = rows[2];
    outputs.shift();

    // console.log('rows' + rows[0]);

    const circuit = new Circuit(wire_count, parseInt(inputs[0]), parseInt(inputs[1]), parseInt(outputs[0]));

    for (var i=3; i<rows.length; i++){
        const val = rows[i];
        // console.log('val' + val[val.length-1]);
        const input_count = parseInt(val[0]);
        const output_count = parseInt(val[1]);
        const op = val[val.length-1];
        // console.log('op: ' + op);

        if(output_count != 1){
            throw Error('Gate' + i +  'does not have only 1 output');
        }

        if ((op === 'INV' || op === 'NOT') && (input_count !== 1)) {
            throw new Error(op + ' Gate ' + r + ' does not have exactly 1 input!');
          }
        if ((op === 'AND' || op === 'LOR' || op === 'XOR') && (input_count !== 2)) {
            throw new Error('Gate ' + r + ' does not have exactly 2 inputs!');
          }
        
        if (RECOGNIZED_OPERATIONS.indexOf(op) === -1) {
            throw new Error('Unrecognized gate: ' + op)
          }

        const output = parseInt(val[2 + input_count]);
        const inputs = val.slice(2, 2 + input_count).map(function (e) {
          return parseInt(e);
        });

        // console.log('inputs: ' + [inputs]);

        const gate = new Gate(i - 3, op, inputs, output);
        circuit.gates.push(gate);

    }

    return circuit;

}


const content = require('fs').readFileSync(__dirname + '/fileclient.html', 'utf8');

const httpServer = require('http').createServer((req, res) => {
  // serve the index.html file
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(content));
  res.end(content);
});

const socket = require('socket.io');
const io = socket(httpServer);
 
// data = require('fs').readFileSync('testing.txt', {encoding:'utf8'}); 
// testc = parsecircuit(data);
// labelc = generateLabels(testc.garbler_input_size + testc.evaluator_input_size, 8, 1)

// io.sockets.emit('hello' , labelc);


io.sockets.on('connection', socket => {
  console.log('connected: ' + socket.id);

  socket.on('circuitchoice', data => {
    console.log('circuitchoice', data);
    data = require('fs').readFileSync(data.circuit, {encoding:'utf8'}); 
    testc = parsecircuit(data);
    // socket.emit('circuitfile' , testc);
    io.sockets.emit('circuitfile' , testc);
  });

  socket.on('GarblerWire', data => {
    console.log('GarblerWire'+ data);
    socket.broadcast.emit('GarblerWire', data);
  });

  socket.on('StartOT', data => {
    console.log('StartOT'+ data);
    socket.broadcast.emit('StartOT', data);
  });

  socket.on('OT-A', data => {
    console.log('OT-A'+ data);
    socket.broadcast.emit('OT-A', data);
  });

  socket.on('OT-B', data => {
    console.log('OT-B'+ data);
    socket.broadcast.emit('OT-B', data);
  });

  socket.on('OT-E', data => {
    console.log('OT-E'+ data);
    socket.broadcast.emit('OT-E', data);
  });



});


httpServer.listen(3000, () => {
  console.log('go to http://localhost:3000');
});



// http.createServer(function (req, res) {
//     //Open a file on the server and return its content:
//     data = fs.readFileSync('testing.txt', {encoding:'utf8'}); 
//       console.log(data);
//       res.writeHead(200, {'Content-Type': 'text/html'});
//     //   res.write(data);
//       testc = parsecircuit(data);
//       console.log(testc);
//       res.write(JSON.stringify(testc));
//       return res.end();
//   }).listen(8080);
