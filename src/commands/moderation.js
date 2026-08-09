import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

const warnings = new Map();

function getWarnings(guildId, userId) {
  const key = `${guildId}:${userId}`;
  if (!warnings.has(key)) warnings.set(key, []);
  return warnings.get(key);
}

function canActOn(interaction, member) {
  if (!member) return 'Member not found.';
  if (member.id === interaction.user.id) return 'You cannot moderate yourself.';
  if (member.id === interaction.client.user.id) return 'You cannot moderate me.';
  if (member.id === interaction.guild.ownerId) return 'The server owner cannot be moderated.';
  if (member.roles.highest.position >= interaction.member.roles.highest.position && interaction.user.id !== interaction.guild.ownerId) {
    return 'You cannot moderate a member with an equal or higher role.';
  }
  return null;
}

export const moderationCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('ban')
      .setDescription('Ban a member from the server.')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption(o => o.setName('user').setDescription('Member to ban.').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for the ban.').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const error = canActOn(interaction, member);
      if (error) return interaction.reply({ content: `❌ ${error}`, ephemeral: true });
      if (!member.bannable) return interaction.reply({ content: '❌ I cannot ban this member. Check my role hierarchy and permissions.', ephemeral: true });
      await member.ban({ reason });
      return interaction.reply(`🔨 **${user.tag}** was banned.\n**Reason:** ${reason}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('kick')
      .setDescription('Kick a member from the server.')
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption(o => o.setName('user').setDescription('Member to kick.').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for the kick.').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const error = canActOn(interaction, member);
      if (error) return interaction.reply({ content: `❌ ${error}`, ephemeral: true });
      if (!member.kickable) return interaction.reply({ content: '❌ I cannot kick this member. Check my role hierarchy and permissions.', ephemeral: true });
      await member.kick(reason);
      return interaction.reply(`👢 **${user.tag}** was kicked.\n**Reason:** ${reason}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('timeout')
      .setDescription('Timeout a member.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName('user').setDescription('Member to timeout.').setRequired(true))
      .addIntegerOption(o => o.setName('minutes').setDescription('Timeout duration in minutes.').setMinValue(1).setMaxValue(40320).setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for the timeout.').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const minutes = interaction.options.getInteger('minutes');
      const reason = interaction.options.getString('reason') || 'No reason provided';
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const error = canActOn(interaction, member);
      if (error) return interaction.reply({ content: `❌ ${error}`, ephemeral: true });
      if (!member.moderatable) return interaction.reply({ content: '❌ I cannot timeout this member. Check my role hierarchy and permissions.', ephemeral: true });
      await member.timeout(minutes * 60 * 1000, reason);
      return interaction.reply(`⏱️ **${user.tag}** was timed out for **${minutes} minutes**.\n**Reason:** ${reason}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Warn a member.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName('user').setDescription('Member to warn.').setRequired(true))
      .addStringOption(o => o.setName('reason').setDescription('Reason for the warning.').setRequired(true)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason');
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const error = canActOn(interaction, member);
      if (error) return interaction.reply({ content: `❌ ${error}`, ephemeral: true });
      const list = getWarnings(interaction.guild.id, user.id);
      list.push({ reason, moderatorId: interaction.user.id, timestamp: Date.now() });
      return interaction.reply(`⚠️ **${user.tag}** has been warned.\n**Warning #${list.length}**\n**Reason:** ${reason}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('warnings')
      .setDescription('View a member\'s warnings.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName('user').setDescription('Member to inspect.').setRequired(true)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      const list = getWarnings(interaction.guild.id, user.id);
      if (!list.length) return interaction.reply(`✅ **${user.tag}** has no warnings.`);
      const lines = list.map((warning, index) => `${index + 1}. ${warning.reason} — <@${warning.moderatorId}>`);
      return interaction.reply(`⚠️ **Warnings for ${user.tag}**\n${lines.join('\n')}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('clearwarns')
      .setDescription('Clear all warnings for a member.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption(o => o.setName('user').setDescription('Member whose warnings should be cleared.').setRequired(true)),
    async execute(interaction) {
      const user = interaction.options.getUser('user');
      warnings.delete(`${interaction.guild.id}:${user.id}`);
      return interaction.reply(`🧹 Cleared all warnings for **${user.tag}**.`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('clear')
      .setDescription('Delete recent messages from this channel.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addIntegerOption(o => o.setName('amount').setDescription('Number of messages to delete (1-100).').setMinValue(1).setMaxValue(100).setRequired(true)),
    async execute(interaction) {
      const amount = interaction.options.getInteger('amount');
      if (!interaction.channel?.isTextBased() || !interaction.channel.bulkDelete) {
        return interaction.reply({ content: '❌ This command can only be used in a text channel.', ephemeral: true });
      }
      await interaction.deferReply({ ephemeral: true });
      const deleted = await interaction.channel.bulkDelete(amount, true);
      return interaction.editReply(`🧹 Deleted **${deleted.size}** messages.`);
    }
  }
];
