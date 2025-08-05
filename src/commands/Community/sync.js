const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sync')
        .setDescription('Sync your Discord account with VATSIM and assign roles.'),
    async execute(interaction) {
        await interaction.deferReply(); // Acknowledge the interaction
        console.log(`User ${interaction.user.id} initiated sync command.`);

        const discordUserId = interaction.user.id;
        const apiKey = process.env.API_KEY;
        const facility = process.env.FACILITY_NAME
        const ATM = process.env.FACILITY_AIR_TRAFFIC_MANAGER_DISCORD_ID; // The user ID to send the DM to

        try {
            // Fetch user_id from VATSIM API
            const vatsimResponse = await fetch(`https://api.vatsim.net/v2/members/discord/${discordUserId}`);
            const vatsimData = await vatsimResponse.json();
            console.log(`VATSIM API response for user ${discordUserId}:`, vatsimData);

            if (!vatsimData.user_id) {
                console.log(`User ${discordUserId} not found in VATSIM.`);
                const reply = await interaction.editReply({ content: "Please sync your Discord with the [VATSIM Community Hub](https://community.vatsim.net/settings) Discord Settings. Once you are synced, please try again.", ephemeral: true });
                setTimeout(() => reply.delete(), 30000); // Delete after 30 seconds
                
                // Notify the Facility Web Master about the VATSIM user not found
                const webMasterId = process.env.FACILITY_WEB_MASTER_DISCORD_ID; // Get the Web Master ID
                const webMasterUser = await interaction.client.users.fetch(webMasterId); // Fetch the user by ID
                const vatsimErrorEmbed = new EmbedBuilder()
                    .setColor('#ffcc00') // Yellow color for warning
                    .setTitle('VATSIM User Not Found')
                    .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                    .addFields(
                        { name: 'Discord ID', value: discordUserId, inline: true },
                        { name: 'Username', value: interaction.user.username, inline: true },
                        { name: 'Channel', value: interaction.channel.name, inline: true },
                        { name: 'Message', value: 'The user was not found in the VATSIM database. Please ensure they have linked their Discord account properly.', inline: true }
                    )
                    .setTimestamp();
                await webMasterUser.send({ embeds: [vatsimErrorEmbed] }); // Send the embed as a DM
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
                setTimeout(() => reply.delete(), 30000); // Delete after 30 seconds
                
                // Notify the Facility Web Master about the VATCAR fetch failure
                const webMasterId = process.env.FACILITY_WEB_MASTER_DISCORD_ID; // Get the Web Master ID
                const webMasterUser = await interaction.client.users.fetch(webMasterId); // Fetch the user by ID
                const vatcarErrorEmbed = new EmbedBuilder()
                    .setColor('#ffcc00') // Yellow color for warning
                    .setTitle('VATCAR Data Fetch Failed')
                    .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                    .addFields(
                        { name: 'Discord ID', value: discordUserId, inline: true },
                        { name: 'Username', value: interaction.user.username, inline: true },
                        { name: 'Channel', value: interaction.channel.name, inline: true },
                        { name: 'Message', value: 'The user data could not be retrieved from VATCAR. Please check their account status.', inline: true }
                    )
                    .setTimestamp();
                await webMasterUser.send({ embeds: [vatcarErrorEmbed] }); // Send the embed as a DM
                return;
            }

            const { first_name, last_name, fir, visiting_facilities } = vatcarData.data;
            const nickname = `${first_name} ${last_name} - ${cid}`;
            console.log(`Setting nickname for user ${discordUserId}: ${nickname}`);

            // Role assignment logic
            const rolesToAssign = [];
            const isHomeController = fir && fir.name_short === facility;
            const isVisitingController = visiting_facilities.some(f => f.fir.name_short === facility);

            // Get neighboring facilities array and clean up any whitespace
            const neighboringFacilities = process.env.NEIGHBORING_FACILITIES.split(',').map(f => f.trim());
            console.log(`Checking neighboring facilities: ${neighboringFacilities.join(', ')}`);

            // Check for neighboring facility affiliation
            const isNeighboringController = (
                (vatcarData.data.fir && neighboringFacilities.includes(vatcarData.data.fir.name_short)) ||
                vatcarData.data.visiting_facilities.some(f => neighboringFacilities.includes(f.fir.name_short))
            );

            // Debug log the VATCAR data
            console.log(`VATCAR data for ${interaction.user.tag}:`, {
                homeFIR: vatcarData.data.fir?.name_short,
                visitingFIRs: vatcarData.data.visiting_facilities.map(f => f.fir.name_short),
                neighboringFacilities
            });

            // Always add VATSIM User role
            rolesToAssign.push(process.env.NORMAL_VATSIM_USER_ROLE_ID);

            if (isHomeController) {
                rolesToAssign.push(process.env.HOME_CONTROLLER_ROLE_ID);
                console.log(`Assigning roles for home controller: ${rolesToAssign}`);
                if (isNeighboringController) {
                    console.log(`Skipping Neighboring Controller role - User is already a home controller`);
                }
            } else if (isVisitingController) {
                rolesToAssign.push(process.env.VISITING_CONTROLLER_ROLE_ID);
                console.log(`Assigning roles for visiting controller: ${rolesToAssign}`);
                if (isNeighboringController) {
                    console.log(`Skipping Neighboring Controller role - User is already a visiting controller`);
                }
            } else if (isNeighboringController) {
                rolesToAssign.push(process.env.NEIGHBORING_CONTROLLER_ROLE_ID);
                const neighboringFacility = vatcarData.data.fir?.name_short || 
                    vatcarData.data.visiting_facilities.find(f => 
                        neighboringFacilities.includes(f.fir.name_short)
                    )?.fir.name_short;
                
                console.log(`Adding Neighboring Controller role for ${interaction.user.tag} (${neighboringFacility} controller)`);
            } else {
                console.log(`Assigning only VATSIM User role: ${rolesToAssign}`);
            }

            // Assign VATSIM User role first
            await interaction.member.roles.add(rolesToAssign[0]); // Add VATSIM User role first

            const hasHomeOrVisitingControllerRole = interaction.member.roles.cache.some(role => role.id === process.env.HOME_CONTROLLER_ROLE_ID || role.id === process.env.VISITING_CONTROLLER_ROLE_ID); // Use the environment variable for Home or Visiting Controller role

            // Attempt to set the nickname if the user does not have the Home or Visiting Controller role
            if (!hasHomeOrVisitingControllerRole) {
                try {
                    await interaction.member.setNickname(nickname);
                    console.log(`Nickname updated for user ${discordUserId}.`);
                } catch (error) {
                    console.error(`Failed to update nickname for user ${discordUserId}:`, error);
                    // Log the error but do not stop the bot
                }
            } else {
                console.log(`User ${discordUserId} already has the Home or Visiting Controller role; skipping nickname update.`);
            }

            // If Home or Visiting Controller role is assigned, wait 5 seconds before adding it
            if (rolesToAssign.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for 5 seconds
                await interaction.member.roles.add(rolesToAssign[1]); // Add Home or Visiting Controller role
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

            const userRating = ratingData.rating; // Get the rating from the API response
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
                6: "C2",
                7: "C3",
                8: "I1",
                9: "I2",
                10: "I3",
                11: "SUP",
                12: "ADM",
            };

            // Fetch role names instead of IDs
            const roleNames = rolesToAssign.map(roleId => {
                const role = interaction.guild.roles.cache.get(roleId);
                return role ? role.name : `Unknown Role (${roleId})`; // Fallback if role is not found
            }).join(', ');

            // Log the successful sync by sending a DM to the specified user
            const targetUser = await interaction.client.users.fetch(ATM); // Fetch the user by ID
            const embed = new EmbedBuilder() // Use EmbedBuilder
                .setColor('#0099ff')
                .setTitle('User Sync Successful')
                .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                .addFields(
                    { name: 'Discord ID', value: discordUserId, inline: true },
                    { name: 'CID', value: cid, inline: true },
                    { name: 'Name', value: `${first_name} ${last_name}`, inline: true },
                    { name: 'Rating', value: ratingNames[userRating] || 'Unknown', inline: true },
                    { name: 'Roles Added', value: roleNames || 'None', inline: true }
                )
                .setTimestamp();

            await targetUser.send({ embeds: [embed] }); // Send the embed as a DM

            const reply = await interaction.editReply({ content: "Roles assigned and nickname updated successfully.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000); // Delete after 30 seconds
        } catch (error) {
            console.error(`Error processing sync command for user ${discordUserId}:`, error);
            
            // Create an embed for the error message
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000') // Red color for error
                .setTitle('User Sync Error')
                .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                .addFields(
                    { name: 'Discord ID', value: discordUserId, inline: true },
                    { name: 'Username', value: interaction.user.username, inline: true },
                    { name: 'Channel', value: interaction.channel.name, inline: true },
                    { name: 'Error Message', value: error.message || 'Unknown error', inline: true }
                )
                .setTimestamp();

            // Send the error embed to the Facility Web Master
            const webMasterId = process.env.FACILITY_WEB_MASTER_DISCORD_ID; // Get the Web Master ID
            const webMasterUser = await interaction.client.users.fetch(webMasterId); // Fetch the user by ID
            await webMasterUser.send({ embeds: [errorEmbed] }); // Send the embed as a DM

            const reply = await interaction.editReply({ content: "An error occurred while processing your request.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000); // Delete after 30 seconds
        }
    },
}; 