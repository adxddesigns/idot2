const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { roasts } = require('./roasts');
const { generateInsult } = require('./insult');
const {
  SUPPORTED_LANGUAGES,
  getUserLanguage,
  setUserLanguage,
  translate,
  getLanguagePage,
  getTotalPages,
} = require('./language');
require('dotenv').config();

// ─── Client Setup ─────────────────────────────────────────────────────────────
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
    .setDescription('Roast someone based on their profile')
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

  new SlashCommandBuilder()
    .setName('language')
    .setDescription('Set your preferred language for Idot 2 responses'),

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildLanguageMenu(page = 0) {
  const langs = getLanguagePage(page);
  const totalPages = getTotalPages();

  const select = new StringSelectMenuBuilder()
    .setCustomId(`lang_select_${page}`)
    .setPlaceholder('Choose your language...')
    .addOptions(
      langs.map(l => ({
        label: `${l.flag} ${l.name}`,
        value: l.code,
        description: `Set language to ${l.name}`,
      }))
    );

  const row = new ActionRowBuilder().addComponents(select);
  const components = [row];

  if (totalPages > 1) {
    const prevBtn = new ButtonBuilder()
      .setCustomId(`lang_page_${page - 1}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0);

    const nextBtn = new ButtonBuilder()
      .setCustomId(`lang_page_${page + 1}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1);

    const pageLabel = new ButtonBuilder()
      .setCustomId('lang_page_label')
      .setLabel(`Page ${page + 1} of ${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const btnRow = new ActionRowBuilder().addComponents(prevBtn, pageLabel, nextBtn);
    components.push(btnRow);
  }

  return components;
}

// ─── Event: Ready ─────────────────────────────────────────────────────────────
client.once('ready', () => {
  console.log(`✅ Idot 2 is online as ${client.user.tag}`);
  client.user.setActivity('/help | v0.0.1', { type: 3 });
});

// ─── Event: Interaction ───────────────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {
  const userId = interaction.user.id;

  // ── Language Select Menu ───────────────────────────────────────────────────
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('lang_select_')) {
    const selectedCode = interaction.values[0];
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === selectedCode);
    if (!lang) return interaction.update({ content: 'Invalid language selected.', components: [] });

    setUserLanguage(userId, selectedCode);

    const confirmMsg = `${lang.flag} Language set to **${lang.name}**! All my responses will now be in ${lang.name}.`;
    const translated = await translate(confirmMsg, selectedCode);

    return interaction.update({ content: translated, embeds: [], components: [] });
  }

  // ── Language Page Buttons ──────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('lang_page_')) {
    const page = parseInt(interaction.customId.replace('lang_page_', ''));
    const components = buildLanguageMenu(page);
    const langCode = getUserLanguage(userId);
    const headerText = await translate('🌐 Choose your language:', langCode);
    return interaction.update({ content: headerText, components });
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, user } = interaction;
  const langCode = getUserLanguage(userId);

  // ── /ping ──────────────────────────────────────────────────────────────────
  if (commandName === 'ping') {
    const msg = await translate('im awake bro', langCode);
    return interaction.reply({ content: msg });
  }

  // ── /kill ──────────────────────────────────────────────────────────────────
  if (commandName === 'kill') {
    const msg = await translate('go fuck yourself 🩷', langCode);
    return interaction.reply({ content: msg });
  }

  // ── /roast ─────────────────────────────────────────────────────────────────
  if (commandName === 'roast') {
    await interaction.deferReply();
    const roast = getRandom(roasts);
    const translatedRoast = await translate(roast, langCode);
    const title = await translate('🔥 Roasted', langCode);

    const embed = new EmbedBuilder()
      .setColor(0xFF4655)
      .setTitle(title)
      .setDescription(translatedRoast)
      .setFooter({ text: `Requested by ${user.username}`, iconURL: user.displayAvatarURL() })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /insult ────────────────────────────────────────────────────────────────
  if (commandName === 'insult') {
    const target = interaction.options.getUser('target');

    if (target.id === client.user.id) {
      const msg = await translate("nice try, i'm not roasting myself 💀", langCode);
      return interaction.reply({ content: msg, ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const member = await interaction.guild.members.fetch(target.id).catch(() => null);
      const insult = generateInsult(target, member);
      const translatedInsult = await translate(insult, langCode);
      const title = await translate(`💀 ${target.username} has been cooked`, langCode);

      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle(title)
        .setThumbnail(target.displayAvatarURL({ size: 256 }))
        .setDescription(translatedInsult)
        .setFooter({ text: `Served by ${user.username}`, iconURL: user.displayAvatarURL() })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Insult error:', err);
      const msg = await translate('Something broke. Even the bot gave up on that one.', langCode);
      return interaction.editReply({ content: msg });
    }
  }

  // ── /version ───────────────────────────────────────────────────────────────
  if (commandName === 'version') {
    await interaction.deferReply();

    const bodyText = [
      '**Version:** `v1.2.0`',
      '**Status:** Pre-release',
      '',
      'V1.2.0: Added Mulilingual Support! All commands also translate to the language selected.',
      'V1.1.0: Adjusted backend to work more smoothly with Discord API.',
      '',
      'The legend continues. The bar is low. We will limbo under it.',
    ].join('\n');

    const translatedBody = await translate(bodyText, langCode);
    const title = await translate('🤖 Idot 2 — Version Info', langCode);
    const footer = await translate('Idot 2 • Built different (barely)', langCode);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(title)
      .setDescription(translatedBody)
      .setFooter({ text: footer })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /help ──────────────────────────────────────────────────────────────────
  if (commandName === 'help') {
    await interaction.deferReply();

    const fields = [
      { name: '`/ping`', value: 'Checks if the bot is alive. It will say **"im awake bro"**.' },
      { name: '`/roast`', value: 'Drops a random roast on whoever dares to use it. 60+ handpicked bangers.' },
      { name: '`/insult @user`', value: 'Personally cooks someone based on their actual Discord profile. Tag your victim.' },
      { name: '`/kill`', value: '...it tells you to go fuck yourself. With love. 🩷' },
      { name: '`/version`', value: 'Shows bot version and lore about Idot 2\'s origin.' },
      { name: '`/language`', value: 'Set your preferred language. 50+ languages supported.' },
      { name: '`/help`', value: 'You\'re literally reading it right now.' },
    ];

    const translatedFields = await Promise.all(
      fields.map(async f => ({
        name: f.name,
        value: await translate(f.value, langCode),
        inline: false,
      }))
    );

    const title = await translate('📖 Idot 2 — Command List', langCode);
    const desc = await translate("Here's everything I can do. Don't expect much.", langCode);
    const footer = await translate('Idot 2 v1.2.0 • Predecessor to the legendary Idot Bot', langCode);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(title)
      .setDescription(desc)
      .addFields(translatedFields)
      .setFooter({ text: footer })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  // ── /language ──────────────────────────────────────────────────────────────
  if (commandName === 'language') {
    const currentCode = getUserLanguage(userId);
    const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentCode);
    const components = buildLanguageMenu(0);

    const headerText = await translate(
      `🌐 Choose your language:\n*Currently set to: ${currentLang?.flag} ${currentLang?.name || 'English'}*`,
      currentCode
    );

    return interaction.reply({ content: headerText, components, ephemeral: true });
  }
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
registerCommands().then(() => {
  client.login(process.env.DISCORD_TOKEN);
});
