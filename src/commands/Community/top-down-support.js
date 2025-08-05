const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const requestingPositionChoices = process.env.REQUESTING_POSITION_OPTIONS.split(',').map(option => ({
    name: option.trim(),
    value: option.trim(),
}));

const currentPositionChoices = process.env.CURRENT_POSITION_OPTIONS.split(',').map(option => ({
    name: option.trim(),
    value: option.trim(),
}));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('top-down-support')
        .setDescription('Request top-down support.')
        .addStringOption(option => 
            option.setName('requesting_position')
                .setDescription('Select the position you are requesting support for')
                .addChoices(...requestingPositionChoices)
                .setRequired(true))
        .addStringOption(option => 
            option.setName('current_position')
                .setDescription('Select your current position')
                .addChoices(...currentPositionChoices)
                .setRequired(true)),
    async execute(interaction) {
        const requestingPosition = interaction.options.getString('requesting_position');
        const currentPosition = interaction.options.getString('current_position');
        const user = interaction.user; // Get the user who invoked the command
        const requestTime = new Date().toLocaleString(); // Get the current time

        // Create an embed
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Top-Down Support Request')
            .setDescription(`${user} is looking for top-down support!
                `)
            .addFields(
                { name: 'Their Current Position:', value: currentPosition, inline: false },
                { name: 'Requesting Support Position:', value: requestingPosition, inline: false },
                { name: 'Request Time:', value: requestTime, inline: false }
            )
            .setThumbnail(user.displayAvatarURL()); // Set the user's profile picture as thumbnail

        await interaction.reply({ embeds: [embed], ephemeral: false }); // Send embed to everyone
    },
};
