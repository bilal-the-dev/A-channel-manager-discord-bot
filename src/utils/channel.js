const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

const channelData = require("./../../data/channelData.json");

const createChannel = async (guild, parent, user) =>
  await guild.channels.create({
    name: user.username,
    parent,
    permissionOverwrites: [
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ManageChannels, // Allow the user to manage the channel
          PermissionsBitField.Flags.ManageMessages, // Allow the user to pin and unpin messages
        ],
      },
    ],
  });
const moveChannel = async (channel, parent, creatorId) => {
  await channel.setParent(parent);

  await channel.permissionOverwrites.create(creatorId, {
    ManageMessages: true,
    ManageChannels: true,
    ViewChannel: true,
  });
};
const writeChannelData = () => {
  fs.writeFile(
    path.join(__dirname, "..", "..", "data/channelData.json"),
    JSON.stringify(channelData),
    (err) => {
      if (err) console.log(err);
    }
  );
};

module.exports = { createChannel, writeChannelData, moveChannel };
