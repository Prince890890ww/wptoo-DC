const express = require('express');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const multer = require('multer');
const { makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require('@whiskeysockets/baileys');

const app = express();
const port = 5000;

let MznKing;
let messages = null;
let targets = [];
let intervalTime = null;
let haterName = null;
let currentInterval = null;
let stopKey = null;
let sendingActive = false;
let lastStatus = '';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const setupBaileys = async () => {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
  const connectToWhatsApp = async () => {
    MznKing = makeWASocket({
      logger: pino({ level: 'silent' }),
      auth: state,
    });

    MznKing.ev.on('connection.update', async (s) => {
      const { connection, lastDisconnect } = s;
      if (connection === "open") console.log("WhatsApp connected.");
      if (connection === "close" && lastDisconnect?.error) {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect) {
          console.log("Reconnecting...");
          await connectToWhatsApp();
        } else {
          console.log("Connection closed. Restart required.");
        }
      }
    });

    MznKing.ev.on('creds.update', saveCreds);
    return MznKing;
  };
  await connectToWhatsApp();
};

setupBaileys();

function generateStopKey() {
  return 'MRPRINCE-' + Math.floor(1000000 + Math.random() * 9000000);
}

app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
    <title>❣️🌷𝐖𝐇𝐀𝐓𝐒𝐇𝐏𝐏 𝐒𝐄𝐑𝐕𝐄𝐑 🌷❣️</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-image: url('https://i.ibb.co/PvG9BWd1/482999af8e28fc48a3d1dcb9160fb51e.jpg');
        background-size: cover;
        background-position: center;
        font-family: Arial, sans-serif;
        touch-action: manipulation;
        -ms-touch-action: manipulation;
        overflow-x: hidden;
      }
      .container {
        width: 90%;
        max-width: 400px;
        margin: 30px auto;
        background-color: rgba(0, 0, 0, 0.6);
        padding: 20px;
        border-radius: 15px;
        border: 2px solid white;
        color: white;
        box-shadow: 0 0 20px rgba(255,255,255,0.2);
        text-align: center;
      }
      h1 { color: white; margin-bottom: 20px; }
      label {
        display: block;
        margin: 10px 0 5px;
        text-align: left;
        font-weight: bold;
      }
      input, button {
        width: 100%;
        padding: 10px;
        margin-bottom: 12px;
        border-radius: 8px;
        border: 2px solid white;
        background: transparent;
        color: white;
        box-sizing: border-box;
        text-align: center;
      }
      input::placeholder { color: #eee; }
      button {
        font-weight: bold;
        cursor: pointer;
        transition: 0.3s;
      }
      button[type="submit"]:nth-of-type(1) { background-color: #ffcc00; color: black; }
      button[type="submit"]:nth-of-type(2) { background-color: #00cc66; color: white; }
      button[type="submit"]:nth-of-type(3) { background-color: #ff4444; color: white; }
      button:hover { opacity: 0.8; }
      .status-box {
        margin-top: 15px;
        padding: 10px;
        background-color: white;
        color: black;
        border-radius: 8px;
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>❣️🌷𝐌𝐑 𝐊𝐑𝐈𝐗🌷❣️</h1>

      <form action="/generate-pairing-code" method="post">
        <label for="phoneNumber">Your Phone Number:</label>
        <input type="text" id="phoneNumber" name="phoneNumber" placeholder="91..." required />
        <button type="submit">PAIR</button>
      </form>

      <form action="/send-messages" method="post" enctype="multipart/form-data">
        <label for="targetsInput">Number or Group UID:</label>
        <input type="text" id="targetsInput" name="targetsInput" placeholder="917543864229 OR GROUP UID" required />

        <label for="messageFile">Upload Message File:</label>
        <input type="file" id="messageFile" name="messageFile" required />

        <label for="haterNameInput">Hater's Name:</label>
        <input type="text" id="haterNameInput" name="haterNameInput" placeholder="Hater name" required />

        <label for="delayTime">Delay (seconds):</label>
        <input type="number" id="delayTime" name="delayTime" placeholder="Minimum 5 sec" required />

        <button type="submit">START</button>
      </form>

      <form action="/stop" method="post">
        <label for="stopKeyInput">Stop Key:</label>
        <input type="text" id="stopKeyInput" name="stopKeyInput" placeholder="Enter Stop Key" />
        <button type="submit">STOP</button>
      </form>

      ${lastStatus ? `<div class="status-box">${lastStatus}</div>` : ''}
    </div>
  </body>
  </html>
  `);
});

app.post('/generate-pairing-code', async (req, res) => {
  const phoneNumber = req.body.phoneNumber;
  try {
    const pairCode = await MznKing.requestPairingCode(phoneNumber);

    res.send(`
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
        <title>Pairing Code</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: black;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: white;
          }
          .box {
            background: white;
            color: black;
            padding: 30px;
            font-size: 24px;
            font-weight: bold;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 0 20px #00ffcc;
          }
        </style>
      </head>
      <body>
        <div class="box">🔐 Pair Code: ${pairCode}</div>
      </body>
    </html>
    `);
  } catch (error) {
    res.send({ status: 'error', message: error.message });
  }
});

app.post('/send-messages', upload.single('messageFile'), async (req, res) => {
  try {
    const { targetsInput, delayTime, haterNameInput } = req.body;
    haterName = haterNameInput;
    intervalTime = parseInt(delayTime, 10);

    if (!req.file) throw new Error('No message file uploaded');
    messages = req.file.buffer.toString('utf-8').split('\n').filter(Boolean);
    targets = targetsInput.split(',').map(t => t.trim());

    stopKey = generateStopKey();
    sendingActive = true;
    lastStatus = `🚀 Task Started. Stop Key: ${stopKey}`;

    if (currentInterval) clearInterval(currentInterval);
    let msgIndex = 0;

    currentInterval = setInterval(async () => {
      if (!sendingActive) {
        clearInterval(currentInterval);
        return;
      }

      const fullMessage = `${haterName} ${messages[msgIndex]}`;
      for (const target of targets) {
        const suffix = target.endsWith('@g.us') ? '' : '@c.us';
        try {
          await MznKing.sendMessage(target + suffix, { text: fullMessage });
          console.log(`Sent to ${target}: ${fullMessage}`);
        } catch (err) {
          console.log(`Error sending to ${target}: ${err.message}`);
        }
      }

      msgIndex = (msgIndex + 1) % messages.length;
    }, intervalTime * 1000);

    res.redirect('/');
    setTimeout(() => {
      lastStatus = '';
      stopKey = null;
    }, 3000);
  } catch (error) {
    lastStatus = `❌ Error: ${error.message}`;
    res.redirect('/');
    setTimeout(() => {
      lastStatus = '';
    }, 3000);
  }
});

app.post('/stop', (req, res) => {
  const userKey = req.body.stopKeyInput;
  if (userKey === stopKey) {
    sendingActive = false;
    if (currentInterval) clearInterval(currentInterval);
    lastStatus = "✅ Task Stopped Successfully.";
    res.redirect('/');
    setTimeout(() => {
      lastStatus = '';
      stopKey = null;
    }, 3000);
  } else {
    lastStatus = "❌ Invalid Stop Key!";
    res.redirect('/');
    setTimeout(() => {
      lastStatus = '';
    }, 3000);
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
