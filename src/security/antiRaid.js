import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';

const joinTracker = new Map();
const actionTracker = new Map();

const DEFAULT_CONFIG = {
  enabled: true,
  joinWindowMs: 10_000,
  maxJoins: 8,
  lockdownMinutes: 10,
  actionWindowMs: 10_000,
  maxDestructiveActions: 3
};

function getConfig(guild) {
  return guild.client.infinitySecurity?.get(guild.id) ?? DEFAULT_CONFIG;
}

function recordAction(guildId, actorId) {
  const key = `${guildId}:${actorId}`;
  const now = Date.now();
  const list = actionTracker.get(key) ?? [];
  const filtered = list.filter(time => now - time < DEFAULT_CONFIG.actionWindowMs);
  filtered.push(now);
  actionTracker.set(key, filtered);
  return filtered.length;
}

async function lockdown(guild, reason) {
  const until = Date.now() + DEFAULT_CONFIG.lockdownMinutes * 60_000;
  guild.client.infinitySecurityLockdowns ??= new Map();
  guild.client.infinitySecurityLockdowns.set(guild.id, until);

  for (const channel of guild.channels.cache.values()) {
    if (!channel.isTextBased() || !channel.permissionOverwrites) continue;
    await channel.permissionOverwrites.edit(guild.roles.everyone, {
      SendMessages: false
    }, { reason }).catch(() => null);
  }

  setTimeout(async () => {
    const current = guild.client.infinitySecurityLockdowns?.get(guild.id);
    if (!current || current > Date.now()) return;
    for (const channel of guild.channels.cache.values()) {
      if (!channel.isTextBased() || !channel.permissionOverwrites) continue;
      await channel.permissionOverwrites.edit(guild.roles.everyone, {
        SendMessages: null
      }, { reason: 'Infinity Manager lockdown expired' }).catch(() => null);
    }
    guild.client.infinitySecurityLockdowns.delete(guild.id);
  }, DEFAULT_CONFIG.lockdownMinutes * 60_000 + 1000);
}

export function registerSecurity(client) {
  client.infinitySecurity ??= new Map();
  client.infinitySecurityLockdowns ??= new Map();

  client.on('guildMemberAdd', async member => {
    const config = getConfig(member.guild);
    if (!config.enabled) return;

    const now = Date.now();
    const joins = (joinTracker.get(member.guild.id) ?? [])
      .filter(time => now - time < config.joinWindowMs);
    joins.push(now);
    joinTracker.set(member.guild.id, joins);

    if (joins.length >= config.maxJoins) {
      await lockdown(member.guild, `Anti-raid: ${joins.length} joins detected in ${config.joinWindowMs / 1000}s`);
    }
  });

  const destructiveEvents = new Set([
    AuditLogEvent.MemberBanAdd,
    AuditLogEvent.MemberKick,
    AuditLogEvent.ChannelDelete,
    AuditLogEvent.RoleDelete
  ]);

  client.on('guildAuditLogEntryCreate', async (entry, guild) => {
    if (!destructiveEvents.has(entry.action)) return;
    if (!entry.executor || entry.executor.id === client.user.id) return;

    const count = recordAction(guild.id, entry.executor.id);
    if (count < DEFAULT_CONFIG.maxDestructiveActions) return;

    const member = await guild.members.fetch(entry.executor.id).catch(() => null);
    if (!member || member.id === guild.ownerId) return;

    const me = guild.members.me;
    if (!me?.permissions.has(PermissionFlagsBits.BanMembers)) return;
    if (!member.bannable) return;

    await member.ban({ reason: 'Infinity Manager anti-nuke: excessive destructive actions' }).catch(() => null);
    await lockdown(guild, 'Infinity Manager anti-nuke: excessive destructive actions');
  });
}
