const express = require("express");
const { getBaseUrl, discordAuth } = require("../functions");
const app = express.Router();
const secret = require("../secret.json");

app.get("/", (req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect("/");
        return;
    }

    const redirectUrl = `${getBaseUrl()}/login/discord/callback`;
    const discordRedirect = `https://discord.com/oauth2/authorize?client_id=${secret.clientId}&response_type=code&redirect_uri=${redirectUrl}&scope=identify+guilds.members.read`;
    res.redirect(discordRedirect);
})

app.get("/discord/callback", async(req, res) => {
    if (req.session.isLoggedIn) {
        res.redirect("/");
        return;
    }

    const redirectUrl = `${getBaseUrl()}/login/discord/callback`;
    const code = req.query.code;

    let userData = {};

    try {
        const authenticate = await discordAuth.authenticate(secret.clientId, secret.clientSecret, redirectUrl, code);
        const { token_type, access_token } = authenticate.data;
    
        const userInfo = await discordAuth.getInfo(token_type,access_token);
        userData = userInfo.data;

    } catch (error) {
        console.error("Error logging user in with Discord:", error);
        // TODO: Handle this in a more fashionable manner.
        res.send("There was an error logging you in, please try again later.");
        return;
    }

    // Set session variables.
    req.session.isLoggedIn = true;
    req.session.discord = userData;

    res.redirect("/");
});

module.exports = app;