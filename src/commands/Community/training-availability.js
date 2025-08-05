const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('training-availability')
    .setDescription('Post your training availability')
    .addStringOption(option =>
      option.setName('start-time')
        .setDescription('When you will be available (e.g., 2:30 PM)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('end-time')
        .setDescription('When you will stop being available (e.g., 5:00 PM)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('training-type')
        .setDescription('What type of training you can provide')
        .setRequired(true)
                .addChoices(
          { name: 'Ground Only', value: 'ground' },
          { name: 'Tower or Ground', value: 'tower_ground' },
          { name: 'Approach, Tower, or Ground', value: 'approach_tower_ground' },
          { name: 'Center, Approach, Tower, or Ground', value: 'center_approach_tower_ground' }
        ))
    .addStringOption(option =>
      option.setName('timezone')
        .setDescription('Your timezone')
        .setRequired(true)
        .addChoices(
          { name: 'Eastern Time (ET)', value: 'ET' },
          { name: 'Central Time (CT)', value: 'CT' },
          { name: 'Mountain Time (MT)', value: 'MT' },
          { name: 'Pacific Time (PT)', value: 'PT' },
          { name: 'Alaska Time (AKT)', value: 'AKT' },
          { name: 'Hawaii-Aleutian Time (HAT)', value: 'HAT' },
          { name: 'Atlantic Time (AT)', value: 'AT' },
          { name: 'UTC/GMT', value: 'UTC' }
        )),
  async execute(interaction) {
    const startTime = interaction.options.getString('start-time');
    const endTime = interaction.options.getString('end-time');
    const trainingType = interaction.options.getString('training-type');
    const timezone = interaction.options.getString('timezone');

    // Helper function to parse time strings
    function parseTime(timeStr) {
      // Remove any extra spaces and convert to lowercase
      timeStr = timeStr.trim().toLowerCase();
      
      // Handle common time formats
      let hours, minutes, period;
      
      // Match patterns like "2:30 PM", "14:30", "2 PM", "2:30pm"
      const timePattern = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/;
      const match = timeStr.match(timePattern);
      
      if (match) {
        hours = parseInt(match[1]);
        minutes = match[2] ? parseInt(match[2]) : 0;
        period = match[3];
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
        } else if (period === 'am' && hours === 12) {
          hours = 0;
        }
        
        return { hours, minutes };
      }
      
      // If no match, try to parse as 24-hour format
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
        return { hours, minutes };
      }
      
      throw new Error(`Invalid time format: ${timeStr}. Please use formats like "2:30 PM", "14:30", or "2 PM"`);
    }

    try {
      const startTimeParsed = parseTime(startTime);
      const endTimeParsed = parseTime(endTime);
      
             // Create timestamps for today only
       const now = new Date();
       const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
       
       // Create dates using the specified timezone
       const timezoneMap = {
         'ET': 'America/New_York',
         'CT': 'America/Chicago', 
         'MT': 'America/Denver',
         'PT': 'America/Los_Angeles',
         'AKT': 'America/Anchorage',
         'HAT': 'Pacific/Honolulu',
         'AT': 'America/Halifax',
         'UTC': 'UTC'
       };
       
       const timezoneName = timezoneMap[timezone];
       
       // Create timestamps for today only - SIMPLE APPROACH
       const createTimestampInTimezone = (hours, minutes) => {
         // Simply create a date for today with the specified time
         // Discord will handle the timezone display automatically
         const date = new Date();
         date.setHours(hours, minutes, 0, 0);
         return date;
       };
       
       const startDateTime = createTimestampInTimezone(startTimeParsed.hours, startTimeParsed.minutes);
       const endDateTime = createTimestampInTimezone(endTimeParsed.hours, endTimeParsed.minutes);
       
       // Check if times are in the past (for today)
       const currentTime = new Date();
       const currentHour = currentTime.getHours();
       const currentMinute = currentTime.getMinutes();
       
       if (startTimeParsed.hours < currentHour || 
           (startTimeParsed.hours === currentHour && startTimeParsed.minutes <= currentMinute)) {
         await interaction.reply({
           content: '❌ Start time cannot be in the past! Please choose a time for today.',
           ephemeral: true
         });
         return;
       }
      
      // Validate that end time is after start time
      if (endDateTime <= startDateTime) {
        await interaction.reply({
          content: '❌ End time must be after start time!',
          ephemeral: true
        });
        return;
      }

    // Create Discord timestamps
    const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
    const endTimestamp = Math.floor(endDateTime.getTime() / 1000);

    // Create training type display text
    const trainingTypeDisplay = {
      'ground': 'Ground Only',
      'tower_ground': 'Tower or Ground',
      'approach_tower_ground': 'Approach, Tower, or Ground',
      'center_approach_tower_ground': 'Center, Approach, Tower, or Ground'
    };

    // Format times for display (time only)
    const formatTime = (hours, minutes) => {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : (hours > 12 ? hours - 12 : hours);
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0057B7)
      .setTitle('vZSU Training Availability')
      .setDescription(
        `**Mentor:** ${interaction.user}\n` +
        `An impromptu training session is available. Please review the details below and click "Accept Training Session" if you wish to accept this availability.`
      )
             .addFields(
         { 
           name: 'Availability Window', 
           value: `**From:** <t:${startTimestamp}:t> (<t:${startTimestamp}:R>)\n**To:** <t:${endTimestamp}:t> (<t:${endTimestamp}:R>)`, 
           inline: false 
         },
         { 
           name: 'Training Type', 
           value: trainingTypeDisplay[trainingType], 
           inline: true 
         }
       )
      .setFooter({ text: 'This post will be automatically removed when the availability period ends.' })
      .setTimestamp();

    // Create accept button
    const acceptButton = new ButtonBuilder()
      .setCustomId(`acceptAvailablility_${interaction.user.id}`)
      .setLabel('Accept Training Session')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder()
      .addComponents(acceptButton);

    // Send the message
    const message = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });

    // Set up auto-deletion
    const timeUntilDeletion = endDateTime.getTime() - Date.now();
    
    if (timeUntilDeletion > 0) {
      console.log(`Scheduling auto-deletion in ${timeUntilDeletion}ms (${Math.floor(timeUntilDeletion/1000/60)} minutes)`);
      setTimeout(async () => {
        try {
          await message.delete();
          console.log('Training availability message auto-deleted');
        } catch (error) {
          console.error('Error deleting training availability message:', error);
        }
      }, timeUntilDeletion);
    } else {
      console.log('Auto-deletion not scheduled - end time is in the past');
    }
    
    } catch (error) {
      await interaction.reply({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
}; 