"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPortTaken = exports.findClosestOpenPort = exports.findClosestOpenPorts = void 0;
const net = require("net");
function findClosestOpenPorts(host, ports) {
    const promises = ports.map(port => findClosestOpenPort(host, port));
    return Promise.all(promises);
}
exports.findClosestOpenPorts = findClosestOpenPorts;
function findClosestOpenPort(host, port) {
    function t(portToCheck) {
        return isPortTaken(host, portToCheck).then(isTaken => {
            if (!isTaken) {
                return portToCheck;
            }
            return t(portToCheck + 1);
        });
    }
    return t(port);
}
exports.findClosestOpenPort = findClosestOpenPort;
function isPortTaken(host, port) {
    return new Promise((resolve, reject) => {
        const tester = net.createServer()
            .once('error', (err) => {
            if (err.code !== 'EADDRINUSE') {
                return resolve(true);
            }
            resolve(true);
        })
            .once('listening', () => {
            tester.once('close', () => {
                resolve(false);
            })
                .close();
        })
            .listen(port, host);
    });
}
exports.isPortTaken = isPortTaken;
