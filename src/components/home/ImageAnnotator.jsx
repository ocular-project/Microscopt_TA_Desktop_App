import React, { useRef, useState, useEffect, useCallback } from "react";

const HANDLE_SIZE = 8;
const MIN_BOX_SIZE = 0.01; // normalized
const SIDEBAR_WIDTH = 300;
const ZOOM_STEP = 0.1;

function clamp(val, min, max) {
 return Math.min(Math.max(val, min), max);
}

export default function ImageAnnotator() {
 const [annotations, setAnnotations] = useState([]); // normalized coords + label
 const [selectedIndex, setSelectedIndex] = useState(null);
 const [action, setAction] = useState(null); // 'draw', 'move', 'resize'
 const [resizeHandle, setResizeHandle] = useState(null);
 const [startPoint, setStartPoint] = useState(null);
 const [zoom, setZoom] = useState(1);
 const [inputLabel, setInputLabel] = useState("");
 const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

 const canvasRef = useRef(null);
 const imageRef = useRef(null);
 const containerRef = useRef(null);

 // Utility: get normalized coords inside canvas
 const getNormalizedCoordinates = (e) => {
   const rect = canvasRef.current.getBoundingClientRect();
   const x = (e.clientX - rect.left) / rect.width;
   const y = (e.clientY - rect.top) / rect.height;
   return { x, y };
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

   ctx.fillStyle = "white";
   ctx.strokeStyle = "black";
   handles.forEach((h) => {
     const px = h.x * ctx.canvas.width;
     const py = h.y * ctx.canvas.height;
     ctx.beginPath();
     ctx.rect(px - HANDLE_SIZE / 2, py - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
     ctx.fill();
     ctx.stroke();
   });

   return handles;
 };

 // Find if point is on a handle
 const getHandleUnderPoint = (handles, px, py) => {
   return handles.find((h) => {
     const hx = h.x * canvasRef.current.width;
     const hy = h.y * canvasRef.current.height;
     return px >= hx - HANDLE_SIZE && px <= hx + HANDLE_SIZE && py >= hy - HANDLE_SIZE && py <= hy + HANDLE_SIZE;
   });
 };

 // Check if point inside box
 const pointInBox = (px, py, box) => {
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
   ctx.font = `14px Arial`;
   ctx.textBaseline = "top";

   annotations.forEach(({ x1, y1, x2, y2, label }, i) => {
     const left = Math.min(x1, x2) * canvas.width;
     const top = Math.min(y1, y2) * canvas.height;
     const width = Math.abs(x2 - x1) * canvas.width;
     const height = Math.abs(y2 - y1) * canvas.height;

     ctx.strokeStyle = i === selectedIndex ? "blue" : "red";
     ctx.lineWidth = 2;
     ctx.strokeRect(left, top, width, height);

     if (label) {
       ctx.fillStyle = i === selectedIndex ? "blue" : "red";
       const text = label;
       const padding = 4;
       const textWidth = ctx.measureText(text).width;
       const textHeight = 16;
       ctx.fillRect(left, top - textHeight, textWidth + padding * 2, textHeight);
       ctx.fillStyle = "white";
       ctx.fillText(text, left + padding, top - textHeight + 2);
     }

     if (i === selectedIndex) {
       drawHandles(ctx, Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2));
     }
   });
 }, [annotations, selectedIndex]);

 useEffect(() => {
   redrawCanvas();
 }, [annotations, selectedIndex, redrawCanvas]);

 useEffect(() => {
   if (selectedIndex !== null) {
     setInputLabel(annotations[selectedIndex]?.label || "");
   } else {
     setInputLabel("");
   }
 }, [selectedIndex, annotations]);

 const handleMouseDown = (e) => {
   if (!canvasRef.current) return;
   const rect = canvasRef.current.getBoundingClientRect();
   const px = e.clientX - rect.left;
   const py = e.clientY - rect.top;

   if (selectedIndex !== null) {
     const box = annotations[selectedIndex];
     const ctx = canvasRef.current.getContext("2d");
     const handles = drawHandles(ctx, Math.min(box.x1, box.x2), Math.min(box.y1, box.y2), Math.max(box.x1, box.x2), Math.max(box.y1, box.y2));
     const handle = getHandleUnderPoint(handles, px, py);
     if (handle) {
       setAction("resize");
       setResizeHandle(handle.name);
       setStartPoint(getNormalizedCoordinates(e));
       e.preventDefault();
       return;
     }
   }

   let foundIndex = null;
   for (let i = annotations.length - 1; i >= 0; i--) {
     if (pointInBox(px, py, annotations[i])) {
       foundIndex = i;
       break;
     }
   }

   if (foundIndex !== null) {
     setSelectedIndex(foundIndex);
     setAction("move");
     setStartPoint(getNormalizedCoordinates(e));
   } else {
     setSelectedIndex(null);
     setAction("draw");
     const pos = getNormalizedCoordinates(e);
     setStartPoint(pos);
     setAnnotations((ann) => [...ann, { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y, label: "" }]);
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
       const box = { ...newAnn[selectedIndex] };

       if (action === "move") {
         const xMin = Math.min(box.x1, box.x2);
         const yMin = Math.min(box.y1, box.y2);
         const width = Math.abs(box.x2 - box.x1);
         const height = Math.abs(box.y2 - box.y1);
         let newX1 = clamp(xMin + dx, 0, 1 - width);
         let newY1 = clamp(yMin + dy, 0, 1 - height);
         box.x1 = newX1;
         box.y1 = newY1;
         box.x2 = newX1 + width;
         box.y2 = newY1 + height;
       } else if (action === "resize") {
         const xMin = Math.min(box.x1, box.x2);
         const yMin = Math.min(box.y1, box.y2);
         const xMax = Math.max(box.x1, box.x2);
         const yMax = Math.max(box.y1, box.y2);

         switch (resizeHandle) {
           case "tl":
             box.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
             box.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
             break;
           case "tr":
             box.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
             box.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
             break;
           case "br":
             box.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
             box.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
             break;
           case "bl":
             box.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
             box.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
             break;
           case "top":
             box.y1 = clamp(pos.y, 0, yMax - MIN_BOX_SIZE);
             break;
           case "right":
             box.x2 = clamp(pos.x, xMin + MIN_BOX_SIZE, 1);
             break;
           case "bottom":
             box.y2 = clamp(pos.y, yMin + MIN_BOX_SIZE, 1);
             break;
           case "left":
             box.x1 = clamp(pos.x, 0, xMax - MIN_BOX_SIZE);
             break;
           default:
             break;
         }
       }
       newAnn[selectedIndex] = box;
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

 const handleKeyDown = useCallback(
   (e) => {
     if (
       (e.key === "Delete" || e.key === "Backspace") &&
       selectedIndex !== null
     ) {
       setAnnotations((ann) => ann.filter((_, i) => i !== selectedIndex));
       setSelectedIndex(null);
       e.preventDefault();
     }
   },
   [selectedIndex]
 );

 useEffect(() => {
   window.addEventListener("keydown", handleKeyDown);
   return () => window.removeEventListener("keydown", handleKeyDown);
 }, [handleKeyDown]);

 // Fit image to viewport on load and window resize, never upscale initially
 const fitImageToViewport = useCallback(() => {
   if (!imageRef.current) return;

   const imgNaturalWidth = imageRef.current.naturalWidth;
   const imgNaturalHeight = imageRef.current.naturalHeight;

   const viewportWidth = window.innerWidth - SIDEBAR_WIDTH - 40; // padding/margin
   const viewportHeight = window.innerHeight - 120; // header/buttons height approx

   if (imgNaturalWidth === 0 || imgNaturalHeight === 0) return;

   const scaleX = viewportWidth / imgNaturalWidth;
   const scaleY = viewportHeight / imgNaturalHeight;

   const fitScale = Math.min(scaleX, scaleY, 1); // don't upscale initially

   setZoom(fitScale);
   setImageSize({ width: imgNaturalWidth, height: imgNaturalHeight });
 }, []);

 // Reset zoom to fit on window resize
 useEffect(() => {
   window.addEventListener("resize", fitImageToViewport);
   return () => window.removeEventListener("resize", fitImageToViewport);
 }, [fitImageToViewport]);

 // Update image and canvas size on zoom or imageSize change
 useEffect(() => {
   if (!imageSize.width || !imageSize.height) return;
   const canvas = canvasRef.current;
   const img = imageRef.current;
   if (!canvas || !img) return;

   const width = imageSize.width * zoom;
   const height = imageSize.height * zoom;

   canvas.width = width;
   canvas.height = height;

   img.style.width = `${width}px`;
   img.style.height = `${height}px`;

   redrawCanvas();
 }, [zoom, imageSize, redrawCanvas]);

 // Zoom controls with smaller steps for smooth scaling
 const zoomIn = () => setZoom((z) => Math.min(z + ZOOM_STEP, 5));
 const zoomOut = () => setZoom((z) => Math.max(z - ZOOM_STEP, 0.1));
 const resetZoom = () => fitImageToViewport();

 return (
   <>
     <div style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
       <button onClick={zoomOut}>Zoom Out</button>
       <button onClick={resetZoom}>Reset Zoom</button>
       <button onClick={zoomIn}>Zoom In</button>
       <span style={{ marginLeft: 10 }}>Zoom: {(zoom * 100).toFixed(0)}%</span>
     </div>

     <div style={{ display: "flex", height: "calc(100vh - 60px)" }}>
       {/* Sidebar */}
       <div
         style={{
           width: SIDEBAR_WIDTH,
           flexShrink: 0,
           overflowY: "auto",
           padding: 10,
           boxSizing: "border-box",
           borderRight: "1px solid #ccc",
           backgroundColor: "#f9f9f9",
         }}
       >
         <h3>Annotations</h3>
         <ul style={{ paddingLeft: 20 }}>
           {annotations.map(({ x1, y1, x2, y2, label }, i) => (
             <li key={i} style={{ marginBottom: 6 }}>
               <strong>Box #{i + 1}:</strong> (
               {(Math.min(x1, x2) * imageSize.width).toFixed(0)},{" "}
               {(Math.min(y1, y2) * imageSize.height).toFixed(0)}) to (
               {(Math.max(x1, x2) * imageSize.width).toFixed(0)},{" "}
               {(Math.max(y1, y2) * imageSize.height).toFixed(0)}){" "}
               {label && <em>Label: {label}</em>}
             </li>
           ))}
         </ul>
       </div>

       {/* Image and canvas container */}
       <div
         ref={containerRef}
         style={{
           position: "relative",
           flexGrow: 1,
           overflow: "auto",
           backgroundColor: "#eee",
           padding: '10px 0 0 10px'
         }}
       >
         <div style={{ position: "relative" }}>
           <img
             ref={imageRef}
             src="/your-image.jpg"
             alt="Annotate"
             onLoad={fitImageToViewport}
             draggable={false}
             style={{ display: "block", userSelect: "none" }}
           />
           <canvas
             ref={canvasRef}
             style={{
               position: "absolute",
               top: 0,
               left: 0,
               cursor:
                 action === "resize"
                   ? "nwse-resize"
                   : action === "move"
                   ? "move"
                   : "crosshair",
               userSelect: "none",
             }}
             onMouseDown={handleMouseDown}
             onMouseMove={handleMouseMove}
             onMouseUp={handleMouseUp}
             onMouseLeave={handleMouseUp}
           />

           {selectedIndex !== null && (() => {
             const box = annotations[selectedIndex];
             if (!box) return null;
             const left = Math.min(box.x1, box.x2) * imageSize.width * zoom;
             const top = Math.max(box.y1, box.y2) * imageSize.height * zoom + 5;
             return (
               <div
                 style={{
                   position: "absolute",
                   left,
                   top,
                   background: "rgba(255,255,255,0.9)",
                   padding: "2px 6px",
                   borderRadius: 4,
                   boxShadow: "0 0 5px rgba(0,0,0,0.3)",
                   zIndex: 10,
                   userSelect: "auto",
                 }}
               >
                 <input
                   type="text"
                   value={inputLabel}
                   onChange={handleLabelChange}
                   style={{ width: "150px" }}
                   autoFocus
                   placeholder={`Label for box #${selectedIndex + 1}`}
                 />
               </div>
             );
           })()}
         </div>
       </div>
     </div>
   </>
 );
}