const Discord = require("discord.js"), // npm install discord.js
ms = require('ms'), // npm install ms
quickdb = require('quick.db'), // npm install quick.db
asciitable = require('ascii-table'); // npm install ascii-table

/* Create tables */
const users_data = new quickdb.table('usersdata'),
cooldowns = {
    work:new quickdb.table('work'),
    rep:new quickdb.table('rep'),
    xp:new quickdb.table('xp')
};


const config = require('./config.json'), // Load config.json file
bot = new Discord.Client() // Create the discord Client

bot.login(config.token); // Discord authentification

bot.on('ready', () => { // When the bot is ready
    bot.user.setActivity(config.game);
    console.log(`Je suis prêt !`);
    console.log(`${bot.guilds.size} serveurs, ${bot.users.size} utilisateurs et ${bot.channels.size} salons`);
});


bot.on('message', async (message) => {
        
    // If the message comes from a bot, cancel
    if(message.author.bot || !message.guild) return;

    // If the message does not start with the prefix, cancel
    if(!message.content.startsWith(config.prefix)) return;

    // If the message content is "/pay @Androz 10", the args will be : [ "pay", "@Androz", "10" ]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    // The command will be : "pay" and the args : [ "@Androz", "10" ]
    const command = args.shift().toLowerCase();

    // Get the current message author information or create a new default profile
    var author_data = users_data.get(message.author.id) || createUser(message.author);

    var members_data = []; // Initialize a new empty array

    if(message.mentions.members.size > 0){ // If some members are mentionned
        message.mentions.members.forEach(member => { // For each member
            // Get the current member information or create a new default profile
            var member_data = users_data.get(member.id) || createUser(member.user);
            members_data.push(member_data);
        });
    }

    // updates the user data by adding xp
    updateXp(message, author_data);

    // Check if the member is an administrator
    var isAdmin = config.administrators.includes(message.author.id) || config.administrators.includes(`${message.author.username}#${message.author.discriminator}`);
    
    /* USER COMMANDS */

    switch(command){
        /**
        *  command 'help'
        *  Display all the bot commands
        */
        case 'help':
            var help_embed = new Discord.RichEmbed() // Creates a new rich embed (see https://discord.js.org/#/docs/main/stable/class/RichEmbed)
                .setAuthor('Bienvenue, '+message.author.username+'#'+message.author.discriminator, message.author.displayAvatarURL)
                .setDescription('**Rappel** : `()` signifie paramètre facultatif et `[]` paramètre obligatoire')
                .addField('👑 Commandes Administrateur', // Sets the title of the field
                    `**${config.prefix}setcredits [@membre] [nombre]** - Change le nombre de crédits du membre mentionné !\n`+
                    `**${config.prefix}premium [@membre]** - Passe un membre premium ou enlève le premium à un membre !\n`+
                    `**${config.prefix}cooldown [work/rep] [@membre]** - Reset le cooldown de la commande pour le membre !`
                )
                .addField('👨 Commandes Utilisateur', // Sets the title of the field
                    `**${config.prefix}profile (@membre)** - Affiche le profil d\'un membre !\n`+
                    `**${config.prefix}work** - Travaillez et gagnez des crédits !\n`+
                    `**${config.prefix}rep [@membre]** - Donnez un point de réputation à un membre !\n`+
                    `**${config.prefix}setbio [texte]** - Changez votre biographie !\n`+
                    `**${config.prefix}pay [@membre] [montant]** - Payez un membre !\n`+
                    `**${config.prefix}leaderboard** - Affiche le leaderboard !\n`
                )
                .setColor(config.embed.color) // Sets the color of the embed
                .setFooter(config.embed.footer) // Sets the footer of the embed
                .setTimestamp();

            message.channel.send(help_embed); // Send the embed in the current channel
            break;
        
        /**
         *  command 'profile'
         *  Display the profile of the message author or the profile of the first mentionned members
        */
        case 'profile':
            // Gets the guildMember whose profile you want to display
            var member = message.mentions.members.size > 0 ? message.mentions.members.first() : message.member;

            // Check if the member is a bot
            if(member.user.bot) return message.reply('les bots n\'ont pas de profil !');

            // Gets the data of the guildMember whose profile you want to display
            var data = (message.member === member) ? author_data : members_data[0];
        
            var profile_embed = new Discord.RichEmbed() // Creates a new rich embed (see https://discord.js.org/#/docs/main/stable/class/RichEmbed)
                .setAuthor(`Profil de ${member.user.username} !`, member.user.displayAvatarURL) // Sets the heading of the embed
                // if the member has a description, display them, else display "Aucune description enregistrée !"
                .setDescription(data.desc !== 'unknow' ? data.desc : 'Aucune biographie enregistrée !')
                // Display the amount of credits of the member
                .addField('💰 Argent', `**${data.credits}** crédit(s)`, true)
                // Display the amount of reputation points of the member
                .addField('🎩 Réputation', `**${data.rep}** point(s)`, true)
                // If the member is premium, display "Oui !" else display "Non..."
                .addField('👑 Premium', ((data.premium === 'true') ? 'Oui !' : 'Non...'), true)
                // Display the creation date of the member
                .addField('📅 Enregistré', `Le ${data.registeredAt}`, true)
                // Display the level of the member
                .addField('📊 Niveau', `**${data.niv.level}**`, true)
                // Display the xp of the member
                .addField('🔮 Expérience', `**${data.niv.xp}** xp`, true)
                .setColor(config.embed.color) // Sets the color of the embed
                .setFooter(config.embed.footer) // Sets the footer of the embed
                .setTimestamp();

            message.channel.send(profile_embed); // Send the embed in the current channel
            break;

        /**
         *  command 'setbio'
         *  Update user biography with the text sent in args
        */
        case 'setbio':
            var bio = args.join(' '); // Gets the description 
            // if the member has not entered a description, display an error message
            if(!bio) return message.reply('veuillez entrer une biographie !');
            // if the description is too long, display an error message 
            if(bio.length > 100) return message.reply('votre biographie ne doit pas excéder les 100 caractères !');

            // save the description in the database
            users_data.set(`${message.author.id}.bio`, bio);

            // Send a success message
            message.reply('votre description vient d\'être mise à jour !');
            break;

        /**
         *  command 'pay'
         *  Send credits to a member
        */
        case 'pay':
            // Gets the first mentionned member
            var member = message.mentions.members.first();
            // if doesn't exist, display an error message
            if(!member) return message.reply('vous devez mentionner un membre !');

            // if the user is a bot, cancel
            if(member.user.bot) return message.reply('vous ne pouvez pas payer un bot !');

            // check if the receiver is the sender
            if(member.id === message.author.id) return message.reply('vous ne pouvez pas vous payer vous même !');

            // gets the amount of credits to send
            var amout_to_pay = args[1];
            // if the member has not entered a valid amount, display an error message
            if(!amout_to_pay) return message.reply(`vous devez entrer un montant à verser à **${member.user.username}** !`);
            if(isNaN(amout_to_pay)) return message.reply('montant invalide.');
            // if the member does not have enough credits
            if(amout_to_pay > author_data.credits) return message.reply('vous ne disposez pas d\'assez de crédits pour effectuer cette transaction !');

            // Adding credits to the receiver
            users_data.add(`${member.id}.credits`, amout_to_pay);
            // Removes credits from the sender
            users_data.subtract(`${message.author.id}.credits`, amout_to_pay);

            // Send a success message
            message.reply('transaction effectuée.');
            break;

        /**
         *  command 'work'
         *  Win credits by using work command every six hours
        */
       case 'work':

            // if the member is already in the cooldown db
            var isInCooldown = cooldowns.work.get(message.author.id);
            if(isInCooldown){
                /*if the timestamp recorded in the database indicating 
                when the member will be able to execute the order again 
                is greater than the current date, display an error message */
                if(isInCooldown > Date.now()){
                    var delai = convertMs(isInCooldown - Date.now()); 
                    return message.reply(`vous devez attendre ${delai} avant de pouvoir de nouveau travailler !`);
                }
            }
    
            // Records in the database the time when the member will be able to execute the command again (in 6 hours)
            var towait = Date.now() + ms('6h');
            cooldowns.work.set(message.author.id, towait);
            
            // Salary calculation (if the member is premium, the salary is doubled)
            var salary = (author_data.premium === 'true') ? 400 : 200;

            // Add "premium" if the member is premium
            var prem = (author_data.premium === 'true') ? ' premium' : '';

            var embed = new Discord.RichEmbed() // Creates a new rich embed
                .setAuthor(`Salaire${prem} récupéré !`) // sets the heading of the embed
                .setDescription(`${salary} crédits ajoutés à votre profil !`)
                .setFooter('Pour les membres premiums, le salaire est doublé !')
                .setColor(config.embed.color) // Sets the color of the embed
                .setFooter(config.embed.footer) // Sets the footer of the embed
                .setTimestamp();
            
            // Update user data
            users_data.add(`${message.author.id}.credits`, salary);

            // Send the embed in the current channel
            message.channel.send(embed);
            break;

        /**
         *  command 'rep'
         *  Give a reputation point to a member to thank him
        */
        case 'rep':
            // if the member is already in the cooldown db
            var isInCooldown = cooldowns.rep.get(message.author.id);
            if(isInCooldown){
                /*if the timestamp recorded in the database indicating 
                when the member will be able to execute the order again 
                is greater than the current date, display an error message */
                if(isInCooldown > Date.now()){
                    var delai = convertMs(isInCooldown - Date.now()); 
                    return message.reply(`vous devez attendre ${delai} avant de pouvoir de nouveau executer cette commande !`);
                }
            }

            // Gets the first mentionned member
            var member = message.mentions.members.first();
            // if doesn't exist, display an error message
            if(!member) return message.reply('vous devez mentionner un membre !');

            // if the user is a bot, cancel
            if(member.user.bot) return message.reply('vous ne pouvez pas donner un point de réputation à un bot !');

            // if the member tries to give himself a reputation point, dispaly an error message
            if(member.id === message.author.id) return message.reply('vous ne pouvez pas vous donner vous-même un point de réputation !');

            // Records in the database the time when the member will be able to execute the command again (in 6 hours)
            var towait = Date.now() + ms('6h');
            cooldowns.rep.set(message.author.id, towait);

            // Update member data 
            users_data.add(`${member.id}.rep`, 1);

            // send a success message in the current channel
            message.reply(`vous avez bien donné un point de réputation à **${member.user.username}** !`);
            break;
        
        /**
         *  command 'leaderboard'
         *  Displays the players with the most amount of credits 
        */
        case 'leaderboard':
            // Creates a new empty array
            var leaderboard = [];

            // Fetch all users in the database and for each member, create a new object
            users_data.fetchAll().forEach(user => {
                // if the user data is not an array, parse the user data
                if(typeof user.data !== 'object') user.data = JSON.parse(user.data);
                // Push the user data in the empty array
                leaderboard.push({
                    id:user.ID,
                    credits:user.data.credits,
                    rep:user.data.rep
                });
            });

            // Sort the array by credits
            leaderboard = sortByKey(leaderboard, 'credits');
            if(leaderboard.length > 20) leaderboard.length = 20;

            var leaderboard_embed = new Discord.RichEmbed() // Creates a new Rich Embed
                .setAuthor('Leaderboard', bot.user.displayAvatarURL)
                .setColor(config.embed.color)
                .setFooter(config.embed.footer)

            // Creates a new ascii table and set the heading
            var table = new asciitable('LEADERBOARD').setHeading('', 'Utilisateur', 'Argent', 'Réputation');

            // Put all users in the new table
            fetchUsers(leaderboard, table).then(newTable => {
                // Send the table in the current channel
                message.channel.send('```'+newTable.toString()+'```');
            });
            break;

        /* ADMIN COMMANDS */

        /**
         *  command 'setcredits'
         *  Sets the amount of credits to the mentionned user
        */

        case 'setcredits':
            // if the user is not an administrator
            if(!isAdmin) return message.reply('vous ne pouvez pas exécuter cette commande !');

            // Gets the first mentionned member
            var member = message.mentions.members.first();
            // if doesn't exist, display an error message
            if(!member) return message.reply('vous devez mentionner un membre !');

            // if the user is a bot, cancel
            if(member.user.bot) return message.reply('vous ne pouvez pas donner des crédits à un bot !');

            // gets the amount of credits to send
            var nb_credits = args[1];
            // if the member has not entered a valid amount, display an error message
            if(isNaN(nb_credits) || !nb_credits) return message.reply(`vous devez entrer un montant pour **${member.user.username}** !`);

            // Update user data
            users_data.set(`${member.id}.credits`, parseInt(nb_credits));
        
            // Send success message in the current channel
            message.reply(`crédits définis à **${nb_credits}** pour **${member.user.username}** !`);
            break;
        
        /**
         *  command 'premium'
         *  Sets the member premium or not
        */
       case 'premium':
        // if the user is not administrator
            if(!isAdmin) return message.reply('vous ne pouvez pas exécuter cette commande !');

            // Gets the first mentionned member
            var member = message.mentions.members.first();
            // if doesn't exist, display an error message
            if(!member) return message.reply('vous devez mentionner un membre !');

            // if the user is a bot, cancel
            if(member.user.bot) return message.reply('vous ne pouvez pas passer un bot premium !');

            // If the mentionned member isn't premium
            if(members_data[0].premium === 'false'){
                // Update user data
                users_data.set(`${member.id}.premium`, 'true');
                // sends a message of congratulations in the current channel
                message.channel.send(`:tada: Félicitations ${member} ! Vous faites désormais parti des membres premium !`);
            } 
            else { // if the member is premium
                // Update user data
                users_data.set(`${member.id}.premium`, 'false');
                // send a message in the current channel
                message.channel.send(`:confused: Dommage ${member}... Vous ne faites désormais plus parti des membres premium !`);
            }
            break;

        /**
         *  command 'cooldown'
         *  Reset the cooldown of the member for the command
        */
        case 'cooldown':
            // if the user is not administrator
            if(!isAdmin) return message.reply('vous ne pouvez pas exécuter cette commande !');

            // Gets the command 
            var cmd = args[0];
            // if the command is not rep or work or there is no command, display an error message
            if(!cmd || ((cmd !== 'rep') && (cmd !== 'work'))) return message.reply('entrez une commande valide (rep ou work) !');

            // Gets the first mentionned member
            var member = message.mentions.members.first();
            // if doesn't exist, display an error message
            if(!member) return message.reply('vous devez mentionner un membre !');

            // if the user is a bot, cancel
            if(member.user.bot) return message.reply('vous ne pouvez pas reset le cooldown d\'un bot !');

            // Update cooldown db
            cooldowns[cmd].set(member.id, 0);

            // Send a success message
            message.reply(`le cooldown de **${member.user.username}** pour la commande **${cmd}** a été réinitialisé !`);
            break;
    }
    

});

