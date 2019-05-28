# DiscordEconomyBot

A very simple bot with an economy system using the Discord.js API made by Androz. [Join the support server](https://discord.gg/sSfQ7uW).

This bot is made for beginners in nodejs, it is possible to make a more advanced and better optimized bot with a commands folder for example. Feel free to contribute to the project!

## Content

This bot contains the following commands :

*   `Profile` (display the profile of the message author or the profile of the first mentionned member)
*   `Work` (this command is limited to one use every 6 hours and allows you to earn credits)
*   `Rep` (this command is also limited to one use every 6 hours and allows you give a reputation point to an other member)
*   `Setbio` (define your biography, which will appear on your profile)
*   `Pay` (allows you to send credits to other members)
*   `Leaderboard` (display the first 20 members (for credits))
*   `Premium` (admin-only, this command define if a member is premium... or not)
*   `Cooldown` (admin-only, this command allows you to reinitialize a member's cooldown for a certain command)
*   `Setcredits` (admin-only, this command allows you to define the number of credits of a member)


## Setup

You need to rename the `config.sample.json` file to `config.json` and edit it before starting the bot.

```Json
{
    "token":"your discord bot secret token",
    "prefix":"!",
    "game":"made by Androz",
    "embed":{
        "color":"#ff5b5b",
        "footer":"By Androz#2091"
    },
    "administrators":[
        "AdminID",
        "AdminID"
    ]
}
```

In the token field, replace `your discord bot secret token` by your bot token.
In the prefix field, put your bot prefix (the character(s) before the command). For example, if the prefix is `$`, the command profile should be called with `$profile` .
The game is the status of your bot, for example "Androz" will show "playing to Androz".
The embed object contains two values : `color` and `footer`.
In the color field, put an hexadecimal color, this will be used for the color to the left of the embeds.
In the footer field, put what you want, it will appear at the bottom of the embeds, maybe the name of your bot?
The administrators field (the accounts that will be able to execute admin only commands) is an array of Discord users ID or Username#Tag.

## Start the bot

To install the required node modules, simply type `npm install` and all dependencies will be installed!

Once all this is done, you can start the `main.js` file!
