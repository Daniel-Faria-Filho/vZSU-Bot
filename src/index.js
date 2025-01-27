const { createTranscript } = require('discord-html-transcripts');
require ("dotenv").config ({debug:true});
const { Client, GatewayIntentBits, PermissionsBitField, Permissions, Partials, MessageManager, Embed, Collection, ActivityType, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events, ChannelType, ButtonBuilder, ActionRowBuilder, ButtonStyle, DefaultDeviceProperty } = require('discord.js');
const cors = require('cors');
const fs = require('fs');
const path = require('path');






const client = new Client({
    intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildPresences,
GatewayIntentBits.DirectMessages,
GatewayIntentBits.DirectMessageTyping,
GatewayIntentBits.DirectMessageReactions,
    ], partials: [Partials.Message, Partials.Channel, Partials.Reaction] });

client.commands = new Collection();

// Define the functions variable
const functions = fs.readdirSync(path.join(__dirname, 'functions')).filter(file => file.endsWith('.js'));

// Define the eventFiles variable
const eventFiles = fs.readdirSync(path.join(__dirname, 'events')).filter(file => file.endsWith('.js'));

// Define the commandFolders variable
const commandFolders = fs.readdirSync(path.join(__dirname, 'commands')); // Assuming commands are in a 'commands' directory

//COMMAND VARIABLES:
(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./src/events");
    client.handleCommands(commandFolders, "./src/commands");
    client.login(process.env.CLIENT_TOKEN)
})();



client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const args = interaction.customId.split('_');
    const command = args.shift();

    if (command === 'acceptTraining') {
        if (!interaction.member._roles.includes('1260981475369554004') ){
            interaction.reply({content: 'This command is for staff only!!', ephemeral: true })
            return;
       
        }
        
        
        const user = await client.users.fetch(args[0]);

        
        try {
        
            await user.send(`Hello!! I am FlyAway Bot from Fly Away Virtual Flight School! A member of the Training Staff has accepted your training session and is ready to go when you are. Join https://discord.com/channels/1119458052886769679/1119458646842163281 when you are ready to start your session.`);
            interaction.reply({content: `Hello ${interaction.user} the Training Session has been accepted successfully! ${user} has been notified via a Direct Message and should join the Training Waiting Room soon. If he does not join after a little bit, Please DM him and ask if there was a mistake.  `, ephemeral: true })
        interaction.message.delete ()
        } catch (error) {
        
            // DMs are closed :(
        }
    }
});

// Command For Show Training

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const args = interaction.customId.split('_');
    const command = args.shift();

    if (command === 'acceptAvailablility') {
        if (interaction.member._roles.includes('1260981475369554004') ){
            interaction.reply({content: 'Training staff can not accept training session availablity from other staff!!', ephemeral: true })
            return;
       
        }
        
        
        const user = await client.users.fetch(args[0]);

        
        try {
        
            await user.send(`Hello!! I am FlyAway Bot from Fly Away Virtual Flight School! **${interaction.user.tag}** has accepted your Training Session Availablility and is ready to go when you are. Join a **Training Room** drag the student in when you are ready to start. **Remember to see if the student has any past student reports. Good luck**!!`);
            interaction.reply({content: `Hello ${interaction.user} the Training Session has been accepted successfully! ${user} has been notified via a Direct Message and should drag you in soon when ready to start. If the your vCFI does not join after a little bit, Please DM him and ask if there was a mistake.  `, ephemeral: true })
        interaction.message.delete ()
        } catch (error) {
        
            // DMs are closed :(
        }
    }
});


//Button For Verify Hours

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    const args = interaction.customId.split('_');
    const command = args.shift();

    if (command === 'hours') {      
    }
});

// Forum channel IDs
const forumChannels = ['1289283910240309321', '1296599166906138654'];

client.on('threadCreate', async (thread) => {
    // Check if the new thread is created in one of the forum channels
    if (forumChannels.includes(thread.parentId)) {
        // Add a 10-second delay before replying
        setTimeout(async () => {
            try {
                // Reply to the user who created the thread (starterMessage.author)
                const starterMessage = await thread.fetchStarterMessage(); // Fetch the original post
                if (starterMessage) {
                    await starterMessage.reply("Thanks for your request, we will accommodate as soon as possible.");
                }
            } catch (error) {
                console.error('Error replying to the thread:', error);
            }
        }, 10000); // 10-second delay (10000 milliseconds)
    }
});

// vCFI promotion

const vCFI_ROLE_ID = '1260981475369554004'; // ID of the vCFI role
const promotionsChannelId = '1264403466457972839'; // ID of the promotions channel

client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    // No action needed if the vCFI role was removed

    // Check if the vCFI role was added
    if (!oldMember.roles.cache.has(vCFI_ROLE_ID) && newMember.roles.cache.has(vCFI_ROLE_ID)) {
        // The vCFI role was added
        const user = newMember.user;

        try {
            // Fetch the promotions channel
            const channel = await newMember.guild.channels.fetch(promotionsChannelId);

            // Send the congratulatory message
            await channel.send(`Let's congratulate ${user} with their recent promotion to vCFI 🎉`);

            console.log(`User ${user.tag} has successfully been promoted to vCFI and has been announced in the promotion channel.`);
        
        } catch (error) {
            console.error('Error sending promotion announcement:', error);
        }
    }
  });





const PORT = process.env.PORT || 3001;