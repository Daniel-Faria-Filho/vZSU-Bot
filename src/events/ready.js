const { ActivityType } = require("discord.js");
const mongoose = require('mongoose');
const scheduleRosterUpdate = require('../functions/scheduleRosterUpdate');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`${process.env.BOT_NAME} is now online!`);

    try {
      client.user.setStatus("online");
      client.user.setActivity("the scopes over ZSU!", {
        type: ActivityType.Watching,
      });
      
      // Initialize roster update scheduler
      scheduleRosterUpdate(client);  // This is the only place we should call it
      
    } catch (error) {
      console.error(error);
    }
  },
};