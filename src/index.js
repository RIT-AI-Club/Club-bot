require("dotenv").config();
const { Client, Events, GatewayIntentBits, Collection } = require("discord.js");
const { discordToken } = process.env;
const fs = require("fs");
const path = require("path");

// Event Handlers
const eventHandler = {
  restart: require("./events/server/restart"),
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
  ],
});
client.commands = new Map();
client.commandArray = [];
client.botStartTime = Math.floor(Date.now() / 1000);
const files = fs
  .readdirSync(`./src/functions/handlers`)
  .filter((file) => file.endsWith(".js"));
for (const file of files) {
  require(`./functions/handlers/${file}`)(client);
}

const commandsPath = "./src/commands";
const clientId = "1418442289889546260";
client.handleCommands(commandsPath, clientId);
client.handleEvents();
client.login(discordToken).catch((err) => {
  console.error("❌ Login failed:", err);
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await eventHandler.restart(client);
});
