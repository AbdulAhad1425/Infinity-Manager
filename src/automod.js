import { PermissionsBitField } from 'discord.js';

const spamState = new Map();
const automodSettings = new Map();

const defaultSettings = {
  enabled: true,
  antiSpam: true,
  antiLinks: false,
  antiInvites: true,
  antiMentions: true,
  maxMentions: 5,
  maxMessages: 6,
  spamWindowMs: 5000,
  timeoutMinutes: 2,
  blockedWords: []
};

function getSettings(guildId) {
  if (!automodSettings.has(guildId)) {
    automodSettings.set(guildId, { ...defaultSettings });
  }
  return automodSettings.get(guildId);
}

function hasModeratorPermissions(member) {
  return member.permissions.has(PermissionsBitField.Flags.ManageMessages) ||
    member.permissions.has(PermissionsBitField.Flags.ModerateMembers) ||
    member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function containsUrl(content) {
  return /https?:\/\/|www\.|discord\.gg\//i.test(content);
}

function containsInvite(content) {
  return /(?:discord(?:app)?\.com\/invite|discord\.gg)\/[a-z0-9-]+/i.test(content);
}

function containsBlockedWord(content, blockedWords) {
  const lower = content.toLowerCase();
  return blockedWords.some(word => word && lower.includes(word.toLowerCase()));
}

function getSpamKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

export function setAutomodSettings(guildId, updates) {
  const current = getSettings(guildId);
  automodSettings.set(guildId, { ...current, ...updates });
  return automodSettings.get(guildId);
}

export function getAutomodSettings(guildId) {
  return getSettings(guildId);
}

export async function handleAutomodMessage(message) {
  if (!message.guild || message.author.bot || !message.member) return;

  const settings = getSettings(message.guild.id);
  if (!settings.enabled || hasModeratorPermissions(message.member)) return;

  let violation = null;

  if (settings.antiInvites && containsInvite(message.content)) {
    violation = 'Discord invite links are not allowed.';
  } else if (settings.antiLinks && containsUrl(message.content)) {
    violation = 'Links are not allowed in this server.';
  } else if (settings.antiMentions && message.mentions.users.size > settings.maxMentions) {
    violation = `Too many mentions. Maximum allowed: ${settings.maxMentions}.`;
  } else if (containsBlockedWord(message.content, settings.blockedWords)) {
    violation = 'That message contains a blocked word.';
  }

  if (!violation && settings.antiSpam) {
    const key = getSpamKey(message.guild.id, message.author.id);
    const now = Date.now();
    const timestamps = (spamState.get(key) ?? []).filter(
      timestamp => now - timestamp < settings.spamWindowMs
    );
    timestamps.push(now);
    spamState.set(key, timestamps);

    if (timestamps.length >= settings.maxMessages) {
      violation = 'Please slow down — spam protection has been triggered.';
    }
  }

  if (!violation) return;

  try {
    if (message.deletable) await message.delete();

    const timeoutMs = settings.timeoutMinutes * 60 * 1000;
    if (message.member.moderatable && timeoutMs > 0) {
      await message.member.timeout(timeoutMs, `Infinity Manager AutoMod: ${violation}`);
    }

    const warning = await message.channel.send(
      `⚠️ <@${message.author.id}> ${violation}`
    );
    setTimeout(() => warning.delete().catch(() => {}), 5000);
  } catch (error) {
    console.error('AutoMod action failed:', error);
  }
}
