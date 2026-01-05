export const getBaseUrl = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');

    // console.log(isElectron)
    if (isElectron) {
        // return import.meta.env.VITE_ELECTRON_BASE_URL || 'https://microscopybackend.ippe.ug'
        return import.meta.env.VITE_ELECTRON_BASE_URL || 'http://localhost:3001'
    } else {
        // return import.meta.env.VITE_BASE_URL || 'https://expressbackend.ocular-project.com'
        return import.meta.env.VITE_BASE_URL || 'http://localhost:3001'
    }
}

export const config = () => {
    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    return isElectron;
}
