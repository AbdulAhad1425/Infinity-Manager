import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const securityCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('security')
      .setDescription('Configure Infinity Manager security protection.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand(sub => sub
        .setName('status')
        .setDescription('Show current security settings.'))
      .addSubcommand(sub => sub
        .setName('enable')
        .setDescription('Enable anti-raid and anti-nuke protection.'))
      .addSubcommand(sub => sub
        .setName('disable')
        .setDescription('Disable anti-raid and anti-nuke protection.'))
      .addSubcommand(sub => sub
        .setName('lockdown')
        .setDescription('Immediately lock the server channels.')),
    async execute(interaction) {
      const security = interaction.client.infinitySecurity ?? new Map();
      interaction.client.infinitySecurity = security;
      const guildId = interaction.guild.id;
      const current = security.get(guildId) ?? {
        enabled: true,
        joinWindowMs: 10_000,
        maxJoins: 8,
        lockdownMinutes: 10,
        actionWindowMs: 10_000,
        maxDestructiveActions: 3
      };

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'status') {
        return interaction.reply({
          content: `🔒 **Infinity Manager Security**\nStatus: **${current.enabled ? 'Enabled' : 'Disabled'}**\nRaid threshold: **${current.maxJoins} joins / ${current.joinWindowMs / 1000}s**\nNuke threshold: **${current.maxDestructiveActions} actions / ${current.actionWindowMs / 1000}s**\nLockdown: **${current.lockdownMinutes} minutes**`,
          ephemeral: true
        });
      }

      if (subcommand === 'enable') {
        current.enabled = true;
        security.set(guildId, current);
        return interaction.reply('🛡️ Anti-raid and anti-nuke protection is now **enabled**.');
      }

      if (subcommand === 'disable') {
        current.enabled = false;
        security.set(guildId, current);
        return interaction.reply('⚠️ Anti-raid and anti-nuke protection is now **disabled**.');
      }

      if (subcommand === 'lockdown') {
        const until = Date.now() + current.lockdownMinutes * 60_000;
        interaction.client.infinitySecurityLockdowns ??= new Map();
        interaction.client.infinitySecurityLockdowns.set(guildId, until);

        let changed = 0;
        for (const channel of interaction.guild.channels.cache.values()) {
          if (!channel.isTextBased() || !channel.permissionOverwrites) continue;
          const changedChannel = await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
            SendMessages: false
          }, { reason: 'Manual Infinity Manager security lockdown' }).then(() => true).catch(() => false);
          if (changedChannel) changed++;
        }

        return interaction.reply(`🔒 **Server lockdown enabled.** ${changed} channels were locked for approximately **${current.lockdownMinutes} minutes**.`);
      }
    }
  }
];
