module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        const { commands } = client;
        const { commandName } = interaction;
        const command = commands.get(commandName);
        if (!command) return;

        if (
          command.owner === true &&
          interaction.user.id !== "691506668781174824"
        ) {
          await interaction.reply({
            content: "This command is only for the bot owner!",
            ephemeral: true,
          });
          return;
        }
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id || null;
        await command.execute(interaction, client, { userId, guildId });
      }
    } catch (error) {
      const cmd = interaction.commandName || interaction.customId || "unknown";

      console.error(`[ERROR] In interaction handler for ${cmd}:`, error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction
          .reply({
            content: "Error executing command.",
            ephemeral: true,
          })
          .catch((err) => console.error("💥 Failed to send error reply:", err));
      }
    }
  },
};
