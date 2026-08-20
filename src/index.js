import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { moderationCommands } from './commands/moderation.js';
import { securityCommands } from './commands/security.js';
import { welcomeCommands } from './commands/welcome.js';
import { loggingCommands } from './commands/logging.js';
import { ticketCommands } from './commands/tickets.js';
import { roleCommands } from './commands/roles.js';
import { automodCommands } from './commands/automod.js';
import { aiCommands } from './commands/ai.js';
import { generalCommands } from './commands/general.js';
import { musicCommands, initMusic } from './commands/music.js';
import { registerSecurity } from './security/antiRaid.js';
import { registerWelcomeSystem } from './config/welcome.js';
import { registerLogging } from './logging.js';
import { handleAutomodMessage } from './automod.js';
import { initAI } from './ai.js';
import { initDatabase } from './database.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId) { console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.'); process.exit(1); }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});
client.commands = new Collection();

const baseCommands = [
  { data: new SlashCommandBuilder().setName('ping').setDescription('Check Infinity Manager latency.'), async execute(i) { await i.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`); } },
  { data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show information about this server.'), async execute(i) { const g=i.guild; await i.reply(`**${g.name}**\n👑 Owner: <@${g.ownerId}>\n👥 Members: ${g.memberCount}\n🆔 ID: ${g.id}`); } },
  { data: new SlashCommandBuilder().setName('userinfo').setDescription('Show information about a member.').addUserOption(o=>o.setName('user').setDescription('Member.').setRequired(false)), async execute(i) { const u=i.options.getUser('user')??i.user; await i.reply(`**${u.tag}**\n🆔 ID: ${u.id}\n📅 Created: <t:${Math.floor(u.createdTimestamp/1000)}:F>`); } },
  { data: new SlashCommandBuilder().setName('botinfo').setDescription('Show Infinity Manager information.'), async execute(i) { await i.reply(`🤖 **Infinity Manager**\nVersion: 2.2.0\nServers: ${client.guilds.cache.size}\nNode.js: ${process.version}`); } },
  { data: new SlashCommandBuilder().setName('help').setDescription('Show available Infinity Manager commands.'), async execute(i) { await i.reply('**Infinity Manager**\n\n🛡️ Moderation: `/ban` `/kick` `/timeout` `/warn` `/warnings` `/clearwarns` `/clear`\n🤖 AutoMod: `/automod`\n🔒 Security: `/security`\n👋 Welcome: `/welcome` `/goodbye` `/autorole`\n📋 Logs: `/logs`\n🎫 Tickets: `/ticket`\n🎭 Roles: `/role`\n🧠 AI: `/ask`\n🎵 Music: `/play` `/pause` `/resume` `/skip` `/stop` `/queue` `/nowplaying` `/volume` `/loop`\n🎮 Gaming: `/coinflip` `/dice` `/8ball` `/rps` `/choose`\n🛠️ Utility: `/avatar` `/invite` `/poll` `/say` `/membercount`'); } }
];

const commands = [...baseCommands, ...generalCommands, ...moderationCommands, ...securityCommands, ...welcomeCommands, ...loggingCommands, ...ticketCommands, ...roleCommands, ...automodCommands, ...aiCommands, ...musicCommands];
for (const command of commands) client.commands.set(command.data.name, command);

registerSecurity(client);
registerWelcomeSystem(client);
registerLogging(client);
initAI();
initDatabase();
client.on(Events.MessageCreate, handleAutomodMessage);

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ ${readyClient.user.tag} is online.`);
  try {
    await initMusic(client);
  } catch (error) {
    console.error('❌ Failed to initialize music player:', error);
  }

  const rest = new REST({ version: '10' }).setToken(token);
  const commandData = commands.map(c => c.data.toJSON());
  try {
    const route = guildId ? Routes.applicationGuildCommands(clientId, guildId) : Routes.applicationCommands(clientId);
    await rest.put(route, { body: commandData });
    console.log(`✅ Registered ${commandData.length} slash commands.`);
  } catch (error) { console.error('❌ Failed to register slash commands:', error); }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName); if (!command) return;
  try { await command.execute(interaction); } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const message='❌ Something went wrong while running that command.';
    if (interaction.replied || interaction.deferred) await interaction.followUp({content:message,ephemeral:true}); else await interaction.reply({content:message,ephemeral:true});
  }
});
client.on(Events.Error, error => console.error('Discord client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));
client.login(token);
