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
                const reply = await interaction.editReply({ content: "Please sync your Discord with the [VATSIM Community Hub](https://community.vatsim.net/settings) Discord Settings. Once you are synced, please try again. If the issue persists, contact Senior Staff.", ephemeral: true });
                setTimeout(() => reply.delete(), 30000);

                // Notify the Facility Web Master about the VATSIM user not found
                const webMasterUser = await interaction.client.users.fetch(WM); // Fetch the user by ID
                const vatsimErrorEmbed = new EmbedBuilder()
                    .setColor('#ffcc00') // Yellow color for warning
                    .setTitle('VATSIM User Not Found')
                    .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                    .addFields(
                        { name: 'Discord ID', value: discordUserId, inline: true },
                        { name: 'Username', value: interaction.user.username, inline: true }, // Include username
                        { name: 'Channel', value: interaction.channel.name, inline: true }, // Include channel name
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
                setTimeout(() => reply.delete(), 30000);

                // Notify the Facility Web Master about the VATCAR fetch failure
                const webMasterUser = await interaction.client.users.fetch(WM); // Fetch the user by ID
                const vatcarErrorEmbed = new EmbedBuilder()
                    .setColor('#ffcc00') // Yellow color for warning
                    .setTitle('VATCAR Data Fetch Failed')
                    .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                    .addFields(
                        { name: 'Discord ID', value: discordUserId, inline: true },
                        { name: 'Username', value: interaction.user.username, inline: true }, // Include username
                        { name: 'Channel', value: interaction.channel.name, inline: true }, // Include channel name
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

            // Get neighboring facilities array from env (trim spaces and split by comma)
            const neighboringFacilities = process.env.NEIGHBORING_FACILITIES.split(',').map(f => f.trim());

            // Check if user is affiliated with any neighboring facility
            const isNeighboringController = (fir && neighboringFacilities.includes(fir.name_short)) || 
                                           visiting_facilities.some(f => neighboringFacilities.includes(f.fir.name_short));

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
            } else {
                // Only add Neighboring Controller role if they're not a home/visiting controller
                if (isNeighboringController) {
                    rolesToAssign.push(process.env.NEIGHBORING_CONTROLLER_ROLE_ID);
                    const affiliatedFacilities = [
                        ...(fir && neighboringFacilities.includes(fir.name_short) ? [fir.name_short] : []),
                        ...visiting_facilities
                            .filter(f => neighboringFacilities.includes(f.fir.name_short))
                            .map(f => f.fir.name_short)
                    ];
                    console.log(`Adding Neighboring Controller role for ${affiliatedFacilities.join(', ')} affiliation`);
                } else {
                    console.log(`Assigning only VATSIM User role: ${rolesToAssign}`);
                }
            }

            // Assign roles to the specified user
            await interaction.guild.members.fetch(discordUserId).then(member => {
                member.roles.add(rolesToAssign);
                console.log(`Roles assigned to user ${discordUserId}.`);
            });

            const hasHomeOrVisitingControllerRole = interaction.member.roles.cache.some(role => role.id === process.env.HOME_CONTROLLER_ROLE_ID || role.id === process.env.VISITING_CONTROLLER_ROLE_ID);

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

            // Assign the rating role to the specified user if it exists
            if (userRating in ratingRoles) {
                await interaction.guild.members.fetch(discordUserId).then(member => {
                    member.roles.add(ratingRoles[userRating]);
                    console.log(`Assigned rating role for rating ${userRating} to user ${discordUserId}.`);
                });
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
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Test User Sync Successful')
                .setThumbnail(interaction.user.displayAvatarURL())
                .addFields(
                    { name: 'Discord ID', value: discordUserId, inline: true },
                    { name: 'CID', value: cid, inline: true },
                    { name: 'Name', value: `${first_name} ${last_name}`, inline: true },
                    { name: 'Rating', value: ratingNames[userRating] || 'Unknown', inline: true },
                    { name: 'Roles Added', value: roleNames || 'None', inline: true }
                )
                .setTimestamp();

            // Notify the Facility Web Master about the successful operation
            const webMasterUser = await interaction.client.users.fetch(WM); // Fetch the user by ID
            await webMasterUser.send({ embeds: [embed] }); // Send the embed as a DM

            const reply = await interaction.editReply({ content: "Roles assigned and nickname updated successfully.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000);
        } catch (error) {
            console.error(`Error processing synctest command for user ${discordUserId}:`, error);
            
            // Create an embed for the error message
            const errorEmbed = new EmbedBuilder()
                .setColor('#ff0000') // Red color for error
                .setTitle('User Sync Error')
                .setThumbnail(interaction.user.displayAvatarURL()) // Set the user's avatar as the thumbnail
                .addFields(
                    { name: 'Discord ID', value: discordUserId, inline: true },
                    { name: 'Username', value: interaction.user.username, inline: true }, // Include username
                    { name: 'Channel', value: interaction.channel.name, inline: true }, // Include channel name
                    { name: 'Error Message', value: error.message || 'Unknown error', inline: true }
                )
                .setTimestamp();

            // Send the error embed to the Facility Web Master
            const webMasterUser = await interaction.client.users.fetch(WM); // Fetch the user by ID
            await webMasterUser.send({ embeds: [errorEmbed] }); // Send the embed as a DM

            const reply = await interaction.editReply({ content: "An error occurred while processing your request.", ephemeral: true });
            setTimeout(() => reply.delete(), 30000);
        }
    },
}; 