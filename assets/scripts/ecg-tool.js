const imgSrc = "../assets/images/graph.png";
const imgWidth = 800;
const imgHeight = 600;
const zoomLevel = 2;
let isDraggable = false;
let showMagnifier = true;
let [width, height] = [0, 0];
let boxMovement = "";
let [x, y] = [0, 100];
let [leftPos, rightPos] = [0, 0];
let cropBox = { width: 150, height: 100 };
let magnifiedPos = 0;
let isLeft = true;
let isResizingLeft = false;
let isResizingRight = false;
let startX = 0;
$(function () {
  const ecgImageElem = $("#ecg_image");
  const boxElem = $("#image_cropBox");
  const leftMarker = $("#magnifier_left_marker");
  const rightMarker = $("#magnifier_right_marker");
  const leftResizeHandle = $("#resize_handle_left");
  const rightResizeHandle = $("#resize_handle_right");
  const changeMagnifierPosition = (isInit, isModified) => {
    if (isInit) {
      $(boxElem).css("display", "block");
      $(boxElem).css(
        "background-size",
        `${imgWidth * zoomLevel}px ${imgHeight * zoomLevel}px`
      );
    }
    if (isInit || isModified) {
      $(boxElem).css("height", `${cropBox.height}px`);
      $(boxElem).css("width", `${cropBox.width}px`);
      $(leftMarker).css("left", `${cropBox.width / 10}px`);
      $(leftMarker).css("height", `${cropBox.height}px`);
      $(rightMarker).css("right", `${cropBox.width / 10}px`);
      $(rightMarker).css("height", `${cropBox.height}px`);
    }
    $(boxElem).css("top", `${y - cropBox.height / 2}px`);
    $(boxElem).css("left", `${startX}px`);
    $(boxElem).css("background-position-x", `${magnifiedPos}px`);
    $(boxElem).css(
      "background-position-y",
      `${-y * zoomLevel + cropBox.height / 2}px`
    );
    $(leftResizeHandle).css("top", `${y + cropBox.height / 2 + 10}px`);
    $(leftResizeHandle).css("left", `${leftPos}px`);
    $(rightResizeHandle).css("top", `${y + cropBox.height / 2 + 10}px`);
    $(rightResizeHandle).css("left", `${rightPos}px`);
  };

  function calculateTriangleSides(pointA, pointB, pointC) {
    // Distance formula function
    function distance(p1, p2) {
      return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    // Calculate lengths of the sides
    const lengthAB = distance(pointA, pointB); // Side opposite to C
    const lengthBC = distance(pointB, pointC); // Side opposite to A
    const lengthCA = distance(pointC, pointA); // Side opposite to B

    return {
      a: lengthAB,
      b: lengthBC,
      c: lengthCA,
    };
  }

  function calculateAngles(rectangle) {
    const { x, y, width, height } = rectangle;

    // Calculate the center of the top side
    const topCenterX = x + width / 2;
    const topY = y;

    // Coordinates of the bottom left and right corners
    const bottomLeftX = x;
    const bottomY = y + height;
    const bottomRightX = x + width;
    const sides = calculateTriangleSides(
      { x: topCenterX, y },
      { x: bottomLeftX, y: bottomY },
      { x: bottomRightX, y: bottomY }
    );

    const { a, b, c } = sides;
    // Calculate angles using the Law of Cosines
    const angleA = Math.acos((b * b + c * c - a * a) / (2 * b * c));
    const angleB = Math.acos((a * a + c * c - b * b) / (2 * a * c));
    const angleC = Math.PI - angleA - angleB; // Sum of angles in a triangle is 180 degrees (or π radians)

    // Convert radians to degrees
    const degreesA = angleA * (180 / Math.PI);
    const degreesB = angleB * (180 / Math.PI);
    const degreesC = angleC * (180 / Math.PI);

    return {
      angleA: degreesA,
      angleB: degreesB,
      angleC: degreesC,
    };
  }

  const handleMouseMove = (e) => {
    const imageRect = ecgImageElem[0].getBoundingClientRect();
    if (isResizingLeft) {
      //const newX = Math.min(e.clientX - imageRect.left, x + cropBox.width);

      // calculate cursor position on the image
      const newX = Math.round(
        e.pageX -
          imageRect.left -
          window.scrollX +
          cropBox.width / 2 -
          cropBox.width / 10
      );
      const imageMouseX = zoomLevel * (x - newX);
      const newWidth = imageMouseX + cropBox.width;
      // console.log("UU ::: ",imageMouseX,newWidth);
      const val = calculateAngles({
        x: newX,
        y,
        width: newWidth,
        height: cropBox.height,
      });
      if (val.angleB < 45 || val.angleB > 90 || newX > x + newWidth / 2) return;
      if (
        newX - cropBox.width / 2 <= imageRect.left ||
        newX + cropBox.width / 2 >= imageRect.right
      )
        return;
      // console.log("TT :::: ", e.pageX, x,cropBox.width, newX, newWidth,zoomLevel);
      setXY([newX, y]);
      setMagnifiedPos(-newX * zoomLevel + newWidth);
      onResize(newX, newWidth, false);
      setMoveIconsDist([
        newX -
          (newWidth - cropBox.width) / 2 -
          cropBox.width / 2 +
          cropBox.width / 10,
        x - (newWidth - cropBox.width) / 2 + newWidth / 2 - newWidth / 10,
      ]);
      setCropBox({ ...cropBox, width: newWidth });

      console.log("angles :::: ", val);
    }
    //// console.log("detected :::: ", isResizingRight)
    if (isResizingRight) {
      const newWidth = Math.round(e.clientX - x + cropBox.width / 2);
      console.log("newWIdth:::", newWidth);
      const val = calculateAngles({
        x,
        y,
        width: newWidth,
        height: cropBox.height,
      });
      if (val.angleB < 45 || val.angleB > 90 || x < x - newWidth / 2) return;
      // if (newWidth < magnifierWidth/2 || newWidth > 3 * magnifierWidth / 2) return;
      if (
        e.clientX - cropBox.width / 10 <= imageRect.left ||
        e.clientX + cropBox.width / 10 >= imageRect.right
      )
        return;
      const newX = x - (newWidth - cropBox.width) / zoomLevel;
      // console.log("UUU ::: ", x, newX,newWidth,newX+(newWidth-cropBox.width)/2,newX-(cropBox.width)/2)
      setXY([x, y]);
      // setMagnifiedPos(-(x - cropBox.width) * zoomLevel - newWidth);
      onResize(startX, newWidth, true);
      setCropBox({ ...cropBox, width: newWidth });
      setMoveIconsDist([
        x + (newWidth - cropBox.width) / 2 - newWidth / 2 + newWidth / 10,
        x + (newWidth - cropBox.width) / 2 + newWidth / 2 - newWidth / 10,
      ]);
    }
    changeMagnifierPosition(false, true);
  };
  const handleMouseMoveGlobal = (e) => {
    handleMouseMove(e);
  };
  const handleMouseUp = () => {
    isResizingLeft = false;
    isResizingRight = false;
  };

  const updateResizeEvents = () => {
    if (isResizingLeft || isResizingRight) {
      setIsDraggable(false);
      window.addEventListener("mousemove", handleMouseMoveGlobal);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMoveGlobal);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  };

  const setCropBox = (updatedObj) => {
    cropBox = updatedObj;
  };

  const onResize = (x, width, isRight) => {
    if (isRight) {
      setStartX(x);
      console.log("ONRESIZE TRIGGERED ::: IF ==> ", x);
    } else {
      setStartX(x - width / 2);
      console.log("ONRESIZE TRIGGERED ::: ELSE", x - width / 2);
    }
  };

  const setStartX = (val) => {
    startX = val;
  };

  const setIsDraggable = (drag) => {
    isDraggable = drag;
    console.log("ISDRAGABLE", drag);
  };
  const setSize = (elem) => {
    width = elem.width;
    height = elem.height;
  };
  const setBoxMovement = (movement) => {
    boxMovement = movement;
  };
  const setMoveIconsDist = ([left, right]) => {
    //console.log("move :::: ",left,right);
    leftPos = left;
    rightPos = right;
  };
  const setXY = ([xCoord, yCoord]) => {
    console.log("NEW X Y,", x, y);
    x = xCoord;
    y = yCoord;
  };
  const setMagnifiedPos = (position) => {
    magnifiedPos = position;
  };
  $(window).on("load", () => {
    ecgImageElem.attr("src", imgSrc);
    $(ecgImageElem).css("height", `${imgHeight}px`);
    $(ecgImageElem).css("width", `${imgWidth}px`);
    $(boxElem).css("background-image", `url('${imgSrc}')`);
    //console.log("loaded");
    changeMagnifierPosition(true);
  });

  $(ecgImageElem).on("mouseenter", (e) => {
    console.log("BACKGROUND IMAGE enter");
    const elem = e.currentTarget;
    const { width, height } = elem.getBoundingClientRect();
    setSize({ width, height });
    // console.log("Width", width, "Height", height);
  });

  $(ecgImageElem).on("mousedown", (e) => {
    //console.log("vv ::: ", boxElem[0]);
    const boxRect = boxElem[0].getBoundingClientRect();

    if (
      boxRect.left + window.scrollX <= e.pageX &&
      e.pageX <= boxRect.right + window.scrollX &&
      boxRect.top + window.scrollY <= e.pageY &&
      e.pageY <= boxRect.bottom + window.scrollY
    )
      setIsDraggable(true);
    console.log("down");
  });

  $(ecgImageElem).on("mouseup", (e) => {
    //console.log("up");
    setIsDraggable(false);
  });

  $(ecgImageElem).on("mousemove", (e) => {
    if (!isDraggable) return;
    console.log("MOUSEMOVE");
    // update cursor position
    const elem = e.currentTarget;
    //console.log("move ---", elem);
    const { top, left } = elem.getBoundingClientRect();

    // calculate cursor position on the image
    const imageMouseX = e.pageX - left - window.scrollX;
    const imageMouseY = e.pageY - top - window.scrollY;

    // // console.log("image ===> ", left, window.scrollX, e.pageX + cropBox.width/2 - left - window.scrollX, imgWidth)
    setBoxMovement(imageMouseX > x ? "right" : "left");
    setMoveIconsDist([
      imageMouseX - cropBox.width / 2 + cropBox.width / 10,
      imageMouseX + cropBox.width / 2 - cropBox.width / 10,
    ]);
    onResize(imageMouseX, cropBox.width, false);
    setXY([imageMouseX, imageMouseY]);

    const isLeft =
      e.pageX - cropBox.width / 2 - left - window.scrollX <
      imgWidth - cropBox.width;
    setMagnifiedPos(
      -imageMouseX * zoomLevel + (isLeft ? cropBox.width : -1 * cropBox.width)
    );
    changeMagnifierPosition();
  });

  $(leftResizeHandle).on("mousedown", (e) => {
    e.preventDefault(); // Prevent selection and dragging
    e.stopPropagation();
    isResizingLeft = true;
    updateResizeEvents();
  });

  $(rightResizeHandle).on("mousedown", (e) => {
    console.log("right");
    e.preventDefault();
    e.stopPropagation();
    isResizingRight = true;
    updateResizeEvents();
  });
});
