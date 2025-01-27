const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('synctest')
        .setDescription('Test sync for a specific Discord user ID.')
        .addStringOption(option =>
            option.setName('discord_id')
                .setDescription('The Discord ID of the user to test.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply(); // Acknowledge the interaction
        console.log(`User ${interaction.user.id} initiated synctest command.`);

        const discordUserId = interaction.options.getString('discord_id');
        const apiKey = process.env.API_KEY;
        const facility = process.env.FACILITY_NAME;
        const WM = process.env.FACILITY_WEB_MASTER_DISCORD_ID;

        try {
            // Fetch user_id from VATSIM API
            const vatsimResponse = await fetch(`https://api.vatsim.net/v2/members/discord/${discordUserId}`);
            const vatsimData = await vatsimResponse.json();
            console.log(`VATSIM API response for user ${discordUserId}:`, vatsimData);

            if (!vatsimData.user_id) {
                console.log(`User ${discordUserId} not found in VATSIM.`);
                const reply = await interaction.editReply({ content: "This Discord ID is not synced with the [VATSIM Community Hub](https://community.vatsim.net/settings) Discord Settings.", ephemeral: true });
                setTimeout(() => reply.delete(), 30000);
                return;
            }

            const cid = vatsimData.user_id;
            console.log(`Fetched CID for user ${discordUserId}: ${cid}`);

            // Fetch user data from VATCAR API
            const vatcarResponse = await fetch(`https://vatcar.net/public/api/v2/user/${cid}?api_key=${apiKey}`);
            const vatcarData = await vatcarResponse.json();
            console.log(`VATCAR API response for CID ${cid}:`, vatcarData);

            if (!vatcarData.success) {
                console.log(`Failed to fetch VATCAR data for CID ${cid}.`);
                const reply = await interaction.editReply({ content: "Please log in with your Discord on the [VATCAR website](https://vatcar.net/public/auth/login) and go to My VATCAR > Integrations then try again. If the issue persists, contact Senior Staff.", ephemeral: true });
                setTimeout(() => reply.delete(), 30000);
                return;
            }

            const { first_name, last_name, fir, visiting_facilities } = vatcarData.data;
            const nickname = `${first_name} ${last_name} - ${cid}`;
            console.log(`Setting nickname for user ${discordUserId}: ${nickname}`);

            // Role assignment logic
            const rolesToAssign = [];
            if (fir && fir.name_short === `${facility}`) {
                rolesToAssign.push(process.env.NORMAL_VATSIM_USER_ROLE_ID);
                rolesToAssign.push(process.env.VISITING_OR_HOME_CONTROLLER_ROLE_ID);
                console.log(`Assigning roles for home controller: ${rolesToAssign}`);
            } else if (visiting_facilities.length > 0) {
                rolesToAssign.push(process.env.VATSIM_USER_ROLE_ID);
                console.log(`Assigning roles for visiting facilities: ${rolesToAssign}`);
            } else {
                rolesToAssign.push(process.env.VATSIM_USER_ROLE_ID);
                console.log(`Assigning only VATSIM User role: ${rolesToAssign}`);
            }

            // Assign VATSIM User role first
            await interaction.member.roles.add(rolesToAssign[0]);

            const hasHomeOrVisitingControllerRole = interaction.member.roles.cache.some(role => role.id === process.env.VISITING_OR_HOME_CONTROLLER_ROLE_ID);

            // Attempt to set the nickname if the user does not have the Home or Visiting Controller role
            if (!hasHomeOrVisitingControllerRole) {
                try {
                    await interaction.member.setNickname(nickname);
                    console.log(`Nickname updated for user ${discordUserId}.`);
                } catch (error) {
                    console.error(`Failed to update nickname for user ${discordUserId}:`, error);
                }
            } else {
                console.log(`User ${discordUserId} already has the Home or Visiting Controller role; skipping nickname update.`);
            }

            // If Home or Visiting Controller role is assigned, wait 5 seconds before adding it
            if (rolesToAssign.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                await interaction.member.roles.add(rolesToAssign[1]);
                console.log(`Home or Visiting Controller role added for user ${discordUserId}.`);
            }

            // Fetch user rating from the new API
            const ratingResponse = await fetch(`https://api.vatsim.net/v2/members/${cid}`);
            const ratingData = await ratingResponse.json();
            console.log(`Rating API response for user ${cid}:`, ratingData);

            // Determine the rating role based on the rating value
            const ratingRoles = {
                1: process.env.OBS_ROLE_ID,
                2: process.env.S1_ROLE_ID,
                3: process.env.S2_ROLE_ID,
                4: process.env.S3_ROLE_ID,
                5: process.env.C1_ROLE_ID,
                6: process.env.C3_ROLE_ID,
                7: process.env.I1_ROLE_ID,
                8: process.env.I3_ROLE_ID,
                9: process.env.SUP_ROLE_ID,
                10: process.env.ADM_ROLE_ID,
            };

            const userRating = ratingData.rating;
            console.log(`User ${discordUserId} has a rating of: ${userRating}`);

            // Assign the rating role if it exists
            if (userRating in ratingRoles) {
                await interaction.member.roles.add(ratingRoles[userRating]);
                console.log(`Assigned role for rating ${userRating} to user ${discordUserId}.`);
            } else {
                console.log(`No role found for rating ${userRating} for user ${discordUserId}.`);
            }

            // Mapping of rating numbers to their corresponding names
            const ratingNames = {
                1: "OBS",
                2: "S1",
                3: "S2",
                4: "S3",
                5: "C1",
                6: "C3",
                7: "I1",
                8: "I3",
                9: "SUP",
                10: "ADM",
            };

            // Fetch role names instead of IDs
            const roleNames = rolesToAssign.map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? role.name : `Unknown Role (${roleId})`;
            }).join(', ');

            // Log the successful sync by sending a DM to the specified user
            const targetUser = await interaction.client.users.fetch(WM);
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('User Sync Successful')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: 'Discord ID', value: discordUserId, inline: true },
                    { name: 'CID', value: cid, inline: true },
                    { name: 'Name', value: `${first_name} ${last_name}`, inline: true },
                    { name: 'Rating', value: ratingNames[userRating] || 'Unknown', inline: true },
                    { name: 'Roles Added', value: roleNames || 'None', inline: true }
                )
                .setTimestamp();

            await targetUser.send({ embeds: [embed] });

            const reply = await interaction.editReply({ content: "Roles assigned and nickname updated successfully.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000);
        } catch (error) {
            console.error(`Error processing synctest command for user ${discordUserId}:`, error);
            const reply = await interaction.editReply({ content: "An error occurred while processing your request.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000);
        }
    },
}; 