
const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");

const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");

const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridContainer = document.getElementById("gridContainer");
const status = document.getElementById("status");

const ctx = gridCanvas.getContext("2d");

// Each crochet stitch will be displayed as a 12x12 square.
const STITCH_SIZE = 12;

let uploadedImage = null;
let contrast = 100;
let brightness = 100;

function enhanceImage(imageData) {
    const data = imageData.data;

    const contrastFactor =
        (259 * (contrast + 255)) /
        (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {

        for (let c = 0; c < 3; c++) {

            let value = data[i + c];

            // Apply brightness
            value *= brightness / 100;

            // Apply contrast
            value = contrastFactor * (value - 128) + 128;

            data[i + c] = Math.max(
                0,
                Math.min(255, value)
            );
        }
    }

    return imageData;
}

// 1. Handle image upload
imageInput.addEventListener("change", function(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        status.textContent = "Please select a valid image.";
        return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
        const image = new Image();

        image.onload = function() {
            uploadedImage = image;

            originalImage.src = e.target.result;
            originalImage.style.display = "block";

            generateBtn.disabled = false;

            status.textContent = "Image uploaded successfully!";
        };

        image.onerror = function() {
            status.textContent = "Could not load the image.";
        };

        image.src = e.target.result;
    };

    reader.readAsDataURL(file);
});


// 2. Generate the crochet grid
generateBtn.addEventListener("click", function() {
    if (!uploadedImage) return;

    const gridWidth = Number(gridWidthInput.value);
    const gridHeight = Number(gridHeightInput.value);

    // Validate dimensions
    if (
        !Number.isInteger(gridWidth) ||
        !Number.isInteger(gridHeight) ||
        gridWidth < 1 ||
        gridHeight < 1 ||
        gridWidth > 300 ||
        gridHeight > 300
    ) {
        status.textContent =
            "Grid dimensions must be between 1 and 300.";
        return;
    }

    status.textContent = "Generating crochet grid...";

    createGrid(gridWidth, gridHeight);
});


// 3. Convert image into a pixel grid
function createGrid(width, height) {

    // Temporary canvas for resizing the image
    const tempCanvas = document.createElement("canvas");

    tempCanvas.width = width;
    tempCanvas.height = height;

    const tempCtx = tempCanvas.getContext("2d", {
        willReadFrequently: true
    });

    // Resize image to selected grid dimensions
    tempCtx.imageSmoothingEnabled = true;

    tempCtx.drawImage(
        uploadedImage,
        0,
        0,
        width,
        height
    );

    // Get pixel color information
    const imageData = tempCtx.getImageData(
        0,
        0,
        width,
        height
    );

    const enhancedData = enhanceImage(imageData);
    const pixels = enhancedData.data;

    // Prepare display canvas
    gridCanvas.width = width * STITCH_SIZE;
    gridCanvas.height = height * STITCH_SIZE;

    gridCanvas.hidden = false;

    // Draw each pixel as a crochet stitch
    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const index = (y * width + x) * 4;

            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            const alpha = pixels[index + 3] / 255;

            // Transparent pixels are displayed as white
            const color = alpha === 0
                ? "#ffffff"
                : `rgba(${red}, ${green}, ${blue}, ${alpha})`;

            ctx.fillStyle = color;

            ctx.fillRect(
                x * STITCH_SIZE,
                y * STITCH_SIZE,
                STITCH_SIZE,
                STITCH_SIZE
            );
        }
    }

    // Draw grid lines
    drawGridLines(width, height);

    status.textContent =
        `Grid generated successfully! ${width} × ${height} stitches.`;
}


// 4. Draw grid lines and stronger lines every 10 stitches
function drawGridLines(width, height) {

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#888888";

    // Vertical lines
    for (let x = 0; x <= width; x++) {

        ctx.beginPath();

        ctx.lineWidth = x % 10 === 0 ? 2 : 0.5;
        ctx.strokeStyle = x % 10 === 0
            ? "#333333"
            : "#999999";

        ctx.moveTo(x * STITCH_SIZE, 0);
        ctx.lineTo(x * STITCH_SIZE, height * STITCH_SIZE);

        ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y++) {

        ctx.beginPath();

        ctx.lineWidth = y % 10 === 0 ? 2 : 0.5;
        ctx.strokeStyle = y % 10 === 0
            ? "#333333"
            : "#999999";

        ctx.moveTo(0, y * STITCH_SIZE);
        ctx.lineTo(width * STITCH_SIZE, y * STITCH_SIZE);

        ctx.stroke();
    }
}
