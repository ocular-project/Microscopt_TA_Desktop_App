import axiosInstance from "./axiosInstance.js";
import {handleBack, handleMessage} from "../repeating.js";

export const fetchTeamsData = async (setLoader, setTeams, setMessage) => {
    setLoader(true);
    try {
        const response = await axiosInstance.get('teams');
        // console.log(response.data);
        setTeams(response.data);
    } catch (err) {
        console.log(err.response);
        const error = err.response?.data?.error || 'An error occurred'
        setMessage({show: true, message:  error, status: "error"})
    } finally {
        setLoader(false);
    }
}

export async function refreshQuota(setQuota, setMessage, setLoader) {
    try {
        const response = await axiosInstance.get('user/quota')
        // console.log(response)
        setQuota(response.data)
    }catch (err) {
        console.log(err)
        const error = err.response?.data?.error || 'An error occurred'
        setMessage({show: true, message:  error, status: "error"})
    }finally {
        setLoader(false)
    }
}

export const getUserData = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
}

export const getBoxId = () => {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export const getFirstLetter = (first) => {
    const fs = first ? first.charAt(0).toUpperCase() : "-";
    return `${fs}`;
};

export async function handleLoading(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator, setFeedback) {
    setLoader(true)
    try {
        let response
        if (cat === "computer"){
            console.log(item._id)
            console.log(cred)
            response = await window.electronAPI.getMyAnnotations(item._id, cred)
            if (!response.success) {
                console.log(response.error)
                 handleMessage(response.error, "error", setMessage)
                return
            }
            // console.log(response)
        }
        else {
            response = await axiosInstance.get(`/annotations/${item._id}`)
        }
        // const response = await axiosInstance.get(`/annotations/${item._id}`)
        const dat = response.data
        const data = dat.file
        // console.log(data)
        setAccess({ shared_with: data.shared_with, shared_with_team: data.shared_with_team })
        setAnnotations(data.annotations)
        // console.log(response.data.annotations)
        if (item.annotator.email === cred.email){
            setMsg("Loaded my annotations")
        }
        else {
            setAnnotator({ owner: item.annotator._id, annoId: item._id})
            setMsg(`Loaded ${item.annotator.firstName}'s annotations`)
        }

        // console.log(dat.feedback)
        const feed = dat.feedback
        if (feed && !!feed.length) {
            setFeedback(feed)
        }

        setOther(bool)
        setFeed(false)
        setBack(false)
        setSelected(item._id)
    }catch (err) {
       console.log(err)
       const error = err.response.data.error
       handleMessage(error, "error", setMessage)
   }finally {
       setLoader(false)
   }
}

export async function handleLoad2ing(cat, item, bool, setLoader, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg, setAnnotator) {
     setLoader(true)
     try {
        let response
         if (cat === "computer") {
             response = await window.electronAPI.getMyFeedback(item.feedbackId)
             if(!response.success){
                 console.log(response.error)
                 handleMessage(response.error, "error", setMessage)
                 return
             }
             // console.log(response.data.feedback)
             const data = response.data.feedback
             setAnnotations(data.annotations)
             setAnnotator({ owner: data.owner._id, annoId: data.annotationId })
         }
         else {
             response = await axiosInstance.get(`/annotations-feedback/${item.feedbackId}`)
             const data = response.data
             console.log(data)
             // const data = dat.file

            // setAccess({ shared_with: data.shared_with, shared_with_team: data.shared_with_team })
            setAnnotations(data.annotations)
             setAnnotator({ owner: data.annotator, annoId: data.annotationId })
         }
         setMsg("Loaded my feedback")

        setOther(bool)
        setFeed(false)
         setSelected(item._id)
    }catch (err) {
       console.log(err)
       const error = err.response.data.error
       handleMessage(error, "error", setMessage)
   }finally {
       setLoader(false)
   }
}

export async function handleLoadFeedbacking(cat, fb, setLoader, setAnnotator, setAccess, setAnnotations, setOther, setFeed, setBack, setSelected, cred, setMessage, setMsg) {
    setLoader(true)
    try {
        let response
        if (cat === "computer"){
            response = await window.electronAPI.getAnnotatorFeedback(fb._id, cred)
            if (!response.success) {
                 handleMessage(response.error, "error", setMessage)
                return
            }
            // console.log("asas",response)
            const data = response.data.feedback
            setAnnotations(data.annotations)
            setAnnotator({ owner: data.owner._id, annoId: data.annotationId })
        }
        else {
            response = await axiosInstance.get(`/feedback/${fb._id}`)
            setAnnotations(response.data.annotations)
        }
        setFeed(true)
        setMsg(`Loaded ${fb.owner.firstName}'s feedback`)
        setBack(true)
        setSelected(fb._id)
    }catch (err) {
       console.log(err)
       const error = err.response.data.error
       handleMessage(error, "error", setMessage)
   }finally {
       setLoader(false)
   }
}

 export async function handleUploading(setLoader, fileId, setMessage, navigate) {
        setLoader(true)
        try {
            const response = await window.electronAPI.getAllAnnotations(fileId)

            const data = response.data
            if (!data.annotations.length && !data.feedback.length){
                handleMessage("There are no annotations or annotation feedback to upload", "warning", setMessage);
                return
            }

            if (!response.success){
                console.log(response.error)
                handleMessage(`Error: ${response.error}`, "error", setMessage);
            }
            const obj = {
                imageId: fileId,
                annotations: data.annotations,
                feedback: data.feedback
            }

            // console.log(obj)
            const expressResponse = await axiosInstance.post('desktop/uploadAllAnnotations', obj)
            handleMessage(expressResponse.data.message, "success", setMessage);
            setTimeout(() => {
                handleBack(navigate)
            }, 500)
        }catch (error) {
            console.log(error)
            handleMessage(`Error: ${error.response?.data?.error || error}`, "error", setMessage);
        }finally {
            setLoader(false)
        }
    }
