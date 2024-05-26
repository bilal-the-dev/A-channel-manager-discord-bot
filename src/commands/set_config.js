const fs = require("fs");
const path = require("path");
const { CommandType } = require("wokcommands");
const {
  handleInteractionError,
  replyOrEditInteraction,
} = require("../utils/interaction");
const { PermissionFlagsBits } = require("discord.js");
const categoryData = require("./../../data/categoryData.json");

module.exports = {
  description: "Configure the categories",
  type: CommandType.SLASH,
  guildOnly: true,
  // permissions: [PermissionFlagsBits.Administrator],
  options: [
    {
      name: "category_1",
      description: "select the first category you wanna create a channel in",
      type: 7,
      required: true,
    },
    {
      name: "category_2",
      description: "select the second category you wanna create a channel in",
      type: 7,
      required: true,
    },
  ],
  callback: async ({ interaction }) => {
    const { options } = interaction;
    try {
      await interaction.deferReply({ ephemeral: true });

      const categoryOne = options.getChannel("category_1");
      const categoryTwo = options.getChannel("category_2");

      const { type: typeOne, id: oneId } = categoryOne;
      const { type: typeTwo, id: twoId } = categoryTwo;

      if (typeOne !== 4 || typeTwo !== 4)
        throw new Error("Please select a actual category");

      categoryData.data = [oneId, twoId];

      fs.writeFileSync(
        path.join(__dirname, "..", "..", "data/categoryData.json"),
        JSON.stringify(categoryData)
      );

      await replyOrEditInteraction(
        interaction,
        `Successfully set the configuration.`
      );
    } catch (err) {
      await handleInteractionError(err, interaction);
    }
  },
};
