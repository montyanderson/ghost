const EventEmitter = require('events');
const dgram = require('dgram');
const crypto = require('crypto');

const stringifyAddress = ({ address, port }) => `${address}:${port}`;

const parseAddress = string => {
	const [ address, port ] = string.split(':');

	return {
		address,
		port: Number(port)
	};
}

module.exports = class Server extends EventEmitter {
	constructor() {
		super();

		this.peers = {};
		this.received = {};

		this.socket = dgram.createSocket('udp4');
		this.socket.on('message', this._handleMessage.bind(this));

		this.socket.bind((...args) => {
			const { address, port } = this.socket.address();

			console.log(`Listening locally at ${address}:${port}`);
		});
	}

	_broadcast(message) {
		for(const peer in this.peers) {
			console.log('in', peer, parseAddress(peer));
			const { address, port } = parseAddress(peer);

			this.socket.send(message, port, address);
		}
	}

	addPeer(peer) {
		this.peers[stringifyAddress(peer)] = true;
	}

	notify() {
		const message = Buffer.alloc(1);

		message[0] = 0x01;

		this._broadcast(message);
	}

	deliver(data) {
		const header = Buffer.alloc(1);

		header[0] = 0x04;

		const message = Buffer.concat([
			header,
			Buffer.from(data)
		]);

		this._broadcast(message);
	}

	_handleNotify(message, rinfo) {
		this.addPeer(rinfo);
	}

	_handleDeliver(message, rinfo) {
		console.log('message from', message.toString(), rinfo);

		const hash = crypto.createHash('sha256')
			.update(message)
			.digest('base64');

		console.log(hash);

		if(!(hash in this.received)) {
			this.received[hash] = true;

			this.deliver(message);
		}
	}

	_handleMessage(message, rinfo) {
		const handlers = {
			1: this._handleNotify,
			4: this._handleDeliver
		};

		console.log('Received message', message, rinfo);

		handlers[message[0]].call(this, message.slice(1), rinfo);
	}
};
