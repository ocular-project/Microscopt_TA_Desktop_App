import { writeFile, readFile, access, mkdir, rename } from 'fs/promises'
import fs from 'fs/promises'
import { constants } from 'fs';
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

async function renameFile(oldPath, newName) {
    try {
        await access(oldPath, constants.F_OK)
    }catch {
        throw new Error(`Folder does not exist: ${oldPath}`);
    }

    const parentDir = path.dirname(oldPath)
    const newPath = path.join(parentDir, newName)

    await rename(oldPath, newPath)
    return newPath
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

        const regex = new RegExp(`^${newObject.name}(?:_\\d+)?$`);

        const count = data.filter(
            item => item.parent === newObject.parent && regex.test(item.name)
        ).length

        // const exists = data.some(item => item.name === newObject.name)

        let newPath = folderPath

        // if (!exists){
        if (newObject.type === "folder") {
            const parentId = newObject.parent
            let parentPath = []
            if (newObject.parent){
                const parentFolder = data.find(item => item._id === parentId)
                if (parentFolder) {
                    const pathList = parentFolder.path
                    parentPath = [...pathList, parentId]
                    newObject.path = parentPath
                    if (!pathList.length){
                        newPath = `${folderPath}/${parentFolder.name}`
                    }
                    else {
                        newPath = `${folderPath}/`
                        for (const object of parentPath){
                            const item = data.find(item => item._id === object)
                            if(item) {
                                newPath += `${item.name}/`
                            }
                        }
                    }
                }
            }
            newObject.name = count > 0 ? `${newObject.name}_${count+1}` : newObject.name
        }
        else {
            if (count > 0){
                return {
                    success: false,
                    data: newObject,
                    error: `${newObject.type} already exists`
                }
            }
        }

        data.push(newObject)

        await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

        if (newObject.type === "folder") {
            await createPhysicalFolder(newPath, newObject.name)
        }

        return {
                success: true,
                data: newObject
            }
        // }
        // else {
        //    return {
        //         success: false,
        //         data: newObject,
        //         error: `${newObject.type} already exists`
        //     }
        // }

    } catch (error) {
        console.log(error.message)
        return {
            success: false,
            error: `Error creating a folder: ${error.message}`
        }
    }
}

export async function renameFolder(dir, object){

    try {
        const { name, folderId } = object

        const filePath = `${dir}/Microscopy_TA/database/database.json`
        const dataArray = await accessFolderFile(filePath)

        const folder = dataArray.find(item => item._id === folderId)
        if (!folder){
            return { success: false, error: "Folder doesn't exist"}
        }

        const regex = new RegExp(`^${name}(?:_\\d+)?$`);

        const count = dataArray.filter(
            item => item.parent === folder.parent && regex.test(item.name)
        ).length

        let folderPath = `${dir}/Microscopy_TA/folders_and_images`
        if (folder.parent){
            for(const pf of folder.path){
                const fd = dataArray.find(item => item._id === pf)
                if (fd){
                    folderPath += `/${fd.name}`
                }
            }
        }

        folderPath = `${folderPath}/${folder.name}`

        const newName = count > 0 ? `${name}_${count+1}` : name
        await renameFile(folderPath, newName)
        const newDataArray = dataArray.map(obj =>
            obj._id === folderId ? { ...obj, name: newName, updatedAt: Date.now() } : obj
        )
        await writeFile(filePath, JSON.stringify(newDataArray, null, 2), 'utf8');

        return {
            success: true,
            data: newName
        }
    }
    catch (error) {
        return {
            success: false,
            error: `Error reading data: ${error.message}`
        };
    }
}

async function accessAnnotationFile(filePath) {
    try {
        await access(filePath)
        const content = await readFile(filePath, 'utf8')
        let data = content ? JSON.parse(content) : []
        if(!Array.isArray(data)) data = [data]

        return data
    } catch (err) {
        if (err.code === 'ENOENT') {
          return [];
        }
        // other errors: rethrow
        throw err;
    }
}

async function imageExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;   // exists
  } catch {
    return false;  // does not exist
  }
}

export async function getDataFile(filePath, fileId) {
    try {
        const dataArray = await accessFolderFile(filePath)

        const item = dataArray.find(obj => obj._id === fileId)
        if (!item){
            return {
                success: false,
                error: "File doesn't exist"
            }
        }

        const exists = await  imageExists(item.url)
        if(!exists){
            return {
                success: false,
                error: "Image no longer exists on your machine"
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
        let dataArray = Array.isArray(data) ? data : [data];
        const result = dataArray
            .filter(obj => obj.parent === parentId)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

        const updatedList = result.map(obj =>
            obj.type === 'file'
            ? { ...obj, size: `${(obj.size / (1024 * 1024)).toFixed(1)} MB` }
            : { ...obj, size: "" }
        )

        let currentPath = []
        if (parentId){
            const parentFolder = dataArray.find(item => item._id === parentId)
            if (parentFolder) {
                for (const obj of parentFolder.path){
                    const pf = dataArray.find(item => item._id === obj)
                    currentPath.push({ _id: pf._id, name: pf.name })
                }
                currentPath.push({ _id: parentFolder._id, name: parentFolder.name })
            }
        }

        return {
            success: true,
            data: {
                folders: updatedList,
                path: currentPath
            },
            message: "Data retrieved successfully"
        };

    }
    catch (error) {
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

export async function saveAnnotations(body){
    try {
        const { imageId, annotations } = body
        if (!body || !imageId || !annotations || annotations.length === 0){
            return {
                success: false,
                error: "The image ID and annotations are required"
              };
        }

        const annObj = {
             _id: String(Date.now()),
            imageId,
            annotator: "me",
            annotations
        }

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const filePath = `${dir}/Microscopy_TA/database/database.json`
        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`

        const dataArray = await accessFolderFile(filePath)
        const annoArray = await accessAnnotationFile(annoFilePath)

        annoArray.push(annObj)
        await writeFile(annoFilePath, JSON.stringify(annoArray, null, 2), 'utf8');

        // dataArray.forEach(obj => {
        //     if (obj._id === imageId){
        //         obj.isAnnotated = true
        //         obj.updatedAt = Date.now()
        //     }
        // })

        const newDataArray = dataArray.map(obj =>
            obj._id === imageId ? { ...obj, isAnnotated: true, updatedAt: Date.now() } : obj
        )
        await writeFile(filePath, JSON.stringify(newDataArray, null, 2), 'utf8');
        return {
            success: true
        }

    }catch (error) {
      return {
        success: false,
        error: `Error saving image annotations: ${error.message}`
      };
    }
}

async function accessFolderFile(filePath) {

    await access(filePath);
    const content = await readFile(filePath, 'utf8');
    if (!content.trim()) {
        throw new Error("Database file is empty");
    }
    const data = JSON.parse(content);
    return  Array.isArray(data) ? data : [data];

}

export async function getMyImageAnnotations(imageId) {
    try {
        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }

        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const annoArray = await accessAnnotationFile(annoFilePath)
        const anno = annoArray.find(an => an.imageId === imageId)
        if (!anno) {
            return {success: false, error: "There are no annotations for this image file"}
        }
        return {
            success: true,
            data: {
                file: anno
            }
        }

    }catch (error) {
      return {
        success: false,
        error: `Error loading image annotations: ${error.message}`
      };
    }

}