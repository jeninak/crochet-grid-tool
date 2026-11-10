
const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");

const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");

const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridContainer = document.getElementById("gridContainer");
const status = document.getElementById("status");

const ctx = gridCanvas.getContext("2d");

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

            value *= brightness / 100;

            value = contrastFactor * (value - 128) + 128;

            data[i + c] = Math.max(
                0,
                Math.min(255, value)
            );
        }
    }

    return imageData;
}

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


generateBtn.addEventListener("click", function() {
    if (!uploadedImage) return;

    const gridWidth = Number(gridWidthInput.value);
    const gridHeight = Number(gridHeightInput.value);

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


function createGrid(width, height) {
    const tempCanvas = document.createElement("canvas");

    tempCanvas.width = width;
    tempCanvas.height = height;

    const tempCtx = tempCanvas.getContext("2d", {
        willReadFrequently: true
    });

    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, width, height);
    tempCtx.imageSmoothingEnabled = true;

    tempCtx.drawImage(
        uploadedImage,
        0,
        0,
        width,
        height
    );

    const imageData = tempCtx.getImageData(
        0,
        0,
        width,
        height
    );

    const enhancedData = enhanceImage(imageData);
    const pixels = enhancedData.data;

    gridCanvas.width = width * STITCH_SIZE;
    gridCanvas.height = height * STITCH_SIZE;

    gridCanvas.hidden = false;

    for (let y = 0; y < height; y++) {

        for (let x = 0; x < width; x++) {

            const index = (y * width + x) * 4;

            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;

            ctx.fillRect(
                x * STITCH_SIZE,
                y * STITCH_SIZE,
                STITCH_SIZE,
                STITCH_SIZE
            );
        }
    }

    drawGridLines(width, height);

    status.textContent =
        `Grid generated successfully! ${width} × ${height} stitches.`;
}


function drawGridLines(width, height) {
    for (let x = 0; x <= width; x++) {
        const majorLine = x % 10 === 0;

        ctx.beginPath();

        ctx.lineWidth = majorLine ? 2 : 1;
        ctx.strokeStyle = majorLine ? "#333333" : "#999999";

        const position = x * STITCH_SIZE + (majorLine ? 0 : 0.5);
        ctx.moveTo(position, 0);
        ctx.lineTo(position, height * STITCH_SIZE);

        ctx.stroke();
    }

    for (let y = 0; y <= height; y++) {
        const majorLine = y % 10 === 0;

        ctx.beginPath();

        ctx.lineWidth = majorLine ? 2 : 1;
        ctx.strokeStyle = majorLine ? "#333333" : "#999999";

        const position = y * STITCH_SIZE + (majorLine ? 0 : 0.5);
        ctx.moveTo(0, position);
        ctx.lineTo(width * STITCH_SIZE, position);

        ctx.stroke();
    }
}
