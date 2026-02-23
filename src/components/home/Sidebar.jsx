import styles from "./css/sidebar.module.css"
import {NavLink, useNavigate} from "react-router-dom";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faDesktop, faHouse, faLink, faUserGroup, faUsers} from "@fortawesome/free-solid-svg-icons";
import {faFolder} from "@fortawesome/free-regular-svg-icons/faFolder";
import {useEffect, useMemo} from "react";
import {faMobileScreen} from "@fortawesome/free-solid-svg-icons/faMobileScreen";
import { configg } from "../utils/files/config.js";
import {IoIosCloudOutline} from "react-icons/io";

export default function Sidebar({ cat, config, quota }){

    const navigate = useNavigate()
    const getClassName = (category) => {
        if (category === cat) {
            return `${styles.listLink} ${styles.active}`;
        }
        return `${styles.listLink}`;
    };

   const getAssetPath = (relativePath) => {
      const isDev = process.env.NODE_ENV === 'development';

      return isDev ? `/${relativePath}` : `./${relativePath}`;
    };

    useEffect(() => {
        const currentPath = location.pathname
    }, [cat]);

     const { usedGB, totalGB, percentage } = useMemo(() => {
      if (!quota) return { usedGB: 0, totalGB: 0, percentage: 0 }

      return {
            usedGB: (quota.usedBytes / (1024 ** 3)).toFixed(2),
            totalGB: (quota.totalBytes / (1024 ** 3)).toFixed(0),
            percentage: Math.min(
              Math.round((quota.usedBytes / quota.totalBytes) * 100),
              100
            )
          }
      }, [quota])

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

            {
                quota && (
                    <div className={styles.card}>
                      <div className={styles.headerX}>
                        <IoIosCloudOutline />
                        <span className={styles.title}>
                          Storage ({percentage}% full)
                        </span>
                      </div>

                      <div className={styles.bar}>
                        <div
                          className={styles.fill}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>

                      <div className={styles.text}>
                        {usedGB} GB of {totalGB} GB used
                      </div>
                    </div>
                )
            }
        </div>
    )
}