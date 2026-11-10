const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");
const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");
const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridPlaceholder = document.getElementById("gridPlaceholder");
const status = document.getElementById("status");
const patternTab = document.getElementById("patternTab");
const editorTab = document.getElementById("editorTab");
const crochetTab = document.getElementById("crochetTab");
const patternView = document.getElementById("patternView");
const editorWorkspace = document.getElementById("editorWorkspace");
const crochetWorkspace = document.getElementById("crochetWorkspace");
const projectInput = document.getElementById("projectInput");
const saveProjectBtn = document.getElementById("saveProjectBtn");
const editorCanvas = document.getElementById("editorCanvas");
const editorGridCanvas = document.getElementById("editorGridCanvas");
const stitchColorInput = document.getElementById("stitchColor");
const undoEditBtn = document.getElementById("undoEditBtn");
const editorDimensions = document.getElementById("editorDimensions");
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

let uploadedImage = null;
let generatedDimensions = null;
let currentRow = 1;
let stitchColors = null;
let twoColorPattern = false;
let patternEdited = false;

const pixelEditor = CrochetPixelEditor.create(
    editorCanvas,
    stitchColorInput,
    undoEditBtn,
    CrochetGridRenderer.stitchSize,
    function(action) {
        patternEdited = true;
        renderPatternCanvases();
        status.textContent = action === "undo"
            ? "Last stitch-editing stroke undone."
            : "Stitch edits added. Save the editable project to keep your changes.";
    }
);

function showView(view) {
    patternView.hidden = view !== "pattern";
    editorWorkspace.hidden = view !== "editor";
    crochetWorkspace.hidden = view !== "crochet";
    patternTab.setAttribute("aria-selected", String(view === "pattern"));
    editorTab.setAttribute("aria-selected", String(view === "editor"));
    crochetTab.setAttribute("aria-selected", String(view === "crochet"));
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

    stitchColors = imageDataToColors(adjustedImage);
    twoColorPattern = twoColorInput.checked;
    patternEdited = false;
    setupPattern(width, height);
    status.textContent = `Grid generated successfully! ${width} × ${height} stitches.`;
}

function imageDataToColors(imageData) {
    const pixels = imageData.data;
    const colors = new Uint32Array(pixels.length / 4);

    for (let index = 0; index < colors.length; index++) {
        const pixelIndex = index * 4;
        colors[index] =
            (pixels[pixelIndex] << 16) |
            (pixels[pixelIndex + 1] << 8) |
            pixels[pixelIndex + 2];
    }

    return colors;
}

function setupPattern(width, height) {
    generatedDimensions = { width, height };
    currentRow = Math.min(currentRow, height);
    pixelEditor.setPattern(stitchColors, width, height);
    renderPatternCanvases();

    gridCanvas.hidden = false;
    gridPlaceholder.hidden = true;
    enlargeBtn.disabled = false;
    downloadBtn.disabled = false;
    saveProjectBtn.disabled = false;
    editorTab.disabled = false;
    crochetTab.disabled = false;
    editorDimensions.textContent = `${width} stitches wide · ${height} rows`;
    workspaceDimensions.textContent = editorDimensions.textContent;
    gridWidthInput.value = width;
    gridHeightInput.value = height;
    currentRowInput.max = height;
    currentRowInput.disabled = false;
    previousRowBtn.disabled = false;
    nextRowBtn.disabled = false;
    updateWorkspaceRow();
}

function renderPatternCanvases() {
    if (!generatedDimensions || !stitchColors) return;

    const { width, height } = generatedDimensions;
    CrochetGridRenderer.drawColors(stitchColors, width, height, gridCanvas, twoColorPattern);
    CrochetGridRenderer.drawColors(stitchColors, width, height, workspaceCanvas, twoColorPattern);
    CrochetGridRenderer.drawColors(stitchColors, width, height, editorCanvas, false, false);
    CrochetGridRenderer.drawGridOverlay(editorGridCanvas, width, height, twoColorPattern);
    updateWorkspaceRow();
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

    if (uploadedImage && generatedDimensions && !patternEdited) {
        renderGrid(generatedDimensions.width, generatedDimensions.height);
    } else if (patternEdited) {
        status.textContent = "Pattern edits are preserved. Generate again to apply color changes.";
    }
}

function saveProject() {
    if (!generatedDimensions || !stitchColors) return;

    const project = CrochetPatternProject.create({
        width: generatedDimensions.width,
        height: generatedDimensions.height,
        currentRow,
        twoColor: twoColorPattern,
        adjustments: {
            brightness: Number(brightnessInput.value),
            contrast: Number(contrastInput.value),
            saturation: Number(saturationInput.value),
            threshold: Number(thresholdInput.value)
        },
        stitches: stitchColors
    });

    const blob = new Blob([JSON.stringify(project)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crochet-pattern.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function() {
        URL.revokeObjectURL(url);
    }, 1000);
    status.textContent = "Editable pattern project saved.";
}

function importProject(file) {
    const reader = new FileReader();

    reader.onload = function() {
        try {
            const project = CrochetPatternProject.parse(reader.result);

            uploadedImage = null;
            stitchColors = Uint32Array.from(project.stitches);
            twoColorPattern = project.twoColor;
            patternEdited = false;
            currentRow = project.currentRow;
            twoColorInput.checked = project.twoColor;
            brightnessInput.value = project.adjustments.brightness;
            contrastInput.value = project.adjustments.contrast;
            saturationInput.value = project.adjustments.saturation;
            thresholdInput.value = project.adjustments.threshold;
            updateColorControls();
            setupPattern(project.width, project.height);
            originalImage.removeAttribute("src");
            originalImage.style.display = "none";
            generateBtn.disabled = true;
            showView("editor");
            status.textContent = "Editable pattern project opened.";
        } catch (error) {
            status.textContent = `Could not open pattern project: ${error.message}`;
        }
    };

    reader.onerror = function() {
        status.textContent = "Could not read the selected pattern project.";
    };

    reader.readAsText(file);
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
            stitchColors = null;
            generatedDimensions = null;
            patternEdited = false;
            pixelEditor.reset();
            originalImage.src = e.target.result;
            originalImage.style.display = "block";
            generateBtn.disabled = false;
            currentRow = 1;
            gridCanvas.hidden = true;
            gridPlaceholder.hidden = false;
            enlargeBtn.disabled = true;
            downloadBtn.disabled = true;
            crochetTab.disabled = true;
            editorTab.disabled = true;
            saveProjectBtn.disabled = true;
            undoEditBtn.disabled = true;
            currentRowInput.disabled = true;
            previousRowBtn.disabled = true;
            nextRowBtn.disabled = true;
            currentRowStatus.textContent = "Generate a pattern to start tracking rows.";
            workspaceDimensions.textContent = "";
            showView("pattern");
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
    showView("pattern");
});

for (const control of [brightnessInput, contrastInput, saturationInput, thresholdInput]) {
    control.addEventListener("input", updateColorControls);
}

twoColorInput.addEventListener("change", updateColorControls);

patternTab.addEventListener("click", function() {
    showView("pattern");
});

editorTab.addEventListener("click", function() {
    if (!editorTab.disabled) showView("editor");
});

crochetTab.addEventListener("click", function() {
    if (!crochetTab.disabled) showView("crochet");
});

projectInput.addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) importProject(file);
    event.target.value = "";
});

saveProjectBtn.addEventListener("click", saveProject);

document.getElementById("darkGreySwatch").addEventListener("click", function() {
    stitchColorInput.value = "#333333";
});

document.getElementById("whiteSwatch").addEventListener("click", function() {
    stitchColorInput.value = "#ffffff";
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
