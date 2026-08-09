import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getAutomodSettings, setAutomodSettings } from '../automod.js';

export const automodCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('automod')
      .setDescription('Configure Infinity Manager AutoMod.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
      .addSubcommand(sub =>
        sub.setName('status').setDescription('Show current AutoMod settings.')
      )
      .addSubcommand(sub =>
        sub.setName('enable').setDescription('Enable AutoMod.')
      )
      .addSubcommand(sub =>
        sub.setName('disable').setDescription('Disable AutoMod.')
      )
      .addSubcommand(sub =>
        sub.setName('spam').setDescription('Enable or disable spam protection.')
          .addBooleanOption(option => option.setName('enabled').setDescription('Enable spam protection.').setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('links').setDescription('Enable or disable normal URL blocking.')
          .addBooleanOption(option => option.setName('enabled').setDescription('Block normal links.').setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('invites').setDescription('Enable or disable Discord invite blocking.')
          .addBooleanOption(option => option.setName('enabled').setDescription('Block Discord invites.').setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('mentions').setDescription('Set the maximum mentions per message.')
          .addIntegerOption(option => option.setName('maximum').setDescription('Maximum mentions.').setMinValue(1).setMaxValue(50).setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('word').setDescription('Add a blocked word.')
          .addStringOption(option => option.setName('word').setDescription('Word or phrase to block.').setMinLength(1).setMaxLength(50).setRequired(true))
      )
      .addSubcommand(sub =>
        sub.setName('clearwords').setDescription('Remove all blocked words.')
      ),
    async execute(interaction) {
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;
      const settings = getAutomodSettings(guildId);

      if (subcommand === 'status') {
        return interaction.reply({
          ephemeral: true,
          content:
            '**🤖 AutoMod Status**\n' +
            `Enabled: **${settings.enabled ? 'Yes' : 'No'}**\n` +
            `Anti-spam: **${settings.antiSpam ? 'On' : 'Off'}**\n` +
            `Anti-links: **${settings.antiLinks ? 'On' : 'Off'}**\n` +
            `Anti-invites: **${settings.antiInvites ? 'On' : 'Off'}**\n` +
            `Mention limit: **${settings.maxMentions}**\n` +
            `Blocked words: **${settings.blockedWords.length}**`
        });
      }

      if (subcommand === 'enable') {
        setAutomodSettings(guildId, { enabled: true });
        return interaction.reply({ content: '✅ AutoMod is now enabled.', ephemeral: true });
      }

      if (subcommand === 'disable') {
        setAutomodSettings(guildId, { enabled: false });
        return interaction.reply({ content: '⛔ AutoMod is now disabled.', ephemeral: true });
      }

      if (subcommand === 'spam') {
        const enabled = interaction.options.getBoolean('enabled', true);
        setAutomodSettings(guildId, { antiSpam: enabled });
        return interaction.reply({ content: `✅ Anti-spam is now **${enabled ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      }

      if (subcommand === 'links') {
        const enabled = interaction.options.getBoolean('enabled', true);
        setAutomodSettings(guildId, { antiLinks: enabled });
        return interaction.reply({ content: `✅ Link blocking is now **${enabled ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      }

      if (subcommand === 'invites') {
        const enabled = interaction.options.getBoolean('enabled', true);
        setAutomodSettings(guildId, { antiInvites: enabled });
        return interaction.reply({ content: `✅ Discord invite blocking is now **${enabled ? 'enabled' : 'disabled'}**.`, ephemeral: true });
      }

      if (subcommand === 'mentions') {
        const maximum = interaction.options.getInteger('maximum', true);
        setAutomodSettings(guildId, { maxMentions: maximum });
        return interaction.reply({ content: `✅ Maximum mentions set to **${maximum}**.`, ephemeral: true });
      }

      if (subcommand === 'word') {
        const word = interaction.options.getString('word', true).trim();
        const words = [...settings.blockedWords, word].filter(
          (item, index, array) => array.findIndex(value => value.toLowerCase() === item.toLowerCase()) === index
        );
        setAutomodSettings(guildId, { blockedWords: words });
        return interaction.reply({ content: `✅ Added **${word}** to the blocked-word list.`, ephemeral: true });
      }

      if (subcommand === 'clearwords') {
        setAutomodSettings(guildId, { blockedWords: [] });
        return interaction.reply({ content: '✅ Blocked-word list cleared.', ephemeral: true });
      }
    }
  }
];
