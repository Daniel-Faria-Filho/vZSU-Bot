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
    console.log(`[TRAINING-AVAILABILITY] Command executed by ${interaction.user.tag} (${interaction.user.id})`);
    
    const startTime = interaction.options.getString('start-time');
    const endTime = interaction.options.getString('end-time');
    const trainingType = interaction.options.getString('training-type');
    const timezone = interaction.options.getString('timezone');
    
    console.log(`[TRAINING-AVAILABILITY] Input parameters:`);
    console.log(`  - Start Time: ${startTime}`);
    console.log(`  - End Time: ${endTime}`);
    console.log(`  - Training Type: ${trainingType}`);
    console.log(`  - Timezone: ${timezone}`);

    // Helper function to parse time strings
    function parseTime(timeStr) {
      console.log(`[TRAINING-AVAILABILITY] Parsing time: "${timeStr}"`);
      
      // Remove any extra spaces and convert to lowercase
      timeStr = timeStr.trim().toLowerCase();
      console.log(`[TRAINING-AVAILABILITY] Cleaned time string: "${timeStr}"`);
      
      // Handle common time formats
      let hours, minutes, period;
      
      // Match patterns like "2:30 PM", "14:30", "2 PM", "2:30pm"
      const timePattern = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/;
      const match = timeStr.match(timePattern);
      
      if (match) {
        hours = parseInt(match[1]);
        minutes = match[2] ? parseInt(match[2]) : 0;
        period = match[3];
        
        console.log(`[TRAINING-AVAILABILITY] Matched pattern - Hours: ${hours}, Minutes: ${minutes}, Period: ${period}`);
        
        // Convert to 24-hour format
        if (period === 'pm' && hours !== 12) {
          hours += 12;
          console.log(`[TRAINING-AVAILABILITY] Converted PM to 24-hour: ${hours}`);
        } else if (period === 'am' && hours === 12) {
          hours = 0;
          console.log(`[TRAINING-AVAILABILITY] Converted 12 AM to 0 hours`);
        }
        
        console.log(`[TRAINING-AVAILABILITY] Final parsed time: ${hours}:${minutes.toString().padStart(2, '0')}`);
        return { hours, minutes };
      }
      
      // If no match, try to parse as 24-hour format
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]);
        console.log(`[TRAINING-AVAILABILITY] Parsed as 24-hour format: ${hours}:${minutes.toString().padStart(2, '0')}`);
        return { hours, minutes };
      }
      
      console.log(`[TRAINING-AVAILABILITY] ERROR: Could not parse time format: ${timeStr}`);
      throw new Error(`Invalid time format: ${timeStr}. Please use formats like "2:30 PM", "14:30", or "2 PM"`);
    }

    try {
      console.log(`[TRAINING-AVAILABILITY] Starting time parsing...`);
      const startTimeParsed = parseTime(startTime);
      const endTimeParsed = parseTime(endTime);
      
      console.log(`[TRAINING-AVAILABILITY] Parsed times:`);
      console.log(`  - Start: ${startTimeParsed.hours}:${startTimeParsed.minutes.toString().padStart(2, '0')}`);
      console.log(`  - End: ${endTimeParsed.hours}:${endTimeParsed.minutes.toString().padStart(2, '0')}`);
      
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
      console.log(`[TRAINING-AVAILABILITY] Mapped timezone: ${timezone} -> ${timezoneName}`);
      
      // Simple timezone conversion using built-in methods
      const createTimeInTimezone = (hours, minutes) => {
        console.log(`[TRAINING-AVAILABILITY] Creating time in timezone: ${hours}:${minutes.toString().padStart(2, '0')} in ${timezoneName}`);
        
        // Get current time in the user's timezone
        const nowInUserTZ = new Date().toLocaleString('en-US', { timeZone: timezoneName });
        console.log(`[TRAINING-AVAILABILITY] Current time in user's timezone: ${nowInUserTZ}`);
        
        // Parse the current time to get today's date
        const dateParts = nowInUserTZ.split(',')[0].split('/');
        const month = dateParts[0].padStart(2, '0');
        const day = dateParts[1].padStart(2, '0');
        const year = dateParts[2];
        
        // Create a date string for today at the specified time
        const timeString = `${year}-${month}-${day}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        console.log(`[TRAINING-AVAILABILITY] Time string: ${timeString}`);
        
        // Create the date object
        const targetDate = new Date(timeString);
        console.log(`[TRAINING-AVAILABILITY] Target date: ${targetDate}`);
        
        return targetDate;
      };
      
      console.log(`[TRAINING-AVAILABILITY] Creating start datetime...`);
      let startDateTime = createTimeInTimezone(startTimeParsed.hours, startTimeParsed.minutes);
      console.log(`[TRAINING-AVAILABILITY] Start datetime created: ${startDateTime} (${startDateTime.toISOString()})`);
      
      console.log(`[TRAINING-AVAILABILITY] Creating end datetime...`);
      let endDateTime = createTimeInTimezone(endTimeParsed.hours, endTimeParsed.minutes);
      console.log(`[TRAINING-AVAILABILITY] End datetime created: ${endDateTime} (${endDateTime.toISOString()})`);
      
      // Check if start time is in the past and adjust to next day if needed
      const now = new Date();
      console.log(`[TRAINING-AVAILABILITY] Current time: ${now} (${now.toISOString()})`);
      console.log(`[TRAINING-AVAILABILITY] Start time: ${startDateTime} (${startDateTime.toISOString()})`);
      console.log(`[TRAINING-AVAILABILITY] Is start time in past? ${startDateTime < now}`);
      
      // Get current time in user's timezone for comparison
      const nowInUserTZ = new Date().toLocaleString('en-US', { timeZone: timezoneName });
      const currentTimeInUserTZ = new Date(nowInUserTZ);
      console.log(`[TRAINING-AVAILABILITY] Current time in user timezone: ${currentTimeInUserTZ}`);
      
      // Compare times directly in user's timezone
      const currentHour = currentTimeInUserTZ.getHours();
      const currentMinute = currentTimeInUserTZ.getMinutes();
      const startHour = startTimeParsed.hours;
      const startMinute = startTimeParsed.minutes;
      
      console.log(`[TRAINING-AVAILABILITY] Current time in user TZ: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);
      console.log(`[TRAINING-AVAILABILITY] Start time in user TZ: ${startHour}:${startMinute.toString().padStart(2, '0')}`);
      
      // Calculate time difference in minutes
      const currentTotalMinutes = currentHour * 60 + currentMinute;
      const startTotalMinutes = startHour * 60 + startMinute;
      const minutesDifference = startTotalMinutes - currentTotalMinutes;
      
      console.log(`[TRAINING-AVAILABILITY] Time difference: ${minutesDifference} minutes`);
      
      if (minutesDifference < -5) {
        console.log(`[TRAINING-AVAILABILITY] ERROR: Start time is too far in the past (${Math.abs(minutesDifference)} minutes)`);
        await interaction.reply({
          content: '❌ Start time cannot be more than 5 minutes in the past! Please choose a time for today.',
          ephemeral: true
        });
        return;
      } else if (minutesDifference < 0) {
        console.log(`[TRAINING-AVAILABILITY] Start time is close to current time (${Math.abs(minutesDifference)} minutes), allowing it`);
      }
      
      // If end time is before start time, assume it's for the next day
      if (endDateTime <= startDateTime) {
        console.log(`[TRAINING-AVAILABILITY] End time is before or equal to start time, assuming next day`);
        const nextDay = new Date(startDateTime);
        nextDay.setDate(nextDay.getDate() + 1);
        console.log(`[TRAINING-AVAILABILITY] Next day date: ${nextDay}`);
        
        const nextDayInUserTZ = nextDay.toLocaleString('en-US', { timeZone: timezoneName });
        console.log(`[TRAINING-AVAILABILITY] Next day in user timezone: ${nextDayInUserTZ}`);
        
        const nextDayUserTZ = new Date(nextDayInUserTZ);
        nextDayUserTZ.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);
        console.log(`[TRAINING-AVAILABILITY] Next day with end time: ${nextDayUserTZ}`);
        
        const utcOffset = nextDayUserTZ.getTimezoneOffset();
        console.log(`[TRAINING-AVAILABILITY] Next day UTC offset: ${utcOffset} minutes`);
        
        endDateTime = new Date(nextDayUserTZ.getTime() - (utcOffset * 60 * 1000));
        console.log(`[TRAINING-AVAILABILITY] Updated end datetime: ${endDateTime} (${endDateTime.toISOString()})`);
      }
      
      // Final check - if start time is still in the past, reject it
      console.log(`[TRAINING-AVAILABILITY] Final check - Current time: ${now} (${now.toISOString()})`);
      console.log(`[TRAINING-AVAILABILITY] Final check - Start time: ${startDateTime} (${startDateTime.toISOString()})`);
      console.log(`[TRAINING-AVAILABILITY] Final check - Is start time in past? ${startDateTime < now}`);
      
      if (startDateTime < now) {
        console.log(`[TRAINING-AVAILABILITY] ERROR: Start time is still in the past after adjustments`);
        await interaction.reply({
          content: '❌ Start time cannot be in the past! Please choose a time for today or tomorrow.',
          ephemeral: true
        });
        return;
      }

     // Create Discord timestamps
     const startTimestamp = Math.floor(startDateTime.getTime() / 1000);
     const endTimestamp = Math.floor(endDateTime.getTime() / 1000);
     
     console.log(`[TRAINING-AVAILABILITY] Discord timestamps:`);
     console.log(`  - Start: ${startTimestamp} (${new Date(startTimestamp * 1000).toISOString()})`);
     console.log(`  - End: ${endTimestamp} (${new Date(endTimestamp * 1000).toISOString()})`);
 
     // Create training type display text
     const trainingTypeDisplay = {
       'ground': 'Ground Only',
       'tower_ground': 'Tower or Ground',
       'approach_tower_ground': 'Approach, Tower, or Ground',
       'center_approach_tower_ground': 'Center, Approach, Tower, or Ground'
     };
 
     console.log(`[TRAINING-AVAILABILITY] Creating embed...`);
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
 
     console.log(`[TRAINING-AVAILABILITY] Creating button...`);
     // Create accept button
     const acceptButton = new ButtonBuilder()
       .setCustomId(`acceptAvailablility_${interaction.user.id}`)
       .setLabel('Accept Training Session')
       .setStyle(ButtonStyle.Success);
 
     const row = new ActionRowBuilder()
       .addComponents(acceptButton);
 
     console.log(`[TRAINING-AVAILABILITY] Sending message...`);
     // Send the message
     const message = await interaction.reply({
       embeds: [embed],
       components: [row],
       fetchReply: true
     });
 
     console.log(`[TRAINING-AVAILABILITY] Message sent successfully`);
     
     // Set up auto-deletion
     const timeUntilDeletion = endDateTime.getTime() - Date.now();
     console.log(`[TRAINING-AVAILABILITY] Time until deletion: ${timeUntilDeletion}ms (${Math.floor(timeUntilDeletion/1000/60)} minutes)`);
     
     if (timeUntilDeletion > 0) {
       console.log(`[TRAINING-AVAILABILITY] Scheduling auto-deletion...`);
       setTimeout(async () => {
         try {
           console.log(`[TRAINING-AVAILABILITY] Auto-deleting message...`);
           await message.delete();
           console.log(`[TRAINING-AVAILABILITY] Training availability message auto-deleted successfully`);
         } catch (error) {
           console.error(`[TRAINING-AVAILABILITY] Error deleting training availability message:`, error);
         }
       }, timeUntilDeletion);
     } else {
       console.log(`[TRAINING-AVAILABILITY] Auto-deletion not scheduled - end time is in the past`);
     }
     
     console.log(`[TRAINING-AVAILABILITY] Command completed successfully`);
     
     } catch (error) {
       console.error(`[TRAINING-AVAILABILITY] ERROR in command execution:`, error);
       await interaction.reply({
         content: `❌ Error: ${error.message}`,
         ephemeral: true
       });
     }
   }
};