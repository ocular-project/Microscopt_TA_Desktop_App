import styles from "./css/sidebar.module.css"
import {NavLink, useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDesktop, faHouse, faLink, faUserGroup, faUsers} from "@fortawesome/free-solid-svg-icons";
import {faFolder} from "@fortawesome/free-regular-svg-icons/faFolder";
import {useEffect} from "react";
import {faMobileScreen} from "@fortawesome/free-solid-svg-icons/faMobileScreen";
import { configg } from "../utils/files/config.js";

export default function Sidebar({ cat, config }){

    const navigate = useNavigate()
    const getClassName = (category) => {
        if (category === cat) {
            return `${styles.listLink} ${styles.active}`;
        }
        return `${styles.listLink}`;
        // const currentPath = location.pathname;
        //
        // const excludedPaths = ['/teams'];
        // const isSharedFilesPath = currentPath.startsWith('/sharedFiles');
        // const isRootPath = currentPath === '/' || currentPath === '';
        //
        // const isExcludedPath = excludedPaths.some(excludedPath =>
        //     currentPath.startsWith(excludedPath)
        // );
        //
        // if (path.startsWith("/sharedFiles")) {
        //     return `${styles.listLink} ${isSharedFilesPath ? styles.active : ''}`;
        // }
        // if (path === '/' || path === '') {
        //     return `${styles.listLink} ${(isRootPath || (!isExcludedPath && !isSharedFilesPath)) ? styles.active : ''}`;
        // }
        // return `${styles.listLink} ${currentPath === path ? styles.active : ''}`;
    };

   const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `./${relativePath}`;
    };

    useEffect(() => {
        const currentPath = location.pathname
    }, [cat]);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.imgDiv}>
                    <img src={getAssetPath('images/logo.png')}  alt="" className={styles.img} />
                </div>

                <div className={styles.textDiv}>
                    <h1>Ocular's</h1>
                    <p>Microscopy Teaching Aid</p>
                </div>
            </div>

            <div className={styles.list}>
                <ul>
                    {
                        configg() ? (
                            <>
                                <li>
                                    <NavLink to="/" className={getClassName("computer")}>
                                        <div className={styles.linkDiv}>
                                            <FontAwesomeIcon icon={faDesktop} />
                                            <span>My Computer</span>
                                        </div>
                                    </NavLink>
                                </li>
                                <li>
                                    <div className={styles.divider}>

                                    </div>
                                </li>
                                <li>
                                    <NavLink to="/collaboration" className={getClassName("folder")}>
                                        <div className={styles.linkDiv}>
                                            <FontAwesomeIcon icon={faFolder} />
                                            <span>My Drive</span>
                                        </div>
                                    </NavLink>
                                </li>
                            </>
                        ) : (
                            <li>
                                <NavLink to="/" className={getClassName("folder")}>
                                    <div className={styles.linkDiv}>
                                        <FontAwesomeIcon icon={faHouse} />
                                        <span>Home</span>
                                    </div>
                                </NavLink>
                            </li>
                        )
                    }

                    <li>
                         <NavLink to="/sharedFiles" className={getClassName("shared")}>
                            <div className={styles.linkDiv}>
                                <FontAwesomeIcon icon={faUserGroup} />
                                <span>Shared Files</span>
                            </div>
                        </NavLink>
                    </li>
                    <li>
                        <NavLink to="/teams" className={getClassName("team")}>
                            <div className={styles.linkDiv}>
                                <FontAwesomeIcon icon={faUsers} />
                                <span>Teams</span>
                            </div>
                        </NavLink>
                    </li>
                </ul>
            </div>
        </div>
    )
}