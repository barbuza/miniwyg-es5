function getImage(callback) {
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.addEventListener("change", function() {
    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function(ev) {
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.onload = function() {
          callback(img);
        }
      }
      reader.readAsDataURL(this.files[0]);
    }
  });
  input.click();
}

module.exports = getImage;