/**
 * createUser
 * This function init a default profile for the user
*/

function createUser(user){

    // if the user is a bot
    if(user.bot) return;

    // Set defaults user information
    users_data.set(user.id, {
        credits:0,
        rep:0,
        niv: { level:0, xp:0 },
        desc:'unknow',
        premium:'false',
        registeredAt:printDate(new Date(Date.now()))
    });

    // Log in the console
    console.log('\x1b[32m','[DB]','\x1b[0m', `User "${user.username}" registered ! ID : "${user.id}"`);

    // Return user data
    return users_data.get(user.id);
}

/**
 * xp
 * This function update userdata by adding xp
*/

function updateXp(msg, userdata){

    // Gets the user informations
    var xp = parseInt(userdata.niv.xp);
    var level = parseInt(userdata.niv.level);

    // if the member is already in the cooldown db
    var isInCooldown = cooldowns.xp.get(msg.author.id);
    if(isInCooldown){
        /*if the timestamp recorded in the database indicating 
        when the member will be able to win xp again
        is greater than the current date, return */
        if(isInCooldown > Date.now()) return;
    }
    // Records in the database the time when the member will be able to win xp again (3min)
    var towait = Date.now() + ms('1m');
    cooldowns.xp.set(msg.author.id, towait);
    
    // Gets a random number between 10 and 5 
    let won = Math.floor(Math.random() * ( Math.floor(10) - Math.ceil(5))) + Math.ceil(5);
    
    let newXp = parseInt(xp + won);

    // Update user data
    users_data.set(`${msg.author.id}.niv.xp`, newXp);

    // calculation how many xp it takes for the next new one
    let needed_xp = 5 * (level * level) + 80 * level + 100;

    // check if the member up to the next level
    if(newXp > needed_xp) level++;

    // Update user data
    users_data.set(`${msg.author.id}.niv.level`, level);
}
/**
 * fetchUsers
 * This function is used to fetch all users for the leaderboard command
*/

