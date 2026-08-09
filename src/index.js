import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, Events, REST, Routes, SlashCommandBuilder } from 'discord.js';
import { moderationCommands } from './commands/moderation.js';
import { securityCommands } from './commands/security.js';
import { welcomeCommands } from './commands/welcome.js';
import { registerSecurity } from './security/antiRaid.js';
import { registerWelcomeSystem } from './config/welcome.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.commands = new Collection();

const baseCommands = [
  {
    data: new SlashCommandBuilder().setName('ping').setDescription('Check Infinity Manager latency.'),
    async execute(interaction) { await interaction.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`); }
  },
  {
    data: new SlashCommandBuilder().setName('serverinfo').setDescription('Show information about this server.'),
    async execute(interaction) {
      const guild = interaction.guild;
      await interaction.reply(`**${guild.name}**\n👑 Owner: <@${guild.ownerId}>\n👥 Members: ${guild.memberCount}\n🆔 ID: ${guild.id}`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('userinfo').setDescription('Show information about a member.')
      .addUserOption(option => option.setName('user').setDescription('The member to inspect.').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user') ?? interaction.user;
      await interaction.reply(`**${user.tag}**\n🆔 ID: ${user.id}\n📅 Created: <t:${Math.floor(user.createdTimestamp / 1000)}:F>`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('botinfo').setDescription('Show Infinity Manager information.'),
    async execute(interaction) {
      await interaction.reply(`🤖 **Infinity Manager**\nVersion: 1.3.0\nServers: ${client.guilds.cache.size}\nNode.js: ${process.version}`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('help').setDescription('Show available Infinity Manager commands.'),
    async execute(interaction) {
      await interaction.reply('**Infinity Manager Commands**\n\n🏓 `/ping`\n📊 `/serverinfo`\n👤 `/userinfo`\n🤖 `/botinfo`\n\n**🛡️ Moderation**\n🔨 `/ban`\n👢 `/kick`\n⏱️ `/timeout`\n⚠️ `/warn`\n📋 `/warnings`\n🧹 `/clearwarns`\n🗑️ `/clear`\n\n**🔒 Security**\n🛡️ `/security status`\n✅ `/security enable`\n⚠️ `/security disable`\n🔒 `/security lockdown`\n\n**👋 Welcome**\n👋 `/welcome enable|disable|channel|message|status`\n🚪 `/goodbye enable|disable|channel|message|status`\n🎭 `/autorole set|disable|status`');
    }
  }
];

const commands = [...baseCommands, ...moderationCommands, ...securityCommands, ...welcomeCommands];

for (const command of commands) client.commands.set(command.data.name, command);

registerSecurity(client);
registerWelcomeSystem(client);

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ ${readyClient.user.tag} is online.`);
  const rest = new REST({ version: '10' }).setToken(token);
  const commandData = commands.map(command => command.data.toJSON());
  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commandData });
      console.log(`✅ Registered ${commandData.length} commands in test guild ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body: commandData });
      console.log(`✅ Registered ${commandData.length} global commands.`);
    }
  } catch (error) { console.error('❌ Failed to register slash commands:', error); }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try { await command.execute(interaction); }
  catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);
    const message = '❌ Something went wrong while running that command.';
    if (interaction.replied || interaction.deferred) await interaction.followUp({ content: message, ephemeral: true });
    else await interaction.reply({ content: message, ephemeral: true });
  }
});

client.on(Events.Error, error => console.error('Discord client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));
client.login(token);
