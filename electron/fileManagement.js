import { writeFile, readFile, access, mkdir } from 'fs/promises'
import fs from 'fs/promises'
import path from "path";
import { loadPath } from './storage.js'

export async function createPhysicalFolder(baseDir, folderName) {
    // Create the full absolute path
    const fullPath = path.join(baseDir, folderName);

    try {
        // 1. Check if it already exists to avoid unnecessary work
        try {
            await access(fullPath);
            return fullPath
        } catch(error) {
            if (error.code !== 'ENOENT') throw error;
        }

        // 2. Create the directory
        // { recursive: true } ensures parent folders are created if missing
        await mkdir(fullPath, { recursive: true });

        return fullPath
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
}

export async function addDataJson(dir, newObject) {
    let data = []

    try {

        const projectFolderPath = await createPhysicalFolder(dir, "Microscopy_TA")
        const databaseFolderPath = await createPhysicalFolder(projectFolderPath, "database")
        const folderPath = await createPhysicalFolder(projectFolderPath, "folders_and_images")
        const filePath = `${databaseFolderPath}/database.json`

        try {
            await access(filePath)
            const content = await readFile(filePath, 'utf8')
            data = content ? JSON.parse(content) : []
            if(!Array.isArray(data)) data = [data]
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }

        const exists = data.some(item => item.name === newObject.name)
        if (!exists){
            data.push(newObject)

            await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

            if (newObject.type === "folder") {
                await createPhysicalFolder(folderPath, newObject.name)
            }

            return {
                success: true,
                data: newObject
            }
        }
        else {
           return {
                success: false,
                data: newObject,
                error: `${newObject.type} already exists`
            }
        }

    } catch (error) {
        console.log(error.message)
        return {
            success: false,
            error: `Error creating a folder: ${error.message}`
        }
    }
}

export async function getDataFile(filePath, fileId) {
    try {
        await access(filePath);
        const content = await readFile(filePath, 'utf8');
        if (!content.trim()) {
            return { success: false, error: "Database file is empty"};
        }
        const data = JSON.parse(content);
        const dataArray = Array.isArray(data) ? data : [data];

        const item = dataArray.find(obj => obj._id === fileId)
        if (!item){
            return {
                success: false,
                error: "File doesn't exist"
            }
        }

        item.size = `${(item.size / (1024 * 1024)).toFixed(1)} MB`
        const buffer = await readFile(item.url);
        item.url =`data:image/png;base64,${buffer.toString('base64')}`

        return {
            success: true,
            data: {
                file: item,
                message: item.isAnnotated ? "This image has annotations" : "",
            }
        }


    }catch (error) {
        return {
            success: false,
            error: `Error reading data: ${error.message}`
        };
    }
}

export async function getDataJson(filePath, parentId) {
    try {
        // 1. Check if the file exists
        await access(filePath);

        // 2. Read the file
        const content = await readFile(filePath, 'utf8');

        // 3. Handle empty files or invalid JSON
        if (!content.trim()) {
            return { success: true, data: {
                folders: [],
                path: []
            }, message: "File is empty" };
        }

        const data = JSON.parse(content);

        // Ensure we always return an array for consistency in your React components
        const dataArray = Array.isArray(data) ? data : [data];

        return {
            success: true,
            data: {
                folders: dataArray,
                path: []
            },
            message: "Data retrieved successfully"
        };

    } catch (error) {
        // Handle "File Not Found" as a soft error (return empty list)
        if (error.code === 'ENOENT') {
            return { success: true, data: [], message: "No database file found yet" };
        }

        // Handle other errors (permissions, corrupted JSON, etc.)
        return {
            success: false,
            data: {
                folders: [],
                path: []
            },
            error: `Error reading data: ${error.message}`
        };
    }
}

export async function handleImagesUpload(filePaths, parentId) {
  try {
      const results = [];

      for (const file of filePaths) {
        const stats = await fs.stat(file);

        const fileData = {
          _id: String(Date.now()),
          name: path.basename(file),
          type: "file",
          mineType: "",
          parent: parentId || "",
          path: [],
          size: stats.size,
          isAnnotated: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const dir = loadPath();
        const resp = await addDataJson(dir, fileData);

        if (resp?.success) {
          results.push(resp.data);
        }
      }

      return {
        success: true,
        data: results
      };
  }
  catch (error) {
      return {
        success: false,
        error: `Error loading images: ${error.message}`
      };
  }
}

export async function handleImageUpload(filePath) {
    try {

        const stats = await fs.stat(filePath);

        const fileData = {
            _id: String(Date.now()),
            name: path.basename(filePath),
            type: "file",
            mineType: "",
            parent: "",
            path: [],
            url: filePath,
            size: stats.size,
            isAnnotated: false,
            category: "From PC",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        const dir = loadPath();
        return await addDataJson(dir, fileData);
    }
    catch (error) {
      return {
        success: false,
        error: `Error loading images: ${error.message}`
      };
    }
}