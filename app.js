const state = {
  canvas: null,
  ctx: null,
  scale: null,
  currentColor: "Ivory",
  font: "30px Arial",
  pencileSize: 20,
  eraseSize: 80,
  currentMouse: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },
}

const MouseButton = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };

// On window resize listener.
window.addEventListener("resize", () => {
  const old = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
  state.canvas.width = window.innerWidth * state.scale;
  state.canvas.height = window.innerHeight * state.scale;
  state.ctx.scale(state.scale, state.scale);
  state.ctx.putImageData(old, 0, 0);
}, false);

// On window load listener.
window.addEventListener("load", () => {
  console.log("Drawarea loaded");
  console.log("Device scale:", window.devicePixelRatio);

  state.canvas = document.querySelector("canvas");
  state.ctx = state.canvas.getContext("2d", { willReadFrequently: true });
  state.canvas.width = window.innerWidth;
  state.canvas.height = window.innerHeight;

  state.scale = window.devicePixelRatio;
  state.canvas.width *= state.scale;
  state.canvas.height *= state.scale;
  state.ctx.scale(state.scale, state.scale);

  state.ctx.lineJoin = "round";
  state.ctx.lineCap = "round";

  // Load last canvas session.
  loadCanvasData();

  // Prevent context menu being displayed.
  state.canvas.addEventListener("contextmenu", (evt) => {
    evt.preventDefault();
  }, false);

  // Handles different cursors when erasing stuff.
  document.addEventListener("keydown", (evt) => { if (evt.key === "Control") { setEraserCursor(); } });
  document.addEventListener("keyup", (evt) => { resetCursor() });

  state.canvas.addEventListener("mousemove", (evt) => {
    // If Ctrl is pressed then erase stuff.
    if (evt.ctrlKey) {
      const x = evt.clientX - state.canvas.offsetLeft - state.eraseSize / 2;
      const y = evt.clientY - state.canvas.offsetTop - state.eraseSize / 2;
      state.ctx.clearRect(x, y, state.eraseSize, state.eraseSize);
      return;
    }

    // Do the drawing.
    state.lastMouse.x = state.currentMouse.x;
    state.lastMouse.y = state.currentMouse.y;
    state.currentMouse.x = evt.pageX - state.canvas.offsetLeft;
    state.currentMouse.y = evt.pageY - state.canvas.offsetTop;
  }, false);

  state.canvas.addEventListener("mousedown", function(evt) {
    // Text being added here.
    if (evt.button == MouseButton.RIGHT) {
      let text = prompt('Text:');
      if (text !== null && text.trim() !== '') {
        const rect = state.canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;

        state.ctx.fillStyle = state.currentColor;
        state.ctx.font = state.font;
        state.ctx.fillText(text, x, y);
      }
      return;
    }
	  
    // Do the drawing.
    state.canvas.addEventListener("mousemove", onPaint, false);
  }, false);
	
  state.canvas.addEventListener("mouseup", function() {
    state.canvas.removeEventListener("mousemove", onPaint, false);
  }, false);
	
  // Clear canvas on Backspace or Del pressed.
  document.addEventListener("keydown", function(event) {
    const key = event.key || event.keyCode;
    if (key === "Backspace" || key === 8 || key === "Delete" || key === 46) {
      state.ctx.clearRect(0, 0, state.canvas.width, state.canvas.height);
    }
  });

  // Construct color picker.
  const colorButtons = document.querySelectorAll('[data-color]');
  state.currentColor = localStorage.getItem("currentColor") || colorButtons[0].dataset.color;
  colorButtons.forEach((colorButton) => {
    colorButton.addEventListener('click', (evt) => {
      state.currentColor = evt.target.dataset.color;
      colorButtons.forEach((colorButton) => { colorButton.classList.remove("selected") });
      evt.target.classList.add("selected");
      localStorage.setItem("currentColor", state.currentColor);
    });
    colorButton.style.background = colorButton.dataset.color;

    if (state.currentColor == colorButton.dataset.color) {
      colorButton.classList.add("selected");
    }
  });

  // Check for pencil size slider value.
  const pencilSizeSlider = document.querySelector(".slider");
  state.pencilSize = parseInt(localStorage.getItem("pencilSize") || 2, 10);
  pencilSizeSlider.value = state.pencilSize;
  pencilSizeSlider.addEventListener("input", (evt) => {
    state.pencilSize = parseInt(evt.target.value, 10);
    localStorage.setItem("pencilSize", state.pencilSize);
  });

  // Periodically save current canvas to localStorage.
  setInterval(() => saveCanvasData(), 1000);
});

function onPaint() {
  state.ctx.lineWidth = state.pencilSize;
  state.ctx.strokeStyle = state.currentColor;

  state.ctx.beginPath();
  state.ctx.moveTo(state.lastMouse.x, state.lastMouse.y);
  state.ctx.lineTo(state.currentMouse.x, state.currentMouse.y);
  state.ctx.closePath();
  state.ctx.stroke();
};

function setEraserCursor() {
  const svgData = `<svg xmlns='http://www.w3.org/2000/svg' width='${state.eraseSize}' height='${state.eraseSize}'><rect width='${state.eraseSize}' height='${state.eraseSize}' fill='transparent' stroke='white' stroke-width='4'/></svg>`;
  const encodedSvgData = encodeURIComponent(svgData);
  state.canvas.style.cursor = `url("data:image/svg+xml,${encodedSvgData}") ${state.eraseSize / 2} ${state.eraseSize / 2}, auto`;
}

function resetCursor() {
  state.canvas.style.cursor = "auto";
}

function saveCanvasData() {
  const dataURL = state.canvas.toDataURL();
  localStorage.setItem("canvasData", dataURL);
}

function loadCanvasData() {
  const dataURL = localStorage.getItem("canvasData");
  if (dataURL) {
    const img = new Image();
    img.src = dataURL;
    img.onload = function() {
      state.ctx.drawImage(img, 0, 0);
    };
  }
}
