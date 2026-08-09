import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const ticketCommands = [{
  data: new SlashCommandBuilder().setName('ticket').setDescription('Create and manage support tickets.')
    .addSubcommand(s => s.setName('create').setDescription('Create a private support ticket.'))
    .addSubcommand(s => s.setName('close').setDescription('Close the current ticket.')),
  async execute(i) {
    if (i.options.getSubcommand() === 'create') {
      const existing = i.guild.channels.cache.find(c => c.topic === `ticket:${i.user.id}`);
      if (existing) return i.reply({ content: `You already have a ticket: ${existing}`, ephemeral: true });
      const channel = await i.guild.channels.create({
        name: `ticket-${i.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90),
        type: ChannelType.GuildText,
        topic: `ticket:${i.user.id}`,
        permissionOverwrites: [
          { id: i.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: i.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }
        ]
      });
      await channel.send(`🎫 Welcome <@${i.user.id}>! Staff will assist you here. Use \`/ticket close\` when finished.`);
      return i.reply({ content: `🎫 Ticket created: ${channel}`, ephemeral: true });
    }
    if (!i.channel.topic?.startsWith('ticket:')) return i.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
    if (!i.memberPermissions.has(PermissionFlagsBits.ManageChannels) && !i.channel.topic.endsWith(i.user.id)) return i.reply({ content: '❌ You cannot close this ticket.', ephemeral: true });
    await i.reply('🔒 Closing ticket...');
    setTimeout(() => i.channel.delete('Infinity Manager ticket closed').catch(() => null), 1500);
  }
}];
