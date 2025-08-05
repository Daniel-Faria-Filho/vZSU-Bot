let isExecuting = false;
let isInitialized = false;  // Add this to prevent double initialization

// Add VATSIM rate limiter
const vatsimRateLimiter = {
    lastRequest: 0,
    requestCount: 0,
    lastMinute: 0,
    async makeRequest(url) {
        const now = Date.now();
        
        // Reset counter if a minute has passed
        if (now - this.lastMinute >= 60000) {
            this.requestCount = 0;
            this.lastMinute = now;
        }

        // Wait if we've hit the rate limit (using 6 to be safe)
        if (this.requestCount >= 6) {
            const waitTime = 60000 - (now - this.lastMinute);
            console.log(`\n⏳ Waiting ${Math.ceil(waitTime/1000)} seconds for VATSIM API rate limit...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.requestCount = 0;
            this.lastMinute = Date.now();
        }

        // Add a delay between requests
        if (this.lastRequest) {
            const timeSinceLastRequest = now - this.lastRequest;
            if (timeSinceLastRequest < 4000) { // 4 second minimum between requests
                await new Promise(resolve => setTimeout(resolve, 4000 - timeSinceLastRequest));
            }
        }

        this.requestCount++;
        this.lastRequest = Date.now();
        const response = await fetch(url);
        return response;
    }
};

// Add the roster update logic as a separate function
async function performRosterUpdate(guild, client) {
    try {
        const facility = process.env.FACILITY_NAME;

        // Rating role mapping
        const ratingRoles = {
            1: process.env.OBS_ROLE_ID,
            2: process.env.S1_ROLE_ID,
            3: process.env.S2_ROLE_ID,
            4: process.env.S3_ROLE_ID,
            5: process.env.C1_ROLE_ID,
            6: process.env.C2_ROLE_ID,
            7: process.env.C3_ROLE_ID,
            8: process.env.I1_ROLE_ID,
            9: process.env.I2_ROLE_ID,
            10: process.env.I3_ROLE_ID,
            11: process.env.SUP_ROLE_ID,
            12: process.env.ADM_ROLE_ID
        };

        const ratingNames = {
            1: "OBS", 2: "S1", 3: "S2", 4: "S3", 5: "C1",
            6: "C2", 7: "C3", 8: "I1", 9: "I2", 10: "I3", 11: "SUP", 12: "ADM"
        };

        // Stats tracking
        const stats = {
            total: 0,
            processed: 0,
            skipped: 0,
            wouldUpdate: 0,
            noChangesNeeded: 0
        };

        // Fetch VATCAR roster data
        const response = await fetch(`https://vatcar.net/public/api/v2/facility/roster?api_key=${process.env.API_KEY}`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to fetch VATCAR roster');
        }

        // Create map of Discord IDs to controller data
        const controllerMap = new Map();
        
        // Process home controllers
        data.data.controllers.forEach(controller => {
            const discordId = controller.integrations.find(i => i.type === 1)?.value;
            if (discordId) {
                controllerMap.set(discordId, {
                    cid: controller.cid,
                    rating: controller.rating,
                    isVisitor: false,
                    isVATCAR: true
                });
            }
        });

        // Process visiting controllers
        data.data.visitors.forEach(visitor => {
            const discordId = visitor.integrations.find(i => i.type === 1)?.value;
            if (discordId) {
                controllerMap.set(discordId, {
                    cid: visitor.cid,
                    rating: visitor.rating,
                    isVisitor: true,
                    isVATCAR: true
                });
            }
        });

        // Get all guild members
        const members = await guild.members.fetch();
        stats.total = members.size;

        console.log(`\n🔍 Starting roster audit for ${members.size} members...`);

        // Process each member
        for (const [memberId, member] of members) {
            try {
                // First check VATSIM API to get their CID
                try {
                    const vatsimResponse = await vatsimRateLimiter.makeRequest(
                        `https://api.vatsim.net/v2/members/discord/${memberId}`
                    );
                    const vatsimData = await vatsimResponse.json();

                    if (!vatsimData.user_id) {
                        console.log(`⚠️ ${member.user.tag} - Skipped (No VATSIM data found)`);
                        stats.skipped++;
                        continue;
                    }

                    // Get user's VATCAR data and rating data once
                    const [vatcarResponse, ratingResponse] = await Promise.all([
                        fetch(`https://vatcar.net/public/api/v2/user/${vatsimData.user_id}?api_key=${process.env.API_KEY}`),
                        vatsimRateLimiter.makeRequest(`https://api.vatsim.net/v2/members/${vatsimData.user_id}`)
                    ]);

                    const [vatcarData, ratingData] = await Promise.all([
                        vatcarResponse.json(),
                        ratingResponse.json()
                    ]);

                    if (!vatcarData.success) {
                        console.log(`Failed to fetch VATCAR data for ${member.user.tag}`);
                        continue;
                    }

                    // Determine required roles
                    const requiredRoles = new Set();
                    requiredRoles.add(process.env.NORMAL_VATSIM_USER_ROLE_ID);

                    // Get neighboring facilities array and clean up any whitespace
                    const neighboringFacilities = process.env.NEIGHBORING_FACILITIES.split(',').map(f => f.trim());
                    console.log(`Checking neighboring facilities: ${neighboringFacilities.join(', ')}`);

                    // Check controller status
                    const isHomeController = vatcarData.data.fir && vatcarData.data.fir.name_short === facility;
                    const isVisitingController = vatcarData.data.visiting_facilities.some(f => f.fir.name_short === facility);
                    
                    // Check for neighboring facility affiliation
                    const isNeighboringController = (
                        (vatcarData.data.fir && neighboringFacilities.includes(vatcarData.data.fir.name_short)) ||
                        vatcarData.data.visiting_facilities.some(f => neighboringFacilities.includes(f.fir.name_short))
                    );

                    // Debug log the VATCAR data
                    console.log(`VATCAR data for ${member.user.tag}:`, {
                        homeFIR: vatcarData.data.fir?.name_short,
                        visitingFIRs: vatcarData.data.visiting_facilities.map(f => f.fir.name_short),
                        neighboringFacilities
                    });

                    // Handle controller roles
                    if (isHomeController) {
                        requiredRoles.add(process.env.HOME_CONTROLLER_ROLE_ID);
                        if (isNeighboringController) {
                            console.log(`Skipping Neighboring Controller role for ${member.user.tag} - Already has home controller role`);
                        }
                    } else if (isVisitingController) {
                        requiredRoles.add(process.env.VISITING_CONTROLLER_ROLE_ID);
                        if (isNeighboringController) {
                            console.log(`Skipping Neighboring Controller role for ${member.user.tag} - Already has visiting controller role`);
                        }
                    } else if (isNeighboringController) {
                        requiredRoles.add(process.env.NEIGHBORING_CONTROLLER_ROLE_ID);
                        const neighboringFacility = vatcarData.data.fir?.name_short || 
                            vatcarData.data.visiting_facilities.find(f => 
                                neighboringFacilities.includes(f.fir.name_short)
                            )?.fir.name_short;
                        
                        console.log(`Adding Neighboring Controller role for ${member.user.tag} (${neighboringFacility} controller)`);
                    } else {
                        console.log(`No special roles needed for ${member.user.tag}`);
                    }

                    // Handle rating role
                    const userRating = ratingData.rating;
                    console.log(`User ${member.user.tag} has a rating of: ${userRating}`);

                    if (userRating in ratingRoles) {
                        requiredRoles.add(ratingRoles[userRating]);
                        console.log(`Adding rating role for rating ${userRating} (${ratingNames[userRating]}) to required roles`);
                    } else {
                        console.log(`No role found for rating ${userRating}`);
                    }

                    // Compare current roles with required roles
                    const currentRoles = member.roles.cache;
                    const rolesToAdd = [...requiredRoles].filter(roleId => !currentRoles.has(roleId));
                    const rolesToRemove = [...currentRoles.keys()].filter(roleId => 
                        [
                            process.env.NORMAL_VATSIM_USER_ROLE_ID, 
                            process.env.HOME_CONTROLLER_ROLE_ID,
                            process.env.VISITING_CONTROLLER_ROLE_ID,
                            process.env.NEIGHBORING_CONTROLLER_ROLE_ID,
                            ...Object.values(ratingRoles)
                        ].includes(roleId) && !requiredRoles.has(roleId)
                    );

                    // Debug logging
                    console.log(`Debug for ${member.user.tag}:`, {
                        isHomeController,
                        isVisitingController,
                        isNeighboringController,
                        rating: `${userRating} (${ratingNames[userRating]})`,
                        requiredRoles: [...requiredRoles].map(roleId => {
                            const role = guild.roles.cache.get(roleId);
                            return role ? role.name : roleId;
                        }),
                        rolesToAdd: rolesToAdd.map(roleId => {
                            const role = guild.roles.cache.get(roleId);
                            return role ? role.name : roleId;
                        }),
                        rolesToRemove: rolesToRemove.map(roleId => {
                            const role = guild.roles.cache.get(roleId);
                            return role ? role.name : roleId;
                        })
                    });

                    // Update roles if needed
                    if (rolesToAdd.length > 0 || rolesToRemove.length > 0) {
                        if (rolesToAdd.length > 0) {
                            await member.roles.add(rolesToAdd);
                            console.log(`Added roles to ${member.user.tag}:`, rolesToAdd);
                        }
                        if (rolesToRemove.length > 0) {
                            await member.roles.remove(rolesToRemove);
                            console.log(`Removed roles from ${member.user.tag}:`, rolesToRemove);
                        }
                        stats.wouldUpdate++;
                    } else {
                        console.log(`✅ ${member.user.tag} (${vatsimData.user_id}) - No changes needed`);
                        stats.noChangesNeeded++;
                    }

                    stats.processed++;
                } catch (error) {
                    console.log(`⚠️ ${member.user.tag} - Skipped (API Error: ${error.message})`);
                    stats.skipped++;
                    continue;
                }
            } catch (error) {
                console.error(`Error processing member ${memberId}:`, error);
                stats.skipped++;
                continue;
            }
        }

        // Log final statistics
        console.log('\n📊 Audit Summary:');
        console.log(`   Total members: ${stats.total}`);
        console.log(`   Successfully processed: ${stats.processed}`);
        console.log(`   No changes needed: ${stats.noChangesNeeded}`);
        console.log(`   Skipped: ${stats.skipped}`);
        console.log(`   Updated: ${stats.wouldUpdate}`);
        
    } catch (error) {
        console.error('Error in roster update:', error);
        throw error;
    }
}

function scheduleRosterUpdate(client) {
    // Prevent multiple initializations first
    if (isInitialized) return;
    isInitialized = true;

    // Check if roster updates are enabled
    if (process.env.ROSTER_UPDATE_ENABLED !== 'true') {
        console.log('📅 Roster updates are disabled in configuration');
        return;
    }

    const formatTime = (date) => {
        // Create a new date object in ET timezone
        const etOptions = { timeZone: "America/New_York" };
        const etDate = new Date(date.toLocaleString('en-US', etOptions));
        
        // Format the time in 24-hour format
        const hours = etDate.getHours().toString().padStart(2, '0');
        const minutes = etDate.getMinutes().toString().padStart(2, '0');
        const seconds = etDate.getSeconds().toString().padStart(2, '0');
        
        return `${hours}:${minutes}:${seconds}`;
    };

    console.log('📅 Initializing roster update scheduler...');
    console.log(`⏰ Next update scheduled for ${process.env.ROSTER_UPDATE_HOUR}:${process.env.ROSTER_UPDATE_MINUTE} ET`);
    
    setInterval(() => {
        const now = new Date();
        // Create date object in ET
        const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const targetHour = parseInt(process.env.ROSTER_UPDATE_HOUR);
        const targetMinute = parseInt(process.env.ROSTER_UPDATE_MINUTE);
        
        if (process.env.ROSTER_UPDATE_ENABLED === 'true' && 
            etTime.getHours() === targetHour && 
            etTime.getMinutes() === targetMinute && 
            !isExecuting) {
            
            isExecuting = true;
            
            // Get the first guild (assuming bot is in only one server)
            const guild = client.guilds.cache.first();
            if (!guild) {
                isExecuting = false;
                return;
            }

            console.log(`\n🕐 Starting scheduled roster update at ${formatTime(now)} ET`);
            
            // Call the roster update function directly
            performRosterUpdate(guild, client)
                .then(() => {
                    isExecuting = false;
                })
                .catch(error => {
                    console.error('Error in scheduled roster update:', error);
                    isExecuting = false;
                });
        }
    }, 60000); // Check every minute
}

module.exports = scheduleRosterUpdate; 