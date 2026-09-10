import { existsSync } from "fs";
import { execFile } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonRepository {
  constructor() {
    this.requiredVersion = "3.12.14";

    this.pythonPath = path.join(
      __dirname,
      "..",
      "..",
      "runtimes",
      "mac-arm64",
      "python",
      "bin",
      "python"
    );
  }

  exists() {
    return existsSync(this.pythonPath);
  }

  getVersion() {
    return new Promise((resolve, reject) => {
      execFile(this.pythonPath, ["--version"], (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }

        const version = (stdout || stderr).trim();

        resolve(version);
      });
    });
  }

  async isValid() {
    if (!this.exists()) {
      return false;
    }

    try {
      const version = await this.getVersion();

      return version === `Python ${this.requiredVersion}`;
    } catch {
      return false;
    }
  }
}

export default PythonRepository;