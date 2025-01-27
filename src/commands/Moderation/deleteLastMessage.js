const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete the last message sent by the bot.'),
    async execute(interaction) {
        // Fetch the last 10 messages in the channel
        const messages = await interaction.channel.messages.fetch({ limit: 10 });
        
        // Find the last message sent by the bot
        const botMessage = messages.find(msg => msg.author.id === interaction.client.user.id);

        if (botMessage) {
            // Delete the last bot message
            await botMessage.delete();
            return interaction.reply({ content: "The last message sent by the bot has been deleted.", ephemeral: true });
        } else {
            return interaction.reply({ content: "No messages found from the bot to delete.", ephemeral: true });
        }
    },
}; 