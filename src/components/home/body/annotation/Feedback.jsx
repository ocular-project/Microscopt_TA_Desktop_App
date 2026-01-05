import styles from "./css/image.module.css";
import {useEffect, useState} from "react";
import { capitalizeFirstLetter } from "../../../utils/functions.jsx"

export default function Feedback({ annotations, setAnnotations, index, setSelectedBoxIndex, cred, feedback,
                                     setFeedback, setAllow, feed }){

    const boxId = annotations[index]?.boxId;

    const label = feedback.find(f => f.boxId === boxId)?.label || "";

    const handleChange = (e) => {
        const newLabel = e.target.value;
        setFeedback(prev => {
            const idx = prev.findIndex(item => item.boxId === boxId);
            if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = { ...updated[idx], label: newLabel };
                return updated;
            }
            return [...prev, { boxId, label: newLabel }];
        });
    };

    function deleteFeedback(index) {
        const boxIdToDelete = annotations[index]?.boxId;

        if (!boxIdToDelete) {
            // If there's no boxId, there's nothing to delete.
            console.warn("No box ID found for feedback to delete.");
            return;
        }

        // Update the state by filtering out the feedback item with the matching boxId
        setFeedback(prev => prev.filter(item => item.boxId !== boxIdToDelete));

        // Deselect the box after deletion, if desired
        setSelectedBoxIndex(-1);
    }

    useEffect(() => {
        console.log(feed.length)
    }, []);

    return (
        <>
            {
                !!feed.length ? (
                   <div>
                       <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                             <label
                                 htmlFor={`label-${index}`}
                                 style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '12px' }}
                             >
                                 Annotation label:
                             </label>
                             <input
                                 id={`label-${index}`}
                                 type={"text"}
                                 style={{
                                     width: '100%',
                                     padding: '8px',
                                     border: '1px solid #ddd',
                                     borderRadius: '4px'
                                 }}
                                 value={annotations[index]?.label || ""}
                                 disabled={true}
                             />
                       </div>
                       <div className={styles.feedDiv}>
                             <label
                                 style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '12px' }}
                             >
                                 Feedback:
                             </label>
                            <ul>
                                {
                                    feed.map((fb) => {
                                        if(fb.boxId === annotations[index].boxId) {
                                            return fb.feedback.map((item, index) => (
                                                <li key={index}>
                                                    <div className={styles.feedListDiv}>
                                                        <div>{capitalizeFirstLetter(item.responder.firstName)} {capitalizeFirstLetter(item.responder.lastName)}</div>
                                                        <div>{item.label}</div>
                                                    </div>
                                                </li>
                                            ))
                                        }
                                         return null
                                    })

                                }
                            </ul>
                        </div>
                   </div>
                ) : (
                   <div>
                         <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                             <label
                                 htmlFor={`label-${index}`}
                                 style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}
                             >
                                 Feedback:
                             </label>
                             <input
                                 id={`label-${index}`}
                                 type={"text"}
                                 style={{
                                     width: '100%',
                                     padding: '8px',
                                     border: '1px solid #ddd',
                                     borderRadius: '4px'
                                 }}
                                 // value={annotations[index]?.boxId || "yeap"}
                                 value={label}
                                 // value="this"
                                 onChange={handleChange}
                                 placeholder="Enter feedback"
                             />
                        </div>
                         <div style={{ display:'flex', justifyContent: 'space-between' }}>
                            <button
                              onClick={() => setSelectedBoxIndex(-1)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#f0f0f0',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Done
                            </button>

                            <button
                              onClick={(e) => {
                                  e.stopPropagation()
                                  deleteFeedback(index)
                              }}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#ff5555',
                                color: 'white',
                                border: '1px solid #ff0000',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              Delete
                            </button>
                         </div>
                   </div>
                )
            }
        </>

        // <>
        //     {
        //         feedback.length > 0 ? (
        //             <>
        //                 <div style={{ marginBottom: '8px', textAlign: 'left' }}>
        //                      <label
        //                          htmlFor={`label-${index}`}
        //                          style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '12px' }}
        //                      >
        //                          annotation label:
        //                      </label>
        //                      <input
        //                          id={`label-${index}`}
        //                          type={"text"}
        //                          style={{
        //                              width: '100%',
        //                              padding: '8px',
        //                              border: '1px solid #ddd',
        //                              borderRadius: '4px'
        //                          }}
        //                          value={annotations[index]?.label || ""}
        //                          disabled={true}
        //                      />
        //                 </div>
        //                 <div className={styles.feedDiv}>
        //                      <label
        //                          style={{ display: 'block', marginBottom: '10px', fontWeight: '500', fontSize: '12px' }}
        //                      >
        //                          Feedback:
        //                      </label>
        //                     <ul>
        //                         {
        //                             feedback.map((fb) => {
        //                                 if(fb.id === annotations[index].id) {
        //                                     return fb.feedbacks.map((item, index) => (
        //                                         <li key={index}>
        //                                             <div className={styles.feedListDiv}>
        //                                                 <div>{capitalizeFirstLetter(item.firstName)} {capitalizeFirstLetter(item.lastName)}</div>
        //                                                 <div>{item.label}</div>
        //                                             </div>
        //                                         </li>
        //                                     ))
        //                                 }
        //                                  return null
        //                             })
        //
        //                         }
        //                     </ul>
        //                 </div>
        //             </>
        //         ) : (
        //             <>
        //                 <div style={{ marginBottom: '8px', textAlign: 'left' }}>
        //                      <label
        //                          htmlFor={`label-${index}`}
        //                          style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}
        //                      >
        //                          Feedback:
        //                      </label>
        //                      <input
        //                          id={`label-${index}`}
        //                          type={"text"}
        //                          style={{
        //                              width: '100%',
        //                              padding: '8px',
        //                              border: '1px solid #ddd',
        //                              borderRadius: '4px'
        //                          }}
        //                          value={annotations[index]?.feedback?.label || ""}
        //                          onChange={(e) => handleChange(index, e.target.value)}
        //                          placeholder="Enter feedback"
        //                      />
        //                 </div>
        //                 <div style={{ display:'flex', justifyContent: 'space-between' }}>
        //                     <button
        //                       onClick={() => setSelectedBoxIndex(-1)}
        //                       style={{
        //                         padding: '6px 12px',
        //                         backgroundColor: '#f0f0f0',
        //                         border: '1px solid #ccc',
        //                         borderRadius: '4px',
        //                         cursor: 'pointer'
        //                       }}
        //                     >
        //                       Done
        //                     </button>
        //
        //                     <button
        //                       onClick={(e) => {
        //                           e.stopPropagation()
        //                           deleteFeedback(index)
        //                       }}
        //                       style={{
        //                         padding: '6px 12px',
        //                         backgroundColor: '#ff5555',
        //                         color: 'white',
        //                         border: '1px solid #ff0000',
        //                         borderRadius: '4px',
        //                         cursor: 'pointer'
        //                       }}
        //                     >
        //                       Delete
        //                     </button>
        //                  </div>
        //             </>
        //         )
        //      }
        //
        // </>
    )
}