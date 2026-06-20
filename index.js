const { Client, GatewayIntentBits, Partials } = require('discord.js');
const axios = require('axios');
require('dotenv').config();
const TWITCH_CHANNEL = 'gunix_live';
const LIVE_CHANNEL_ID = '1517534465080033423';

let liveAlreadyAnnounced = false;

console.log('TWITCH_CLIENT_ID =', process.env.TWITCH_CLIENT_ID ? 'OK' : 'MANQUANT');
console.log('TWITCH_CLIENT_SECRET =', process.env.TWITCH_CLIENT_SECRET ? 'OK' : 'MANQUANT');

// ===== CONFIGURATION =====
const SPAWN_CHANNEL_ID = '1485332617946726561';
const REGLEMENT_CHANNEL_ID = '1485341010614554624';
const SURVIVANT_ROLE_ID = '1090651904754847805';

// ===== CLIENT =====
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

  setInterval(checkTwitchLive, 300000);
  checkTwitchLive();
});
// ===== BIENVENUE =====
client.on('guildMemberAdd', async (member) => {
  try {
    const channel = member.guild.channels.cache.get(SPAWN_CHANNEL_ID);

    if (!channel) {
      console.error('❌ Salon Spawn introuvable');
      return;
    }

    console.log(`👋 Nouveau membre : ${member.user.tag}`);

    await channel.send(
      `👋 Bienvenue ${member} !\n\n` +
      `Tu viens de spawn sur le serveur ⚒️\n\n` +
      `Merci de lire le règlement dans <#${REGLEMENT_CHANNEL_ID}>.\n` +
      `Une fois la lecture terminée, clique sur la réaction ✅ sous le message du règlement pour obtenir le rôle ⚒️ Survivant.`
    );
  } catch (error) {
    console.error('Erreur bienvenue :', error);
  }
});

// ===== AJOUT ROLE =====
client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();

    if (reaction.message.channel.id !== REGLEMENT_CHANNEL_ID) return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(SURVIVANT_ROLE_ID);

    if (!role) {
      console.error('❌ Rôle Survivant introuvable');
      return;
    }

    if (!member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      console.log(`✅ ${member.user.tag} a reçu le rôle ${role.name}`);
    }

  } catch (error) {
    console.error('Erreur réaction + :', error);
  }
});

// ===== RETRAIT ROLE =====
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;

  try {
    if (reaction.partial) await reaction.fetch();

    if (reaction.message.channel.id !== REGLEMENT_CHANNEL_ID) return;
    if (reaction.emoji.name !== '✅') return;

    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.get(SURVIVANT_ROLE_ID);

    if (!role) return;

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      console.log(`❌ ${member.user.tag} a perdu le rôle ${role.name}`);
    }

  } catch (error) {
    console.error('Erreur réaction - :', error);
  }
});

// ===== TWITCH LIVE CHECK =====

async function getTwitchAccessToken() {
  const response = await axios.post(
    'https://id.twitch.tv/oauth2/token',
    null,
    {
      params: {
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    }
  );

  return response.data.access_token;
}

async function checkTwitchLive() {
  try {
    const token = await getTwitchAccessToken();

    const response = await axios.get(
      'https://api.twitch.tv/helix/streams',
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        },
        params: {
          user_login: TWITCH_CHANNEL
        }
      }
    );

    const isLive = response.data.data.length > 0;

    if (isLive && !liveAlreadyAnnounced) {
      const channel = await client.channels.fetch(LIVE_CHANNEL_ID);

      if (channel) {
        await channel.send(
          `🔴 **GuniX est en live !**\n\n` +
          `Je suis actuellement en stream sur Twitch.\n\n` +
          `https://www.twitch.tv/${TWITCH_CHANNEL}\n\n` +
          `@everyone`
        );

        console.log('🔴 Annonce live envoyée');
      }

      liveAlreadyAnnounced = true;
    }

    if (!isLive) {
      liveAlreadyAnnounced = false;
    }

  } catch (error) {
    console.error('Erreur Twitch :', error.message);
  }
}
client.login(process.env.BOT_TOKEN);