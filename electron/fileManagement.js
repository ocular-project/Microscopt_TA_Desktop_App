import { writeFile, readFile, access, mkdir, rename, rm } from 'fs/promises'
import fs from 'fs/promises'
import { constants } from 'fs';
import path from "path";
import { loadPath } from './storage.js'
import dns from "dns"
import { ObjectId } from "mongodb"
import { Mutex } from 'async-mutex'
const annotationMutex = new Mutex()
const dbMutex = new Mutex()

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

        if (newObject.name === "my_drive"){
            const myDrive = data.find(item => item.name === "my_drive")
            if (myDrive){
                return {
                    success: true,
                    data: myDrive,
                }
            }
        }

        if (newObject.name === "shared_files"){
            const sharedFiles = data.find(item => item.name === "shared_files")
            if (sharedFiles){
                return {
                    success: true,
                    data: sharedFiles,
                }
            }
        }

        const idCheck = data.find(item => item.type === "file" && item._id === newObject._id)
        if (idCheck) {
            await fs.unlink(newObject.url)
            return {
                success: true,
                data: newObject,
            }
        }

        let newPath = folderPath

        // if (!exists){
        if (newObject.type === "folder") {

             const childFolder = data.find(item => item._id === newObject._id)
            if (childFolder) {
                return {
                    success: true,
                    data: childFolder,
                }
            }

            const regex = new RegExp(`^${newObject.name}(?:_\\d+)?$`);
            const count = data.filter(
                item => item.parent === newObject.parent && regex.test(item.name)
            ).length

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
            const newFile = data.find(item => item.parent === newObject.parent && item._id === newObject._id)
            if (newFile){
                return {
                    success: true,
                    data: newFile,
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
        const feedbackFilePath = `${dir}/Microscopy_TA/database/feedback.json`
        const feedbackArray = await getArrayObject("feedback.json")

        const updatedAnno = annoArray.filter(an => !imageList.includes(an.imageId))
        await writeFile(annoFilePath, JSON.stringify(updatedAnno, null, 2), 'utf8');

        const updatedFeed = feedbackArray.filter(fb => !imageList.includes(fb.imageId))
        await writeFile(feedbackFilePath, JSON.stringify(updatedFeed, null, 2), 'utf8');

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
export async function getDataFile(filePath, fileId, cred) {
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

        const annoArray = await getArrayObject("annotations.json")
        const feedbackArray = await getArrayObject("feedback.json")

        const annotators = (annoArray ?? []).filter(item => item.imageId === fileId)
        const annotatorsIds = annotators.map(item => item._id)
        const feedbacks = (feedbackArray ?? [])
            .filter(item => annotatorsIds.includes(item.annotationId) && item?.owner._id === cred?._id)
            .map(item => ({
                annotationId: item.annotationId,
                _id: item._id
            }))

        const feedbackMap = Object.fromEntries(
            feedbacks.map(fb => [fb.annotationId, fb._id])
        )

        const annotationsWithFeedback = annotators.map(item => ({
            _id: item._id,
            annotator: {...item.annotator},
            feedbackId: feedbackMap[item._id] || null
        }))

        return {
            success: true,
            data: {
                file: item,
                annotators: !annotators.length ? [] : annotationsWithFeedback,
                message: !!annotators.length ? "This image has annotations" : "No annotations found",
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
        const instArray = await getArrayObject("Instructions.json")

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

            const instructions = instArray.find(inst => inst.file._id === obj._id)

            return { ...obj, size, instructions: !!instructions };
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
export async function handleImagesUpload(filePaths) {
  try {
      const results = [];

      for (const file of filePaths) {
        const stats = await fs.stat(file);

        const fileData = {
          _id: generateObjectId(),
          name: path.basename(file),
          type: "file",
          mineType: "",
          parent: null,
          url: file,
          path: [],
          category: "From PC",
          isOnline: false,
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
            _id: generateObjectId(),
            name: path.basename(filePath),
            type: "file",
            mineType: "",
            parent: null,
            path: [],
            url: filePath,
            size: stats.size,
            isAnnotated: false,
            category: "From PC",
            isOnline: false,
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
export async function saveAnnotations(body, cred){
    try {
        const { imageId, annotations } = body
        if (!body || !imageId || !annotations || annotations.length === 0){
            return {
                success: false,
                error: "The image ID and annotations are required"
              };
        }

        const dataArray = await getArrayObject("database.json")
        const annoArray = await getArrayObject("annotations.json")
        // console.log(feedbackArray)
        // console.log(cred)
        // console.log(imageId)
        // console.log(annoArray)
        const annoItem = annoArray.find(item => item.imageId === imageId && item.annotator?._id === cred?._id)
        // console.log(annoItem)
        if (annoItem) {
            annoItem.annotations = annotations
            annoItem.updatedAt= Date.now()
        }
        else {

            // console.log(cred)
            const newObject = {
                _id: generateObjectId(),
                annotator: {...cred},
                imageId,
                annotations,
                shared_with: [],
                shared_with_team: [],
                updatedAt: Date.now(),
                createdAt: Date.now()
            }
            // console.log(newObject)
            annoArray.push(newObject)
        }

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const filePath = `${dir}/Microscopy_TA/database/annotations.json`
        const filePath2 = `${dir}/Microscopy_TA/database/database.json`

        await writeFile(filePath, JSON.stringify(annoArray, null, 2), 'utf8');

        const newDataArray = dataArray.map(obj =>
            obj._id === imageId ? { ...obj, isAnnotated: true, updatedAt: Date.now() } : obj
        )
        await writeFile(filePath2, JSON.stringify(newDataArray, null, 2), 'utf8');

        return {
            success: true,
            message: "Annotations saved successfully!"
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

        const annoArray = await getArrayObject("annotations.json")
        const feedbackArray = await getArrayObject("feedback.json")

        const anno = annoArray.find(an => an._id === id)
        if (!anno) {
            return {success: false, error: "There are no annotations for this image file"}
        }

        const annotator = anno.annotator
        let feedback = []
        // console.log(cred?._id)
        // console.log(annotator._id)
        if(annotator?._id === cred?._id){
            // console.log(id)
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

// Get annotator feedback
export async function getAnnotatorFeedback(id, cred) {
    try {
        const feedbackArray = await getArrayObject("feedback.json")
        const feedbackItem = feedbackArray.find(item => item._id === id)
        if (!feedbackItem){
            return {
                success: false,
                error: "Annotations' Feedback do not exist"
            }
        }

        return {
            success: true,
            data: {
                feedback: feedbackItem
            }
        }

    }catch (error) {
      return {
        success: false,
        error: `Error loading feedabck: ${error.message}`
      };
    }
}

// Save feedback
export async function saveFeedback(object, cred){
    try {
        if (!cred) {
            throw new Error("There are no user credentials, Please first login")
        }
        const { imageId, annotations, annotator = {} } = object
        const isAnnotatorValid = annotator.owner?.trim() !== "" && annotator.annoId?.trim() !== "";
        if (!imageId || !annotations || annotations.length === 0 || !isAnnotatorValid) {
          throw new Error ('Either the image ID or annotation ID or annotations are missing')
        }

        const feedbackArray = await getArrayObject("feedback.json")
        const annoArray = await getArrayObject("annotations.json")
        // console.log(feedbackArray)
        const feedbackItem = feedbackArray.find(item => item.owner._id === annotator.owner && item.annotationId === annotator.annoId)
        if (feedbackItem) {
            feedbackItem.annotations = annotations
            feedbackItem.updatedAt = Date.now()
        }
        else {

            const annoItem = annoArray.find(item => item._id === annotator.annoId)
            if (!annoItem) {
                 throw new Error ("Annotations object doesn't exist")
            }
            const newObject = {
                _id: generateObjectId(),
                owner: {...cred},
                annotationId: annotator.annoId,
                annotations,
                annotator: {...annoItem.annotator},
                updatedAt: Date.now(),
                createdAt: Date.now()
            }

            feedbackArray.push(newObject)
        }

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const filePath = `${dir}/Microscopy_TA/database/feedback.json`
        await writeFile(filePath, JSON.stringify(feedbackArray, null, 2), 'utf8');

        return {
            success: true,
            message: "Annotations' feedback saved successfully!"
        }

    }catch (error) {
        return {
            success: false,
            error: `Error: ${error.message}`
          };
    }
}

export async function getMyFeedback(id) {
    try{
        const feedbackArray = await getArrayObject("feedback.json")
        const feedbackItem = feedbackArray.find(item => item._id === id)
        if (!feedbackItem){
            return {
                success: false,
                error: "Annotations' Feedback do not exist"
            }
        }

        return {
            success: true,
             data: {
                feedback: feedbackItem
            }
        }

    }catch (error) {
        return {
            success: false,
            error: `Error: ${error.message}`
          };
    }
}

export function generateObjectId() {
  return new ObjectId().toHexString()
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

export async function updateFiles(fileList) {
    try {
        const dataArray = await getArrayObject("database.json")
        const dataLookup = new Map(
            dataArray.map(item => [item._id, item])
        )
        const now = Date.now()
        for(const file of fileList) {
            const item = dataLookup.get(file)
            if (item) {
                item.updatedAt = now,
                item.isOnline = true
            }
        }

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const filePath = `${dir}/Microscopy_TA/database/database.json`
        await writeFile(filePath, JSON.stringify(dataArray, null, 2), 'utf8');

        return {
            success: true
        }
    }
    catch (error) {
        return {
            success: false,
            error: error.message
        }
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

        const dataArray = await getArrayObject("database.json")
        // const feedbackArray = await getArrayObject("feedback.json")
        const annoArray = await getArrayObject("annotations.json")

        const fileType = fileList.every(file => file.type === "file")

        if (!fileType) {
            throw new Error("There are some folders selected and they are not allowed")
        }

        // console.log(fileList)
        const newList = fileList.map(file => file.id)
        let msg = ""
        let fol = []
        let images = []
        let annotations = []

        const folderLookUp = new Map(
            dataArray.map(item => [item._id, item])
        );

        const annoLookUp = new Map(
            annoArray.map(item => [item.imageId, item])
        );

        // console.log(newList)

        for (const [index, id] of newList.entries()) {
            const folder = folderLookUp.get(id)

            if (!folder) {
                const value = index+1
                msg = `Image record for Image number ${value} doesn't exist`
                break
            }

            // console.log("===================================")
            // console.log(folder)
            // console.log("===================================")

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
            images.push(obj)
            fol.push(folder)

            if(!annoLookUp.has(id)){
                continue
            }
            const anno = annoLookUp.get(id)
            annotations.push(anno)

        }

        if (msg) {
            return {
                success: false,
                error: msg
            }
        }

        return {
            success: true,
            data: {
                annotations,
                folders: fol,
                images
            }
        }

    }
    catch (error) {
      return {
        success: false,
        error: `${error.message}`
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
export async function handleImagesSave(folder, saveFiles, folders, driveId) {
    try {

        const dir = loadPath();
        let count = 0
        for (const file of saveFiles) {
            const fileName = path.basename(file)
            const fileObject = folders.find(item => item.name === fileName)
            if (!fileObject) {
                throw new Error(`Image ${fileName} doesn't have metadata`)
            }

            let pathX = []
            if (driveId === folder._id){
                pathX = [driveId]
            }
            else {
                pathX = [driveId, folder._id]
            }

            fileObject.url = file
            fileObject.parent = folder._id
            fileObject.path = pathX
            fileObject.isOnline = true
            fileObject.createdAt = Date.now()
            fileObject.updatedAt = Date.now()

            // console.log(fileObject)
            const resp = await addDataJson(dir, fileObject);
            // console.log(resp)

            if (!resp.success && resp.error !== "New file already exists") {
              throw new Error(resp.error)
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
async function getArrayObject(file) {
     const dir = loadPath()
     if (!dir) {
        return {success: false, error: "Failed to load primary directory"}
     }
     const annoFilePath = `${dir}/Microscopy_TA/database/${file}`
     const annoArray = await accessAnnotationFile(annoFilePath)

     return annoArray
}


// save one image annotations and feedback from download
export async function handleAnnotationsDownload(object, fileId) {
    try {
        const { annotations,  feedback} = object

        const dir = loadPath()
        if (!dir) {
            return {success: false, error: "Failed to load primary directory"}
        }
        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const feedbackFilePath = `${dir}/Microscopy_TA/database/feedback.json`
        const filePath = `${dir}/Microscopy_TA/database/database.json`

        const annoArray = await getArrayObject("annotations.json")
        const feedbackArray = await getArrayObject("feedback.json")
        const dataArray = await getArrayObject("database.json")

        for(const anno of annotations) {
            const index = annoArray.findIndex(item => item._id === anno._id)
            if (index !== -1) {
                if(new Date(anno.updatedAt) > new Date(annoArray[index].updatedAt)){
                    annoArray[index] = {
                        ...annoArray[index],
                        annotations: anno.annotations,
                        shared_with: anno.shared_with,
                        shared_with_team: anno.shared_with_team,
                        updatedAt: anno.updatedAt
                    }
                }
            }
            else {
                annoArray.push({
                  ...anno
                })
            }
        }

        for(const feed of feedback) {
            const index = feedbackArray.findIndex(item => item._id === feed._id)
            if (index !== -1) {
                if(new Date(feed.updatedAt) > new Date(feedbackArray[index].updatedAt)){
                    feedbackArray[index] = {
                        ...feedbackArray[index],
                        annotations: feedback.annotations,
                        updatedAt: feedback.updatedAt
                    }
                }
            }
            else {
                feedbackArray.push({
                  ...feedback
                })
            }
        }

        // annoArray.push(...combined)
        // feedbackArray.push(...feedback)
        await writeFile(annoFilePath, JSON.stringify(annoArray, null, 2), 'utf8');
        await writeFile(feedbackFilePath, JSON.stringify(feedbackArray, null, 2), 'utf8');

        if (!!combined.length){
             const newDataArray = dataArray.map(obj =>
                obj._id === fileId ? { ...obj, isAnnotated: true, updatedAt: Date.now() } : obj
            )
            await writeFile(filePath, JSON.stringify(newDataArray, null, 2), 'utf8');
        }

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

export async function handleInstructionsDownload(instructionsList){
    const dir = loadPath()
    if (!dir) {
        return { success: false, error: "Failed to load primary directory" }
    }
    const instFilePath = `${dir}/Microscopy_TA/database/instructions.json`
    let instArray = await getArrayObject("instructions.json")

    // console.log(instructionsList)
    for(const inst of instructionsList) {
        const index = instArray.findIndex(item => item._id === inst._id)
        if (index !== -1) {
            if(new Date(inst.updatedAt) > new Date(instArray[index].updatedAt)){
                instArray[index] = {
                    ...instArray[index],
                    instructions: inst.instructions
                }
            }
        }
        else {
            instArray.push({
              ...inst
            })
        }
    }

    await atomicWrite(instFilePath, instArray)

}

export async function handleBatchAnnotationsDownload(pairs){
    return annotationMutex.runExclusive(async () => {

        const dir = loadPath()
        if (!dir) {
            return { success: false, error: "Failed to load primary directory" }
        }
        const annoFilePath = `${dir}/Microscopy_TA/database/annotations.json`
        const feedbackFilePath = `${dir}/Microscopy_TA/database/feedback.json`
        const filePath = `${dir}/Microscopy_TA/database/database.json`

        // ✅ Load once
        const [annoArray, feedbackArray, dataArray] = await Promise.all([
            getArrayObject("annotations.json"),
            getArrayObject("feedback.json"),
            getArrayObject("database.json")
        ])

        // console.log("=========================================")
        // console.log("=========================================")
        // console.log("=========================================")
        // console.log(pairs)
        for (const { object, fileId } of pairs) {
            applyAnnotations({annoArray, feedbackArray, dataArray}, object, fileId)
        }

        await Promise.all([
            atomicWrite(annoFilePath, annoArray),
            atomicWrite(feedbackFilePath, feedbackArray),
            atomicWrite(filePath, dataArray)
        ])

        return {
            success: true,
            message: "Annotations saved successfully"
        }
    })
}

function applyAnnotations(state, object, fileId) {
    const { annotations, feedback } = object
    const {annoArray, feedbackArray, dataArray} = state

    for(const anno of annotations) {
        const index = annoArray.findIndex(item => item._id === anno._id)
        if (index !== -1) {
            if(new Date(anno.updatedAt) > new Date(annoArray[index].updatedAt)){
                annoArray[index] = {
                    ...annoArray[index],
                    annotations: anno.annotations,
                    shared_with: anno.shared_with,
                    shared_with_team: anno.shared_with_team,
                    updatedAt: anno.updatedAt
                }
            }
        }
        else {
            annoArray.push({
              ...anno
            })
        }
    }

    for(const feed of feedback) {
        // console.log(feed)
        const index = feedbackArray.findIndex(item => item._id === feed._id)
        if (index !== -1) {
            if(new Date(feed.updatedAt) > new Date(feedbackArray[index].updatedAt)){
                feedbackArray[index] = {
                    ...feedbackArray[index],
                    annotations: feed.annotations,
                    updatedAt: feed.updatedAt
                }
            }
        }
        else {
            feedbackArray.push({
              ...feed
            })
        }
    }

    // console.log(fileId)
    // console.log(annotations)
    // console.log(annotations.length)
    if (!!annotations.length){
        // console.log("Yes")
        const index = dataArray.findIndex(item => item._id === fileId)
        if (index !== -1){
            dataArray[index] = {
                ...dataArray[index],
                isAnnotated: true,
                updatedAt: Date.now()
            }
        }
    }
}

async function atomicWrite(path, data) {
    const tempPath = `${path}.tmp`
    await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf8')
    await rename(tempPath, path)
}

//upload annotations and feedback of an image
export async function getAllAnnotations(imageId) {
    try {
         const annoArray = await getArrayObject("annotations.json")
         const feedbackArray = await getArrayObject("feedback.json")

        let annotations = []
        let feedback = []

        annotations = annoArray.filter(item => item.imageId === imageId)

        const annoIds = annotations.map(item => item._id)
        feedback = feedbackArray.filter(item => annoIds.includes(item.annotationId))

        return {
            success: true,
            data: {
                annotations,
                feedback
            }
        }

    }catch (error) {
        return {
            success: false,
            error: `Error: ${error.message}`
        }
    }
}

export async function getInstructions(fileId) {
    try {
        const instArray = await getArrayObject("Instructions.json")
        const instructions = instArray.find(inst => inst.file._id === fileId)
        return {
            success: true,
            file: instructions
        }
    }catch (error) {
        return {
            success: false,
            error: `Error: ${error.message}`
        }
    }
}