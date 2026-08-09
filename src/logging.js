import { EmbedBuilder } from 'discord.js';

export function getLogConfig(client, guildId) {
  client.logConfigs ??= new Map();
  if (!client.logConfigs.has(guildId)) client.logConfigs.set(guildId, { channelId: null });
  return client.logConfigs.get(guildId);
}

export async function sendLog(guild, title, description, fields = []) {
  const config = getLogConfig(guild.client, guild.id);
  if (!config.channelId) return;
  const channel = guild.channels.cache.get(config.channelId);
  if (!channel?.isTextBased()) return;
  const embed = new EmbedBuilder().setTitle(title).setDescription(description).setTimestamp();
  if (fields.length) embed.addFields(fields);
  await channel.send({ embeds: [embed] }).catch(() => null);
}

export function registerLogging(client) {
  client.on('guildMemberAdd', member => sendLog(member.guild, '👋 Member Joined', `${member.user.tag} joined the server.`, [{ name: 'User ID', value: member.id, inline: true }]));
  client.on('guildMemberRemove', member => sendLog(member.guild, '👋 Member Left', `${member.user.tag} left the server.`, [{ name: 'User ID', value: member.id, inline: true }]));
  client.on('messageDelete', message => { if (message.guild) sendLog(message.guild, '🗑️ Message Deleted', `A message was deleted in ${message.channel}.`, [{ name: 'Author', value: message.author?.tag ?? 'Unknown', inline: true }, { name: 'Content', value: message.content?.slice(0, 1000) || 'Unavailable', inline: false }]); });
  client.on('messageUpdate', (oldMessage, newMessage) => { if (oldMessage.guild && oldMessage.content !== newMessage.content) sendLog(oldMessage.guild, '✏️ Message Edited', `A message was edited in ${oldMessage.channel}.`, [{ name: 'Before', value: oldMessage.content?.slice(0, 500) || 'Unavailable' }, { name: 'After', value: newMessage.content?.slice(0, 500) || 'Unavailable' }]); });
  client.on('guildBanAdd', ban => sendLog(ban.guild, '🔨 Member Banned', `${ban.user.tag} was banned.`));
  client.on('guildBanRemove', ban => sendLog(ban.guild, '♻️ Ban Removed', `${ban.user.tag} was unbanned.`));
  client.on('channelCreate', channel => sendLog(channel.guild, '📁 Channel Created', `Created ${channel}.`));
  client.on('channelDelete', channel => sendLog(channel.guild, '🗑️ Channel Deleted', `Deleted **${channel.name}**.`));
  client.on('roleCreate', role => sendLog(role.guild, '🎭 Role Created', `Created ${role}.`));
  client.on('roleDelete', role => sendLog(role.guild, '🗑️ Role Deleted', `Deleted **${role.name}**.`));
}
