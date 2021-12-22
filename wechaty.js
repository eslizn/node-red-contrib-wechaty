const {WechatyBuilder, ScanStatus} = require('wechaty');

let instances = {};

module.exports = function (RED) {
	RED.nodes.registerType('wechaty', function (config) {
		RED.nodes.createNode(this, config);
		
		this.online = () => {
			this.status({fill: 'green', shape: 'dot', text: 'online'});
		};

		this.offline = () => {
			this.status({fill: 'red', shape: 'ring', text: 'offline'});
		};

		this.start = () => {
			if ((config.id in instances) && !instances[config.id].isLoggedIn) {
				instances[config.id].start().then(() => {
					this.log('Starter Bot Started.')
				}).catch(async error => {
					this.send({topic: 'error', payload: error});
				});
			}
		};

		this.destory = async () => {
			if (config.id in instances) {
				await instances[config.id].stop();
				delete instances[config.id];
			}
		};

		this.on('close', async (removed, done) => {
			if (removed) {
				await this.destory();
			}
			done();
		});

		this.on('input', async (msg) => {
			if (!(config.id in instances) || !instances[config.id].isLoggedIn) {
				return;
			}
			if (msg.respond) {
				await msg.respond.say(msg.payload);
				return;
			}
			if (msg.room) {
				await msg.room.say(msg.payload);
				return;
			}
			if (msg.forward) {
				await msg.payload.forward(msg.forward);
				return;
			}
			if (msg.contact) {
				await msg.contact.say(msg.forward);
				return;
			}
		});

		if (!(config.id in instances)) {
			this.offline();
			instances[config.id] = WechatyBuilder.build({
				name: config.id,
				puppet: 'wechaty-puppet-wechat',
			});
		}

		instances[config.id].off('login', () => {}).on('login', (user) => {
			this.online();
			this.send({topic: 'login', payload: user});
		}).off('logout', () => {}).on('logout', (user) => {
			this.offline();
			this.send({topic: 'logout', payload: user});
		}).off('message', () => {}).on('message', (msg) => {
			this.send({topic: 'message', payload: msg});
		}).off('friendship', () => {}).on('friendship', (friendship) => {
			this.send({topic: 'friendship', payload: friendship});
		}).off('room-invite', () => {}).on('room-invite', (invite) => {
			this.send({topic: 'room-invite', payload: invite});
		}).off('room-join', () => {}).on('room-join', (room, targets, inviter, date) => {
			this.send({
				topic: 'room-join',
				room: room,
				inviter: inviter,
				date: date,
				payload: targets
			});
		}).off('room-leave', () => {}).on('room-leave', (room, targets, remover, date) => {
			this.send({
				topic: 'room-leave',
				room: room,
				remover: remover,
				date: date,
				payload: targets
			});
		}).off('room-topic', () => {}).on('room-topic', (room, topic, old, changer, date) => {
			this.send({
				topic: 'room-topic',
				room: room,
				old: old,
				changer: changer,
				date: date,
				payload: topic
			});
		}).off('start', () => {}).on('start', () => {
			this.online();
			this.send({topic: 'start', payload: null});
		}).off('stop', () => {}).on('stop', () => {
			this.offline();
			this.send({topic: 'stop', payload: null});
			this.start();
		}).off('error', () => {}).on('error', (error) => {
			this.send({topic: 'error', payload: error});
		});

		this.start();
	});
}
