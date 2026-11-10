
const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");

const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");

const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridPlaceholder = document.getElementById("gridPlaceholder");
const status = document.getElementById("status");
const brightnessInput = document.getElementById("brightness");
const contrastInput = document.getElementById("contrast");
const saturationInput = document.getElementById("saturation");
const enlargeBtn = document.getElementById("enlargeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const largePreviewDialog = document.getElementById("largePreviewDialog");
const largeGridCanvas = document.getElementById("largeGridCanvas");

const ctx = gridCanvas.getContext("2d");
const largeCtx = largeGridCanvas.getContext("2d");

const STITCH_SIZE = 12;

let uploadedImage = null;
let generatedDimensions = null;

function enhanceImage(imageData) {
    const data = imageData.data;
    const brightness = Number(brightnessInput.value) / 100;
    const contrast = Number(contrastInput.value) / 100;
    const saturation = Number(saturationInput.value) / 100;

    for (let i = 0; i < data.length; i += 4) {
        const red = data[i] * brightness;
        const green = data[i + 1] * brightness;
        const blue = data[i + 2] * brightness;

        const average = red * 0.2126 + green * 0.7152 + blue * 0.0722;

        const adjustedRed = (average + (red - average) * saturation - 128) * contrast + 128;
        const adjustedGreen = (average + (green - average) * saturation - 128) * contrast + 128;
        const adjustedBlue = (average + (blue - average) * saturation - 128) * contrast + 128;

        data[i] = Math.max(0, Math.min(255, adjustedRed));
        data[i + 1] = Math.max(0, Math.min(255, adjustedGreen));
        data[i + 2] = Math.max(0, Math.min(255, adjustedBlue));
    }

    return imageData;
}

function updateColorControls() {
    for (const control of [brightnessInput, contrastInput, saturationInput]) {
        document.getElementById(`${control.id}Value`).value = `${control.value}%`;
    }

    if (uploadedImage && generatedDimensions) {
        createGrid(generatedDimensions.width, generatedDimensions.height);
    }
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
            generatedDimensions = null;
            gridCanvas.hidden = true;
            gridPlaceholder.hidden = false;
            enlargeBtn.disabled = true;
            downloadBtn.disabled = true;

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

for (const control of [brightnessInput, contrastInput, saturationInput]) {
    control.addEventListener("input", updateColorControls);
}

enlargeBtn.addEventListener("click", function() {
    largeGridCanvas.width = gridCanvas.width;
    largeGridCanvas.height = gridCanvas.height;
    largeCtx.drawImage(gridCanvas, 0, 0);
    largePreviewDialog.showModal();
});

document.getElementById("closePreviewBtn").addEventListener("click", function() {
    largePreviewDialog.close();
});

downloadBtn.addEventListener("click", function() {
    gridCanvas.toBlob(function(blob) {
        if (!blob) {
            status.textContent = "Could not create the pattern image.";
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "crochet-pattern.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 1000);
    }, "image/png");
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
    gridPlaceholder.hidden = true;
    generatedDimensions = { width, height };
    enlargeBtn.disabled = false;
    downloadBtn.disabled = false;

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
