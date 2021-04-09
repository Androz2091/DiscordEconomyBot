const Discord = require("discord.js"),
ms = require("ms");

module.exports = {

    /**
     * Creates a new profile for the user
     * 
     * @param {object} user The user for whom the profile will be created
     * @param {object} db The database in which the user profile will be saved
     * 
     * @returns The user profile (object)
     */
    createUser(user, db, bot){

        // Set defaults user information
        db.set(user.id, {
            credits:0,
            rep:0,
            level:0, 
            xp:0,
            desc:"unknow",
            premium:"false",
            registeredAt:require("./functions.js").printDate(new Date(Date.now()))
        });

        // Log in the console
        console.log("\x1b[32m","[DB]","\x1b[0m", "User \""+user.username+"\" registered ! ID : \""+user.id+"\"");

        // Return user data
        return db.get(user.id);
    },

    /**
     * This function will fetch the users and add them to the table
     * 
     * @param {array} array The array of users
     * @param {object} table The table that will contain the users
     * @param {object} bot The discord client 
     * 
     * @returns The table with the users 
     */
    async fetchUsers(array, table, bot) {
        // Create promise
        return new Promise((resolve, reject) => {
            // Init counter
            let pos = 0;
            // Init new array
            let narray = [];
            array.forEach((element) => {
                bot.fetchUser(element.id).then((user) => {
                     // Update counter variable
                    pos++;
                    // Update the username of the user 
                    let regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
                    let _user = user.username.replace(regex, "");
                    if(_user.length > 20){
                        _user.length = 20;
                    }
                    // Add new row to the ascii table
                    table.addRow(pos, _user, element.credits, element.rep);
                });
            });
            // Return the table
            resolve(table);
        });
    },

    /**
     * This function manages the xp of users
     * 
     * @param {object} msg The Discord Message
     * @param {object} authorData The user data
     * @param {array} dbs An array with the cooldown db and the db which the user xp will be saved
     * 
     * @returns The user profile
     */
    updateXp(msg, authorData, dbs){

        let usersData = dbs[0];
        let xpCooldown = dbs[1];

        // Gets the user informations
        let xp = parseInt(authorData.xp, 10);
        let level = parseInt(authorData.level, 10);
    
        // if the member is already in the cooldown db
        let isInCooldown = xpCooldown.get(msg.author.id);
        if(isInCooldown){
            /*if the timestamp recorded in the database indicating 
            when the member will be able to win xp again
            is greater than the current date, return */
            if(isInCooldown > Date.now()){
                return;
            }
        }
        // Records in the database the time when the member will be able to win xp again (3min)
        let towait = Date.now() + ms("1m");
        xpCooldown.set(msg.author.id, towait);
        
        // Gets a random number between 10 and 5 
        let won = Math.floor(Math.random() * ( Math.floor(10) - Math.ceil(5))) + Math.ceil(5);
        
        let newXp = parseInt(xp + won, 10);
    
        // Update user data
        usersData.set(msg.author.id+".xp", newXp);
    
        // calculation how many xp it takes for the next new one
        let neededXp = 5 * (level * level) + 80 * level + 100;
    
        // check if the member up to the next level
        if(newXp > neededXp){
            level++;
        }
    
        // Update user data
        usersData.set(msg.author.id+".level", level);

        return usersData.get(msg.author.id);
    },

    /**
     * Returns a correctly formatted date
     * 
     * @param {Date} pdate The date to be formatted
     * 
     * @returns The formatted date (string)
     */
    printDate(pdate){
        // An array of the months
        let monthNames = [
            "January", "Feburary", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];
    
        // Get date informations
        let day = pdate.getDate(),
        monthIndex = pdate.getMonth(),
        year = pdate.getFullYear(),
        hour = pdate.getHours(),
        minute = pdate.getMinutes();
    
        // Return a string of the date
        return day+" "+monthNames[monthIndex]+" "+year+" Y "+hour+"H"+minute;
    },

    /**
     * Converts a time in milliseconds into a well formatted character string
     * 
     * @param {number} ms The amount of milliseconds
     * 
     * @returns A string
     */
    convertMs(ms){
        let d, h, m, s;
        s = Math.floor(ms / 1000);
        m = Math.floor(s / 60);
        s = s % 60;
        h = Math.floor(m / 60);
        m = m % 60;
        d = Math.floor(h / 24);
        h = h % 24;
        h += d * 24;
    
        // Return a string
        return h+" hour(s) "+m+" minute(s) "+s+" second(s)";
    },

    /**
     * Sort an array of objects 
     * 
     * @param {array} array The array to sort
     * @param {string} key The value that will determine how the objects will be sorted
     * 
     * @returns The sorted array
     */
    sortByKey(array, key) {
        return array.sort(function(a, b) {
            let x = a[key]; let y = b[key];
            return ((x < y) ? 1 : ((x > y) ? -1 : 0));
        });
    }
    
};