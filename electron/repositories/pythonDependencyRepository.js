import { execFile } from "child_process";

class PythonDependencyRepository {
  constructor(pythonRepository) {
    this.pythonRepository = pythonRepository;

    this.requiredPackages = [
      "ultralytics",
      "numpy",
      "pillow",
      "fastapi",
      "uvicorn"
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
        (error) => {
          resolve(!error);
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

  installPackage(packageName) {
    return new Promise((resolve, reject) => {
      console.log(`Installing Python package: ${packageName}`);

      execFile(
        this.pythonPath,
        ["-m", "pip", "install", packageName],
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Failed to install ${packageName}`);
            console.error(stderr);

            reject(error);
            return;
          }

          console.log(`${packageName} installed successfully`);

          resolve(stdout);
        }
      );
    });
  }

  async installMissingPackages() {
    const missingPackages = await this.getMissingPackages();

    if (missingPackages.length === 0) {
      console.log("All Python dependencies are installed.");
      return true;
    }

    console.log("Missing Python packages:", missingPackages);

    for (const packageName of missingPackages) {
      await this.installPackage(packageName);
    }

    return true;
  }

}

export default PythonDependencyRepository;