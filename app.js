const state = {
  canvas: null,
  ctx: null,
  scale: null,
  currentColor: "Ivory",
  font: "30px Arial",
  lineWidth: 3,
  prevX: 0,
  currX: 0,
  prevY: 0,
  currY: 0,
  flag: false,
  dotFlag: false,
  eraseSize: 80,
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

  // Prevent context menu being displayed.
  state.canvas.addEventListener("contextmenu", (evt) => {
    evt.preventDefault();
  }, false);

  state.canvas.addEventListener("mousedown", (evt) => {
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

    // Drawing takes place here.
    moveAndDraw("down", evt);
  }, false);

  // Handles different cursors when erasing stuff.
  document.addEventListener("keydown", (evt) => { if (evt.key === "Control") { setEraserCursor(); } });
  document.addEventListener("keyup", (evt) => { resetCursor() });

  state.canvas.addEventListener("mouseup", function (evt) { moveAndDraw("up", evt) }, false);
  state.canvas.addEventListener("mouseout", function (evt) { moveAndDraw("out", evt) }, false);
  state.canvas.addEventListener("mousemove", function (evt) {
    // If Ctrl is pressed then erase stuff.
    if (evt.ctrlKey) {
      const x = evt.clientX - state.canvas.offsetLeft - state.eraseSize / 2;
      const y = evt.clientY - state.canvas.offsetTop - state.eraseSize / 2;
      state.ctx.clearRect(x, y, state.eraseSize, state.eraseSize);
      return;
    }
    
    // Do normal drawing stuff.
    moveAndDraw("move", evt)
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
  colorButtons.forEach((colorButton) => {
    colorButton.addEventListener('click', (evt) => {
      state.currentColor = evt.target.dataset.color;
      colorButtons.forEach((colorButton) => { colorButton.classList.remove("selected") });
      evt.target.classList.add("selected");
    });
    colorButton.style.background = colorButton.dataset.color;
  });
});

function moveAndDraw(res, evt) {
  if (res == "down") {
    state.prevX = state.currX;
    state.prevY = state.currY;
    state.currX = evt.clientX - state.canvas.offsetLeft;
    state.currY = evt.clientY - state.canvas.offsetTop;

    state.flag = true;
    state.dotFlag = true;
    if (state.dotFlag) {
      state.ctx.beginPath();
      state.ctx.fillStyle = state.currentColor;
      state.ctx.fillRect(state.currX, state.currY, state.lineWidth, state.lineWidth);
      state.ctx.closePath();
      state.dotFlag = false;
    }
  }
  if (res == "up" || res == "out") {
    state.flag = false;
  }
  if (res == "move") {
    if (state.flag) {
      state.prevX = state.currX;
      state.prevY = state.currY;
      state.currX = evt.clientX - state.canvas.offsetLeft;
      state.currY = evt.clientY - state.canvas.offsetTop;

      // Draw line.
      state.ctx.beginPath();
      state.ctx.moveTo(state.prevX, state.prevY);
      state.ctx.lineTo(state.currX, state.currY);
      state.ctx.strokeStyle = state.currentColor;
      state.ctx.lineWidth = state.lineWidth;
      state.ctx.stroke();
      state.ctx.closePath();
    }
  }
}

function setEraserCursor() {
  const svgData = `<svg xmlns='http://www.w3.org/2000/svg' width='${state.eraseSize}' height='${state.eraseSize}'><rect width='${state.eraseSize}' height='${state.eraseSize}' fill='transparent' stroke='white' stroke-width='4'/></svg>`;
  const encodedSvgData = encodeURIComponent(svgData);
  state.canvas.style.cursor = `url("data:image/svg+xml,${encodedSvgData}") ${state.eraseSize / 2} ${state.eraseSize / 2}, auto`;
}

function resetCursor() {
  state.canvas.style.cursor = "auto";
}
