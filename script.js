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
const twoColorInput = document.getElementById("twoColorMode");
const thresholdInput = document.getElementById("darkThreshold");
const thresholdValue = document.getElementById("darkThresholdValue");
const thresholdControl = document.getElementById("thresholdControl");
const enlargeBtn = document.getElementById("enlargeBtn");
const downloadBtn = document.getElementById("downloadBtn");
const largePreviewDialog = document.getElementById("largePreviewDialog");
const largeGridCanvas = document.getElementById("largeGridCanvas");

const largeCtx = largeGridCanvas.getContext("2d");

let uploadedImage = null;
let generatedDimensions = null;

function renderGrid(width, height) {
    const sourceCanvas = document.createElement("canvas");
    sourceCanvas.width = width;
    sourceCanvas.height = height;

    const sourceCtx = sourceCanvas.getContext("2d", {
        willReadFrequently: true
    });

    sourceCtx.fillStyle = "#ffffff";
    sourceCtx.fillRect(0, 0, width, height);
    sourceCtx.imageSmoothingEnabled = true;
    sourceCtx.drawImage(uploadedImage, 0, 0, width, height);

    const imageData = sourceCtx.getImageData(0, 0, width, height);
    const adjustedImage = CrochetImageProcessing.adjustColors(imageData, {
        brightness: Number(brightnessInput.value),
        contrast: Number(contrastInput.value),
        saturation: Number(saturationInput.value)
    });

    if (twoColorInput.checked) {
        CrochetImageProcessing.applyTwoColor(adjustedImage, Number(thresholdInput.value));
    }

    CrochetGridRenderer.draw(adjustedImage, width, height, gridCanvas);

    gridCanvas.hidden = false;
    gridPlaceholder.hidden = true;
    generatedDimensions = { width, height };
    enlargeBtn.disabled = false;
    downloadBtn.disabled = false;
    status.textContent = `Grid generated successfully! ${width} × ${height} stitches.`;
}

function updateColorControls() {
    for (const control of [brightnessInput, contrastInput, saturationInput]) {
        document.getElementById(`${control.id}Value`).value = `${control.value}%`;
    }

    thresholdValue.value = thresholdInput.value;
    thresholdControl.hidden = !twoColorInput.checked;

    if (uploadedImage && generatedDimensions) {
        renderGrid(generatedDimensions.width, generatedDimensions.height);
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
        status.textContent = "Grid dimensions must be between 1 and 300.";
        return;
    }

    status.textContent = "Generating crochet grid...";
    renderGrid(gridWidth, gridHeight);
});

for (const control of [brightnessInput, contrastInput, saturationInput, thresholdInput]) {
    control.addEventListener("input", updateColorControls);
}

twoColorInput.addEventListener("change", updateColorControls);

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

updateColorControls();
