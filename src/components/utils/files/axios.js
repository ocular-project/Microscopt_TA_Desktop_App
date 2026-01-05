import axios from "axios";

const axioss = axios.create({
    baseURL: 'http://localhost:3001/api/'
})

axioss.interceptors.request.use(
    (config) => {
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default axioss