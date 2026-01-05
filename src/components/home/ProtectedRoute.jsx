import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { checkSession } from '../utils/files/sessionCheck.js';
import styles from "../css/general.module.css"

export const ProtectedRoute = ({ children }) => {
    const [loader, setLoader] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const verifySession = async () => {
            try {
                const isValid = await checkSession();
                setIsAuthenticated(isValid)
            }catch (err) {
                setIsAuthenticated(false)
            }finally {
                setLoader(false)
            }
        }

        verifySession()

        const intervalId = setInterval(async  () => {
            const isValid = await checkSession()
            if (isValid) {
                navigate('/login')
            }
        }, 60 * 60 * 1000);

        return () => clearInterval(intervalId)

    }, [navigate]);

    if(loader) {
        return (
            <div className={styles.load}>
                <div className={styles.loadDiv}>
                    <div className={`${styles.loader} ${loader ? styles.active : ""}`}></div>
                </div>
            </div>
        )
    }

    return isAuthenticated ? children : <Navigate to="/login" />

}

export default ProtectedRoute