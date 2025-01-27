Hello! Welcome to vZSU's Open Source Discord bot made for ANY VATCAR facilities!!

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
