import { WebSocket } from 'k6/experimental/websockets';
import { check } from 'k6';
class Writer {
    constructor(littleEndian) {
        this.writer = true;
        this.tmpBuf = new DataView(new ArrayBuffer(8));
        this._e = littleEndian;
        this.reset();
        return this;
    }
    reset(littleEndian = this._e) {
        this._e = littleEndian;
        this._b = [];
        this._o = 0;
    }
    setUint8(a) {
        if (a >= 0 && a < 256) this._b.push(a);
        return this;
    }
    setInt8(a) {
        if (a >= -128 && a < 128) this._b.push(a);
        return this;
    }
    setUint16(a) {
        this.tmpBuf.setUint16(0, a, this._e);
        this._move(2);
        return this;
    }
    setInt16(a) {
        this.tmpBuf.setInt16(0, a, this._e);
        this._move(2);
        return this;
    }
    setUint32(a) {
        this.tmpBuf.setUint32(0, a, this._e);
        this._move(4);
        return this;
    }
    setInt32(a) {
        this.tmpBuf.setInt32(0, a, this._e);
        this._move(4);
        return this;
    }
    setFloat32(a) {
        this.tmpBuf.setFloat32(0, a, this._e);
        this._move(4);
        return this;
    }
    setFloat64(a) {
        this.tmpBuf.setFloat64(0, a, this._e);
        this._move(8);
        return this;
    }
    _move(b) {
        for (let i = 0; i < b; i++) this._b.push(this.tmpBuf.getUint8(i));
    }
    setStringUTF8(s) {
        const bytesStr = unescape(encodeURIComponent(s));
        for (let i = 0, l = bytesStr.length; i < l; i++)
            this._b.push(bytesStr.charCodeAt(i));
        this._b.push(0);
        return this;
    }
    build() {
        return new Uint8Array(this._b);
    }
}
// Define the binary data to be sent
const SEND_254 = new Uint8Array([254, 6, 0, 0, 0]);
const SEND_255 = new Uint8Array([255, 1, 0, 0, 0]);
const newUNT = new Uint8Array([254]);

export default function() {
    for (let i = 0; i < 500; i++) {
        startWSWorker(i);
    }

    const params = {}; // Use this object to specify additional parameters, such as headers

    // Create a new WebSocket connection
    function startWSWorker(id) {
        const url = 'ws://localhost:8443'; // WebSocket server URL
        const ws = new WebSocket(url);

        // Wait for the connection to open
        ws.addEventListener('open', () => {
            console.log('Connection opened');

            // Send the binary messages
            ws.send(SEND_254.buffer);
            ws.send(SEND_255.buffer);
            ws.send(newUNT.buffer);

           sendPlay("tariq", "null",ws);
           sendMouseMove(12,12,ws);

        });
        // Optionally, handle messages from the server
        ws.addEventListener('message', (data) => {

            console.log(`Received message: ${JSON.stringify(data)}`);
        });

        // Handle any errors
        ws.addEventListener('error', (e) => {
            console.error(`WebSocket error: ${e.error()}`);
        });
    }
}

    // Close the connection after a specified time
    // Adjust the timing as per your test case
//     setTimeout(() => {
//         ws.close();
//     }, 10000); // Closes the connection after 10 seconds
//
    function sendMouseMove(x, y, ws) {
        const writer = new Writer(true);
        writer.setUint8(0x10);
        writer.setUint32(x);
        writer.setUint32(y);
        writer._b.push(0, 0, 0, 0);
        ws.send(writer.build().buffer);
    }
    function sendPlay(name, skin,ws) {
        const writer = new Writer(true);
        writer.setUint8(0x00); // Packet ID for play
        writer.setStringUTF8(name); // Send name
        writer.setStringUTF8(skin); // Send skin
        ws.send(writer.build().buffer);
    }
