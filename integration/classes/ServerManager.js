const { spawn } = require("child_process");
const { Server } = require("socket.io");

/**
 * Converts gigabytes into megabyte memory format for minecraft server.
 * 
 * @param { Number } gb - Gigabytes to convert.
 * @returns { Number } Memory to allocate server in megabytes.
*/
function calculateMemory(gb) {
    return gb*1024;
}

const MAX_STORED_LOGS = 6;

/**
 * Log object
 *
 * @typedef { Object } Log
 * @property { String } message - Log message.
 * @property { Boolean } isError - Is it an error log?
 */

class ServerManager {
    /** @type { import("child_process").ChildProcessWithoutNullStreams } */
    #process;

    #ready;
    #serverPath;

    /** @type { Server } */
    #io;

    /** @type { Log[] } */
    #logs = [];

    constructor() {
        this.running = false;
        this.memory = calculateMemory(1);

        this.#ready = false;
    }

    /**
     * Initalises the server instance.
     * 
     * @param { Object } config - Data from config.json.
     * @param { Server } io - Socket io server.
     */
    init(config, io) {
        this.#serverPath = config?.server?.pathTo;

        if (!this.#serverPath) {
            console.error("Server path not found for server!");
            return;
        }

        this.memory = calculateMemory(config?.server?.memory || 1);
        this.#ready = true;
        this.#io = io;
    }

    /**
     * Start the server.
     */
    start() {
        if (!this.#ready) {
            console.error("Cannot start uninitialised server!");
            return;
        }

        if (this.#process) {
            throw new Error("Server has already started!");
        }

        this.#process = this.#newServerProcess(this.#serverPath, this.memory);
        this.#process.on("exit", () => {
            // Set running to false, and delete process whenever it exits, as to do it for server crashes too.
            this.#process = null;
            this.running = false;
        });
        this.running = true;
    }

    /**
     * Stop the server.
     * 
     * @returns { Promise }
     */
    stop() {        
        return new Promise((resolve, reject) => {
            if (!this.#process) {
                reject("Server is not running!");
                return;
            }

            // Write "stop" to the process to stop the mincraft server safely - then kill process and set var to null.
            this.#process.stdin.write("stop\n", (success, err) => {
                if (err) {
                    reject(`Error stopping server: ${err}`);
                    return;
                }

                let cancelTimeout;

                // Wait until mc server fully stops before killing process and etc
                this.#process.stdout.on("data", (data) => {
                    // TODO: just check if this message consistently means the server has shutdown.
                    // Until then, assume after 3s of no ouput then its done.
                    const done = data.toString().includes("All dimensions are saved");

                    // Essentially wait until there are 3s of no output, then assume it's stopped.
                    clearTimeout(cancelTimeout);
                    cancelTimeout = setTimeout(() => {

                        this.#process?.stdin?.end();
                        this.#process?.kill();

                        resolve();

                    }, 3000);
                });
            });
        });
    }

    /**
     * Create a new process for the server.
     *
     * @param { string } path - Path of server jar file - including jar file.
     * @param { number } memory - Memory (mb) to give server.
     * @param { any[] } args - Arguments to pass on command line with node file.
     * @param { import("child_process").ForkOptions } options - Options.
     * @returns { ChildProcess } The spawned process.
     */
    #newServerProcess(path, memory = 1024) {
        // Split into directories - support both forward slashes, and backslashes.
        const dirs = path.match(/\//g) ? path.split("/") : path.split("\\");
        const fileName = dirs[dirs.length-1];

        // Remove filename from path.
        path = path.replace(fileName, "");

        const process = spawn("java", [`-Xmx${memory}M`, `-Xms${memory}M`, `-jar`, fileName, "nogui"], { shell: true, cwd: path });

        process.stdout.on("data", (data) => {
            this.#logData(data, false);

            this.#io.of("/admin").emit("server:log", data.toString());
        });

        process.stderr.on("data", (data) => {
            this.#logData(data, true);

            this.#io.of("/admin").emit("server:error", data.toString());
        });

        process.on("exit", (code) => {
            this.#io.of("/admin").emit("server:exit", code);
        });

        return process;
    }

    /**
     * Saves server log.
     *
     * @param { String } message - Message. 
     * @param { Boolean? } isError - Is the message an error?
     */
    #logData(message, isError = false) {
        this.#logs.push({
            message, isError
        });

        // Trim logs to ensure it does not grow infinitely.
        this.#logs.slice(-MAX_STORED_LOGS);
    }

    /**
     * Get server logs.
     * 
     * @returns { Log[] } Server logs.
     */
    getLogs() {
        return this.#logs;
    }

    /**
     * Clear server logs.
     */
    clearLogs() {
        this.#logs.length = 0;
    }

    /**
     * Enter a command to the server.
     * 
     * @param { String } cmd - Command to enter.
     * @returns { Promise<Boolean> } Was it a success?
     */
    enterCommand(cmd) {
        return new Promise(resolve => {
            if (!this.running) {
                resolve(false);
                return;
            }

            this.#process.stdin.write(`${cmd}\n`, (success) => {
                resolve(success);
            });
        });
    }
}

module.exports = ServerManager;