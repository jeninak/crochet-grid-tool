const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");
const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");
const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridPlaceholder = document.getElementById("gridPlaceholder");
const status = document.getElementById("status");
const patternTab = document.getElementById("patternTab");
const crochetTab = document.getElementById("crochetTab");
const patternView = document.getElementById("patternView");
const crochetWorkspace = document.getElementById("crochetWorkspace");
const workspaceCanvas = document.getElementById("workspaceCanvas");
const rowHighlightCanvas = document.getElementById("rowHighlightCanvas");
const currentRowInput = document.getElementById("currentRowInput");
const currentRowStatus = document.getElementById("currentRowStatus");
const previousRowBtn = document.getElementById("previousRowBtn");
const nextRowBtn = document.getElementById("nextRowBtn");
const workspaceDimensions = document.getElementById("workspaceDimensions");
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
const workspaceCtx = workspaceCanvas.getContext("2d");

let uploadedImage = null;
let generatedDimensions = null;
let currentRow = 1;

function showView(showWorkspace) {
    patternView.hidden = showWorkspace;
    crochetWorkspace.hidden = !showWorkspace;
    patternTab.setAttribute("aria-selected", String(!showWorkspace));
    crochetTab.setAttribute("aria-selected", String(showWorkspace));
}

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

    CrochetGridRenderer.draw(adjustedImage, width, height, gridCanvas, twoColorInput.checked);

    gridCanvas.hidden = false;
    gridPlaceholder.hidden = true;
    generatedDimensions = { width, height };
    enlargeBtn.disabled = false;
    downloadBtn.disabled = false;
    crochetTab.disabled = false;
    workspaceDimensions.textContent = `${width} stitches wide · ${height} rows`;
    currentRowInput.max = height;
    currentRow = Math.min(currentRow, height);
    currentRowInput.disabled = false;
    previousRowBtn.disabled = false;
    nextRowBtn.disabled = false;
    workspaceCanvas.width = gridCanvas.width;
    workspaceCanvas.height = gridCanvas.height;
    workspaceCtx.drawImage(gridCanvas, 0, 0);
    updateWorkspaceRow();
    status.textContent = `Grid generated successfully! ${width} × ${height} stitches.`;
}

function updateWorkspaceRow() {
    if (!generatedDimensions) return;

    currentRowInput.value = currentRow;
    currentRowStatus.textContent = `Row ${currentRow} of ${generatedDimensions.height}`;
    previousRowBtn.disabled = currentRow <= 1;
    nextRowBtn.disabled = currentRow >= generatedDimensions.height;
    CrochetGridRenderer.highlightRow(
        rowHighlightCanvas,
        generatedDimensions.width,
        generatedDimensions.height,
        currentRow - 1
    );
}

function setCurrentRow(row) {
    if (!generatedDimensions || !Number.isInteger(row)) return;

    currentRow = Math.max(1, Math.min(generatedDimensions.height, row));
    updateWorkspaceRow();
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
            currentRow = 1;
            gridCanvas.hidden = true;
            gridPlaceholder.hidden = false;
            enlargeBtn.disabled = true;
            downloadBtn.disabled = true;
            crochetTab.disabled = true;
            currentRowInput.disabled = true;
            previousRowBtn.disabled = true;
            nextRowBtn.disabled = true;
            currentRowStatus.textContent = "Generate a pattern to start tracking rows.";
            workspaceDimensions.textContent = "";
            showView(false);
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
    currentRow = 1;
    renderGrid(gridWidth, gridHeight);
});

for (const control of [brightnessInput, contrastInput, saturationInput, thresholdInput]) {
    control.addEventListener("input", updateColorControls);
}

twoColorInput.addEventListener("change", updateColorControls);

patternTab.addEventListener("click", function() {
    showView(false);
});

crochetTab.addEventListener("click", function() {
    if (!crochetTab.disabled) showView(true);
});

previousRowBtn.addEventListener("click", function() {
    setCurrentRow(currentRow - 1);
});

nextRowBtn.addEventListener("click", function() {
    setCurrentRow(currentRow + 1);
});

currentRowInput.addEventListener("change", function() {
    const row = Number(currentRowInput.value);
    setCurrentRow(row);
});

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
