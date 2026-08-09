import 'dotenv/config';
import {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} from 'discord.js';
import { moderationCommands } from './commands/moderation.js';
import { automodCommands } from './commands/automod.js';
import { handleAutomodMessage } from './automod.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId) {
  console.error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

const baseCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Check Infinity Manager latency.'),
    async execute(interaction) {
      await interaction.reply(`🏓 Pong! Latency: ${client.ws.ping}ms`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('serverinfo')
      .setDescription('Show information about this server.'),
    async execute(interaction) {
      const guild = interaction.guild;
      await interaction.reply(
        `**${guild.name}**\n` +
        `👑 Owner: <@${guild.ownerId}>\n` +
        `👥 Members: ${guild.memberCount}\n` +
        `🆔 ID: ${guild.id}`
      );
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('userinfo')
      .setDescription('Show information about a member.')
      .addUserOption(option =>
        option.setName('user').setDescription('The member to inspect.').setRequired(false)
      ),
    async execute(interaction) {
      const user = interaction.options.getUser('user') ?? interaction.user;
      await interaction.reply(
        `**${user.tag}**\n` +
        `🆔 ID: ${user.id}\n` +
        `📅 Created: <t:${Math.floor(user.createdTimestamp / 1000)}:F>`
      );
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('botinfo')
      .setDescription('Show Infinity Manager information.'),
    async execute(interaction) {
      await interaction.reply(
        `🤖 **Infinity Manager**\n` +
        `Version: 1.2.0\n` +
        `Servers: ${client.guilds.cache.size}\n` +
        `Node.js: ${process.version}`
      );
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('help')
      .setDescription('Show available Infinity Manager commands.'),
    async execute(interaction) {
      await interaction.reply(
        '**Infinity Manager Commands**\n\n' +
        '🏓 `/ping` — Check bot latency\n' +
        '📊 `/serverinfo` — Server information\n' +
        '👤 `/userinfo` — User information\n' +
        '🤖 `/botinfo` — Bot information\n\n' +
        '**🛡️ Moderation**\n' +
        '🔨 `/ban` — Ban a member\n' +
        '👢 `/kick` — Kick a member\n' +
        '⏱️ `/timeout` — Timeout a member\n' +
        '⚠️ `/warn` — Warn a member\n' +
        '📋 `/warnings` — View warnings\n' +
        '🧹 `/clearwarns` — Clear warnings\n' +
        '🗑️ `/clear` — Delete messages\n\n' +
        '**🤖 AutoMod**\n' +
        '⚙️ `/automod status` — View AutoMod settings\n' +
        '✅ `/automod enable` — Enable AutoMod\n' +
        '⛔ `/automod disable` — Disable AutoMod\n' +
        '🚫 `/automod spam` — Configure spam protection\n' +
        '🔗 `/automod links` — Configure link blocking\n' +
        '📨 `/automod invites` — Configure invite blocking\n' +
        '👥 `/automod mentions` — Set mention limit\n' +
        '🔤 `/automod word` — Add blocked word\n' +
        '🧹 `/automod clearwords` — Clear blocked words'
      );
    }
  }
];

const commands = [...baseCommands, ...moderationCommands, ...automodCommands];

for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`✅ ${readyClient.user.tag} is online.`);

  const rest = new REST({ version: '10' }).setToken(token);
  const commandData = commands.map(command => command.data.toJSON());

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
        body: commandData
      });
      console.log(`✅ Registered ${commandData.length} commands in test guild ${guildId}.`);
    } else {
      await rest.put(Routes.applicationCommands(clientId), {
        body: commandData
      });
      console.log(`✅ Registered ${commandData.length} global commands.`);
    }
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
  }
});

client.on(Events.MessageCreate, async message => {
  await handleAutomodMessage(message);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error in /${interaction.commandName}:`, error);

    const message = '❌ Something went wrong while running that command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
});

client.on(Events.Error, error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

client.login(token);
