const { gitP } = require("simple-git");
const fs = require("fs-extra");
const path = require("node:path");
const config = require("../config.json");
const { Readable } = require("node:stream");
require("dotenv").config();

class ProjectFileUpdater {
    #rootDir = path.join(__dirname, "../");
    #latestVersion;

    /**
     * @param { String[] } ignoreFiles - Files to ignore. 
     * @param { String } latestVersion - The tag of the latest version to be downloaded from github.
     * @param { Boolean? } testing - Testing mode, if set to true, files in project directory will not be overwritten.
     */
    constructor(ignoreFiles, latestVersion) {
        this.repo = "https://github.com/Superchicken962/minecraft-web-integration";
        this.ignoreFiles = ignoreFiles || [];
        this.#latestVersion = latestVersion;
    }

    async #clone() {
        const clonePath = path.join(this.#rootDir, "clone");

        // If clone files are still there, clear it.
        if (fs.existsSync(clonePath)) {
            await fs.emptyDir(clonePath);
        }

        const git = gitP();
        await git.clone(this.repo, clonePath);
    }

    async #formatFiles() {
        const webPath = path.join(this.#rootDir, "clone/integration");

        // Delete files specified in "ignore files".
        for (const fileName of this.ignoreFiles) {
            const pth = path.join(webPath, fileName);
    
            if (fs.existsSync(pth)) {
                await fs.promises.unlink(pth);
            }
        }
    }

    async #replaceFiles() {
        const clonePath = path.join(this.#rootDir, "clone");

        // Copy the current directory as a backup - ensure we do not copy node_modules.
        await fs.promises.cp(this.#rootDir, path.join(this.#rootDir, "../integration_backup"), { recursive: true, filter: (f => !f.includes("node_modules") && !f.includes("clone")) });

        // If dev mode is not enabled, replace files in project directory.
        if (process.env.dev != "true") {
            // Copy from clone to main directory, then empty & delete clone folder.
            await fs.promises.cp(path.join(clonePath, "integration"), this.#rootDir, { recursive: true });
            await fs.emptyDir(clonePath)
            await fs.promises.rmdir(clonePath);
        }

        console.log(clonePath);
    }

    #updatePlugin() {
        return new Promise(async(resolve) => {
            if (!this.#latestVersion) return "Plugin already up to date";

            const fileName = "minecraft-web-integration";
            const downloadUrl = `https://github.com/Superchicken962/minecraft-web-integration/releases/download/v${this.#latestVersion}/${fileName}.jar`;

            console.log(downloadUrl);
            // pathTo should be the path to the server.jar, so go back one and enter plugins folder.
            const serverPluginPath = path.join(config.server.pathTo, "../plugins");
            if (!serverPluginPath) {
                resolve("Plugin failed to update: No valid server path provided in config!");
            }

            const filePath = path.join(serverPluginPath, `${fileName}.jar`);
            const writeStream = fs.createWriteStream(filePath);
            const req = await fetch(downloadUrl);
            Readable.fromWeb(req.body).pipe(writeStream);

            writeStream.on("finish", () => {
                resolve("Plugin has been updated");
            });

            writeStream.on("error", (e) => {
                fs.unlink(filePath);
                console.error("Failed to download plugin", e);
                resolve("Failed downloading plugin! Check console for more details");
            });
        });
    }

    /**
     * Update the project files.
     * 
     * @param { (message: String) => {} } onprogress - Progress callback
     * @returns { Promise }
     */
    async update(onprogress) {
        onprogress?.("Cloning from GitHub...");
        await this.#clone();

        onprogress?.("Formatting...");
        await this.#formatFiles();

        onprogress?.("Replacing files...");
        await this.#replaceFiles();

        onprogress?.("Updating plugin...");
        const pluginStatus = await this.#updatePlugin();
        onprogress?.(pluginStatus);
    }
}

exports.ProjectFileUpdater = ProjectFileUpdater;