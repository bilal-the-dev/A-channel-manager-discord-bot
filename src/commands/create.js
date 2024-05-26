const fs = require("fs");
const { CommandType } = require("wokcommands");
const {
  handleInteractionError,
  replyOrEditInteraction,
} = require("../utils/interaction");
const categoryData = require("./../../data/categoryData.json");
const { channelMention } = require("discord.js");
const { createChannel, writeChannelData } = require("../utils/channel");
const channelData = require("./../../data/channelData.json");

module.exports = {
  description: "Create a new Channel",
  type: CommandType.SLASH,

  options: [
    {
      name: "category",
      description: "select the category you wanna create a channel in",
      type: 7,
      required: true,
    },
  ],
  callback: async ({ interaction }) => {
    const { options, user, guild, member } = interaction;
    try {
      await interaction.deferReply({ ephemeral: true });
      const category = options.getChannel("category");

      const { type, id, children } = category;

      if (type !== 4) throw new Error("Please select a category");

      const wrongCatReply = `Make sure the category is either ${channelMention(
        categoryData.data[0]
      )} or ${channelMention(categoryData.data[1])}`;

      if (!categoryData.data.includes(id))
        return await replyOrEditInteraction(interaction, wrongCatReply);

      if (children.cache.size === 50)
        throw new Error("The channel limit has been hit please contact staff");

      const alreadyCreatedChannels = channelData.filter(
        (c) => c.creatorId === user.id
      );

      const limit = member.premiumSince ? 3 : 2;

      if (alreadyCreatedChannels.length >= limit)
        throw new Error("Your channel creation limit has been hit");
      const createdCh = await createChannel(guild, id, user);

      channelData.push({
        channelId: createdCh.id,
        creatorId: user.id,
        parent: id,
      });

      writeChannelData();

      await replyOrEditInteraction(
        interaction,
        `Here's  your channel ${createdCh}`
      );
    } catch (err) {
      await handleInteractionError(err, interaction);
    }
  },
};
