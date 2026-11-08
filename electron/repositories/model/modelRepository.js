import https from "https";
import fs from "fs";
import { mkdir, rename, rm, stat } from "fs/promises";
import path from "path";
import { app } from "electron";

class ModelRepository {
  constructor() {
    this.model = {
      name: "YOLOv8n Classification",
      version: "1.0.0",
      filename: "yolov8n-cls.pt",
      url: "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n-cls.pt"
    };
  }

  get modelsPath() {
    return path.join(
      app.getPath("userData"),
      "models"
    );
  }

  get modelPath() {
    return path.join(
      this.modelsPath,
      this.model.filename
    );
  }

  get temporaryModelPath() {
    return path.join(
      this.modelsPath,
      `.${this.model.filename}.download`
    );
  }

  async ensureModelsDirectory() {
    await mkdir(this.modelsPath, {
      recursive: true
    });
  }

  async exists() {
    try {
      const fileInfo = await stat(this.modelPath);

      return fileInfo.isFile();
    } catch {
      return false;
    }
  }

  async getModelInfo() {
    const installed = await this.exists();

    let size = null;

    if (installed) {
      const fileInfo = await stat(this.modelPath);
      size = fileInfo.size;
    }

    return {
      name: this.model.name,
      version: this.model.version,
      filename: this.model.filename,
      installed,
      size,
      path: installed ? this.modelPath : null
    };
  }

  async download(onProgress) {
    await this.ensureModelsDirectory();

    console.log("[MODEL] Models directory:", this.modelsPath);
    console.log("[MODEL] Download URL:", this.model.url);
    console.log("[MODEL] Destination:", this.modelPath);

    await rm(this.temporaryModelPath, {
      force: true
    });

    return this.downloadUrl(
      this.model.url,
      onProgress
    );
  }

  downloadUrl(url, onProgress) {
    return new Promise((resolve, reject) => {
      console.log("[MODEL] Requesting:", url);

      const request = https.get(
        url,
        (response) => {

          console.log(
            "[MODEL] HTTP status:",
            response.statusCode
          );

          // Follow redirects
          if (
            response.statusCode >= 300 &&
            response.statusCode < 400 &&
            response.headers.location
          ) {
            const redirectUrl =
              response.headers.location;

            console.log(
              "[MODEL] Redirecting to:",
              redirectUrl
            );

            response.resume();

            this.downloadUrl(
              redirectUrl,
              onProgress
            )
              .then(resolve)
              .catch(reject);

            return;
          }

          if (response.statusCode !== 200) {
            response.resume();

            reject(
              new Error(
                `Model download failed. HTTP status: ${response.statusCode}`
              )
            );

            return;
          }

          const totalBytes = Number(
            response.headers["content-length"] || 0
          );

          let downloadedBytes = 0;

          console.log(
            "[MODEL] Total size:",
            totalBytes,
            "bytes"
          );

          const fileStream =
            fs.createWriteStream(
              this.temporaryModelPath
            );

          response.on("data", (chunk) => {
            downloadedBytes += chunk.length;

            const progress = totalBytes
              ? Math.round(
                  (downloadedBytes / totalBytes) *
                    100
                )
              : null;

            onProgress({
              type: "download-progress",
              downloadedBytes,
              totalBytes,
              progress
            });
          });

          response.pipe(fileStream);

          fileStream.on("finish", () => {
            fileStream.close(async () => {
              try {
                await rename(
                  this.temporaryModelPath,
                  this.modelPath
                );

                console.log(
                  "[MODEL] Download complete"
                );

                console.log(
                  "[MODEL] Saved to:",
                  this.modelPath
                );

                resolve({
                  success: true,
                  name: this.model.name,
                  version: this.model.version,
                  filename: this.model.filename,
                  path: this.modelPath
                });
              } catch (error) {
                reject(error);
              }
            });
          });

          fileStream.on("error", async (error) => {
            await rm(
              this.temporaryModelPath,
              { force: true }
            );

            reject(error);
          });
        }
      );

      request.on("error", async (error) => {
        await rm(
          this.temporaryModelPath,
          { force: true }
        );

        reject(error);
      });
    });
  }
}

export default ModelRepository;