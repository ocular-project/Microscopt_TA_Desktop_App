import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PythonInferenceRepository {
  constructor(pythonRepository) {
    this.pythonRepository = pythonRepository;

    this.inferencePath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "python",
      "inference.py"
    );
  }

  runInference(imagePath) {
    return new Promise((resolve, reject) => {
      if (!imagePath) {
        reject(
          new Error("No image path was provided.")
        );

        return;
      }

      const childProcess = spawn(
        this.pythonRepository.pythonPath,
        [
          this.inferencePath,
          imagePath
        ],
        {
          env: {
            ...process.env,
            PYTHONUNBUFFERED: "1"
          }
        }
      );

      let stdout = "";
      let stderr = "";

      childProcess.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      childProcess.stderr.on("data", (data) => {
        stderr += data.toString();

        console.error(
          "[Python stderr]",
          data.toString()
        );
      });

      childProcess.on("error", (error) => {
        reject(error);
      });

      childProcess.on("close", (code) => {
        if (code !== 0) {
          reject(
            new Error(
              stderr ||
              `Python inference failed with exit code ${code}.`
            )
          );

          return;
        }

        try {
          const result = JSON.parse(
            stdout.trim()
          );

          resolve(result);
        } catch (error) {
          reject(
            new Error(
              `Invalid JSON returned by Python: ${error.message}\nOutput: ${stdout}`
            )
          );
        }
      });
    });
  }
}

export default PythonInferenceRepository;