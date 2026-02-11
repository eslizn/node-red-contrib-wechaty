# Node-RED WeChaty Plugin

[![npm version](https://img.shields.io/npm/v/node-red-contrib-wechaty.svg)](https://www.npmjs.com/package/node-red-contrib-wechaty)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Node-RED node for integrating WeChaty - a Conversational RPA SDK for Chatbot Makers. This plugin allows you to build WeChat (微信) automation workflows using Node-RED's visual programming interface.

## Features

- 🤖 **Multiple Puppet Support**: Supports various WeChaty puppets including wechat4u, padlocal, and service puppets
- 🔐 **Session Persistence**: Automatically saves and restores login sessions
- 📱 **QR Code Login**: Visual QR code display for WeChat login
- 📨 **Message Handling**: Send and receive text messages, images, and files
- 👥 **Contact Management**: Handle friend requests and contact interactions
- 🏠 **Room Management**: Join/leave rooms, handle room invitations, and room topic changes
- ⚡ **Event-Driven Architecture**: Real-time event handling for all WeChat activities
- 🌐 **Internationalization**: Multi-language support (Chinese/English)

## Installation

### Method 1: Using Node-RED Palette Manager

1. Open Node-RED editor
2. Go to **Menu → Manage Palette**
3. Click **Install** tab
4. Search for `node-red-contrib-wechaty`
5. Click **Install**

### Method 2: Manual Installation

```bash
npm install node-red-contrib-wechaty
```

Then restart Node-RED.

## Configuration

### Node Properties

When adding a WeChaty node to your flow, configure the following properties:

- **Name**: Display name for the node (optional)
- **Puppet**: WeChaty puppet driver to use:
  - `wechaty-puppet-wechat4u` - Web-based puppet (recommended for beginners)
  - `wechaty-puppet-service` - Token-based service puppet
- **Options**: JSON configuration for puppet-specific options

### Puppet Options Examples

```json
// For wechaty-puppet-service
{
  "token": "your-puppet-service-token"
}

// For wechaty-puppet-padlocal
{
  "token": "your-padlocal-token"
}
```

## Usage

### Basic Setup

1. Drag a **WeChaty** node from the social category to your flow
2. Configure the puppet type and options
3. Deploy the flow
4. The node will show a QR code for login when first started
5. Scan the QR code with WeChat to login

### Input Messages

The node accepts messages with different topics to perform actions:

#### Send Message
```javascript
// Send message to specific contact
msg.topic = "message";
msg.payload = "Hello from Node-RED!";
msg.to = "contact-name";
return msg;

// Send message to room
msg.topic = "message";
msg.payload = "Hello everyone!";
msg.room = "room-name";
return msg;

// Send message with mentions
msg.topic = "message";
msg.payload = "Hello @user1 and @user2!";
msg.room = "room-name";
msg.to = "user1,user2";
return msg;
```

#### Logout
```javascript
msg.topic = "logout";
return msg;
```

#### Custom Function
```javascript
msg.topic = "function";
msg.payload = async function(wechaty) {
    // Custom WeChaty operations
    const contacts = await wechaty.Contact.findAll();
    console.log('Total contacts:', contacts.length);
};
return msg;
```

### Output Events

The node emits messages for various WeChat events:

#### Login Event
```javascript
{
    topic: "login",
    payload: userObject,
    _node: "node-id"
}
```

#### Message Event
```javascript
{
    topic: "message",
    payload: messageContent,
    _node: "node-id",
    // Additional message properties
}
```

#### Friendship Event
```javascript
{
    topic: "friendship",
    payload: friendshipObject,
    _node: "node-id"
}
```

#### Room Events
- `room-join` - When someone joins a room
- `room-leave` - When someone leaves a room
- `room-topic` - When room topic changes
- `room-invite` - When receiving room invitation

#### Error Event
```javascript
{
    topic: "error",
    payload: errorObject,
    _node: "node-id"
}
```

## Examples

### Auto-Reply Bot

Create a simple auto-reply bot that responds to messages:

```javascript
// Flow:
// WeChaty Node → Function Node → WeChaty Node

// Function node code:
if (msg.topic === "message") {
    const response = `I received your message: ${msg.payload}`;
    return {
        topic: "message",
        payload: response,
        to: msg.from
    };
}
return null;
```

### Message Forwarding

Forward messages from one contact to another:

```javascript
// Forward messages from Contact A to Contact B
if (msg.topic === "message" && msg.from === "Contact A") {
    return {
        topic: "message",
        payload: `Forwarded from ${msg.from}: ${msg.payload}`,
        to: "Contact B"
    };
}
return null;
```

### Group Message Logger

Log all group messages to a file or database:

```javascript
if (msg.topic === "message" && msg.room) {
    console.log(`[${msg.room}] ${msg.from}: ${msg.payload}`);
    // Add your logging logic here
}
return msg;
```

## Troubleshooting

### Common Issues

**QR Code Not Displaying**
- Check if the puppet is properly configured
- Verify network connectivity
- Ensure Node-RED has access to display QR codes

**Login Failures**
- Ensure WeChat account is not banned
- Try different puppet types
- Check puppet-specific configuration

**Message Sending Failures**
- Verify contact/room exists
- Check if bot has proper permissions
- Ensure message format is correct

### Debug Mode

Enable debug logging by setting environment variable:

```bash
DEBUG=wechaty* node-red
```

## API Reference

### WeChaty Node Methods

- `send(message)` - Send message to WeChaty node
- `on('input', callback)` - Handle input messages
- `on('close', callback)` - Cleanup on node removal

### Supported Message Types

- **Text Messages**: Plain text content
- **Image Messages**: Base64 encoded images
- **File Messages**: File attachments
- **Location Messages**: GPS coordinates
- **Contact Cards**: Contact sharing

## Development

### Project Structure

```
node-red-contrib-wechaty/
├── wechaty.js          # Main node implementation
├── wechaty.html         # Node configuration UI
├── locales/            # Internationalization files
│   ├── en-US/
│   └── zh-CN/
├── icons/              # Node icons
├── package.json        # Package configuration
└── README.md           # This file
```

### Building from Source

```bash
git clone https://github.com/eslizn/node-red-contrib-wechaty.git
cd node-red-contrib-wechaty
npm install
npm link
# Then link in your Node-RED user directory
cd ~/.node-red
npm link node-red-contrib-wechaty
```

## Contributing

Contributions are welcome! Please feel free to submit Pull Requests.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/eslizn/node-red-contrib-wechaty/issues)
- **Documentation**: This README and [WeChaty Documentation](https://wechaty.js.org/)
- **Community**: [WeChaty Community](https://wechaty.js.org/community)

## Related Projects

- [WeChaty](https://github.com/wechaty/wechaty) - Conversational RPA SDK for Chatbot Makers
- [Node-RED](https://nodered.org/) - Low-code programming for event-driven applications
- [WeChaty Puppets](https://wechaty.js.org/docs/puppets/) - Various puppet implementations for WeChaty

---

**Note**: This plugin is for personal WeChat accounts only. Commercial use may violate WeChat's Terms of Service. Use responsibly.
