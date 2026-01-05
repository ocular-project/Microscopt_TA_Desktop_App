import styles from "../css/image.module.css"
import axiosInstance from "../../../../utils/files/axiosInstance.js";
import {handleMessage} from "../../../../utils/repeating.js";
import {formatDate} from "../../../../utils/files/FormatDate.js";
import {useState} from "react";
export default function Annotations({ primary, setPrimary, setAnnotations, setMessage, setLoader, setBtn, setCanEdit,
                                        setSec, cred }) {

    const [visible, setVisible] = useState(0);

    function handleLoad(primary, index) {
        setAnnotations(primary.annotations)
        setVisible(index)
        if (index === 0 && cred?.email === primary.annotator.email) {
            setBtn("save")
            setCanEdit(true)
            setSec("")
        }
        else {
            setBtn("feed")
            setCanEdit(false)
            setSec(primary._id)
        }
    }

    async function handleDelete(primary) {
        setLoader(true)
        try {
            const response = await axiosInstance.delete('delete-annotations', {
                params: {
                    annotationId: primary._id,
                    imageId: primary.imageId._id
                }
             })
            setAnnotations([])
            setPrimary({})
        }
        catch (err) {
            const error = err.response?.data.error
            handleMessage(error, "error", setMessage)
        }
        finally {
            setLoader(false)
        }
    }

    return (
        <div>
            {
                !!primary.length && primary.map((pri, index) => (
                    <div className={`${styles.anno} ${visible === index ? styles.active : ''}`}>
                        <div className={styles.anno1}>
                            <h4>{pri.annotator.email}</h4>
                            <p>{formatDate(pri.updatedAt)}</p>
                        </div>
                        <div className={styles.anno2}>
                            <span onClick={() => handleLoad(pri, index)}>Load</span>
                            {
                               pri.annotator.email === "me" && (
                                   <span onClick={() => handleDelete(pri)}>Delete</span>
                                )
                            }
                        </div>
                    </div>
                ))
            }
        </div>
    )
}