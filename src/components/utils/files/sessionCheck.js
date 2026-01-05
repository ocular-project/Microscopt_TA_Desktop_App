import axiosInstance from "./axiosInstance.js";

export const checkSession = async () => {
    try {
        const response = await axiosInstance.get('check-session')
        // console.log("Response", response)
        return response.data.isValid
    }catch (err) {
        // console.log("Error", err)
        return false
    }
}