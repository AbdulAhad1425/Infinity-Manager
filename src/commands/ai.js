import { SlashCommandBuilder } from 'discord.js';
import { askAI } from '../ai.js';

export const aiCommands = [{
  data: new SlashCommandBuilder().setName('ask').setDescription('Ask the Infinity Manager AI assistant.').addStringOption(o => o.setName('prompt').setDescription('Your question.').setRequired(true)),
  async execute(i) {
    await i.deferReply();
    const answer = await askAI(i.options.getString('prompt'));
    await i.editReply(answer.slice(0, 2000));
  }
}];
