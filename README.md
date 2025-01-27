Hello! Welcome to vZSU's Open Source Discord bot made for ANY VATCAR facility!!

This bot allows for users to AUTOMATICALLY sync their VATSIM Account with your FIR's Discord roles and will set their nickname to their Server nickname to this format: "{first} {last} | {CID}". That's right, NO MORE MANUAL ROLE ADDING ANYMORE! All you have to do is setup the .envexample file and follow instructions in the file to add you facility name and role id's. After that, rename the .envexample to .env and you are all set to start the bot!!



**INSTALLATION INSTRUCITONS:** 

To install the bot, clone the bot into your local enverionment. Then make sure you have Node.JS installed via "npm i node.js" if you don't have it installed already. I reccomend attempting to start the bot after setting everything up then install whatever dependencies you may need.

Once you cloned the bot code, make sure you are in it by using "cd /vZSU-BOt" to get into the code. Then you can start working.


**SETUP INSTRUCTIONS**

Go into the "*.envexample*" file and setup all role IDs, token numbers, api numbers, etc as required. Here is some more detailed step-by-step instructions on how to do that:


Set the CLIENT_TOKEN equal to your Discord Client Token in the bot settings found in [Discord Develelopment Portal](https://discord.com/developers/applications/). First, create a new application if you havent already. Once you have done that, add it to your Facility Discord Server with the appropriate permisions setup and then copy the bot token. Paste the bot token after the CLIENT_TOKEN variable in the .envexample file with NO SPACE after the = sign. There can not be any spaces after any = signs anywhere in the file.

Next, set BOT_NAME equal to your Facility Name + Bot or whatever you want to call it. Our's is "vZSU BOT"

Next, set the API_KEY equal to your production key that can be found in the [VATCAR FIR Managment Tab](https://vatcar.net/public/manage/facilities) under the Web Configuration tab. Copy/Paste that Production key into the .envexample file. Remember, no space.

Next, set your FACILITY_NAME equal to your Facility 4 digit ICAO Name. This can be found by going to the FIR Management Tab in VATCAR and checking the Tab Name on your Browser.

Next, set your FACILITY_AIR_TRAFFIC_MANAGER_DISCORD_ID equal to your Facility Air Traffic Manager's Discord ID inside the quotation marks.

Next, set your FACILITY_WEB_MASTER_DISCORD_ID equal to your Facility Webmaster's Discord ID inside the qutation marks. (This is probably you)

Next, set your NORMAL_VATSIM_USER_ROLE_ID to the role your Discord server uses for members that arent controllers in the facility, but are verified VATSIM members. All these role ids in quation marks remember.

Next, set your VISITING_OR_HOME_CONTROLLER_ROLE_ID role to whatever your facility uses for members who are a visiting/home controller within the facility. At this time, this can only be one role. We can not have seperate visiting and home controller roles.

Next, set your Rating roles below. You must make all these roles manually and paste their IDs inside the appropriate variables if you havent already made them.

Next, set your REQUESTING_POSITION_OPTIONS and CURRENT_POSITION_OPTIONS to their appropriate position names you think are fit. These variables are for the /top-down-support command. All this command does is allows users to request top down support in the form of an embed. Edit the variables below in the EXACT FORMAT they are in. Make sure there are no spaces in between the comas and other letters.


**STARTING THE BOT**

You are 100% chance going to have errors when you try to start the bot for the first time. Something somewhere might now be formated correctly or you may not have a dependecy installed. Work though those.

The command to start the bot is the following: "node ."

Work though the errors and install required dependancies. Once you finally get this:

Started refreshing application (/) commands.
Successfully reloaded application (/) commands.
vZSU Bot is now online!

It means your bot has started and you are good to go! You can then try and test your commands out!!



Please contact Daniel Faria on Discord or email via "inbox@danielfaria.cc" if you have any questions or need some help setting up. I am glad to help.









**COMMANDS:**

1. /member-stats Description: Fetches and displays statistics for a specified Discord user. How It Works: The command retrieves the selected user's VATSIM ID from the VATSIM API then uses that ID to get information from the user from VATCAR's API. It then creates an embed message displaying the user's CID, Discord ID, username, full name, current FIR, and any visiting facilities. The embed is sent as a follow-up message and is deleted after 15 seconds. NOTE: This command should only be available to Senior Staff and Tech Staff.

2. /sync Description: Syncs a user's Discord account with VATSIM and assigns appropriate roles. How It Works: The command checks if the user is linked to VATSIM. If found, it fetches their data from the VATCAR API, assigns roles based on their current position and rating, and updates their nickname. If the user is not found or if there are issues fetching data, it sends error messages and notifies the facility web master. Success messages are sent over DMs to the Facility Air Traffic Manager.

3. /synctest Description: Tests the sync process for a specific Discord user ID. How It Works: Similar to the /sync command, but it allows testing for any user by providing their Discord ID. It fetches the user's VATSIM and VATCAR data, assigns roles, and updates the nickname. It also sends a summary of the sync results to the facility web master. NOTE: This command should only be available to Senior Staff and Tech Staff.

4. /flightaware Description: Provides a link to check flight routes or flights on FlightAware. How It Works: The command takes departure and arrival ICAO codes as input and generates a button that links to the FlightAware website for the specified route. The button is included in the reply message, which is sent as an ephemeral message.

5. /top-down-support Description: Requests top-down support for a specific position. How It Works: The command allows users to select their current position and the position they are requesting support for. It creates an embed message summarizing the request and sends it to the channel, notifying relevant parties of the support request. NOTE: This command should only be available to S3+ Rated Users.

6. /check-stats Description: Provides a link to check member stats on VATSIM. How It Works: The command takes a CID as input and generates a button that links to the VATSIM stats page for that user. The button is included in the reply message, which is sent as an ephemeral message.

7. /autoresponder Description: Sets up an autoresponder for specific messages in the channel. How It Works: The command takes a sentence to listen for and a response to send. It creates a message collector that listens for messages containing the specified sentence and replies with the designated response. It also confirms the setup with an embed message. NOTE: This command should only be available to Senior Staff and Tech Staff.

8. /dm Description: Sends a direct message to a specified user. How It Works: The command takes a user and a message as input. It sends the specified message to the selected user as a DM and confirms the action with a reply in the channel. NOTE: This command should only be available to Senior Staff and Tech Staff. It is made to DM users anonymously from a member of the Senior Staff.

9. /check-notes Description: Retrieves and displays training notes for a specified user. How It Works: The command takes a Discord user as input, fetches their VATSIM ID, and retrieves their training notes from the VATCAR API. It creates an embed message displaying the latest training note details, including the instructor's name, session date, and training note content. NOTE: This command should only be available to Senior Staff, Tech Staff, and Training Staff.


**NOTE**: *You can set who can use what commands by going into the Server Settings > Integrations > Select your bot. There you can manage who can use certain commands. If you want only Senior Staff to see a certain command, simply add it so they have privelges and deny @everyone privelges.*
