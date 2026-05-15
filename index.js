const { Client, GatewayIntentBits, Partials } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('clientReady', () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);
});

client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.get('1485332617946726561');
  if (!channel) return;

  await channel.send(
    `👋 Bienvenue ${member} !\n\n` +
    `Merci de lire le règlement dans https://discord.com/channels/875672123425837066/1485341010614554624 .\n` +
    `Une fois la lecture terminée, clique sur la réaction ✅ sous le message du règlement pour obtenir le rôle ⚒️ Survivant.`
  );
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();

    if (reaction.message.channel.id !== '1485341010614554624') return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get('1090651904754847805');

    if (!role) return;

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role);
    }
  } catch (error) {
    console.error('Erreur réaction :', error);
  }
});
client.on('messageReactionRemove', async (reaction, user) => {
    try {
        if (reaction.partial) await reaction.fetch();

        if (reaction.message.channel.id !== '1485341010614554624') return;
        if (reaction.emoji.name !== '✅') return;

        const guild = reaction.message.guild;
        const member = await guild.members.fetch(user.id);
        const role = guild.roles.cache.get('1090651904754847805');

        if (!role) return;

        if (member.roles.cache.has(role.id)) {
            await member.roles.remove(role);
        }

    } catch (error) {
        console.error(error);
    }
});
client.login(process.env.BOT_TOKEN);