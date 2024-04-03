import ws from 'k6/ws';
import { sleep, check } from 'k6';

export let options = {
    vus: 1, // 50 virtual users
    duration: '10s', // for 1 minute
};
const SEND_254 = new Uint8Array([254, 6, 0, 0, 0]);
const SEND_255 = new Uint8Array([255, 1, 0, 0, 0]);
function nextState(currentState) {
    // Define transition probabilities
    const transitions = {
        idle: { sendText: 0.3, sendBinary: 0.2, idle: 0.5 },
        sendText: { idle: 0.7, sendBinary: 0.2, sendText: 0.1 },
        sendBinary: { idle: 0.6, sendText: 0.3, sendBinary: 0.1 },
    };

    const rand = Math.random();
    let cumulative = 0;

    for (const [state, probability] of Object.entries(transitions[currentState])) {
        cumulative += probability;
        if (rand < cumulative) {
            return state;
        }
    }

    return currentState; // Fallback to current state if no transition occurs
}

export default function () {
    //const url = 'ws://localhost:8443';
    const url = 'ws://172.17.0.1:8443';
    let currentState = 'idle'; // Initial state

    ws.connect(url, null, function (socket) {
        socket.on('open', function open() {
            console.log(`WebSocket connection established by VU ${__VU}`);

            for (let i = 0; i < 60; i++) { // Assuming 1 minute test, with actions every second
                currentState = nextState(currentState); // Determine the next state

                if (currentState === 'sendText') {
                    const buffer = new ArrayBuffer(1);
                    new Uint8Array(buffer)[0] = 254;
                    socket.sendBinary(buffer);
                    console.log(`VU ${__VU} sent binary data: 254`);
                } else if (currentState === 'sendBinary') {
                    const buffer = new ArrayBuffer(1);
                    new Uint8Array(buffer)[0] = 254;
                    socket.sendBinary(buffer);
                    console.log(`VU ${__VU} sent binary data: 254`);
                } else {
                    const buffer = new ArrayBuffer(1);
                    new Uint8Array(buffer)[0] = 254;
                    socket.sendBinary(buffer);
                    console.log(`VU ${__VU} sent binary data: 254`);
                }

                sleep(1); // Wait for 1 second before the next state transition
            }

            socket.close();
        });

        socket.on('message', function (message) {
            // Optionally handle incoming messages
            console.log(message);
        });

        socket.on('close', function () {
            console.log(`WebSocket closed by VU ${__VU}`);
        });

        check(socket, { 'WebSocket opened successfully': (s) => s.readyState === s.OPEN });
    });
}