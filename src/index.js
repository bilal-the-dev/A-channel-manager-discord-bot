const { Client, IntentsBitField, Partials } = require("discord.js");
const WOK = require("wokcommands");
const path = require("path");
const dotenv = require("dotenv");
const cron = require("node-cron");

const channelData = require("./../data/channelData.json");
const { writeChannelData, moveChannel } = require("./utils/channel");
const { error } = require("console");

const { DefaultCommands } = WOK;
dotenv.config();

const { TOKEN, ARCHIVE_CATEGORY_ID } = process.env;

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
  ],
});

client.on("ready", async (readyClient) => {
  readyClient.application.commands.set([]);
  client.guilds.cache.get("1239804781468586024").commands.set([]);
  console.log(`${readyClient.user.username} is running 🧶`);

  cron.schedule("* * * * *", checkForChannelsToBeArchived);
  cron.schedule("* * * * *", checkForChannelsToBeDeleted);
  checkForChannelsToBeArchived();
  checkForChannelsToBeDeleted();
  new WOK({
    client,
    commandsDir: path.join(__dirname, "./commands"),
    events: {
      dir: path.join(__dirname, "events"),
    },
    disabledDefaultCommands: [
      DefaultCommands.ChannelCommand,
      DefaultCommands.CustomCommand,
      DefaultCommands.Prefix,
      DefaultCommands.RequiredPermissions,
      DefaultCommands.RequiredRoles,
      DefaultCommands.ToggleCommand,
    ],
    cooldownConfig: {
      errorMessage: "Please wait {TIME} before doing that again.",
      botOwnersBypass: false,
      dbRequired: 300,
    },
  });
});
client.login(TOKEN);

async function checkForChannelsToBeArchived() {
  try {
    console.log("Checking for archiving channels");

    const filteredChannels = channelData.filter((channel) => !channel.archived);

    for (const [i, { channelId, creatorId }] of filteredChannels.entries()) {
      const channel = client.channels.cache.get(channelId);
      const guild = client.guilds.cache.get(channel?.guildId);

      if (!channel) {
        console.log("Channel not found deleting...");

        channelData.splice(i, 1);
        writeChannelData();
        continue;
      }

      const creator = await guild.members.fetch(creatorId).catch(() => null);

      if (creator?.premiumSince) continue;

      const messages = await channel.messages.fetch({ limit: 5 });
      const lastBotMessage = messages.first();

      const lastMessageNotBot = messages.find(
        (message) => message.author.id !== client.user.id
      );

      const messageTimestamp =
        lastMessageNotBot?.createdTimestamp || channel.createdTimestamp;
      const curDate = Date.now();
      const timeToArchive = 1000 * 60 * 2;
      const timeToSendArchiveMessage = 1000 * 60 * 1;

      if (
        messageTimestamp + timeToSendArchiveMessage < curDate &&
        lastBotMessage?.author?.id !== client.user.id
      ) {
        await channel.send(
          `Hey ${
            creator ?? "creator of"
          } the channel is going to be archived soon. If you keep it active, the channel wont be archived `
        );

        continue;
      }

      if (messageTimestamp + timeToArchive < curDate) {
        console.log(`Archiving channel: ${channel.name}`);

        await moveChannel(channel, ARCHIVE_CATEGORY_ID, creatorId);

        channelData[i].archived = true;
        channelData[i].archivedAt = Date.now();
        writeChannelData();
        continue;
      }
    }
  } catch (error) {
    console.log(error);
  }
}

async function checkForChannelsToBeDeleted() {
  console.log("Checking for deleting channels");

  const archiveCategory = client.channels.cache.get(ARCHIVE_CATEGORY_ID);
  const guild = client.guilds.cache.get(archiveCategory.guildId);

  const allChannels = [...archiveCategory.children.cache.values()];

  for (const ch of allChannels) {
    try {
      const i = channelData.findIndex((c) => c.channelId === ch.id);

      if (i === -1) continue;

      const channel = channelData[i];

      const creator = await guild.members
        .fetch(channel.creatorId)
        .catch(() => null);

      if (creator?.premiumSince) continue;

      const messages = await ch.messages.fetch({ limit: 5 });
      const lastBotMessage = messages.first();

      const lastMessageNotBot = messages.find(
        (message) => message.author.id !== client.user.id
      );

      const messageTimestamp =
        lastMessageNotBot?.createdTimestamp || ch.createdTimestamp;
      const content = lastBotMessage.content ?? "";
      const curDate = Date.now();
      const timeToDelete = 1000 * 60 * 4;
      const timeToSendDeleteMessage = 1000 * 60 * 3;

      const hasCrossedLmit =
        messageTimestamp + timeToSendDeleteMessage < curDate;
      const revertChannel = messageTimestamp > channel.archivedAt;
      const isBotMessage =
        lastBotMessage?.author?.id === client.user.id &&
        !content.includes("archived");

      if (revertChannel && !isBotMessage) {
        await moveChannel(ch, channel.parent, channel.creatorId);
        channelData[i].archived = false;
        writeChannelData();
        continue;
      }

      if (hasCrossedLmit && !isBotMessage) {
        await ch.send(
          `Hey ${
            creator ?? "creator of"
          } the channel is going to be deleted soon. If you keep it active, the channel wont be deleted `
        );

        continue;
      }

      if (messageTimestamp + timeToDelete < curDate) {
        console.log(`Deleting channel: ${ch.name}`);

        await ch.delete();

        channelData.splice(i, 1);
        writeChannelData();
        continue;
      }
    } catch (error) {
      console.log(error);
    }
  }
}
