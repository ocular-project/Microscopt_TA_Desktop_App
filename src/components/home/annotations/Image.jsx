import styles from "../../css/annotation.module.css";
import css from "../../css/general.module.css";
import style from "./css/image.module.css";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {GoZoomIn} from "react-icons/go";

const HANDLE_SIZE = 8;
const MIN_BOX_SIZE = 0.002;
const POINTER_SIZE = 20;

function clamp(val, min, max) {
 return Math.min(Math.max(val, min), max);
}

export default function Image({ loader, file, SIDEBAR_WIDTH, zoom, setZoom, setImageSize, imageRef, imageSize, ZOOM_STEP,
                                  labels, fitImageToViewport, setAnnotations, annotations, cred, feed, visual,
                                  setIsClosed, width, containerRe, cat, containerRef, setSharedAction }){

     const [selectedIndex, setSelectedIndex] = useState(null);
     const [action, setAction] = useState(null); // 'draw', 'move', 'resize'
     const [resizeHandle, setResizeHandle] = useState(null);
     const [startPoint, setStartPoint] = useState(null);
     const [inputLabel, setInputLabel] = useState("");
     const [feedbackLabel, setFeedbackLabel] = useState("");

     const canvasRef = useRef(null);
     const stageRef = useRef(null);

    // Utility: get normalized coords inside canvas
     const getNormalizedCoordinates = (e) => {
       const rect = canvasRef.current.getBoundingClientRect();
       const x = (e.clientX - rect.left) / rect.width;
       const y = (e.clientY - rect.top) / rect.height;
       return { x, y };
     };

     // Draw pointer shape
     const drawPointer = (ctx, x, y, isSelected, strokeColor) => {
       const px = x * ctx.canvas.width;
       const py = y * ctx.canvas.height;

       const getPointerSize = () => POINTER_SIZE / zoom;
       const size = getPointerSize()

       ctx.fillStyle = isSelected ? '#00ff00' : strokeColor;
       ctx.strokeStyle = '#ffffff';
       ctx.lineWidth = 2 / zoom;

       ctx.beginPath();
       // Create cursor pointer shape
       ctx.moveTo(px, py); // tip
       ctx.lineTo(px, py + size); // bottom of shaft
       ctx.lineTo(px + size * 0.4, py + size * 0.7);
       ctx.lineTo(px + size * 0.6, py + size * 0.7);
       ctx.lineTo(px + size * 0.3, py + size * 0.45);
       ctx.closePath();

       ctx.fill();
       ctx.stroke();
     };

     // Check if point is inside pointer
     const pointInPointer = (px, py, pointer) => {
        const getPointerSize = () => POINTER_SIZE / zoom;
        const size = getPointerSize();

        const pointerPx = pointer.x * canvasRef.current.width;
        const pointerPy = pointer.y * canvasRef.current.height;

        return (
            px >= pointerPx &&
            px <= pointerPx + size * 0.6 &&
            py >= pointerPy &&
            py <= pointerPy + size
        );
     };

     // Draw resize handles on selected box
     const drawHandles = (ctx, x1, y1, x2, y2) => {
       const left = Math.min(x1, x2);
       const top = Math.min(y1, y2);
       const right = Math.max(x1, x2);
       const bottom = Math.max(y1, y2);

       const handles = [
         { x: left, y: top, cursor: "nwse-resize", name: "tl" },
         { x: right, y: top, cursor: "nesw-resize", name: "tr" },
         { x: right, y: bottom, cursor: "nwse-resize", name: "br" },
         { x: left, y: bottom, cursor: "nesw-resize", name: "bl" },
         { x: (left + right) / 2, y: top, cursor: "ns-resize", name: "top" },
         { x: right, y: (top + bottom) / 2, cursor: "ew-resize", name: "right" },
         { x: (left + right) / 2, y: bottom, cursor: "ns-resize", name: "bottom" },
         { x: left, y: (top + bottom) / 2, cursor: "ew-resize", name: "left" },
       ];

       if (!feed) {

          const handleSize = HANDLE_SIZE / zoom;

          ctx.fillStyle = "white";
          ctx.strokeStyle = "black";
          handles.forEach((h) => {
            const px = h.x * ctx.canvas.width;
            const py = h.y * ctx.canvas.height;
            ctx.beginPath();
            ctx.rect(
                px - handleSize / 2,
                py - handleSize / 2,
                handleSize,
                handleSize
            );
            ctx.fill();
            ctx.stroke();
          });
       }

       return handles;
     };

     // Find if point is on a handle
     const getHandleUnderPoint = (handles, px, py) => {
       const handleSize = HANDLE_SIZE / zoom;

        return handles.find((h) => {
            const hx = h.x * canvasRef.current.width;
            const hy = h.y * canvasRef.current.height;

            return (
                px >= hx - handleSize &&
                px <= hx + handleSize &&
                py >= hy - handleSize &&
                py <= hy + handleSize
            );
        });
     };

     // Check if point inside box
     const pointInBox = (px, py, box) => {
       if (box.type === 'pointer') {
         return pointInPointer(px, py, box);
       }

       const x1 = Math.min(box.x1, box.x2) * canvasRef.current.width;
       const y1 = Math.min(box.y1, box.y2) * canvasRef.current.height;
       const x2 = Math.max(box.x1, box.x2) * canvasRef.current.width;
       const y2 = Math.max(box.y1, box.y2) * canvasRef.current.height;
       return px > x1 && px < x2 && py > y1 && py < y2;
     };

     // Redraw all annotations and handles
     const redrawCanvas = useCallback(() => {
       const canvas = canvasRef.current;
       if (!canvas) return;
       const ctx = canvas.getContext("2d");
       ctx.clearRect(0, 0, canvas.width, canvas.height);
       const labelFontSize = 14 / zoom;
       ctx.font = `${labelFontSize}px Arial`;
       ctx.textBaseline = "top";

       annotations.forEach((annotation, i) => {
         let strokeColor;
         if (feed) {
           if (i === selectedIndex) {
             strokeColor = annotation.owner === cred._id ? "black" : "red";
           } else {
             strokeColor = annotation.owner === cred._id ? "#F69220" : "blue";
           }
         } else {
           strokeColor = "#F69220";
         }

         if (annotation.type === 'pointer') {
           // Draw pointer
           drawPointer(ctx, annotation.x, annotation.y, i === selectedIndex, strokeColor);

           // Draw label for pointer (positioned below the pointer)
           if (annotation.label) {
             const px = annotation.x * canvas.width;
             const py = annotation.y * canvas.height;

             ctx.fillStyle = strokeColor;
             const text = annotation.label;
             const padding = 4 / zoom;
             const textWidth = ctx.measureText(text).width;
             const textHeight = 18 / zoom;
             const getPointerSize = () => POINTER_SIZE / zoom;
             const labelY = py + getPointerSize() + (5 / zoom); // Position below the pointer

             ctx.fillRect(px - textWidth/2, labelY, textWidth + padding * 2, textHeight);
             ctx.fillStyle = "white";
             ctx.fillText(text, px - textWidth/2 + padding, labelY + (2 / zoom));
           }
         } else {
           // Draw box (existing logic)
           const { x1, y1, x2, y2, label } = annotation;
           const left = Math.min(x1, x2) * canvas.width;
           const top = Math.min(y1, y2) * canvas.height;
           const width = Math.abs(x2 - x1) * canvas.width;
           const height = Math.abs(y2 - y1) * canvas.height;

           ctx.strokeStyle = strokeColor;
           ctx.lineWidth = 2 / zoom;
           ctx.strokeRect(left, top, width, height);

           if (label) {
             ctx.fillStyle = strokeColor;
             const text = label;
             const padding = 4 / zoom;
             const textWidth = ctx.measureText(text).width;
             const textHeight = 18 / zoom;
             ctx.fillRect(left, top - textHeight, textWidth + padding * 2, textHeight);
             ctx.fillStyle = "white";
             ctx.fillText(text, left + padding, top - textHeight + (2 / zoom));
           }

           if (i === selectedIndex) {
             drawHandles(ctx, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
           }
         }
       });
     }, [annotations, selectedIndex]);

     useEffect(() => {
       redrawCanvas();
     }, [annotations, selectedIndex, redrawCanvas]);

     useEffect(() => {
       if (selectedIndex !== null) {
         setInputLabel(annotations[selectedIndex]?.label || "");
         setFeedbackLabel(annotations[selectedIndex]?.feedback || "")
       } else {
         setInputLabel("");
         setFeedbackLabel("")
       }
     }, [selectedIndex, annotations]);

     const handleMouseDown = (e) => {
       if (!canvasRef.current) return;

       const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();

        // Convert screen coordinates to canvas internal coordinates
        const px = (e.clientX - rect.left) * (canvas.width / rect.width);
        const py = (e.clientY - rect.top) * (canvas.height / rect.height);

       // Check for resize handles first (only for selected boxes)
       if (selectedIndex !== null) {
         const annotation = annotations[selectedIndex];
         const canModify = (annotation.owner === cred._id) && !feed;

         if (canModify && annotation.type !== 'pointer') {
           const ctx = canvasRef.current.getContext("2d");
           const handles = drawHandles(ctx, Math.min(annotation.x1, annotation.x2), Math.min(annotation.y1, annotation.y2), Math.max(annotation.x1, annotation.x2), Math.max(annotation.y1, annotation.y2));
           const handle = getHandleUnderPoint(handles, px, py);
           if (handle) {
             setAction("resize");
             setResizeHandle(handle.name);
             setStartPoint(getNormalizedCoordinates(e));
             e.preventDefault();
             return;
           }
         }
       }

       // Check if clicking on existing annotation
       let foundIndex = null;
       for (let i = annotations.length - 1; i >= 0; i--) {
         if (pointInBox(px, py, annotations[i])) {
           foundIndex = i;
           break;
         }
       }

       if (foundIndex !== null) {
         // Clicked on existing annotation - select it
         setSelectedIndex(foundIndex);
         setAction("move");
         setStartPoint(getNormalizedCoordinates(e));
       } else {
         // Clicked on empty space
         if (selectedIndex !== null) {
           // If something was selected, just deselect it
           setSelectedIndex(null);
         } else if (!feed) {
           // Only create new annotation if nothing was selected
           const pos = getNormalizedCoordinates(e);

           if (visual === 'pointer') {
             // Create pointer immediately
             const newPointer = {
               type: 'pointer',
               x: clamp(pos.x, 0, 1),
               y: clamp(pos.y, 0, 1),
               label: "",
               owner: cred._id
             };
             setAnnotations((ann) => [...ann, newPointer]);
             setSelectedIndex(annotations.length); // Select the new pointer
           } else {
             // Start drawing box
             setAction("draw");
             setStartPoint(pos);
             setAnnotations((ann) => [...ann, {
               type: 'box',
               x1: pos.x,
               y1: pos.y,
               x2: pos.x,
               y2: pos.y,
               label: "",
               owner: cred._id
             }]);
           }
         }
       }

       e.preventDefault();
     };

     const handleMouseMove = (e) => {
       if (!action) return;

       const pos = getNormalizedCoordinates(e);
       const dx = pos.x - startPoint.x;
       const dy = pos.y - startPoint.y;

       if (action === "draw") {
         setAnnotations((ann) => {
           if (ann.length === 0) return ann;
           const newAnn = [...ann];
           const box = { ...newAnn[newAnn.length - 1] };
           box.x2 = clamp(pos.x, 0, 1);
           box.y2 = clamp(pos.y, 0, 1);
           newAnn[newAnn.length - 1] = box;
           return newAnn;
         });
       } else if (selectedIndex !== null) {
         setStartPoint(pos);
         setAnnotations((ann) => {
           const newAnn = [...ann];
           const annotation = { ...newAnn[selectedIndex] };

           if (annotation.type === 'pointer') {
             // Move pointer
             annotation.x = clamp(annotation.x + dx, 0, 1);
             annotation.y = clamp(annotation.y + dy, 0, 1);
           } else if (action === "move") {
             const xMin = Math.min(annotation.x1, annotation.x2);
             const yMin = Math.min(annotation.y1, annotation.y2);
             const width = Math.abs(annotation.x2 - annotation.x1);
             const height = Math.abs(annotation.y2 - annotation.y1);
             let newX1 = clamp(xMin + dx, 0, 1 - width);
             let newY1 = clamp(yMin + dy, 0, 1 - height);
             annotation.x1 = newX1;
             annotation.y1 = newY1;
             annotation.x2 = newX1 + width;
             annotation.y2 = newY1 + height;
           } else if (action === "resize") {
             const xMin = Math.min(annotation.x1, annotation.x2);
             const yMin = Math.min(annotation.y1, annotation.y2);
             const xMax = Math.max(annotation.x1, annotation.x2);
             const yMax = Math.max(annotation.y1, annotation.y2);

             switch (resizeHandle) {
               case "tl":
                 annotation.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
                 annotation.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
                 break;
               case "tr":
                 annotation.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
                 annotation.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
                 break;
               case "br":
                 annotation.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
                 annotation.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
                 break;
               case "bl":
                 annotation.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
                 annotation.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
                 break;
               case "top":
                 annotation.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
                 break;
               case "right":
                 annotation.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
                 break;
               case "bottom":
                 annotation.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
                 break;
               case "left":
                 annotation.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
                 break;
               default:
                 break;
             }
           }
           newAnn[selectedIndex] = annotation;
           return newAnn;
         });
       }
       e.preventDefault();
     };

     const handleMouseUp = (e) => {
       if (action === "draw") {
         const lastIndex = annotations.length - 1;
         const box = annotations[lastIndex];
         if (
           Math.abs(box.x2 - box.x1) < MIN_BOX_SIZE ||
           Math.abs(box.y2 - box.y1) < MIN_BOX_SIZE
         ) {
           setAnnotations((ann) => ann.filter((_, i) => i !== lastIndex));
           setSelectedIndex(null);
         } else {
           setSelectedIndex(lastIndex);
         }
       }
       setAction(null);
       setResizeHandle(null);
       setStartPoint(null);
       e.preventDefault();
     };

     const handleLabelChange = (e) => {
       const value = e.target.value;
       setInputLabel(value);
       setAnnotations((ann) => {
         const newAnn = [...ann];
         if (selectedIndex !== null) {
           newAnn[selectedIndex] = { ...newAnn[selectedIndex], label: value };
         }
         return newAnn;
       });
     };

     const handleFeedbackLabelChange = (e) => {
        const value = e.target.value;
        setFeedbackLabel(value)
        setAnnotations((ann) => {
         const newAnn = [...ann];
         const annotation = { ...newAnn[selectedIndex] };
         annotation.feedback = value;
         newAnn[selectedIndex] = annotation;
         return newAnn;
       });
     }

     const handleKeyDown = useCallback(
       (e) => {
         // Key handling logic if needed
       },
       [selectedIndex]
     );

     function handleDelete() {
       setAnnotations((ann) => ann.filter((_, i) => i !== selectedIndex));
       setSelectedIndex(null);
     }

     function handleDelete2() {
       if (selectedIndex === null) return

       setAnnotations((ann) => {
          const newAnn = [...ann];
          const annotation = { ...newAnn[selectedIndex] };
          annotation.feedback = "";
          newAnn[selectedIndex] = annotation
          return newAnn
       })
        setFeedbackLabel("");
     }

     useEffect(() => {
       window.addEventListener("keydown", handleKeyDown);
       return () => window.removeEventListener("keydown", handleKeyDown);
     }, [handleKeyDown]);

     useEffect(() => {
       window.addEventListener("resize", fitImageToViewport);
       return () => window.removeEventListener("resize", fitImageToViewport);
     }, [fitImageToViewport]);

     useEffect(() => {
        if (!imageSize.width || !imageSize.height) return;

        const canvas = canvasRef.current;
        const img = imageRef.current;

        if (!canvas || !img) return;

        const displayWidth = imageSize.width * zoom;
        const displayHeight = imageSize.height * zoom;

        // Keep the canvas coordinate system based on original image dimensions.
        canvas.width = imageSize.width;
        canvas.height = imageSize.height;

        // Give both elements exactly the same displayed dimensions.
        img.style.width = `${displayWidth}px`;
        img.style.height = `${displayHeight}px`;
        img.style.maxWidth = "none";
        img.style.transform = "none";

        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        redrawCanvas();

    }, [zoom, imageSize, redrawCanvas]);

     const exportAnnotatedImage = () => {
        const image = imageRef.current;
        const annotationCanvas = canvasRef.current;

        if (!image || !annotationCanvas || !image.complete) {
            console.error("Image or annotation canvas is not ready.");
            return;
        }

        // Create an off-screen canvas at the original image resolution.
        const exportCanvas = document.createElement("canvas");

        exportCanvas.width = image.naturalWidth;
        exportCanvas.height = image.naturalHeight;

        const ctx = exportCanvas.getContext("2d");

        // Draw the original image.
        ctx.drawImage(
            image,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height
        );

        // Draw annotations over the original image.
        ctx.drawImage(
            annotationCanvas,
            0,
            0,
            exportCanvas.width,
            exportCanvas.height
        );

        // Generate PNG.
        exportCanvas.toBlob((blob) => {
            if (!blob) {
                console.error("Failed to generate annotated image.");
                return;
            }

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;
            link.download = "mta_annotated-image.png";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
        }, "image/png");
    };

    useEffect(() => {
        setSharedAction(() => exportAnnotatedImage);
    }, [setSharedAction]);

    return (
        <div
            className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-slate-100"
            ref={containerRef}
        >

            <div className="relative min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain">
                <div ref={stageRef} className="relative w-max min-w-0 shrink-0">
                    <img
                        ref={imageRef}
                        src={file?.url}
                        alt="Image being annotated"
                        onLoad={fitImageToViewport}
                        className="block max-w-none select-none"
                    />

                    <canvas
                        ref={canvasRef}
                        className="absolute left-0 top-0 select-none"
                        style={{
                            cursor:
                                action === "resize"
                                    ? "nwse-resize"
                                    : action === "move"
                                    ? "move"
                                    : "crosshair",
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />

                    {selectedIndex !== null && (() => {
                        const annotation = annotations[selectedIndex];
                        const canvas = canvasRef.current;
                        const stage = stageRef.current;

                        if (!annotation || !canvas || !stage) return null;

                        const canvasRect = canvas.getBoundingClientRect();
                        const stageRect = stage.getBoundingClientRect();

                        // Account for CSS scaling between the stage's layout
                        // dimensions and its actual rendered dimensions.
                        const scaleX = stageRect.width / stage.offsetWidth || 1;
                        const scaleY = stageRect.height / stage.offsetHeight || 1;

                        let left;
                        let top;

                        if (annotation.type === "pointer") {
                            // Position relative to the pointer annotation.
                            left =
                                (canvasRect.left - stageRect.left) / scaleX +
                                annotation.x * canvasRect.width / scaleX;

                            top =
                                (canvasRect.top - stageRect.top) / scaleY +
                                annotation.y * canvasRect.height / scaleY +
                                POINTER_SIZE + 5;

                        } else {
                            // Position relative to the actual bottom-left
                            // corner of the selected bounding box.
                            left =
                                (canvasRect.left - stageRect.left) / scaleX +
                                Math.min(annotation.x1, annotation.x2) *
                                    canvasRect.width / scaleX;

                            top =
                                (canvasRect.top - stageRect.top) / scaleY +
                                Math.max(annotation.y1, annotation.y2) *
                                    canvasRect.height / scaleY +
                                8;
                        }

                         return (
                           <div
                           style={{
                                position: "absolute",
                                left: `${left}px`,
                                top: `${top}px`,
                                zIndex: 1000,
                                background: "#fff",
                                padding: '10px'
                            }}
                           >
                               {
                                    labels.some(item => item.trim() === '') ? (
                                        <input
                                           type="text"
                                           value={inputLabel}
                                           onChange={handleLabelChange}
                                           className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                           autoFocus
                                           placeholder={`Enter ${annotation.type || 'box'} label`}
                                           disabled={(annotation.owner && annotation.owner !== "" && annotation.owner !== cred._id) || feed}
                                         />
                                    ) : (
                                       <select
                                           name="labels"
                                           className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                           onChange={handleLabelChange}
                                           required disabled={(annotation.owner && annotation.owner !== "" && annotation.owner !== cred._id) || feed}>
                                           <option value="">-- Select box label --</option>
                                           {
                                               labels.map((label, index) => (
                                                   <option key={index} value={label}>{label}</option>
                                               ))
                                           }
                                       </select>
                                    )
                               }

                             {
                               feed ? (
                                   feedbackLabel && (
                                      <div>
                                       <input
                                         type="text"
                                         value={feedbackLabel}
                                         className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                         style={{ marginTop: '10px' }}
                                         disabled
                                       />
                                     </div>
                                   )
                               ) : (
                                    annotation.owner && annotation.owner !== "" && annotation.owner !== cred._id ? (
                                       <div>
                                           <input
                                           type="text"
                                           value={feedbackLabel}
                                           onChange={handleFeedbackLabelChange}
                                           className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                                           style={{ marginTop: '10px' }}
                                           autoFocus
                                           placeholder={`Enter your feedback`}
                                         />
                                         <div className="mt-2 cursor-pointer border border-red-200 rounded-lg px-3 py-2 text-center text-xs font-semibold text-red-600 transition hover:text-white hover:bg-red-600"
                                              onClick={handleDelete2}>
                                            <span>Delete Feedback</span>
                                        </div>
                                       </div>
                                   ) : (
                                       <div className="mt-2 cursor-pointer border border-red-200 rounded-lg px-3 py-2 text-center text-xs font-semibold text-red-600 transition hover:text-white hover:bg-red-600"
                                            onClick={handleDelete}>
                                      <span>Delete</span>
                                  </div>
                                   )
                               )
                             }
                           </div>
                         );
                       })()}
                </div>
            </div>

        </div>
    )
}