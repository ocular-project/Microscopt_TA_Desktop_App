import styles from "../../css/general.module.css";
import {faArrowUpFromBracket, faCheck, faExclamation, faXmark} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {useEffect, useRef, useState} from "react";

export default function Success({ message, setMessage }){

    const intervalRef = useRef(null);

    useEffect(() => {
        // If there are no messages, clear the interval
        if (message.length === 0) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            return;
        }

        // If interval is already running, do nothing
        if (intervalRef.current) return;

        // Start interval
        intervalRef.current = setInterval(() => {
            setMessage(prev => {
                const updated = prev.slice(0, -1); // FIFO: remove first message
                if (updated.length === 0) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
                return updated;
            });
        }, 3000);

        // Cleanup when component unmounts
        return () => {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        };
    }, [message]);

    const handleClose = (id) => {
        setMessage(prev => prev.filter((msg, index) => index !== id))
    }

    return (
        <div className={styles.popDiv}>
            {
                !!message.length && message.map((msg, index) => (
                    <div key={index} className={styles.pop}>
                        <div className={styles.popLeft}>
                            <div>
                                <span className={`${styles.popSpan} ${msg.status === "success" ? styles.success : msg.status === "warning" ? styles.warning : msg.status === "info" ? styles.info : styles.danger}`}>
                                    {
                                        msg.status === "success" ? (
                                            <FontAwesomeIcon icon={faCheck} />
                                        ) : msg.status === "warning" ? (
                                            <FontAwesomeIcon icon={faExclamation} />
                                        ) : msg.status === "info" ? (
                                            <FontAwesomeIcon icon={faArrowUpFromBracket} />
                                        ) : (
                                            <FontAwesomeIcon icon={faXmark} />
                                        )
                                    }

                                </span>
                            </div>
                            <p>
                                {
                                    msg.message
                                }
                            </p>
                        </div>
                        <div>
                            <span className={styles.popClose} onClick={() => handleClose(index)}>
                              <FontAwesomeIcon icon={faXmark} />
                            </span>
                        </div>
                    </div>
                ))
            }
        </div>
        // <>
        //     {
        //         !!(message?.messages && message.messages.length) ? (
        //             <div className={styles.popList}>
        //                 {
        //                     message.messages.map((msg, index) => (
        //                         <div key={index} className={`${styles.pop} ${msg.show ? styles.active : ""}`}>
        //                             <span className={styles.popClose} onClick={handleClose}>
        //                                 <FontAwesomeIcon icon={faXmark} />
        //                             </span>
        //                             <div className={`${styles.popText} ${msg.status === "success" ? styles.success : msg.status === "warning" ? styles.warning : styles.danger}`}>
        //                                 <span>
        //                                     {
        //                                         msg.status === "success" ? (
        //                                             <FontAwesomeIcon icon={faCheck} />
        //                                         ) : msg.status === "warning" ? (
        //                                             <FontAwesomeIcon icon={faExclamation} />
        //                                         ) : msg.status === "info" ? (
        //                                             <FontAwesomeIcon icon={faArrowUpFromBracket} />
        //                                         ) : (
        //                                             <FontAwesomeIcon icon={faXmark} />
        //                                         )
        //                                     }
        //
        //                                 </span>
        //                                 <p>
        //                                     {
        //                                         msg.message
        //                                     }
        //                                 </p>
        //                             </div>
        //                         </div>
        //                     ))
        //                 }
        //
        //             </div>
        //         ) : (
        //             <div className={`${styles.pop} ${message.show ? styles.active : ""}`}>
        //                 <span className={styles.popClose} onClick={handleClose}>
        //                     <FontAwesomeIcon icon={faXmark} />
        //                 </span>
        //                 <div className={`${styles.popText} ${message.status === "success" ? styles.success : message.status === "warning" ? styles.warning : styles.danger}`}>
        //                     <span>
        //                         {
        //                             message.status === "success" ? (
        //                                 <FontAwesomeIcon icon={faCheck} />
        //                             ) : message.status === "warning" ? (
        //                                 <FontAwesomeIcon icon={faExclamation} />
        //                             ) : message.status === "info" ? (
        //                                 <FontAwesomeIcon icon={faArrowUpFromBracket} />
        //                             ) : (
        //                                 <FontAwesomeIcon icon={faXmark} />
        //                             )
        //                         }
        //
        //                     </span>
        //                     <p>
        //                         {
        //                             message.message
        //                         }
        //                     </p>
        //                 </div>
        //             </div>
        //         )
        //     }
        // </>
    )
}