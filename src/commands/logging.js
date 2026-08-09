import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getLogConfig } from '../logging.js';

export const loggingCommands = [{
  data: new SlashCommandBuilder().setName('logs').setDescription('Configure the server log channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName('set').setDescription('Set the log channel.').addChannelOption(o => o.setName('channel').setDescription('Log channel.').setRequired(true)))
    .addSubcommand(s => s.setName('disable').setDescription('Disable logging.'))
    .addSubcommand(s => s.setName('status').setDescription('Show logging status.')),
  async execute(i) {
    const c = getLogConfig(i.client, i.guild.id); const sub = i.options.getSubcommand();
    if (sub === 'set') { c.channelId = i.options.getChannel('channel').id; return i.reply(`📋 Logs will be sent to <#${c.channelId}>.`); }
    if (sub === 'disable') { c.channelId = null; return i.reply('📋 Server logging disabled.'); }
    return i.reply({ content: `📋 Log channel: ${c.channelId ? `<#${c.channelId}>` : 'Disabled'}`, ephemeral: true });
  }
}];
