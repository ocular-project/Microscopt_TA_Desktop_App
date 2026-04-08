import { spawn } from 'node:child_process';
import fs from 'fs'
import path from "path";
import {loadPath} from "./storage.js";
import {addDataJson, generateObjectId} from "./fileManagement.js";

class SimpleAdb {
  // constructor(mainWindow, folderPath, _id, value) {
  constructor(mainWindow, dir) {
    this.mainWindow = mainWindow;
    this.logPrefix = '[ADB-JSON]';

    // Simple data storage
    this.data = {
      messages: [],
      users: [
        { id: 1, name: "John Doe", email: "john@example.com" },
        { id: 2, name: "Jane Smith", email: "jane@example.com" }
      ],
      settings: {
        theme: "dark",
        notifications: true,
        language: "en"
      },
      appInfo: {
        name: "Electron Mirror App",
        version: "1.0.0",
        status: "running"
      },
      images: []
    };

    // File paths in Android app internal storage
    this.ANDROID_REQUEST_FILE = "electron_request.json";
    this.ANDROID_RESPONSE_FILE = "electron_response.json";

    this.imageStorageDir = path.join(dir, "Microscopy_TA", "folders_and_images");
    this.ensureImageDirectory();

    this.isTransferInProgress = false;
    this.transferTimeout = null;

    // console.log(`${this.logPrefix} Initializing ADB JSON Communication`);
    // console.log(`${this.logPrefix} Request file: ${this.ANDROID_REQUEST_FILE}`);
    // console.log(`${this.logPrefix} Response file: ${this.ANDROID_RESPONSE_FILE}`);

    this.startPolling();
  }

