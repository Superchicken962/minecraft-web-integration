const { gitP } = require("simple-git");

class ProjectFileUpdater {
    /**
     * @param { String[] } ignoreFiles - Files to ignore. 
     */
    constructor(ignoreFiles) {
        this.repo = "https://github.com/Superchicken962/minecraft-web-integration";
        this.ignoreFiles = ignoreFiles || [];
    }

    async #clone() {
        const git = gitP();
        await git.clone(this.repo, path.join(__dirname, "clone"));
    }

    /**
     * Update the project files.
     * 
     * @param { (message: String) => {} } onprogress - Progress callback
     * @returns { Promise }
     */
    async update(onprogress) {
        onprogress?.("Cloning files...");
        await this.#clone();
        onprogress?.("...");
    }
}

exports.ProjectFileUpdater = ProjectFileUpdater;