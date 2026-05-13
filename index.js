const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { roasts } = require('./roasts');
const { generateInsult } = require('./insult');
require('dotenv').config();

// ─── Client Setup ────────────────────────────────────────────────────────────
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── Slash Command Definitions ────────────────────────────────────────────────
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if Idot 2 is alive'),

  new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Get hit with a random roast. No one is safe.'),

  new SlashCommandBuilder()
    .setName('insult')
    .setDescription("Roast someone based on their profile")
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Who are we destroying today?')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('kill')
    .setDescription('...you know what this does'),

  new SlashCommandBuilder()
    .setName('version')
    .setDescription('Bot version info'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('List of all Idot 2 commands'),
].map(cmd => cmd.toJSON());

// ─── Register Commands ────────────────────────────────────────────────────────
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function registerCommands() {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered successfully.');
  } catch (err) {
    console.error('Failed to register commands:', err);
  }
}

// ─── Helper: Random Item ──────────────────────────────────────────────────────
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Event: Ready ─────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Idot 2 is online as ${client.user.tag}`);
  client.user.setActivity('/help | v1.1.0', { type: 3 }); // WATCHING
});

// ─── Event: Interaction ───────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;

  // /ping
  if (commandName === 'ping') {
    return interaction.reply({ content: 'im awake bro', ephemeral: false });
  }

  // /kill
  if (commandName === 'kill') {
    return interaction.reply({ content: 'go fuck yourself 🩷', ephemeral: false });
  }

  // /roast
  if (commandName === 'roast') {
    const roast = getRandom(roasts);
    const embed = new EmbedBuilder()
      .setColor(0xFF4655)
      .setTitle('🔥 Roasted')
      .setDescription(roast)
      .setFooter({ text: `Requested by ${user.username}`, iconURL: user.displayAvatarURL() })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  // /insult
  if (commandName === 'insult') {
    const target = interaction.options.getUser('target');

    // Self-insult easter egg
    if (target.id === client.user.id) {
      return interaction.reply({ content: "nice try, i'm not roasting myself 💀", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      const insult = await generateInsult(target, member);

      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(`💀 ${target.username} has been cooked`)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setDescription(insult)
        .setFooter({ text: `Served by ${user.username}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Insult error:', err);
      return interaction.editReply({ content: 'Something broke. Even the bot gave up on that one.' });
    }
  }

  // /version
  if (commandName === 'version') {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤖 Idot 2 — Version Info')
      .setDescription([
        '**Version:** `v1.1.0`',
        '**Status:** Discord API Adjustment',
        '',
        'Fixed bugs regarding Discords API that was causing the hosting to shut down'
        '',
        'The legend continues. The bar is low. We will limbo under it.',
      ].join('\n'))
      .setFooter({ text: 'Idot 2 • Built different (barely)' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  // /help
  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('📖 Idot 2 — Command List')
      .setDescription('Here\'s everything I can do. Don\'t expect much.')
      .addFields(
        {
          name: '`/ping`',
          value: 'Checks if the bot is alive. It will say **"im awake bro"**.',
          inline: false,
        },
        {
          name: '`/roast`',
          value: 'Drops a random roast on whoever dares to use it. 50+ handpicked bangers.',
          inline: false,
        },
        {
          name: '`/insult @user`',
          value: 'Personally cooks someone based on their actual Discord profile. Tag your victim.',
          inline: false,
        },
        {
          name: '`/kill`',
          value: '...it tells you to go fuck yourself. With love. 🩷',
          inline: false,
        },
        {
          name: '`/version`',
          value: 'Shows bot version and lore about Idot 2\'s origin.',
          inline: false,
        },
        {
          name: '`/help`',
          value: 'You\'re literally reading it right now.',
          inline: false,
        }
      )
      .setFooter({ text: 'Idot 2 v1.0.0 • Predecessor to the legendary Idot Bot' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
registerCommands().then(() => {
  client.login(process.env.DISCORD_TOKEN);
});
