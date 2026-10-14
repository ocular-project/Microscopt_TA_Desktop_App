import axios from "axios";
import {getBaseUrl} from "./config";

const axiosInstance = axios.create({
    baseURL: `http://localhost:3001/api/`,
    // baseURL: `https://expressbackend.ocular-project.com/api/`,
    withCredentials:true
})

axiosInstance.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default axiosInstance