const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('member-stats')
        .setDescription('Fetch stats for a specified Discord user.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Select the Discord user to fetch stats for.')
                .setRequired(true)),
    
    async execute(interaction) {
        await interaction.deferReply(); // Acknowledge the interaction
        const user = interaction.options.getUser('user'); // Get the selected user
        console.log(`User ${interaction.user.id} initiated member-stats command for ${user.id}.`);

        try {
            // Fetch user_id from VATSIM API
            const vatsimData = await fetchVatsimData(user.id);
            if (!vatsimData) {
                await interaction.followUp({ content: "User not found in VATSIM.", ephemeral: false });
                return;
            }

            const cid = vatsimData.user_id;
            console.log(`Fetched CID for user ${user.id}: ${cid}`);

            // Fetch user data from VATCAR API
            const vatcarData = await fetchVatcarData(cid);
            if (!vatcarData) {
                await interaction.followUp({ content: "Failed to fetch user data from VATCAR.", ephemeral: false });
                return;
            }

            // Create and send the embed with user stats
            const statsEmbed = createStatsEmbed(vatcarData.data, user);
            await interaction.followUp({ embeds: [statsEmbed], ephemeral: false });
            console.log(`Stats embed sent for user ${user.id}.`);
            setTimeout(() => interaction.deleteReply(), 15000); // Delete after 15 seconds

        } catch (error) {
            console.error(`Error processing member-stats command for user ${user.id}:`, error);
            await interaction.followUp({ content: "An error occurred while processing your request.", ephemeral: false });
        }
    },
};

// Function to fetch user data from VATSIM API
async function fetchVatsimData(discordUserId) {
    const response = await fetch(`https://api.vatsim.net/v2/members/discord/${discordUserId}`);
    const data = await response.json();
    console.log(`VATSIM API response for user ${discordUserId}:`, data);
    return data.user_id ? data : null; // Return data if user_id exists
}

// Function to fetch user data from VATCAR API
async function fetchVatcarData(cid) {
    const response = await fetch(`https://vatcar.net/public/api/v2/user/${cid}?api_key=${process.env.API_KEY}`);
    const data = await response.json();
    console.log(`VATCAR API response for CID ${cid}:`, data);
    return data.success ? data : null; // Return data if success is true
}

// Function to create the embed for user stats
function createStatsEmbed(vatcarData, user) {
    const { first_name, last_name, fir, visiting_facilities } = vatcarData;
    const fullName = `${first_name} ${last_name}`; // Combine first and last name
    const isInDivision = fir.name_long !== "Academy"; // Check if not in Academy division
    const currentFIR = fir.name_long; // Current FIR name
    const visitingFacilities = visiting_facilities.length > 0 
        ? visiting_facilities.map(facility => facility.fir.name_long).join(', ') 
        : 'None'; // Get names of visiting facilities

    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`${fullName}'s Stats`)
        .setThumbnail(user.displayAvatarURL()) // User's Discord avatar
        .addFields(
            { name: 'CID', value: vatcarData.cid.toString(), inline: true },
            { name: 'Discord ID', value: user.id, inline: true },
            { name: 'Discord Username', value: user.username, inline: true },
            { name: 'Full Name', value: fullName, inline: true }, // Combined name
            { name: 'Current FIR', value: currentFIR, inline: true }, // Updated label
            { name: 'Visiting Facilities', value: visitingFacilities, inline: true } // Updated to show facility names
        )
        .setTimestamp();
}