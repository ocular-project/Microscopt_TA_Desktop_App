import axiosInstance from "./axiosInstance.js";

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