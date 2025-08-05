# vZSU Discord Bot for VATCAR Facilities

A powerful Discord bot designed for VATCAR facilities that automates role management, roster synchronization, and provides various utility commands for your Discord server.

## Key Features

- 🔄 **Automatic VATSIM Account Sync**
  - Automatically syncs user roles with VATSIM/VATCAR ratings
  - Sets nicknames to "{first} {last} | {CID}" format
  - No manual role management needed!

- ⏰ **Automatic Daily Roster Updates**
  - Automatically checks and updates all member roles daily
  - Configurable update time (24-hour format, ET)
  - Can be enabled/disabled via configuration

## Installation

1. Clone the repository to your local environment
2. Install Node.js if not already installed:
   ```bash
   npm i node.js
   ```
3. Navigate to the bot directory:
   ```bash
   cd vZSU-Bot
   ```
4. Install dependencies as needed

## Configuration

1. Copy `.envexample` to `.env`
2. Configure the following settings:

### Basic Configuration
- `CLIENT_TOKEN`: Your Discord bot token from [Discord Developer Portal](https://discord.com/developers/applications/)
- `BOT_NAME`: Your facility name + "BOT" (e.g., "vZSU BOT")
- `API_KEY`: VATCAR production key from [VATCAR FIR Management](https://vatcar.net/public/manage/facilities)
- `FACILITY_NAME`: Your 4-letter ICAO identifier

### Discord IDs
- `FACILITY_AIR_TRAFFIC_MANAGER_DISCORD_ID`: ATM's Discord ID (receives sync notifications)
- `FACILITY_WEB_MASTER_DISCORD_ID`: Webmaster's Discord ID (receives test notifications)

### Role Configuration
- `NORMAL_VATSIM_USER_ROLE_ID`: Role ID for verified VATSIM members
- `VISITING_OR_HOME_CONTROLLER_ROLE_ID`: Role ID for facility controllers
- `NEIGHBORING_FACILITIES`: Comma-separated list of neighboring facility identifiers
- `NEIGHBORING_CONTROLLER_ROLE_ID`: Role ID for controllers from neighboring facilities
- Rating role IDs (OBS through ADM)

### Automatic Roster Updates
- `ROSTER_UPDATE_ENABLED`: Set to "true" to enable automatic daily updates
- `ROSTER_UPDATE_HOUR`: Hour to run updates (24-hour format, ET)
- `ROSTER_UPDATE_MINUTE`: Minute to run updates (ET)

### Position Options
Configure position names for the top-down support command:
- `REQUESTING_POSITION_OPTIONS`: Comma-separated list of positions
- `CURRENT_POSITION_OPTIONS`: Comma-separated list of positions

## Commands

### Administrative Commands
1. `/member-stats` - View VATSIM/VATCAR stats for a user
   - *Access: Senior Staff and Tech Staff*

2. `/sync` - Sync user's Discord roles with VATSIM/VATCAR
   - Updates roles and nickname
   - Assigns appropriate controller roles (Home/Visiting/Neighboring)
   - Notifies ATM of changes

3. `/synctest` - Test sync process for specific Discord ID
   - *Access: Senior Staff and Tech Staff*
   - Tests role assignment including neighboring facility detection
   - Sends results to webmaster

4. `/autoresponder` - Set up automatic responses
   - *Access: Senior Staff and Tech Staff*

5. `/dm` - Send anonymous DM to user
   - *Access: Senior Staff and Tech Staff*

6. `/check-notes` - View training notes
   - *Access: Senior Staff, Tech Staff, and Training Staff*

### Utility Commands
7. `/flightaware` - Generate FlightAware route link
   - Takes departure/arrival ICAO codes

8. `/top-down-support` - Request position support
   - *Access: S3+ rated controllers*
   - Creates formatted support request

9. `/check-stats` - Generate VATSIM stats link
   - Takes CID as input

### Training Commands
10. `/training-availability` - Post training availability
    - *Access: Training Staff*
    - Set start and end availability times
    - Choose training type (Ground, Tower, Approach, Center)
    - Specify timezone
    - Message auto-deletes when availability ends
    - Includes accept button for students to request training

## Permission Management

Manage command access in Discord:
1. Server Settings > Integrations
2. Select your bot
3. Configure permissions per command
4. Deny @everyone and grant specific roles access as needed

## Support

For setup assistance or questions, contact:
- Discord: Daniel Faria
- Email: inbox@danielfaria.cc

## Role Hierarchy

The bot implements the following role hierarchy:
1. Home/Visiting Controller Role
   - Takes precedence over Neighboring Controller role
   - Assigned to controllers from your facility
2. Neighboring Controller Role
   - Assigned to controllers from configured neighboring facilities
   - Only assigned if user isn't already a home/visiting controller
3. VATSIM User Role
   - Base role for all verified VATSIM members
