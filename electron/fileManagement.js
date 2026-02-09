import { writeFile, readFile, access, mkdir, rename, rm } from 'fs/promises'
import fs from 'fs/promises'
import { constants } from 'fs';
import path from "path";
import { loadPath } from './storage.js'
import dns from "dns"

// creating a physical folder on computer
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

// renaming a file or folder on the computer
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

// deleting a file or folder from the computer
async function deleteFilePath(filePath, type) {
  try {
      if (type === "folder") {
          await rm(filePath, { recursive: true, force: true });
      }
      else {
          await rm(filePath)
      }
  } catch (err) {
    throw err; // re-throw so caller can handle it
  }
}

// creating an object in the database json file
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
            newObject.size = ""
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

// renaming an object in the database json file
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

        const { folderPath, imageList } = getFolderPath(folder, dir)

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

// getting the path of a folder/ file based on its object PATH
function getFolderPath(folder, dir){
    let folderPath = `${dir}/Microscopy_TA/folders_and_images`
    let imageList = []

    if (folder.parent){
        for(const pf of folder.path){
            const fd = dataArray.find(item => item._id === pf)
            if (fd){
                if (fd.type === "file"){
                    imageList.push(fd._id)
                }
                folderPath += `/${fd.name}`
            }
        }
    }

    folderPath = `${folderPath}/${folder.name}`
    return { folderPath, imageList }
}

// deleting an object from the database json file
export async function deleteFile(fileId) {
    try {
        const dir = loadPath()
        const filePath = `${dir}/Microscopy_TA/database/database.json`
        const dataArray = await accessFolderFile(filePath)

        const folder = dataArray.find(item => item._id === fileId)
        if (!folder){
            return { success: false, error: "Folder/ File doesn't exist"}
        }

        let msg
        let imageList = []
        if (folder.type === "file" && !folder.parent){
            msg = "The file record has been deleted but the image still exists on your computer"
            imageList.push(folder._id)
        }
        else {
            const { folderPath, imageList: images } = getFolderPath(folder, dir)
            imageList = images
            await deleteFilePath(folderPath , folder.type)
            msg = "The File/ Folder has been deleted successfully"
        }

        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const annoArray = await accessAnnotationFile(annoFilePath)
        const updatedAnno = annoArray.filter(an => !imageList.includes(an.imageId))
        await writeFile(annoFilePath, JSON.stringify(updatedAnno, null, 2), 'utf8');

        const newData = dataArray.filter(item => item._id !== fileId && !item.path.includes(fileId))
        await writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');

        return {
            success: true,
            message: msg
        }

    }
    catch (error) {
        return {
            success: false,
            error: `Failed to delete file/ folder: ${error.message}`
        };
    }
}

// get the annotation array from annotations.json file
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

// checks if the image exists on the computer
async function imageExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;   // exists
  } catch {
    return false;  // does not exist
  }
}

