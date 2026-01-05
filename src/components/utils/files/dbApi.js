const isElectron = window.electronAPI !== undefined;
import {checkElectron, handleError} from "../repeating"

const dbApi = {
    dialog: {
         async openFile(options) {
            checkElectron(isElectron)

            try {
                return await window.electronAPI.dialog.openFile(options);
              } catch (error) {
                handleError(error)
              }
        },
    },

    fs: {
        async stat(filePath) {
           checkElectron(isElectron)

            try {
                return await window.electronAPI.fs.stat(filePath);
            } catch (error) {
                handleError(error)
            }
        },

        async getImageDataUrl(filePath) {
           checkElectron(isElectron)

            try {
                return await window.electronAPI.fs.getImageDataUrl(filePath);
            } catch (error) {
                handleError(error)
            }
        }
    }
}

export default dbApi