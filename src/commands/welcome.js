import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getWelcomeConfig } from '../config/welcome.js';

export const welcomeCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('welcome')
      .setDescription('Configure the welcome system.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub => sub.setName('enable').setDescription('Enable welcome messages.'))
      .addSubcommand(sub => sub.setName('disable').setDescription('Disable welcome messages.'))
      .addSubcommand(sub => sub.setName('channel').setDescription('Set the welcome channel.').addChannelOption(o => o.setName('channel').setDescription('Channel for welcome messages.').setRequired(true)))
      .addSubcommand(sub => sub.setName('message').setDescription('Set the welcome message.').addStringOption(o => o.setName('message').setDescription('Use {user}, {username}, {server}, and {count}.').setRequired(true)))
      .addSubcommand(sub => sub.setName('status').setDescription('Show welcome settings.')),
    async execute(interaction) {
      const config = getWelcomeConfig(interaction.client, interaction.guild.id);
      const sub = interaction.options.getSubcommand();
      if (sub === 'enable') {
        config.enabled = true;
        return interaction.reply('👋 Welcome messages are **enabled**.');
      }
      if (sub === 'disable') {
        config.enabled = false;
        return interaction.reply('👋 Welcome messages are **disabled**.');
      }
      if (sub === 'channel') {
        config.channelId = interaction.options.getChannel('channel').id;
        return interaction.reply(`📢 Welcome channel set to <#${config.channelId}>.`);
      }
      if (sub === 'message') {
        config.message = interaction.options.getString('message');
        return interaction.reply('✏️ Welcome message updated.');
      }
      return interaction.reply({ content: `👋 **Welcome Status**\nEnabled: **${config.enabled ? 'Yes' : 'No'}**\nChannel: ${config.channelId ? `<#${config.channelId}>` : 'Not configured'}\nMessage: ${config.message}`, ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('goodbye')
      .setDescription('Configure the goodbye system.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub => sub.setName('enable').setDescription('Enable goodbye messages.'))
      .addSubcommand(sub => sub.setName('disable').setDescription('Disable goodbye messages.'))
      .addSubcommand(sub => sub.setName('channel').setDescription('Set the goodbye channel.').addChannelOption(o => o.setName('channel').setDescription('Channel for goodbye messages.').setRequired(true)))
      .addSubcommand(sub => sub.setName('message').setDescription('Set the goodbye message.').addStringOption(o => o.setName('message').setDescription('Use {user}, {username}, {server}, and {count}.').setRequired(true)))
      .addSubcommand(sub => sub.setName('status').setDescription('Show goodbye settings.')),
    async execute(interaction) {
      const config = getWelcomeConfig(interaction.client, interaction.guild.id);
      const sub = interaction.options.getSubcommand();
      if (sub === 'enable') { config.goodbyeEnabled = true; return interaction.reply('👋 Goodbye messages are **enabled**.'); }
      if (sub === 'disable') { config.goodbyeEnabled = false; return interaction.reply('👋 Goodbye messages are **disabled**.'); }
      if (sub === 'channel') { config.goodbyeChannelId = interaction.options.getChannel('channel').id; return interaction.reply(`📢 Goodbye channel set to <#${config.goodbyeChannelId}>.`); }
      if (sub === 'message') { config.goodbyeMessage = interaction.options.getString('message'); return interaction.reply('✏️ Goodbye message updated.'); }
      return interaction.reply({ content: `👋 **Goodbye Status**\nEnabled: **${config.goodbyeEnabled ? 'Yes' : 'No'}**\nChannel: ${config.goodbyeChannelId ? `<#${config.goodbyeChannelId}>` : 'Not configured'}\nMessage: ${config.goodbyeMessage}`, ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('autorole')
      .setDescription('Configure the automatic member role.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addSubcommand(sub => sub.setName('set').setDescription('Set a role for new members.').addRoleOption(o => o.setName('role').setDescription('Role to assign.').setRequired(true)))
      .addSubcommand(sub => sub.setName('disable').setDescription('Disable automatic roles.'))
      .addSubcommand(sub => sub.setName('status').setDescription('Show the current automatic role.')),
    async execute(interaction) {
      const config = getWelcomeConfig(interaction.client, interaction.guild.id);
      const sub = interaction.options.getSubcommand();
      if (sub === 'set') {
        const role = interaction.options.getRole('role');
        if (role.managed) return interaction.reply({ content: '❌ Managed/integration roles cannot be assigned.', ephemeral: true });
        if (role.position >= interaction.guild.members.me.roles.highest.position) return interaction.reply({ content: '❌ My highest role must be above that role.', ephemeral: true });
        config.autoRoleId = role.id;
        return interaction.reply(`🎭 Auto-role set to <@&${role.id}>.`);
      }
      if (sub === 'disable') { config.autoRoleId = null; return interaction.reply('🎭 Auto-role disabled.'); }
      return interaction.reply({ content: `🎭 Auto-role: ${config.autoRoleId ? `<@&${config.autoRoleId}>` : 'Disabled'}`, ephemeral: true });
    }
  }
];