// Loading an image for annotation
export async function getDataFile(filePath, fileId, credentials) {
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

        const annoArray = await getAnnotations()
        const annotators = annoArray
            .filter(item => item.imageId === fileId)
            .map(item => ({
                _id: item._id,
                annotator: {...item.annotator},
                feedbackId: null
            }))

        // console.log(annotators)

        return {
            success: true,
            data: {
                file: item,
                annotators,
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

// get root files or folder files or sub folders
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

        // const updatedList = result.map(obj =>
        //     obj.type === 'file'
        //     ? { ...obj, size: `${(obj.size / (1024 * 1024)).toFixed(2)} MB` }
        //     : { ...obj, size: "" }
        // )

        const updatedList = result.map(obj => {
            if (obj.type  !== 'file' || typeof  obj.size !== 'number') {
                return { ...obj, size: ""}
            }
            const sizeMB = obj.size / (1024 * 1024)
            const size =
                sizeMB >= 0.01
                    ? `${sizeMB.toFixed(2)} MB`
                    : `${(obj.size / 1024).toFixed(2)} KB`;
            return { ...obj, size };
        })

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

// saving the images' objects of the image on the computer
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

// saving the image object of the image on the computer
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

// saving image annotations
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

// get the data array from database.json file
async function accessFolderFile(filePath) {

    await access(filePath);
    const content = await readFile(filePath, 'utf8');
    if (!content.trim()) {
        throw new Error("Database file is empty");
    }
    const data = JSON.parse(content);
    return  Array.isArray(data) ? data : [data];

}

// get image annotations
export async function getMyImageAnnotations(id, cred) {
    try {
        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }

        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const feedbackFilePath = `${dir}/Microscopy_TA/database/feedback.json`
        const annoArray = await accessAnnotationFile(annoFilePath)
        const feedbackArray = await accessAnnotationFile(feedbackFilePath)

        const anno = annoArray.find(an => an._id === id)
        if (!anno) {
            return {success: false, error: "There are no annotations for this image file"}
        }

        const annotator = anno.annotator
        let feedback = []
        console.log(cred?._id)
        console.log(annotator._id)
        if(annotator._id === cred?._id){
            console.log(id)
            feedback = feedbackArray
                .filter(item => item.annotator._id === cred?._id)
                .filter(item => item.annotationId === id)
                .map(item => ({
                    _id: item._id,
                    owner: {...item.owner}
                }))
        }

        return {
            success: true,
            data: {
                file: anno,
                feedback
            }
        }

    }catch (error) {
      return {
        success: false,
        error: `Error loading image annotations: ${error.message}`
      };
    }

}

// transfer image to the online drive
export async function transferFile(fileId, type) {
    try {
        const dir = loadPath()
        const filePath = `${dir}/Microscopy_TA/database/database.json`
        const dataArray = await accessFolderFile(filePath)

        const folder = dataArray.find(item => item._id === fileId)
        if (!folder){
            return { success: false, error: "Folder/ File doesn't exist"}
        }

        if (folder.type === "file") {
            const filePathX = folder.url
            const result = await validateImageExists(filePathX);
            if (!result.success) {
                return result;
            }
            // console.log(filePathX)
            const buffer = await readFile(filePathX)
            const extension = filePathX.split('.').pop().toLowerCase();
            // console.log(extension)
            const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            // console.log(mimeType)

            return {
                success: true,
                data: {
                    buffer,
                    name: folder.name,
                    mimeType
                }
            }
        }

        return {
                success: false
            }
    }
    catch (error) {
      return {
        success: false,
        error: `Error: ${error.message}`
      };
    }
}

async function validateImageExists(filePath) {
    const exists = await imageExists(filePath);

    if (!exists) {
        return {
            success: false,
            error: "Image no longer exists on your machine"
        };
    }

    return { success: true };
}

export async function transferFiles(fileList, type) {
    try {
        const dir = loadPath()
        const filePath = `${dir}/Microscopy_TA/database/database.json`
        const dataArray = await accessFolderFile(filePath)

        const fileType = fileList.some(file => file.type === "file")

        if (fileType) {
            const newList = fileList.map(file => file.id)
            let msg = ""
            let data = []
            for (const [index, id] of newList.entries()) {
                const folder = dataArray.find(item => item._id === id)
                if (!folder) {
                    const value = index+1
                    msg = `Image recorde for Image number ${value} doesn't exist`
                    break
                }
                const url = folder.url
                const exists = await imageExists(url);
                if (!exists) {
                     msg = `This image: ${folder.name} no longer exist on your machine`
                    break
                }
                const buffer = await readFile(url)
                const extension = url.split('.').pop().toLowerCase();
                const obj = {
                    buffer,
                    name: folder.name,
                    extension
                }
                data.push(obj)
            }

            if (msg) {
                return {
                    success: false,
                    error: msg
                }
            }

            return {
                success: true,
                data
            }

        }
        // const folder = dataArray.find(item => item._id === fileId)
        // if (!folder){
        //     return { success: false, error: "Folder/ File doesn't exist"}
        // }

        // if (folder.type === "file") {
        //     const filePath = folder.url
        //     console.log(filePath)
        //     const buffer = await readFile(filePath)
        //     const extension = filePath.split('.').pop().toLowerCase();
        //     console.log(extension)
        //     const mimeType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
        //     console.log(mimeType)
        //
        //     return {
        //         success: true,
        //         data: {
        //             buffer,
        //             name: folder.name,
        //             mimeType
        //         }
        //     }
        // }

        return {
            success: false
        }
    }
    catch (error) {
      return {
        success: false,
        error: `Error: ${error.message}`
      };
    }
}

// check for an internet connection
function hasInternet(){
    const domain = "http://localhost:3001"
    // const domain = "https://expressbackend.ocular-project.com"

    return new Promise((resolve) => {
        dns.lookup(domain, (err) => {
            resolve(!err);
        });
    });
}

// saving images from zipped file
export async function handleImagesSave(folder, saveFiles, folders) {
    try {

        const dir = loadPath();
        let count = 0
        for (const file of saveFiles) {
            const fileName = path.basename(file)
             const fileObject = folders.find(item => item.name === fileName)
            if (!fileObject) {
                throw new Error(`Image ${fileName} doesn't have metadata`)
            }
            fileObject.url = file
            fileObject.parent = folder._id
            fileObject.path = [folder._id]
            fileObject.createdAt = Date.now()
            fileObject.updatedAt = Date.now()

            const resp = await addDataJson(dir, fileObject);
            if (!resp.success) {
              throw new Error(`Failed to save image ${fileName} metadata`)
            }
            count += 1
        }

        if (count === 0){
            throw new Error(`Failed to save all images' metadata`)
        }

        return {
            success: true,
        }

    }catch (error){
        return {
            success: false,
            error: error.message
        }
    }
}

// Get annotations Array obj
async function getAnnotations() {
     const dir = loadPath()
     if (!dir) {
        return {success: false, error: "Failed to load primary directory"}
     }
     const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
     const annoArray = await accessAnnotationFile(annoFilePath)

     return annoArray
}


// save one image annotations and feedback from download
export async function handleAnnotationsDownload(object, fileId) {
    try {
        const { combined,  feedback} = object

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const feedbackFilePath = `${dir}/Microscopy_TA/database/feedback.json`
        const filePath = `${dir}/Microscopy_TA/database/database.json`

        const annoArray = await accessAnnotationFile(annoFilePath)
        const feedbackArray = await accessAnnotationFile(feedbackFilePath)
        const dataArray = await accessFolderFile(filePath)

        annoArray.push(...combined)
        feedbackArray.push(...feedback)
        await writeFile(annoFilePath, JSON.stringify(annoArray, null, 2), 'utf8');
        await writeFile(feedbackFilePath, JSON.stringify(feedbackArray, null, 2), 'utf8');

        const newDataArray = dataArray.map(obj =>
            obj._id === fileId ? { ...obj, isAnnotated: true, updatedAt: Date.now() } : obj
        )
        await writeFile(filePath, JSON.stringify(newDataArray, null, 2), 'utf8');

        return {
            success: true,
            message: "Annotations saved successfully"
        }

    }catch (error) {
        return {
            success: false,
            error: `Error: ${error.message}`
        }
    }
}