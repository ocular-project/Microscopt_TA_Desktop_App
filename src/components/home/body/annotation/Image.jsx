import styles from "./css/image.module.css";
import {useEffect, useRef, useState} from "react";
import {getBoxId, getUserData} from "../../../utils/files/RepeatingFiles.jsx";
import css from "../../../css/general.module.css";
import Feedback from "./Feedback.jsx";

export default function Image({ obj, annotations, setAnnotations, loader, canEdit, cred, setCred,
                                  feedback, setFeedback, setAllow, feed }){

    const imageRef = useRef(null);
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [boxes, setBoxes] = useState([]);
    // const [annotations, setAnnotations] = useState([]);
    const [selectedBoxIndex, setSelectedBoxIndex] = useState(-1);
    const [resizeDirection, setResizeDirection] = useState(null);
    const [hoverHandleIndex, setHoverHandleIndex] = useState(-1);
    const [viewedBoxIndex, setViewedBoxIndex] = useState(-1);
    const [oldAnnotations, setOldAnnotations] = useState([])

    const handleSize = 8;

    const setupCanvas = () => {
            const canvas = canvasRef.current;
            const image = imageRef.current;
            const container = containerRef.current;

            if (!canvas || !image || !container) {
                // console.log("Missing ref:", { canvas, image, container });
                return;
            }

            // console.log("Setting up canvas...");
            // console.log("Image natural dimensions:", image.naturalWidth, "x", image.naturalHeight);
            // console.log("Image display dimensions:", image.clientWidth, "x", image.clientHeight);


             // Ensure image is loaded before proceeding
            if (!image.complete || image.naturalWidth === 0) {
                // console.log("Image not fully loaded, waiting...");
                image.onload = () => {
                    // console.log("Image loaded, now setting up canvas");
                    setupCanvasDimensions();
                };
            } else {
                // console.log("Image already loaded, setting up canvas");
                setupCanvasDimensions();
            }

            function setupCanvasDimensions() {

                canvas.width = image.naturalWidth || image.clientWidth;
                canvas.height = image.naturalHeight || image.clientHeight;

                // Ensure we have non-zero dimensions
                if (canvas.width === 0) canvas.width = image.clientWidth || 400;
                if (canvas.height === 0) canvas.height = image.clientHeight || 300;

                // Set the internal drawing dimensions of the canvas
                // canvas.width = width;
                // canvas.height = height;

                // console.log("Canvas dimensions set to:", canvas.width, "x", canvas.height);

                // Make the canvas cover exactly the same area as the image
                canvas.style.position = 'absolute';
                canvas.style.top = '0';
                canvas.style.left = '0';
                canvas.style.width = '100%';
                canvas.style.height = '100%';

                // Force a redraw if we have annotations
                if (annotations.length > 0) {
                    redrawBoxes();
                }
            }
        };

    useEffect(() => {

        setupCanvas();

        // Handle window resizing
        const handleResize = () => {
            setupCanvas();
            redrawBoxes();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [obj.url]);

    useEffect(() => {
       if (annotations.length > 0) {
           // console.log("annotations.jsx changed, updating boxes and redrawing...");

            const extractedBoxes = annotations.map(annotation => {
                const box = annotation.box;

                // If the box is already using percentages, just use it directly
                if (box.xPercent !== undefined) {
                    return box;
                }

                // Otherwise, convert absolute coordinates to percentages
                const canvas = canvasRef.current;
                if (!canvas) return box;

                return {
                    xPercent: box.x / canvas.width,
                    yPercent: box.y / canvas.height,
                    widthPercent: box.width / canvas.width,
                    heightPercent: box.height / canvas.height
                };
            });

            // console.log("Setting boxes state with", extractedBoxes.length, "boxes");
            setBoxes(extractedBoxes);

            requestAnimationFrame(() => {
                // console.log("Forced redraw after annotations change");
                redrawBoxes();
            });
        }
        else {
           // console.log("No annotations to draw");
            // Clear any existing boxes
            setBoxes([]);

            // Clear the canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [annotations]);

     const percentToPixel = (box) => {
        const canvas = canvasRef.current;
        const image = imageRef.current;

        if (!canvas || !image) return { x: 0, y: 0, width: 0, height: 0 };

        // Get the actual dimensions being used for drawing
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        // Log the dimensions for debugging
        // console.log("Canvas dimensions used for drawing:", canvasWidth, "x", canvasHeight);
        // console.log("Percentage box being converted:", box);

        // Convert percentages to absolute coordinates
        const result = {
            x: box.xPercent * canvasWidth,
            y: box.yPercent * canvasHeight,
            width: box.widthPercent * canvasWidth,
            height: box.heightPercent * canvasHeight
        };

        // console.log("Converted to pixels:", result);
        return result;
    };

     const pixelToPercent = (x, y, width, height) => {
        const canvas = canvasRef.current;
        if (!canvas) return { xPercent: 0, yPercent: 0, widthPercent: 0, heightPercent: 0 };

        return {
            xPercent: x / canvas.width,
            yPercent: y / canvas.height,
            widthPercent: width / canvas.width,
            heightPercent: height / canvas.height
        };
    };

    const redrawBoxes = () => {
        // console.log("Redrawing boxes...");

        const canvas = canvasRef.current;
        if (!canvas) {
            // console.warn("No canvas reference for redrawing");
            return;
        }

        if (canvas.width === 0 || canvas.height === 0) {
            // console.warn("Canvas has zero dimension, cannot draw");
            return;
        }

        const ctx = canvas.getContext('2d')
        if (!ctx) {
            // console.warn("Could not get canvas context");
            return;
        }

        ctx.clearRect(0,0,canvas.width, canvas.height)

        // console.log(`Drawing ${boxes.length} boxes`);

        // boxes.forEach((box, index) => {
        annotations.forEach((annotation, index) => {

          const box = annotation.box

          try {
              const pixelBox = percentToPixel(box);

              ctx.strokeStyle = index === selectedBoxIndex ? '#00ff00' : '#ff0000'; // Box color - can be customized
              ctx.lineWidth = 10;
              ctx.strokeRect(
                pixelBox.x,
                pixelBox.y,
                pixelBox.width,
                pixelBox.height
              );

              if (annotation?.label) {
                ctx.font = '40px Arial';

                // Measure text width to set background width
                const textWidth = ctx.measureText(annotation.label).width;
                const padding = 10; // Padding on both sides
                const backgroundWidth = textWidth + padding * 2;

                // Calculate appropriate label height and position
                const labelHeight = 60;
                // Draw the label closer to the box (use -labelHeight instead of -20)
                const labelY = pixelBox.y - labelHeight;

                // Draw background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(pixelBox.x, labelY, backgroundWidth, labelHeight);

                // Draw text
                ctx.fillStyle = '#ffffff';
                const textY = labelY + (labelHeight * 0.7);
                ctx.fillText(annotation.label, pixelBox.x + padding, textY);
              }

              if (index === selectedBoxIndex) {
                drawResizeHandles(ctx, pixelBox);
              }
              } catch (error) {
                    console.error("Error drawing box", index, error);
              }

        });
    }

    const drawResizeHandles = (ctx, pixelBox) => {
    // Define handle positions (corners and midpoints of edges)
        const handles = [
            { x: pixelBox.x, y: pixelBox.y }, // top-left
            { x: pixelBox.x + pixelBox.width / 2, y: pixelBox.y }, // top-middle
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y }, // top-right
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y + pixelBox.height / 2 }, // right-middle
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y + pixelBox.height }, // bottom-right
            { x: pixelBox.x + pixelBox.width / 2, y: pixelBox.y + pixelBox.height }, // bottom-middle
            { x: pixelBox.x, y: pixelBox.y + pixelBox.height }, // bottom-left
            { x: pixelBox.x, y: pixelBox.y + pixelBox.height / 2 } // left-middle
        ];

        // Draw each handle
        handles.forEach((handle, index) => {
            ctx.fillStyle = hoverHandleIndex === index ? '#00ffff' : '#ffffff';
            ctx.strokeStyle = '#0000ff';
            ctx.lineWidth = 20;

            // Draw handle as a small square
            ctx.fillRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
            ctx.strokeRect(
                handle.x - handleSize / 2,
                handle.y - handleSize / 2,
                handleSize,
                handleSize
            );
        });
    };

    // Check if a point is inside a box
    const isPointInBox = (x, y, percentBox) => {
        const pixelBox = percentToPixel(percentBox);
        return (
            x >= pixelBox.x &&
            x <= pixelBox.x + pixelBox.width &&
            y >= pixelBox.y &&
            y <= pixelBox.y + pixelBox.height
        );
    };

    // Check if a point is on a resize handle, return handle index or -1
    const getResizeHandleAt = (x, y, percentBox) => {
        const pixelBox = percentToPixel(percentBox);

        // Define handle positions
        const handles = [
            { x: pixelBox.x, y: pixelBox.y }, // top-left
            { x: pixelBox.x + pixelBox.width / 2, y: pixelBox.y }, // top-middle
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y }, // top-right
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y + pixelBox.height / 2 }, // right-middle
            { x: pixelBox.x + pixelBox.width, y: pixelBox.y + pixelBox.height }, // bottom-right
            { x: pixelBox.x + pixelBox.width / 2, y: pixelBox.y + pixelBox.height }, // bottom-middle
            { x: pixelBox.x, y: pixelBox.y + pixelBox.height }, // bottom-left
            { x: pixelBox.x, y: pixelBox.y + pixelBox.height / 2 } // left-middle
        ];

        // Check each handle
        for (let i = 0; i < handles.length; i++) {
            const handle = handles[i];
            if (
                x >= handle.x - handleSize / 2 &&
                x <= handle.x + handleSize / 2 &&
                y >= handle.y - handleSize / 2 &&
                y <= handle.y + handleSize / 2
            ) {
                return i;
            }
        }

        return -1;
    };

    // Set the appropriate cursor based on the resize handle
    const setCursorStyle = (handleIndex) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const cursorStyles = [
            'nw-resize', // top-left
            'n-resize',  // top-middle
            'ne-resize', // top-right
            'e-resize',  // right-middle
            'se-resize', // bottom-right
            's-resize',  // bottom-middle
            'sw-resize', // bottom-left
            'w-resize'   // left-middle
        ];

        if (handleIndex >= 0 && handleIndex < cursorStyles.length) {
            canvas.style.cursor = cursorStyles[handleIndex];
        } else if (selectedBoxIndex >= 0) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    };

    // Handle mouse movement for hover effects
    const handleMouseMove = (e) => {

        // Log the current state
        // console.log("handleMouseMove called, isDrawing:", isDrawing, "isResizing:", isResizing);

        if (isDrawing || isResizing) {
            handleDrawOrResize(e);
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if hovering over a resize handle of the selected box
        if (selectedBoxIndex >= 0) {
            const box = boxes[selectedBoxIndex];
            const handleIndex = getResizeHandleAt(x, y, box);

            if (handleIndex !== hoverHandleIndex) {
                setHoverHandleIndex(handleIndex);
                setCursorStyle(handleIndex);
                redrawBoxes();
            }
        } else {
            // Check if hovering over any box
            let foundBox = false;
            for (let i = boxes.length - 1; i >= 0; i--) {
                if (isPointInBox(x, y, boxes[i])) {
                    canvas.style.cursor = 'pointer';
                    foundBox = true;
                    break;
                }
            }

            if (!foundBox) {
                canvas.style.cursor = 'crosshair';
            }
        }
    };

    // Handle drawing or resizing based on current state
    const handleDrawOrResize = (e) => {
        console.log("handleDrawOrResize called, canEdit:", canEdit, "isDrawing:", isDrawing, "isResizing:", isResizing);

        if (!canEdit) {
            // console.log("Can't edit, returning");
            return;
        }

        if (isResizing) {
            resizeBox(e);
        } else if (isDrawing) {
            drawBox(e);
        } else {
            // console.log("Not drawing or resizing");
        }
    };

    // Start drawing or resizing
    const handleMouseDown = (e) => {
        // console.log("Mouse down, canEdit:", canEdit); // Debug log
        // if (!canEdit) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get mouse position relative to canvas
        const rect = canvas.getBoundingClientRect();
        // const x = e.clientX - rect.left;
        // const y = e.clientY - rect.top;

        // Calculate the scale factor between display and internal canvas dimensions
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // Check if clicking on a resize handle
        if (selectedBoxIndex >= 0) {
            const box = boxes[selectedBoxIndex];
            const handleIndex = getResizeHandleAt(x, y, box);

            if (handleIndex >= 0) {
            // Start resizing from a handle
                setIsResizing(true);
                setResizeDirection(handleIndex);
                setStartPos({ x, y });
                return;
            }

            // Check if clicking inside the selected box (for moving)
            if (isPointInBox(x, y, box)) {
                // Start moving the box
                setIsResizing(true);
                setResizeDirection('move');
                setStartPos({ x, y });
                return;
            }
        }

        // Check if clicking on any box (for selection)
        for (let i = boxes.length - 1; i >= 0; i--) {
            if (isPointInBox(x, y, boxes[i])) {
                setSelectedBoxIndex(i);
                setHoverHandleIndex(-1);
                redrawBoxes();
                return;
            }
        }

        // If not clicking on any box or handle, start drawing a new box
        setIsDrawing(true);
        setSelectedBoxIndex(-1);
        setStartPos({ x, y });
    };

    // Draw a new box while dragging
    const drawBox = (e) => {
        // console.log("drawBox called, isDrawing:", isDrawing);

        const canvas = canvasRef.current;
        if (!canvas) {
            // console.log("No canvas reference");
            return;
        }

        const ctx = canvas.getContext('2d');

        // Get current mouse position
        const rect = canvas.getBoundingClientRect();
        if (!ctx) {
            // console.log("Could not get canvas context");
            return;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;

        // console.log("Drawing from:", startPos.x, startPos.y, "to", currentX, currentY);


        // const currentX = e.clientX - rect.left;
        // const currentY = e.clientY - rect.top;

        // console.log("Drawing box from", startPos.x, startPos.y, "to", currentX, currentY);
        // console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

        // Clear and redraw existing boxes
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        redrawBoxes();

        // Draw the current box being created
        ctx.strokeStyle = '#e1ec48';
        ctx.lineWidth = 10;
        ctx.strokeRect(
            startPos.x,
            startPos.y,
            currentX - startPos.x,
            currentY - startPos.y
        );

        // console.log("Rectangle drawn with properties:", {
        //     x: startPos.x,
        //     y: startPos.y,
        //     width: currentX - startPos.x,
        //     height: currentY - startPos.y,
        //     strokeStyle: ctx.strokeStyle,
        //     lineWidth: ctx.lineWidth
        // });
    };

    // Resize or move the selected box
    const resizeBox = (e) => {
        if (selectedBoxIndex < 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get current mouse position
        const rect = canvas.getBoundingClientRect();
        // const currentX = e.clientX - rect.left;
        // const currentY = e.clientY - rect.top;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;

        // Calculate movement from start position
        const deltaX = currentX - startPos.x;
        const deltaY = currentY - startPos.y;

        const box = boxes[selectedBoxIndex];
        const pixelBox = percentToPixel(box);
        let newPixelBox = { ...pixelBox };

        // Update the box based on resize direction
        if (resizeDirection === 'move') {
            // Move the entire box
            newPixelBox.x += deltaX;
            newPixelBox.y += deltaY;
        } else {
            // Resize based on which handle is being dragged
            switch (resizeDirection) {
                case 0: // top-left
                    newPixelBox.x += deltaX;
                    newPixelBox.y += deltaY;
                    newPixelBox.width -= deltaX;
                    newPixelBox.height -= deltaY;
                    break;
                case 1: // top-middle
                    newPixelBox.y += deltaY;
                    newPixelBox.height -= deltaY;
                    break;
                case 2: // top-right
                    newPixelBox.y += deltaY;
                    newPixelBox.width += deltaX;
                    newPixelBox.height -= deltaY;
                    break;
                case 3: // right-middle
                    newPixelBox.width += deltaX;
                    break;
                case 4: // bottom-right
                    newPixelBox.width += deltaX;
                    newPixelBox.height += deltaY;
                    break;
                case 5: // bottom-middle
                    newPixelBox.height += deltaY;
                    break;
                case 6: // bottom-left
                    newPixelBox.x += deltaX;
                    newPixelBox.width -= deltaX;
                    newPixelBox.height += deltaY;
                    break;
                case 7: // left-middle
                    newPixelBox.x += deltaX;
                    newPixelBox.width -= deltaX;
                    break;
            }

            // Ensure width and height stay positive
            if (newPixelBox.width < 0) {
                newPixelBox.x += newPixelBox.width;
                newPixelBox.width = Math.abs(newPixelBox.width);
            }
            if (newPixelBox.height < 0) {
                newPixelBox.y += newPixelBox.height;
                newPixelBox.height = Math.abs(newPixelBox.height);
            }
        }

        // Convert the new box back to percentages
        const newPercentBox = pixelToPercent(
            newPixelBox.x,
            newPixelBox.y,
            newPixelBox.width,
            newPixelBox.height
        );

        // Update the box in our array
        const newBoxes = [...boxes];
        newBoxes[selectedBoxIndex] = newPercentBox;
        setBoxes(newBoxes);

        const newAnnotations = [...annotations];
        if (!newAnnotations[selectedBoxIndex]) {
            newAnnotations[selectedBoxIndex] = {};
        }
        newAnnotations[selectedBoxIndex].box = newPercentBox
        setAnnotations(newAnnotations);

        // Update start position for continuous movement
        setStartPos({ x: currentX, y: currentY });

        // Redraw all boxes
        redrawBoxes();
    };

    // Finish drawing or resizing
    const handleMouseUp = (e) => {
         if(!canEdit) return;

        if (isDrawing) {
            finishDrawingBox(e);
        } else if (isResizing) {
            setIsResizing(false);
            setResizeDirection(null);
        }
    };

    // Complete drawing a new box
    const finishDrawingBox = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get final mouse position
        const rect = canvas.getBoundingClientRect();
        // const currentX = e.clientX - rect.left;
        // const currentY = e.clientY - rect.top;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const currentX = (e.clientX - rect.left) * scaleX;
        const currentY = (e.clientY - rect.top) * scaleY;

        // Calculate box dimensions
        let x = startPos.x;
        let y = startPos.y;
        let width = currentX - startPos.x;
        let height = currentY - startPos.y;

        // Handle negative dimensions (when drawing from bottom-right to top-left)
        if (width < 0) {
            x += width;
            width = Math.abs(width);
        }
        if (height < 0) {
            y += height;
            height = Math.abs(height);
        }

        // Only add if the box has some size
        if (width > 5 && height > 5) {
            const percentBox = pixelToPercent(x, y, width, height);

            const newBoxes = [...boxes, percentBox];
            setBoxes(newBoxes);

            // Add to annotations
            const newAnnotations = [...annotations];
            // newAnnotations.push({
            //     annotator: cred._id,
            //     label: '',
            //     feedback: {},
            //     id: getBoxId(),
            //     box: percentBox
            // });

            newAnnotations.push({
                label: '',
                boxId: getBoxId(),
                box: percentBox,
            });
            setAnnotations(newAnnotations);

            // Select the new box
            setSelectedBoxIndex(newBoxes.length - 1);
        }

        setIsDrawing(false);
        redrawBoxes();
    };

    // Handle mouse leaving the canvas
    const handleMouseLeave = () => {
        setHoverHandleIndex(-1);
        if (!isResizing) {
            setIsDrawing(false);
        }
    };

     // Update annotation for a box
    const handleAnnotationChange = (index, field, value) => {
         if(!canEdit) return;

        const newAnnotations = [...annotations];
        if (!newAnnotations[index]) {
            newAnnotations[index] = {};
        }
        newAnnotations[index][field] = value
        setAnnotations(newAnnotations);
        redrawBoxes();
    };

    // Delete a box and its annotation
    const deleteBox = (index) => {
         if(!canEdit) return;

        // Create new arrays without the item at this index
        const newBoxes = [...boxes];
        newBoxes.splice(index, 1);

        const newAnnotations = [...annotations];
        newAnnotations.splice(index, 1);

        // Update state with the filtered arrays
        setBoxes(newBoxes);
        setAnnotations(newAnnotations);

        // Deselect the current box
        setSelectedBoxIndex(-1);

        // Force a redraw of the canvas immediately
        requestAnimationFrame(() => {
            redrawBoxes()
        });
    };

    // Handle touch events (simplified)
    const handleTouchStart = (e) => {
         if(!canEdit) return;

        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleMouseDown({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    };

    const handleTouchMove = (e) => {
         if(!canEdit) return;

        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            handleDrawOrResize({
                clientX: touch.clientX,
                clientY: touch.clientY
            });
        }
    };

    const handleTouchEnd = (e) => {
         if(!canEdit) return;

        e.preventDefault();
        handleMouseUp();
    };

    const getAnnotationFormPosition = (percentBox) => {
        if (!percentBox) {
            // console.log("No percentBox provided");
            return { left: 0, top: 0 };
        }

        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image) {
            // console.log("Missing refs:", { canvas, image });
            return { left: 0, top: 0 };
        }

        // Log all the key elements and their positions
        const imageRect = image.getBoundingClientRect();
        const canvasRect = canvas.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        // Convert percentage coordinates to pixel coordinates
        const pixelBox = percentToPixel(percentBox);
        // Try different positioning approaches

         const scaleFactorX = canvasRect.width / canvas.width;
        const scaleFactorY = canvasRect.height / canvas.height;

        // console.log("Scale factors:", scaleFactorX, scaleFactorY);

        const left = canvasRect.left + (pixelBox.x * scaleFactorX);
        const top = canvasRect.top + (pixelBox.y * scaleFactorY) + (pixelBox.height * scaleFactorY) + 5;


        // console.log("annotation form position (fixed):", {
        // canvasRect: {
        //         left: canvasRect.left,
        //         top: canvasRect.top,
        //         width: canvasRect.width,
        //         height: canvasRect.height
        //     },
        //     canvasInternalDimensions: {
        //         width: canvas.width,
        //         height: canvas.height
        //     },
        //     pixelBox,
        //     scaledPosition: {
        //         x: pixelBox.x * scaleFactorX,
        //         y: pixelBox.y * scaleFactorY
        //     },
        //     finalPosition: { left, top }
        // });

        // // Approach 1: Using canvas position directly
        // const position1 = {
        //     left: canvasRect.left + pixelBox.x,
        //     top: canvasRect.top + pixelBox.y + pixelBox.height + 10
        // };
        //
        // // Approach 2: Using image position
        // const position2 = {
        //     left: imageRect.left + (percentBox.xPercent * imageRect.width),
        //     top: imageRect.top + (percentBox.yPercent * imageRect.height) + (percentBox.heightPercent * imageRect.height) + 10
        // };
        //
        // // Approach 3: Using container-relative positioning
        // const position3 = containerRect ? {
        //     left: (pixelBox.x / canvas.width) * containerRect.width,
        //     top: (pixelBox.y / canvas.height) * containerRect.height + ((pixelBox.height / canvas.height) * containerRect.height) + 10
        // } : null;

        // Use Approach 1 for now, but you can change this based on what looks right
        return { left, top };
};

    return (
         <div className={styles.imageSection} ref={containerRef}>
             <div className={`${css.loader} ${loader ? css.active : ""}`}></div>
             <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                 <img src={obj.url} alt="" id="targetImage" ref={imageRef} style={{ width: '100%', display: 'block' }}/>
                 <canvas
                    ref={canvasRef}
                    className={styles.drawingCanvas}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                 {
                     boxes.map((box, index) => (
                         <div
                            key={index}
                            className={styles.box}
                            style={{
                                ...getAnnotationFormPosition(box),
                                display: selectedBoxIndex === index ? 'block' : 'none',
                            }}
                         >
                             <div style={{ display: canEdit ? 'inline' : 'none' }}>
                                 <div style={{ marginBottom: '8px', textAlign: 'left' }}>
                                     <label
                                         htmlFor={`label-${index}`}
                                         style={{ display: 'block', marginBottom: '4px', fontWeight: '500', fontSize: '12px' }}
                                     >
                                         Annotation label:
                                     </label>
                                     <input
                                         id={`label-${index}`}
                                         type={"text"}
                                         value={annotations[index]?.label || ''}
                                         onChange={(e) => handleAnnotationChange(index, 'label', e.target.value)}
                                         style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                                         placeholder="Enter annotation"
                                     />
                                 </div>
                                 <div style={{ display:'flex', justifyContent: 'space-between' }}>
                                    <button
                                      onClick={() => setSelectedBoxIndex(-1)}
                                      style={{padding: '6px 12px', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer'}}
                                    >
                                      Done
                                    </button>

                                    <button
                                      onClick={(e) => {
                                          e.stopPropagation()
                                          deleteBox(index)
                                      }}
                                      style={{padding: '6px 12px', backgroundColor: '#ff5555', color: 'white', border: '1px solid #ff0000', borderRadius: '4px', cursor: 'pointer'}}
                                    >
                                      Delete
                                    </button>
                                 </div>
                             </div>
                             <div style={{ display: canEdit ? 'none' : 'inline' }}>
                                 <Feedback annotations={annotations} setAnnotations={setAnnotations} index={index}
                                           setSelectedBoxIndex={setSelectedBoxIndex} cred={cred} feedback={feedback}
                                           setAllow={setAllow} setFeedback={setFeedback} feed={feed} />
                             </div>
                         </div>
                     ))
                 }
             </div>
        </div>
    )
}