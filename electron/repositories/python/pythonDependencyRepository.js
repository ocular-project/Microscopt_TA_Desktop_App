import { execFile, spawn } from "child_process";

class PythonDependencyRepository {
  constructor(pythonRepository) {
    this.pythonRepository = pythonRepository;

    this.requiredPackages = [
      "ultralytics",
      "numpy",
      "pillow",
      "fastapi",
      "uvicorn",
      "matplotlib",
      "torch",
      "torchvision",
      "opencv-python",
      "pandas"
    ];
  }

  get pythonPath() {
    return this.pythonRepository.pythonPath;
  }

  checkPackage(packageName) {
    return new Promise((resolve) => {
      execFile(
        this.pythonPath,
        ["-m", "pip", "show", packageName],
        (error, stdout) => {
          if (error) {
            resolve({
              name: packageName,
              installed: false,
              version: null,
            });

            return;
          }

          const versionLine = stdout
            .split("\n")
            .find((line) => line.startsWith("Version:"));

          const version = versionLine
            ? versionLine.replace("Version:", "").trim()
            : null;

          resolve({
            name: packageName,
            installed: true,
            version,
          });
        }
      );
    });
  }

  async getMissingPackages() {
    const missingPackages = [];

    for (const packageName of this.requiredPackages) {
      const installed = await this.checkPackage(packageName);

      if (!installed) {
        missingPackages.push(packageName);
      }
    }

    return missingPackages;
  }

  installPackage(packageName, onOutput) {
    return new Promise((resolve, reject) => {
      const childProcess = spawn(
        this.pythonPath,
        [
          "-m",
          "pip",
          "install",
          packageName,
          "--disable-pip-version-check",
        ],
        {
          env: {
            ...process.env,
            PYTHONUNBUFFERED: "1",
          },
        }
      );

      let output = "";

      childProcess.stdout.on("data", (data) => {
        const message = data.toString();

        output += message;

        onOutput({
          type: "log",
          package: packageName,
          stream: "stdout",
          message,
        });
      });

      childProcess.stderr.on("data", (data) => {
        const message = data.toString();

        output += message;

        onOutput({
          type: "log",
          package: packageName,
          stream: "stderr",
          message,
        });
      });

      childProcess.on("error", (error) => {
        reject(error);
      });

      childProcess.on("close", (code) => {
        if (code === 0) {
          resolve({
            name: packageName,
            status: "success",
            output,
          });
        } else {
          reject(
            new Error(
              `Failed to install ${packageName}. pip exited with code ${code}.`
            )
          );
        }
      });
    });
  }

  async installPackages(packages, onProgress) {
    const results = [];
    const total = packages.length;

    for (let index = 0; index < total; index++) {
      const packageName = packages[index];

      onProgress({
        type: "package-start",
        name: packageName,
        index: index + 1,
        total,
        progress: Math.round((index / total) * 100),
        message: `[PIP] Installing ${packageName}...`,
      });

      try {
        const result = await this.installPackage(
          packageName,
          (data) => {
            onProgress(data);
          }
        );

        results.push(result);

        onProgress({
          type: "package-success",
          name: packageName,
          status: "success",
          index: index + 1,
          total,
          progress: Math.round(((index + 1) / total) * 100),
          message: `[OK] Package ${packageName} installed successfully.`,
        });
      } catch (error) {
        const result = {
          name: packageName,
          status: "failed",
          reason: error.message,
        };

        results.push(result);

        onProgress({
          type: "package-failed",
          name: packageName,
          status: "failed",
          index: index + 1,
          total,
          progress: Math.round(((index + 1) / total) * 100),
          message: `[FAIL] ${error.message}`,
        });
      }
    }

    return results;
  }

  async getPackageStatus() {
    const packages = [];

    for (const packageName of this.requiredPackages) {
      const packageInfo = await this.checkPackage(packageName);
      packages.push(packageInfo);
    }

    return packages;
  }

}

export default PythonDependencyRepository;