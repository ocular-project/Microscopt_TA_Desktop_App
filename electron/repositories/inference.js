import { spawn } from "child_process";
import path from "path";

export function runInference(pythonPath, inferencePath, imagePath) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(
      pythonPath,
      [inferencePath, imagePath],
      {
        cwd: path.dirname(inferencePath),
      }
    );

    let output = "";
    let errorOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(
            `Python inference failed (${code}): ${errorOutput}`
          )
        );
        return;
      }

      resolve(output.trim());
    });

    pythonProcess.on("error", (error) => {
      reject(error);
    });
  });
}