async function fetchUsers(array, table) {
    // Create promise
    return new Promise((resolve, reject) => {
        // Init counter
        var pos = 0;
        // Init new array
        var narray = [];
        array.forEach(element => {
            bot.fetchUser(element.id).then(user => {
                 // Update counter variable
                pos++;
                // Update the username of the user 
                var regex = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g;
                _user = user.username.replace(regex, '');
                if(_user.length > 20) _user.length = 20
                // Add new row to the ascii table
                table.addRow(pos, _user, element.credits, element.rep);
            });
        });
        // Return the table
        resolve(table);
    });
}

function printDate(pdate){
    // An array of the months
    var monthNames = [
        "janvier", "février", "mars",
        "avril", "mai", "juin", "juillet",
        "août", "septembre", "octobre",
        "novembre", "décembre"
    ];

    // Get date informations
    var day = pdate.getDate(),
    monthIndex = pdate.getMonth(),
    year = pdate.getFullYear(),
    hour = pdate.getHours(),
    minute = pdate.getMinutes();

    // Return a string of the date
    return `${day} ${monthNames[monthIndex]} ${year} à ${hour} h ${minutes}`;
}


function convertMs(ms){
    var d, h, m, s;
    s = Math.floor(ms / 1000);
    m = Math.floor(s / 60);
    s = s % 60;
    h = Math.floor(m / 60);
    m = m % 60;
    d = Math.floor(h / 24);
    h = h % 24;
    h += d * 24;

    // Return a string
    return `${h} heure(s) ${m} minute(s) ${s} seconde(s)`;
}

// This function sort an array by keys
function sortByKey(array, key) {
    return array.sort(function(a, b) {
        var x = a[key]; var y = b[key];
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    });
}
