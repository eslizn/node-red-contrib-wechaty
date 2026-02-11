const wasi = require("node:wasi");
const WechatyBuilder = require('wechaty').WechatyBuilder;
const MemoryCard = require('memory-card').MemoryCard;

function WechatyNode(RED) {
    return function (config) {
        RED.nodes.createNode(this, config);
        this.status({fill: 'red', shape: 'ring', text: 'offline'});
        this.context().get('session', (err, session) => {
            this.wechaty = WechatyBuilder.build({
                name: this.id,
                puppet: config.puppet,
                puppetOptions: config.puppetOptions,
                memory: MemoryCard.fromJSON({payload: session ? session : {}}),
            });
            this.wechaty.on('scan', (qrcode, status) => {
                this.context().set('qrcode', qrcode.replaceAll(/\/l\//g, '/qrcode/'));
            }).on('login', (user) => {
                this.context().set('session', this.wechaty.memory.payload, () => {
                    this.status({fill: 'green', shape: 'dot', text: 'online'});
                    this.context().set('qrcode', '');
                    this.send({
                        topic: 'login',
                        payload: user,
                        _node: this.id,
                    });
                });
            }).on('logout', () => {
                this.context().set('session', this.wechaty.memory.payload, async () => {
                    this.status({fill: 'red', shape: 'ring', text: 'offline'});
                    try {
                        await this.wechaty.stop();
                        await this.wechaty.start();
                    } catch (e) {
                        this.send({
                            topic: 'error',
                            payload: e,
                            _node: this.id,
                        });
                    }
                });
                this.send({
                    topic: 'logout',
                    payload: null,
                    _node: this.id,
                });
            }).on('message', (message) => {
                message.topic = 'message';
                message._node = this.id;
                this.send(message);
            }).on('friendship', (friendship) => {
                friendship.topic = 'friendship';
                friendship._node = this.id;
                this.send(friendship);
            }).on('room-join', (room, list, inviter) => {
                this.send({
                    topic: 'room-join',
                    room: room,
                    payload: list,
                    inviter: inviter,
                    _node: this.id,
                });
            }).on('room-leave', (room, list, remover) => {
                this.send({
                    topic: 'room-leave',
                    room: room,
                    payload: list,
                    remover: remover,
                    _node: this.id,
                });
            }).on('room-topic', (room, now, old, changer) => {
                this.send({
                    topic: 'room-topic',
                    room: room,
                    payload: now,
                    old: old,
                    changer: changer,
                    _node: this.id,
                });
            }).on('room-invite', (invitation) => {
                invitation.topic = 'room-invite';
                invitation._node = this.id;
                this.send(invitation);
            }).on('error', (error) => {
                this.send({
                    topic: 'error',
                    payload: error,
                    _node: this.id,
                });
            }).start();
        })

        this.on('close', async (removed, done) => {
            try {
                if (removed) {
                    await this.wechaty.logout();
                    await this.wechaty.stop();
                }
                this.context().set('session', this.wechaty.memory.payload, done);
            } catch (e) {
                this.send({
                    topic: 'error',
                    payload: e,
                    _node: this.id,
                });
            }
        });

        this.on('input', async (msg) => {
            if (!this.wechaty.logonoff()) {
                return this.send({
                    topic: 'error',
                    payload: 'wechaty not login',
                    _node: this.id,
                });
            }

            try {
                switch (msg.topic)
                {
                    case 'logout':
                        await this.wechaty.logout();
                        break;
                    case 'message':
                        await handleInputMessage.apply(this, [msg.payload, msg.to, msg.room])
                        break;
                    case 'function':
                        if (typeof(msg.payload) === 'function') {
                            await msg.payload(this.wechaty);
                        }
                        break;
                    default:
                        this.send({
                            topic: 'error',
                            payload: msg,
                            _node: this.id,
                        });
                }
            } catch (e) {
                this.send({
                    topic: 'error',
                    payload: e,
                    _node: this.id,
                });
            }
        });
    }
}

async function handleInputMessage(payload, to, room)
{
    if (room) {
        return await handleInputRoomMessage(payload, room.split(','), to ? to.split(','): []);
    }
    if (to) {
        return await handleInputContactMessage(payload, to.split(','));
    }
    await this.wechaty.say(payload);
}

async function handleInputContactMessage(payload, contacts)
{
    let query = await this.wechaty.Contact.findAll();
    query = query.filter(async function (x) {
        if (!x.friend()) {
            return false;
        }
        if (x.self()) {
            return false;
        }
        return contacts.indexOf(x.name()) >= 0 ||
            contacts.indexOf(x.id) >= 0 ||
            contacts.indexOf(await x.alias()) >= 0;
    })
    for (let contact of query) {
        await contact.say(payload)
    }
}

async function handleInputRoomMessage(payload, rooms, members)
{
    let query = await this.wechaty.Room.findAll();
    query = query.filter(async function (x) {
        return rooms.indexOf(x.id) >= 0 ||
            rooms.indexOf(await x.topic()) >= 0;
    })
    for (let room of query) {
        let at = [];
        if (members.length > 0) {
            at = (await room.memberAll()).filter(async function (x) {
                if (x.self()) {
                    return false;
                }
                return members.indexOf(x.name()) >= 0 ||
                    members.indexOf(x.id) >= 0 ||
                    members.indexOf(await x.alias()) >= 0;
            })
        }
        await room.say(payload, ...at);
    }
}

module.exports = async function (RED) {
    RED.nodes.registerType('wechaty', WechatyNode(RED));
}
