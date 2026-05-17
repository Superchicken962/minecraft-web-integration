const fs = require("fs-extra");
const path = require("node:path");
const config = require("../config.json");
const { exec } = require("node:child_process");
const os = require("os");
const { Readable } = require("node:stream");
const { minecraftServer } = require("../DataStorage");

class SpigotUpdater {
    #LATEST_BUILD_DOWNLOAD_LINK = "https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar";
    #REQUIRED_JAVA_VERSION = "25";

    /**
     * Update to the latest spigot version.
     * 
     * @param { (message: String) => {} } onprogress - Progress callback
     * @returns { Promise<Boolean> } Was the update a success?
     */
    async updateLatest(onprogress) {
        if (minecraftServer.running) {
            onprogress?.("Please stop the minecraft server then rerun the update!");
            return;
        }

        onprogress?.("Checking Java version...");

        // Get installed java version.
        const javaVersion = await this.#getJavaVersion();
        const javaVersionMain = javaVersion.split(".")[0];
        onprogress?.(`Found Java version: ${javaVersion}`);

        // Check if java version is up to date for required version.
        if (javaVersionMain < this.#REQUIRED_JAVA_VERSION) {
            onprogress?.(`Java version ${javaVersionMain} below required ${this.#REQUIRED_JAVA_VERSION}!`);

            const success = await this.#updateJavaSDK(onprogress);
            if (!success) {
                onprogress?.("Failed to update Java SDK! Please install it manually! Aborting update...");
                return false;
            }
        }

        // Check the server plugin path is configured.
        const serverDirectory = path.join(config.server?.pathTo, "../");
        if (!config.server?.pathTo || !serverDirectory) {
            onprogress?.("Build tools fetch failed: No valid server path provided in config!");
            return resolve(false);
        }

        const btPath = path.join(serverDirectory, `BuildTools_MWI${this.#REQUIRED_JAVA_VERSION}.jar`);

        // Try downloading build tools.
        onprogress?.("Getting Spigot BuildTools...");
        const downloadBt = await this.#downloadBuildTools(btPath, onprogress);
        
        if (!downloadBt) {
            onprogress?.(`Failed to download build tools! You can manually download the file and place it at '${btPath}'. Rerun the script and it will use this file.`);
            return false;
        }

        // Now run buildtools.
        const runBt = await this.#runBuildTools(btPath, onprogress);
        if (!runBt) {
            return false;
        }

        onprogress?.("Updated Minecraft Version!");
        return true;
    }

    /**
     * Get current java version.
     * 
     * @returns { Promise<String> }
     */
    #getJavaVersion() {
        return new Promise((resolve, reject) => {
            exec("javac -version", (error, stdout, stderr) => {
                let version = stdout.split("javac")[1]?.trim() || stdout;
                
                resolve(version);
            });
        });
    }

    /**
     * Get the OS distribution (or just windows if windows). Searches /etc/os-release for the 'ID_LIKE' value if linux.
     * 
     * @returns { Promise<"windows" | "debian" | "fedora" | "arch" | "rhel" | "centos"> }
     */
    async #getOSDistribution() {
        if (os.platform() === "win32") {
            return "windows";
        }

        if (!fs.existsSync("/etc/os-release")) {
            return null;
        }

        const content = await fs.promises.readFile("/etc/os-release", "utf-8");
        const likeId = content.split("ID_LIKE=\"")[1]?.split("\"")?.[0] || null;
        return likeId;
    }

    /**
     * Updates Java SDK
     * 
     * @param { (message: String) => {} } onprogress - Progress callback, passed in from main function.
     * @returns { Promise<Boolean> } Was update successful?
     */
    #updateJavaSDK(onprogress) {
        return new Promise(async(resolve, reject) => {
            let pkg = `openjdk-${this.#REQUIRED_JAVA_VERSION}-jdk-headless`;

            const os = (await this.#getOSDistribution()) || "debian";
            if (os === "windows") {
                onprogress?.("You are using windows, please update your Java SDK to the required version manually!");
                return resolve(true); // Return true to continue update on windows.
            }

            onprogress?.(`Your OS Distribution: ${os}. Not correct? Please install the package yourself using the correct package manager: ${pkg}`);
            onprogress?.("Updating Java version...");
            onprogress?.(`Attempting to install ${pkg}...`);

            // Change install command and package name based on the distribution.
            let osInstaller = "sudo apt install";
            switch(os) {
                case "debian":
                    osInstaller = "sudo apt-get install";
                    break;

                case "arch":
                    osInstaller = "sudo pacman -S";
                    pkg = `jre${this.#REQUIRED_JAVA_VERSION}-openjdk-headless`;
                    break;

                case "rhel":
                case "centos":
                case "fedora":
                    osInstaller = "sudo yum install";
                    pkg = `jdk-${this.#REQUIRED_JAVA_VERSION}-headless`;
                    break;
            }

            // Pipe 'yes' to auto accept install.
            exec(`yes | ${osInstaller} ${pkg}`, async(error, stdout, stderr) => {
                if (error) {
                    onprogress?.(`Error updating sdk: ${error.toString()}`);
                    resolve(false);
                    return;
                }

                resolve(true);
            });
        });
    }

    /**
     * Download a file from a url.
     * 
     * @param { String } url - Url to download from.
     * @param { String } downloadPath - File to save as.
     * @returns { Promise<Boolean> } Was the download a success?
     */
    #downloadFile(url, downloadPath) {
        return new Promise(async(resolve, reject) => {
            const writeStream = fs.createWriteStream(downloadPath);
            const req = await fetch(url);

            if (!req.ok) {
                writeStream.close();
                return reject(false);
            }

            writeStream.on("finish", () => {
                writeStream.close();
                return resolve(true);
            });

            writeStream.on("error", async() => {
                await fs.promises.unlink(downloadPath);
                return reject(false);
            });

            Readable.fromWeb(req.body).pipe(writeStream);
        });
    }

    /**
     * Download build tools.
     * 
     * @param { String } buildToolsPath - Path to build tools where it should download.
     * @param { (message: String) => {} } onprogress - Progress callback, passed in from main function.
     * @returns { Promise<Boolean> }
     */
    async #downloadBuildTools(buildToolsPath, onprogress) {
        if (fs.existsSync(buildToolsPath)) {
            onprogress?.("Existing BuildTools file found! Using that. If this was not intentional, delete the file and rerun the script to redownload it.");
            return true;
        }

        try {
            await this.#downloadFile(this.#LATEST_BUILD_DOWNLOAD_LINK, buildToolsPath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Run build tools.
     * 
     * @param { String } buildToolsPath - Path to build tools where it should download.
     * @param { (message: String) => {} } onprogress - Progress callback, passed in from main function.
     * @returns { Promise<Boolean> } Did it successfully run?
     */
    #runBuildTools(buildToolsPath, onprogress) {
        return new Promise((resolve) => {
            exec(`cd ${path.dirname(buildToolsPath)} && java -jar "${path.basename(buildToolsPath)}"`, async(error, stdout, stderr) => {
                if (error) {
                    onprogress?.(`Error running build tools: ${error.message}`);
                    return resolve(false);
                }

                if (fs.existsSync(buildToolsPath)) {
                    onprogress?.("Deleting no longer required BuildTools...");
                    await fs.promises.rm(buildToolsPath);
                }

                resolve(true);
            });
        });
    }
}

exports.SpigotUpdater = SpigotUpdater;