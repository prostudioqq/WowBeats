const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus
} = require("@discordjs/voice");

const play = require("play-dl");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

client.once("ready", () => {
  console.log(`✅ Music Bot Online: ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // ▶️ PLAY COMMAND
  if (message.content.startsWith("!play")) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.reply("❌ Pehle voice channel join karo");

    const query = message.content.replace("!play", "").trim();
    if (!query)
      return message.reply("❌ Song / Spotify / YouTube link do");

    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    let stream;

    // 🎵 Spotify / YouTube handling
    if (play.sp_validate(query) === "track") {
      const spotifyTrack = await play.spotify(query);
      const search = await play.search(
        `${spotifyTrack.name} ${spotifyTrack.artists[0].name}`,
        { limit: 1 }
      );
      stream = await play.stream(search[0].url);
    } else {
      stream = await play.stream(query);
    }

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type
    });

    const player = createAudioPlayer();
    player.play(resource);
    connection.subscribe(player);

    message.reply(`🎶 Now Playing: **${query}**`);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });
  }

  // ⏹️ STOP COMMAND
  if (message.content === "!stop") {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
      return message.reply("❌ Voice channel me nahi ho");

    voiceChannel.guild.voiceAdapterCreator.destroy?.();
    message.reply("⏹️ Music stopped");
  }
});

client.login(process.env.TOKEN);
