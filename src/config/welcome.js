const DEFAULT_WELCOME = {
  enabled: false,
  channelId: null,
  message: 'Welcome {user} to **{server}**! 🎉 You are member #{count}.',
  goodbyeEnabled: false,
  goodbyeChannelId: null,
  goodbyeMessage: '**{user}** has left **{server}**. 👋',
  autoRoleId: null
};

export function getWelcomeConfig(client, guildId) {
  client.welcomeConfigs ??= new Map();
  if (!client.welcomeConfigs.has(guildId)) {
    client.welcomeConfigs.set(guildId, { ...DEFAULT_WELCOME });
  }
  return client.welcomeConfigs.get(guildId);
}

export function formatWelcomeMessage(message, member) {
  return message
    .replaceAll('{user}', `<@${member.id}>`)
    .replaceAll('{username}', member.user.username)
    .replaceAll('{server}', member.guild.name)
    .replaceAll('{count}', String(member.guild.memberCount));
}

export function registerWelcomeSystem(client) {
  client.on('guildMemberAdd', async member => {
    const config = getWelcomeConfig(client, member.guild.id);

    if (config.autoRoleId) {
      const role = member.guild.roles.cache.get(config.autoRoleId);
      if (role && role.editable) {
        await member.roles.add(role, 'Infinity Manager auto-role').catch(() => null);
      }
    }

    if (!config.enabled || !config.channelId) return;
    const channel = member.guild.channels.cache.get(config.channelId);
    if (!channel?.isTextBased()) return;
    await channel.send(formatWelcomeMessage(config.message, member)).catch(() => null);
  });

  client.on('guildMemberRemove', async member => {
    const config = getWelcomeConfig(client, member.guild.id);
    if (!config.goodbyeEnabled || !config.goodbyeChannelId) return;
    const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
    if (!channel?.isTextBased()) return;
    await channel.send(formatWelcomeMessage(config.goodbyeMessage, member)).catch(() => null);
  });
}
