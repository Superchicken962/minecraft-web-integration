const { gitP } = require("simple-git");
const fs = require("node:fs");
const path = require("node:path");

class ProjectFileUpdater {
    #rootDir = path.join(__dirname, "../");

    /**
     * @param { String[] } ignoreFiles - Files to ignore. 
     */
    constructor(ignoreFiles) {
        this.repo = "https://github.com/Superchicken962/minecraft-web-integration";
        this.ignoreFiles = ignoreFiles || [];
    }

    async #clone() {
        const clonePath = path.join(this.#rootDir, "clone");

        // If clone files are still there, clear it.
        if (fs.existsSync(clonePath)) {
            await fs.promises.rm(clonePath);
        }

        const git = gitP();
        await git.clone(this.repo, clonePath);
    }

    async #formatFiles() {
        const basePath = path.join(this.#rootDir, "clone/integration")

        // Delete files specified in "ignore files".
        for (const fileName of this.ignoreFiles) {
            const pth = path.join(basePath, fileName);
    
            if (fs.existsSync(pth)) {
                await fs.promises.unlink(pth);
            }
        }
    }

    async #replaceFiles() {
        const clonePath = path.join(this.#rootDir, "clone");

        // Copy the current directory as a backup.
        await fs.promises.cp(this.#rootDir, path.join(this.#rootDir, "backup"), { recursive: true });

        console.log(clonePath);
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
    }
}

exports.ProjectFileUpdater = ProjectFileUpdater;