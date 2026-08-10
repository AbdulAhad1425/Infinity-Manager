import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';

export const generalCommands = [
  {
    data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Show a member avatar.')
      .addUserOption(o => o.setName('user').setDescription('Member.').setRequired(false)),
    async execute(interaction) {
      const user = interaction.options.getUser('user') || interaction.user;
      await interaction.reply({
        content: `🖼️ **${user.tag}'s avatar**\n${user.displayAvatarURL({ size: 1024, extension: 'png' })}`
      });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('invite')
      .setDescription('Get an invite link for Infinity Manager.'),
    async execute(interaction) {
      const url = `https://discord.com/oauth2/authorize?client_id=${interaction.client.application.id}&permissions=8&scope=bot%20applications.commands`;
      await interaction.reply(`🤖 **Invite Infinity Manager:**\n${url}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription('Flip a coin.'),
    async execute(interaction) {
      const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
      await interaction.reply(`🪙 **${result}**`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('dice')
      .setDescription('Roll a dice.')
      .addIntegerOption(o => o.setName('sides').setDescription('Number of sides (2-100).').setMinValue(2).setMaxValue(100).setRequired(false)),
    async execute(interaction) {
      const sides = interaction.options.getInteger('sides') || 6;
      const roll = Math.floor(Math.random() * sides) + 1;
      await interaction.reply(`🎲 You rolled **${roll}** on a **d${sides}**.`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('8ball')
      .setDescription('Ask the Magic 8-Ball a question.')
      .addStringOption(o => o.setName('question').setDescription('Your question.').setRequired(true)),
    async execute(interaction) {
      const answers = [
        'Yes, definitely.', 'It is likely.', 'Without a doubt.', 'Ask again later.',
        'Cannot predict that right now.', 'Probably not.', 'My answer is no.', 'Very doubtful.'
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];
      await interaction.reply(`🎱 **Question:** ${interaction.options.getString('question')}\n**Answer:** ${answer}`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('rps')
      .setDescription('Play Rock Paper Scissors.')
      .addStringOption(o => o.setName('choice').setDescription('Your choice.').setRequired(true)
        .addChoices(
          { name: 'Rock', value: 'rock' },
          { name: 'Paper', value: 'paper' },
          { name: 'Scissors', value: 'scissors' }
        )),
    async execute(interaction) {
      const userChoice = interaction.options.getString('choice');
      const choices = ['rock', 'paper', 'scissors'];
      const botChoice = choices[Math.floor(Math.random() * choices.length)];
      const wins = { rock: 'scissors', paper: 'rock', scissors: 'paper' };
      const result = userChoice === botChoice ? 'Draw 🤝' : wins[userChoice] === botChoice ? 'You win! 🎉' : 'I win! 🤖';
      await interaction.reply(`🎮 **You:** ${userChoice}\n🤖 **Infinity:** ${botChoice}\n🏆 **${result}**`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('poll')
      .setDescription('Create a simple yes/no poll.')
      .addStringOption(o => o.setName('question').setDescription('Poll question.').setRequired(true)),
    async execute(interaction) {
      const question = interaction.options.getString('question');
      const message = await interaction.reply({ content: `📊 **Poll**\n${question}\n\n👍 Yes  |  👎 No`, fetchReply: true });
      await message.react('👍');
      await message.react('👎');
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('say')
      .setDescription('Send a message as Infinity Manager.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
      .addStringOption(o => o.setName('message').setDescription('Message to send.').setRequired(true)),
    async execute(interaction) {
      const text = interaction.options.getString('message');
      await interaction.channel.send(text);
      await interaction.reply({ content: '✅ Message sent.', ephemeral: true });
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('membercount')
      .setDescription('Show the server member count.'),
    async execute(interaction) {
      await interaction.reply(`👥 **${interaction.guild.name}** has **${interaction.guild.memberCount}** members.`);
    }
  },
  {
    data: new SlashCommandBuilder()
      .setName('choose')
      .setDescription('Choose randomly from several options.')
      .addStringOption(o => o.setName('options').setDescription('Separate options with commas.').setRequired(true)),
    async execute(interaction) {
      const options = interaction.options.getString('options').split(',').map(x => x.trim()).filter(Boolean);
      if (options.length < 2) return interaction.reply({ content: '❌ Please provide at least two options separated by commas.', ephemeral: true });
      const choice = options[Math.floor(Math.random() * options.length)];
      await interaction.reply(`🎯 I choose: **${choice}**`);
    }
  }
];
