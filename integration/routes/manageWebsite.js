const express = require("express");
const app = express.Router();
const config = require("../config.json");
const secret = require("../secret.json");
const { minecraftServer } = require("../DataStorage");
const fs = require("node:fs").promises;
const path = require("node:path");
const { deepReadDirectory, getLatestProjectVersion, askSocket, adminSocket, updateProject, projectUpdateStatus, minecraftUpdateStatus, updateMinecraftVersion } = require("../functions");
const package = require("../package.json");
const { Server } = require("socket.io");
const { existsSync } = require("node:fs");

/**
 * @param { Server } io 
 */
exports.register = (io) => {
    app.use("*", (req, res, next) => {
        // Continue if the user is an admin.
        if (config.settings?.admins?.includes(req.session?.discord?.id)) {
            next();
            return;
        }

        res.sendStatus(404);
    });

    adminSocket.listenFor("updateProject:start", (socket) => {
        updateProject((msg, data) => {
            // On update progress, pass it through to the socket.
            io.of("/admin").emit("updateProject:progress", { ...data, message: msg });
        });
    });

    adminSocket.listenFor("updateMinecraft:start", (socket) => {
        updateMinecraftVersion((msg, data) => {
            io.of("/admin").emit("updateMinecraft:progress", { ...data, message: msg });
        });
    });

    app.get("/", async(req, res) => {
        // Not being used at the moment.
        // const directory = await deepReadDirectory(path.join(__dirname, "../"), ["node_modules"], false);

        const latestPackage = await getLatestProjectVersion();
        
        const oudatedFilePath = path.join(__dirname, "../server.outdated");
        const serverOutdated = existsSync(oudatedFilePath);

        res.render("manageWebsite.html", {
            package,
            latestPackage,
            updateStatus: projectUpdateStatus,
            serverOutdated,
            mcUpdateStatus: minecraftUpdateStatus
        });
    });   
    
    return app;
}