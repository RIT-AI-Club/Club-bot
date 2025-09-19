module.exports = async (client) => {
  const channelId = "1418441518330417203";
  const channel = client.channels.cache.get(channelId);

  if (channel) {
    await channel.send(`${client.user.tag} is online`);
  } else {
    console.error(`Channel with ID ${channelId} not found.`);
  }
};
