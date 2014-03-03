var resizeCanvas = null;
var resizeCtx = null;

function resizeImage(img, maxWidth, maxHeight, overlayText) {
  if (! resizeCtx) {
    resizeCanvas = document.createElement("canvas");
    resizeCtx = resizeCanvas.getContext("2d");
  }
  var width = img.width;
  var height = img.height;
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  }
  resizeCanvas.width = width;
  resizeCanvas.height = height;
  resizeCtx.drawImage(img, 0, 0, width, height);
  if (overlayText) {
    resizeCtx.fillStyle = "white";
    resizeCtx.font = "36px Arial";
    resizeCtx.fillText(overlayText, 10, 45);
  }
  return resizeCanvas.toDataURL("image/jpeg", 0.85);
}

module.exports = resizeImage;