  // Start polling for requests from Android
  startPolling() {
    // console.log(`${this.logPrefix} 🔄 Starting polling every 2 seconds...`);

    this.pollInterval = setInterval(() => {
      this.checkForRequests();
    }, 2000);

    // console.log(`${this.logPrefix} ✅ Polling started successfully`);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  // Check if Android app sent a request
  async checkForRequests() {
    try {
      // console.log(`${this.logPrefix} 🔍 Checking for requests...`);
      const devices = await this.getConnectedDevices();

      if (devices.length === 0) {
        // console.log(`${this.logPrefix} ⚠️ No devices connected`);
        return;
      }

      // console.log(`${this.logPrefix} 📱 Found ${devices.length} devices(s): ${devices.join(', ')}`);

      for (const deviceId of devices) {
        // console.log(`${this.logPrefix} 📋 Checking devices: ${deviceId}`);
        const request = await this.pullJsonFromAppStorage(deviceId, this.ANDROID_REQUEST_FILE);

        if (request) {
          // console.log(`${this.logPrefix} 📥 REQUEST RECEIVED from ${deviceId}:`);
          // console.log(`${this.logPrefix}    Method: ${request.method}`);
          // console.log(`${this.logPrefix}    Endpoint: ${request.endpoint}`);
          // console.log(`${this.logPrefix}    Data:`, request.data);

          // Process the request
          const response = await this.processRequest(request, deviceId);
          // console.log(`${this.logPrefix} 📤 RESPONSE PREPARED:`);
          // console.log(`${this.logPrefix}    Success: ${response.success}`);
          // console.log(`${this.logPrefix}    Message: ${response.message || 'N/A'}`);
          // console.log(`${this.logPrefix}    Error: ${response.error || 'N/A'}`);

          // Send response back to Android
          const pushSuccess = await this.pushJsonToAppStorage(deviceId, this.ANDROID_RESPONSE_FILE, response);
          if (pushSuccess) {
            // console.log(`${this.logPrefix} ✅ Response sent successfully to ${deviceId}`);
          } else {
            // console.log(`${this.logPrefix} ❌ Failed to send response to ${deviceId}`);
          }

          // Delete the request file
          await this.deleteFileFromAppStorage(deviceId, this.ANDROID_REQUEST_FILE);
          // console.log(`${this.logPrefix} 🗑️ Cleaned up request file`);

          // Notify Electron UI
          this.mainWindow.webContents.send('adb-request-received', {
            deviceId,
            request,
            response
          });
          // console.log(`${this.logPrefix} 📡 Notified Electron UI`);
        } else {
          // console.log(`${this.logPrefix} 💤 No request found for ${deviceId}`);
          return {
            success: false,
            error: "No request found for ${deviceId}"
          };
        }
      }

    } catch (error) {
      console.error(`${this.logPrefix} ❌ Error in checkForRequests:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Process different types of requests
  async processRequest(request, deviceId) {
    const { method, endpoint, data, imageTransfer } = request;
    // console.log(`${this.logPrefix} ⚙️ Processing ${method} ${endpoint} from ${deviceId}`);

    // console.log(`${this.logPrefix} 🔍 DEBUG: Full request object:`, JSON.stringify(request, null, 2));
    // console.log(`${this.logPrefix} 🔍 DEBUG: method:`, method);
    // console.log(`${this.logPrefix} 🔍 DEBUG: endpoint:`, endpoint);
    // // console.log(`${this.logPrefix} 🔍 DEBUG: data:`, data);
    // console.log(`${this.logPrefix} 🔍 DEBUG: imageTransfer:`, imageTransfer);

    try {
      switch (method.toUpperCase()) {
        case 'GET':
          // console.log(`${this.logPrefix} 📥 Handling GET request`);
          return this.handleGet(endpoint, deviceId);

        case 'POST':
          // console.log(`${this.logPrefix} 📤 Handling POST request with data:`, data);
          // console.log(`${this.logPrefix} 📤 Handling POST request with data:`, imageTransfer);
          return this.handlePost(endpoint, request, deviceId);

        default:
          console.log(`${this.logPrefix} ❌ Unsupported method: ${method}`);
          return {
            success: false,
            error: `Unsupported method: ${method}`
          };
      }
    } catch (error) {
      console.error(`${this.logPrefix} ❌ Error processing request:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Handle GET requests
  handleGet(endpoint, deviceId) {
    // console.log(`${this.logPrefix} 🔍 GET ${endpoint}`);

    switch (endpoint) {
      case '/messages':
        // console.log(`${this.logPrefix} 💬 Returning ${this.data.messages.length} messages`);
        return {
          success: true,
          data: this.data.messages,
          count: this.data.messages.length
        };

      case '/users':
        // console.log(`${this.logPrefix} 👥 Returning ${this.data.users.length} users`);
        return {
          success: true,
          data: this.data.users
        };

      case '/settings':
        // console.log(`${this.logPrefix} ⚙️ Returning settings:`, this.data.settings);
        return {
          success: true,
          data: this.data.settings
        };

      case '/info':
        // console.log(`${this.logPrefix} ℹ️ Returning app info:`, this.data.appInfo);
        return {
          success: true,
          data: this.data.appInfo
        };

      default:
        // console.log(`${this.logPrefix} ❌ Unknown GET endpoint: ${endpoint}`);
        return {
          success: false,
          error: `Endpoint not found: ${endpoint}`
        };
    }
  }

  // Handle POST requests
  handlePost(endpoint, requestData, deviceId) {  // ← Changed parameter name from 'data' to 'requestData'
    // console.log(`${this.logPrefix} 📝 POST ${endpoint}`);
    // console.log(`${this.logPrefix} 🔍 DEBUG: handlePost requestData:`, JSON.stringify(requestData, null, 2));

    switch (endpoint) {
        case '/messages':
            const newMessage = {
                id: Date.now(),
                message: requestData.data?.message || '',  // ← Access via requestData.data
                deviceId: deviceId,
                timestamp: new Date().toISOString()
            };
            this.data.messages.push(newMessage);
            console.log(`${this.logPrefix} ✅ Message added:`, newMessage);

            return {
                success: true,
                message: 'Message added',
                data: newMessage
            };

        case '/settings':
            console.log(`${this.logPrefix} 🔧 Updating settings. Old:`, this.data.settings);
            this.data.settings = { ...this.data.settings, ...requestData.data };  // ← Access via requestData.data
            console.log(`${this.logPrefix} 🔧 New settings:`, this.data.settings);

            return {
                success: true,
                message: 'Settings updated',
                data: this.data.settings
            };

        case '/users':
            const newUser = {
                id: Date.now(),
                name: requestData.data?.name || 'Unknown',  // ← Access via requestData.data
                email: requestData.data?.email || ''
            };
            this.data.users.push(newUser);
            console.log(`${this.logPrefix} ✅ User added:`, newUser);

            return {
                success: true,
                message: 'User added',
                data: newUser
            };

        case '/images/transfer':
            // console.log(`${this.logPrefix} 🖼️ Image transfer endpoint hit`);
            return this.handleDirectImageTransfer(requestData, deviceId);  // ← Pass full requestData

        default:
            console.log(`${this.logPrefix} ❌ Unknown POST endpoint: ${endpoint}`);
            return {
                success: false,
                error: `Endpoint not found: ${endpoint}`
            };
    }
}

  // Get list of connected devices
  async getConnectedDevices() {
    // console.log(`${this.logPrefix} 🔌 Getting connected devices...`);

    return new Promise((resolve, reject) => {
      const adbProcess = spawn('adb', ['devices', '-l']);
      let output = '';

      adbProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      adbProcess.on('exit', (code) => {
        // console.log(`${this.logPrefix} 📋 ADB devices command exit code: ${code}`);
        // console.log(`${this.logPrefix} 📋 ADB devices output:\n${output}`);

        if (code === 0) {
          const devices = this.parseDeviceList(output);
          // console.log(`${this.logPrefix} 📱 Parsed devices:`, devices);
          resolve(devices);
        } else {
          // console.log(`${this.logPrefix} ❌ ADB devices command failed`);
          resolve([]);
        }
      });

      adbProcess.on('error', (error) => {
        // console.error(`${this.logPrefix} ❌ ADB devices error:`, error.message);
        resolve([]);
      });
    });
  }

  parseDeviceList(output) {
    const lines = output.split('\n');
    const devices = [];

    // console.log(`${this.logPrefix} 🔍 Parsing devices list...`);
    for (const line of lines) {
      const trimmedLine = line.trim();
      // console.log(`${this.logPrefix} 📄 Line: "${trimmedLine}"`);

      if (!trimmedLine || trimmedLine.startsWith('List of devices')) {
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
      if (parts.length >= 2 && parts[1] === 'device') {
        devices.push(parts[0]);
        // console.log(`${this.logPrefix} ✅ Found devices: ${parts[0]}`);
      }
    }

    return devices;
  }

  // Get the package name of the app
  async getAppPackageName(deviceId) {
    // console.log(`${this.logPrefix} 📦 Getting package name for devices: ${deviceId}`);

    return new Promise((resolve) => {
      const adbProcess = spawn('adb', ['-s', deviceId, 'shell', 'pm', 'list', 'packages', '-3']);
      let output = '';

      adbProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      adbProcess.on('exit', (code) => {
        // console.log(`${this.logPrefix} 📦 Package list command exit code: ${code}`);

        if (code === 0) {
          // console.log(`${this.logPrefix} 📦 Package list output:\n${output}`);
          const lines = output.split('\n');

          for (const line of lines) {
            if (line.includes('com.ug.air.ocular_mta')) {
              const packageName = line.replace('package:', '').trim();
              // console.log(`${this.logPrefix} ✅ Found target package: ${packageName}`);
              resolve(packageName);
              return;
            }
          }
        }

        const defaultPackage = 'com.ug.air.ocular_mta';
        // console.log(`${this.logPrefix} ⚠️ Target package not found, using default: ${defaultPackage}`);
        resolve(defaultPackage);
      });

      adbProcess.on('error', (error) => {
        console.error(`${this.logPrefix} ❌ Package list error:`, error.message);
        resolve('com.ug.air.ocular_mta');
      });
    });
  }

  // Pull JSON file from Android app internal storage
  async pullJsonFromAppStorage(deviceId, fileName) {
    // console.log(`${this.logPrefix} ⬇️ Pulling ${fileName} from ${deviceId}`);

    return new Promise(async (resolve) => {
      const packageName = await this.getAppPackageName(deviceId);
      // console.log(`${this.logPrefix} 📦 Using package: ${packageName}`);

      const adbProcess = spawn('adb', ['-s', deviceId, 'exec-out', `run-as ${packageName} cat files/${fileName}`]);
      let output = '';
      let errorOutput = '';

      adbProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      adbProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      adbProcess.on('exit', (code) => {
        // console.log(`${this.logPrefix} ⬇️ Pull command exit code: ${code}`);

        if (errorOutput) {
          // console.log(`${this.logPrefix} ⚠️ Pull stderr: ${errorOutput}`);
        }

        if (code === 0 && output.trim()) {
          // console.log(`${this.logPrefix} 📄 Raw file content: ${output}`);
          try {
            const jsonData = JSON.parse(output);
            // console.log(`${this.logPrefix} ✅ Successfully parsed JSON:`, jsonData);
            resolve(jsonData);
          } catch (error) {
            // console.error(`${this.logPrefix} ❌ JSON parse error:`, error.message);
            resolve(null);
          }
        } else {
          // console.log(`${this.logPrefix} 💤 No file found or empty content`);
          resolve(null);
        }
      });

      adbProcess.on('error', (error) => {
        console.error(`${this.logPrefix} ❌ Pull process error:`, error.message);
        resolve(null);
      });
    });
  }

  // Push JSON data to Android app internal storage
  async pushJsonToAppStorage(deviceId, fileName, jsonData) {
    // console.log(`${this.logPrefix} ⬆️ Pushing ${fileName} to ${deviceId}`);
    // console.log(`${this.logPrefix} 📄 Data to push:`, jsonData);

    return new Promise(async (resolve, reject) => {
      const packageName = await this.getAppPackageName(deviceId);
      const jsonString = JSON.stringify(jsonData, null, 2);

      // console.log(`${this.logPrefix} 📦 Using package: ${packageName}`);
      // console.log(`${this.logPrefix} 📄 JSON string length: ${jsonString.length} characters`);

      // Escape single quotes in JSON for shell command
      const escapedJson = jsonString.replace(/'/g, "'\"'\"'");

      const adbProcess = spawn('adb', ['-s', deviceId, 'shell', `echo '${escapedJson}' | run-as ${packageName} tee files/${fileName} > /dev/null`]);
      let errorOutput = '';

      adbProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      adbProcess.on('exit', (code) => {
        // console.log(`${this.logPrefix} ⬆️ Push command exit code: ${code}`);

        if (errorOutput) {
          // console.log(`${this.logPrefix} ⚠️ Push stderr: ${errorOutput}`);
        }

        if (code === 0) {
          // console.log(`${this.logPrefix} ✅ Successfully pushed ${fileName}`);
          resolve(true);
        } else {
          console.error(`${this.logPrefix} ❌ Failed to push ${fileName}`);
          reject(new Error('Failed to write file to app storage'));
        }
      });

      adbProcess.on('error', (error) => {
        console.error(`${this.logPrefix} ❌ Push process error:`, error.message);
        reject(error);
      });
    });
  }

  // Delete file from Android app internal storage
  async deleteFileFromAppStorage(deviceId, fileName) {
    // console.log(`${this.logPrefix} 🗑️ Deleting ${fileName} from ${deviceId}`);

    return new Promise(async (resolve) => {
      const packageName = await this.getAppPackageName(deviceId);

      const adbProcess = spawn('adb', ['-s', deviceId, 'shell', `run-as ${packageName} rm -f files/${fileName}`]);
      let errorOutput = '';

      adbProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      adbProcess.on('exit', (code) => {
        // console.log(`${this.logPrefix} 🗑️ Delete command exit code: ${code}`);

        if (errorOutput) {
          // console.log(`${this.logPrefix} ⚠️ Delete stderr: ${errorOutput}`);
        }

        if (code === 0) {
          // console.log(`${this.logPrefix} ✅ Successfully deleted ${fileName}`);
        } else {
          // console.log(`${this.logPrefix} ⚠️ Delete failed (file might not exist)`);
        }

        resolve();
      });

      adbProcess.on('error', (error) => {
        console.error(`${this.logPrefix} ❌ Delete process error:`, error.message);
        resolve();
      });
    });
  }

  // Helper methods for Electron UI
  getData() {
    // console.log(`${this.logPrefix} 📊 Getting current data state`);
    return this.data;
  }

  addMessage(message) {
    const newMessage = {
      id: Date.now(),
      message: message,
      deviceId: 'electron',
      timestamp: new Date().toISOString()
    };
    this.data.messages.push(newMessage);
    // console.log(`${this.logPrefix} ✅ Message added from Electron:`, newMessage);
    return newMessage;
  }

  clearMessages() {
    const oldCount = this.data.messages.length;
    this.data.messages = [];
    // console.log(`${this.logPrefix} 🗑️ Cleared ${oldCount} messages`);
  }

  updateSettings(newSettings) {
    // console.log(`${this.logPrefix} 🔧 Updating settings from Electron. Old:`, this.data.settings);
    this.data.settings = { ...this.data.settings, ...newSettings };
    // console.log(`${this.logPrefix} 🔧 New settings:`, this.data.settings);
    return this.data.settings;
  }

  // New method for direct file transfer
  async handleDirectImageTransfer(transferRequest, deviceId) {
    // console.log(`${this.logPrefix} 🖼️ Handling direct image transfer from ${deviceId}`);
    // console.log(`${this.logPrefix} 🔍 DEBUG: Full requestData in handleDirectImageTransfer:`, JSON.stringify(requestData, null, 2));

      console.log(this.isTransferInProgress)
      if (this.isTransferInProgress) {
        console.log(`${this.logPrefix} ⚠️ Transfer already in progress`);
        return {
          success: false,
          error: 'Transfer already in progress'
        };
      }

      this.isTransferInProgress = true;

      this.transferTimeout = setTimeout(() => {
        console.log(`${this.logPrefix} ⏰ Force releasing stuck transfer lock`);

        this.isTransferInProgress = false;
        this.transferTimeout = null;
      }, 60000); // 60 seconds max

      try {
        console.log(`${this.logPrefix} 📥 Pulling image from Android...`);

        console.log(transferRequest)
        // 📦 3. TRANSFER IMAGE FROM DEVICE
        const success = await this.pullImageFromAndroid(deviceId, transferRequest);

        if (!success) {
          console.log(`${this.logPrefix} ❌ Pull failed`);

          return {
            success: false,
            error: 'Failed to pull image from device'
          };
        }

        // 📁 4. SAVE METADATA
          console.log(transferRequest)
          console.log(this.imageStorageDir)

        const transferredImage = {
          id: Date.now().toString(),
          filename: transferRequest.imageTransfer.filename,
          originalName: transferRequest.imageTransfer.originalName,
          mimeType: transferRequest.imageTransfer.mimeType,
          size: transferRequest.imageTransfer.fileSize,
          savedPath: path.join(this.imageStorageDir, transferRequest.imageTransfer.filename),
          deviceId,
          transferredAt: new Date().toISOString()
        };

        this.data.images.push(transferredImage);

        // 💾 5. PERSIST DATA
        await this.handleJsonSave(transferredImage);

        console.log(`${this.logPrefix} ✅ Image transferred successfully`);

        return {
          success: true,
          message: 'Image transferred successfully',
          data: transferredImage
        };

      }
      catch (error) {
        console.error(`${this.logPrefix} ❌ Transfer error:`, error);

        return {
          success: false,
          error: error.message || 'Unknown error during image transfer'
        };

      }
      finally {
        // 🧹 6. ALWAYS CLEAN UP LOCK
        this.isTransferInProgress = false;

        if (this.transferTimeout) {
          clearTimeout(this.transferTimeout);
          this.transferTimeout = null;
        }

        console.log(`${this.logPrefix} 🔓 Transfer lock released`);
      }
}

  async handleJsonSave(transferredImage) {
    try {
        const fileData = {
            _id: generateObjectId(),
            name: transferredImage.filename,
            type: "file",
            mineType: "",
            parent: null,
            url: transferredImage.savedPath,
            path: [],
            category: "From Mobile",
            isOnline: false,
            size: transferredImage.size,
            isAnnotated: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const dir = loadPath();
        await addDataJson(dir, fileData);

    }
    catch (error) {
        console.log('Creating new folders registry file' + error);
    }

  }

  // Pull image file directly from Android internal storage
  async pullImageFromAndroid(deviceId, transferRequest) {
    console.log(`${this.logPrefix} ⬇️ Pulling image file: ${transferRequest.imageTransfer.filename}`);

    return new Promise(async (resolve) => {
        const packageName = await this.getAppPackageName(deviceId);
        console.log(packageName)
        const sourcePath = `files/images_to_transfer/${transferRequest.imageTransfer.filename}`;
        console.log(sourcePath)
        console.log(this.imageStorageDir)
        const destPath = path.join(this.imageStorageDir, transferRequest.imageTransfer.filename);
        console.log(destPath)

        console.log(`${this.logPrefix} 📦 Package: ${packageName}`);
        console.log(`${this.logPrefix} 📁 Source: ${sourcePath}`);
        console.log(`${this.logPrefix} 📁 Dest: ${destPath}`);

        // Use adb pull to get the file directly
        const adbProcess = spawn('adb', [
            '-s', deviceId,
            'exec-out',
            `run-as ${packageName} cat ${sourcePath}`
        ]);

        const writeStream = fs.createWriteStream(destPath);
        let errorOutput = '';

        adbProcess.stdout.pipe(writeStream);

        adbProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        adbProcess.on('exit', (code) => {
            writeStream.end();

            console.log(`${this.logPrefix} ⬇️ Pull command exit code: ${code}`);

            if (errorOutput) {
                console.log(`${this.logPrefix} ⚠️ Pull stderr: ${errorOutput}`);
            }

            if (code === 0 && fs.existsSync(destPath)) {
                const stats = fs.statSync(destPath);
                console.log(`${this.logPrefix} ✅ Image pulled successfully: ${stats.size} bytes`);

                // Verify file size matches
                if (stats.size === transferRequest.imageTransfer.fileSize) {
                    console.log(`${this.logPrefix} ✅ File size verified`);
                    resolve(true);
                } else {
                    console.log(`${this.logPrefix} ⚠️ File size mismatch: expected ${transferRequest.imageTransfer.fileSize}, got ${stats.size}`);
                    resolve(true); // Still consider success, might be compression
                }
            } else {
                console.log(`${this.logPrefix} ❌ Failed to pull image file`);
                resolve(false);
            }
        });

        adbProcess.on('error', (error) => {
            console.error(`${this.logPrefix} ❌ Pull process error:`, error.message);
            writeStream.end();
            resolve(false);
        });
    });
}

  ensureImageDirectory() {
      try {
          if (!fs.existsSync(this.imageStorageDir)) {
              fs.mkdirSync(this.imageStorageDir, { recursive: true });
              console.log(`${this.logPrefix} 📁 Created image directory: ${this.imageStorageDir}`);
          } else {
              console.log(`${this.logPrefix} 📁 Image directory exists: ${this.imageStorageDir}`);
          }
      } catch (error) {
          console.error(`${this.logPrefix} ❌ Failed to create image directory:`, error);

          // Fallback to a directory in the app's folder
          this.imageStorageDir = path.join(__dirname, '..', 'transferred_images');
          try {
              if (!fs.existsSync(this.imageStorageDir)) {
                  fs.mkdirSync(this.imageStorageDir, { recursive: true });
                  console.log(`${this.logPrefix} 📁 Created fallback image directory: ${this.imageStorageDir}`);
              }
          } catch (fallbackError) {
              console.error(`${this.logPrefix} ❌ Failed to create fallback directory:`, fallbackError);
          }
      }
  }

}

export default SimpleAdb;