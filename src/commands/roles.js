import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const roleCommands = [{
  data: new SlashCommandBuilder().setName('role').setDescription('Manage server roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(s => s.setName('add').setDescription('Add a role to a member.').addUserOption(o => o.setName('user').setDescription('Member.').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role.').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('Remove a role from a member.').addUserOption(o => o.setName('user').setDescription('Member.').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Role.').setRequired(true)))
    .addSubcommand(s => s.setName('create').setDescription('Create a role.').addStringOption(o => o.setName('name').setDescription('Role name.').setRequired(true)))
    .addSubcommand(s => s.setName('delete').setDescription('Delete a role.').addRoleOption(o => o.setName('role').setDescription('Role.').setRequired(true))),
  async execute(i) {
    const sub = i.options.getSubcommand();
    if (sub === 'create') { const role = await i.guild.roles.create({ name: i.options.getString('name'), reason: 'Infinity Manager role command' }); return i.reply(`🎭 Created ${role}.`); }
    const role = i.options.getRole('role');
    if (role.position >= i.guild.members.me.roles.highest.position || role.managed) return i.reply({ content: '❌ I cannot manage that role.', ephemeral: true });
    if (sub === 'delete') { await role.delete('Infinity Manager role command'); return i.reply('🗑️ Role deleted.'); }
    const member = await i.guild.members.fetch(i.options.getUser('user').id);
    if (member.roles.highest.position >= i.guild.members.me.roles.highest.position) return i.reply({ content: '❌ I cannot manage that member.', ephemeral: true });
    if (sub === 'add') { await member.roles.add(role); return i.reply(`🎭 Added ${role} to ${member}.`); }
    await member.roles.remove(role); return i.reply(`🎭 Removed ${role} from ${member}.`);
  }
}];
