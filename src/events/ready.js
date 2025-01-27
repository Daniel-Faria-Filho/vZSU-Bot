const { ActivityType } = require("discord.js");
const mongoose = require('mongoose');



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
    } catch (error) {
      console.error(error);
    }
  },
};