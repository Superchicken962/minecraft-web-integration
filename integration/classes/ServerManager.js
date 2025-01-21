const { fork, spawn } = require("child_process");
const { Server } = require("socket.io");
const { calculateMemory } = require("../functions");

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
        this.running = true;
    }

    /**
     * Stop the server.
     */
    stop() {
        if (!this.#process) {
            throw new Error("Server is not running!");
        }

        // Write "stop" to the process to stop the mincraft server safely - then kill process and set var to null.
        this.#process.stdin.write("stop", (err) => {
            if (err) {
                throw new Error("Error stopping server: ", err);
            }

            this.#process.stdin.end();

            this.#process.kill(0);
            this.#process = null;
            this.running = false;
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

        console.log(path, fileName);

        const process = spawn("java", [`-Xmx${memory}M`, `-Xms${memory}M`, `-jar`, fileName, "nogui"], { shell: true, cwd: path });

        process.stdout.on("data", (data) => {
            this.#logs.push({
                message: data,
                isError: false
            });

            this.#io.of("/admin").emit("server:log", data.toString());
        });

        process.stderr.on("data", (data) => {
            this.#logs.push({
                message: data,
                isError: true
            });

            this.#io.of("/admin").emit("server:error", data.toString());
        });

        process.on("exit", (code) => {
            this.#io.of("/admin").emit("server:exit", code);
        });

        return process;
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
}

module.exports = ServerManager;