import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Player, useQueue } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import ffmpegPath from 'ffmpeg-static';

export let musicPlayer = null;
let initialized = false;

export async function initMusic(client) {
  if (initialized) return musicPlayer;

  if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
  musicPlayer = new Player(client);
  await musicPlayer.extractors.loadMulti(DefaultExtractors);

  musicPlayer.events.on('playerStart', (queue, track) => {
    queue.metadata?.send(`🎶 Now playing: **${track.title}**`).catch(() => {});
  });
  musicPlayer.events.on('audioTrackAdd', (queue, track) => {
    queue.metadata?.send(`➕ Added **${track.title}** to the queue.`).catch(() => {});
  });
  musicPlayer.events.on('error', (queue, error) => {
    console.error('[Music] Queue error:', error);
    queue.metadata?.send(`❌ Music error: ${error.message ?? 'Unknown playback error.'}`).catch(() => {});
  });
  musicPlayer.events.on('playerError', (queue, error) => {
    console.error('[Music] Player error:', error);
    queue.metadata?.send(`❌ Playback error: ${error.message ?? 'Unknown playback error.'}`).catch(() => {});
  });
  musicPlayer.events.on('emptyChannel', queue => {
    queue.metadata?.send('👋 Everyone left the voice channel, so I stopped the music.').catch(() => {});
  });

  initialized = true;
  console.log('✅ Music player initialized.');
  return musicPlayer;
}

function getQueue(interaction) {
  return useQueue(interaction.guildId);
}

export const musicCommands = [
  {
    data: new SlashCommandBuilder().setName('play').setDescription('Play a song or add it to the queue.')
      .addStringOption(o => o.setName('song').setDescription('Song name, YouTube URL, Spotify URL, or supported URL.').setRequired(true)),
    async execute(interaction) {
      const voiceChannel = interaction.member.voice.channel;
      if (!voiceChannel) return interaction.reply({ content: '❌ Join a voice channel first.', ephemeral: true });
      const permissions = voiceChannel.permissionsFor(interaction.guild.members.me);
      if (!permissions?.has(PermissionFlagsBits.Connect) || !permissions?.has(PermissionFlagsBits.Speak)) {
        return interaction.reply({ content: '❌ I need **Connect** and **Speak** permissions in your voice channel.', ephemeral: true });
      }
      const query = interaction.options.getString('song', true);
      await interaction.deferReply();
      try {
        const { track } = await musicPlayer.play(voiceChannel, query, {
          nodeOptions: {
            metadata: interaction.channel,
            leaveOnEnd: true,
            leaveOnEndCooldown: 15000,
            leaveOnStop: true,
            leaveOnStopCooldown: 5000,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000,
            skipOnNoStream: true,
            bufferingTimeout: 15000
          }
        });
        return interaction.editReply(`🎵 **${track.title}** has been added to the queue.`);
      } catch (error) {
        console.error('[Music] /play failed:', error);
        return interaction.editReply(`❌ I couldn't play that track.\n\`${error.message ?? 'Unknown error'}\``);
      }
    }
  },
  {
    data: new SlashCommandBuilder().setName('pause').setDescription('Pause the current song.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      queue.node.setPaused(true); return interaction.reply('⏸️ Music paused.');
    }
  },
  {
    data: new SlashCommandBuilder().setName('resume').setDescription('Resume paused music.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      queue.node.setPaused(false); return interaction.reply('▶️ Music resumed.');
    }
  },
  {
    data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current song.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      const skipped = queue.currentTrack.title; await queue.node.skip(); return interaction.reply(`⏭️ Skipped **${skipped}**.`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('stop').setDescription('Stop music and clear the queue.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue) return interaction.reply({ content: '❌ There is no active music session.', ephemeral: true });
      queue.delete(); return interaction.reply('⏹️ Music stopped and the queue was cleared.');
    }
  },
  {
    data: new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ The queue is empty.', ephemeral: true });
      const tracks = queue.tracks.toArray();
      const upcoming = tracks.slice(0, 10).map((t, i) => `**${i + 1}.** ${t.title}`).join('\n') || 'No upcoming tracks.';
      return interaction.reply(`🎶 **Now Playing:** ${queue.currentTrack.title}\n\n**Up Next:**\n${upcoming}`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing song.'),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      return interaction.reply(`🎧 **Now Playing:** ${queue.currentTrack.title}\n🔗 ${queue.currentTrack.url ?? 'No URL available'}`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('volume').setDescription('Set music volume.')
      .addIntegerOption(o => o.setName('level').setDescription('Volume from 0 to 100.').setMinValue(0).setMaxValue(100).setRequired(true)),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      const level = interaction.options.getInteger('level', true); queue.node.setVolume(level);
      return interaction.reply(`🔊 Volume set to **${level}%**.`);
    }
  },
  {
    data: new SlashCommandBuilder().setName('loop').setDescription('Set the queue repeat mode.')
      .addStringOption(o => o.setName('mode').setDescription('Repeat mode.').setRequired(true).addChoices(
        { name: 'Off', value: 'off' }, { name: 'Track', value: 'track' }, { name: 'Queue', value: 'queue' }
      )),
    async execute(interaction) {
      const queue = getQueue(interaction);
      if (!queue?.currentTrack) return interaction.reply({ content: '❌ Nothing is playing.', ephemeral: true });
      const mode = interaction.options.getString('mode', true);
      queue.setRepeatMode(mode === 'track' ? 1 : mode === 'queue' ? 2 : 0);
      return interaction.reply(`🔁 Repeat mode: **${mode}**.`);
    }
  }
];
