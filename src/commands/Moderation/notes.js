const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('check-notes')
        .setDescription('Check the training notes for a user.')
        .addUserOption(option => 
            option.setName('student')
                .setDescription('Select the student to check notes for')
                .setRequired(true)),
    async execute(interaction) {
        const student = interaction.options.getUser('student'); // Get the selected student
        const discordId = student.id; // Get the Discord ID of the selected student
        const apiKey = process.env.API_KEY; // Get the API key from the environment variables

        // Fetch the user_id from the VATSIM API using the Discord ID
        const userApiUrl = `https://api.vatsim.net/v2/members/discord/${discordId}`;

        try {
            const userResponse = await fetch(userApiUrl);
            const userData = await userResponse.json();

            if (userData.user_id) {
                const userCid = userData.user_id; // Get the user_id to use as CID
                const apiUrl = `https://vatcar.net/public/api/v2/user/${userCid}/notes?api_key=${apiKey}`;

                const response = await fetch(apiUrl);
                const data = await response.json();

                if (data.success) {
                    // Get the last session
                    const lastNote = data.notes[data.notes.length - 1];

                    // Create an embed
                    const embed = new EmbedBuilder()
                        .setColor('#0099ff')
                        .setTitle('Training Notes')
                        .addFields(
                            { name: 'Instructor Name', value: lastNote.instructor_name, inline: true },
                            { name: 'Instructor CID', value: lastNote.instructor_cid.toString(), inline: true },
                            { name: 'Student CID', value: lastNote.user_cid.toString(), inline: true },
                            { name: 'Date of Session', value: lastNote.friendly_time, inline: true },
                            { name: 'Training Note', value: lastNote.training_note, inline: false },
                            { name: 'Created At', value: new Date(lastNote.created_at).toLocaleString(), inline: true },
                        );

                    // Include updated_at if it exists and is different from created_at
                    if (lastNote.updated_at && lastNote.updated_at !== lastNote.created_at) {
                        embed.addFields({ name: 'Updated At', value: new Date(lastNote.updated_at).toLocaleString(), inline: true });
                    }

                    // Include position trained
                    embed.addFields({ name: 'Position Trained', value: lastNote.position_trained, inline: true });

                    await interaction.reply({ embeds: [embed], ephemeral: true });
                } else {
                    console.error(`Failed to retrieve notes for User CID: ${userCid}. Response: ${JSON.stringify(data)}`);
                    await interaction.reply({ content: 'Failed to retrieve notes. Please check the User CID and try again.', ephemeral: true });
                }
            } else {
                console.error(`Failed to retrieve user ID for Discord ID: ${discordId}. Response: ${JSON.stringify(userData)}`);
                await interaction.reply({ content: 'Failed to retrieve user information. The user Discord account may not be linked with VATSIM yet. Please check notes manually on VATCAR website.', ephemeral: true });
            }
        } catch (error) {
            console.error('Error fetching notes:', error);
            await interaction.reply({ content: 'An error occurred while fetching the notes. Please try again later.', ephemeral: true });
        }
    },
};
