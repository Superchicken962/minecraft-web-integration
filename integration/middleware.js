const config = require("./config.json");

/**
 * Requires the user to be a listed admin to have access to the route. If there are no listed admins, anyone can access the page.
 * 
 * @param { Express.Request } req 
 * @param { Express.Response } res 
 * @param { Function } next 
 */
function requireAdmin(req, res, next) {
    const noAdmins = Array.isArray(config?.settings?.admins) ? config?.settings?.admins.length === 0 : true;

    if ((req.session.isLoggedIn && noAdmins) || config?.settings?.admins?.includes(req.session?.discord?.id)) {
        next();
        return;
    }

    res.sendStatus(403);
}

module.exports = {
    requireAdmin
};