const imageInput = document.getElementById("imageInput");
const originalImage = document.getElementById("originalImage");
const gridWidthInput = document.getElementById("gridWidth");
const gridHeightInput = document.getElementById("gridHeight");
const generateBtn = document.getElementById("generateBtn");
const gridCanvas = document.getElementById("gridCanvas");
const gridContainer = document.getElementById("gridContainer");
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
const editorGuideCanvas = document.getElementById("editorGuideCanvas");
const editorRuleCanvas = document.getElementById("editorRuleCanvas");
const stitchColorInput = document.getElementById("stitchColor");
const undoEditBtn = document.getElementById("undoEditBtn");
const mosaicModeInput = document.getElementById("mosaicMode");
const mosaicModeDescription = document.getElementById("mosaicModeDescription");
const editorDimensions = document.getElementById("editorDimensions");
const showGuideImageInput = document.getElementById("showGuideImage");
const guidePositionInput = document.getElementById("guidePosition");
const guideOpacityInput = document.getElementById("guideOpacity");
const guideOpacityValue = document.getElementById("guideOpacityValue");
const guideAvailability = document.getElementById("guideAvailability");
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
let guideImage = null;
let guideImageDataUrl = null;
let generatedDimensions = null;
let requestedDimensions = null;
let currentRow = 1;
let stitchColors = null;
let twoColorPattern = false;
let patternEdited = false;
let mosaicEnabled = false;
let mosaicPatternData = null;

function showView(view) {
    patternView.hidden = view !== "pattern";
    editorWorkspace.hidden = view !== "editor";
    crochetWorkspace.hidden = view !== "crochet";
    patternTab.setAttribute("aria-selected", String(view === "pattern"));
    editorTab.setAttribute("aria-selected", String(view === "editor"));
    crochetTab.setAttribute("aria-selected", String(view === "crochet"));
    document.body.classList.toggle("editor-mode", view === "editor");
    document.body.classList.toggle("crochet-mode", view === "crochet");
    document.body.classList.toggle("pattern-mode", view === "pattern");
}

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

document.addEventListener("keydown", function(event) {
    if (
        (!event.ctrlKey && !event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== "z" ||
        editorWorkspace.hidden ||
        undoEditBtn.disabled
    ) {
        return;
    }

    const target = event.target;
    if (
        target instanceof Element &&
        (target.matches("input, textarea, select") || target.isContentEditable)
    ) {
        return;
    }

    event.preventDefault();
    pixelEditor.undo();
});

function samplePattern(width, height) {
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

    return {
        canvas: sourceCanvas,
        colors: imageDataToColors(adjustedImage)
    };
}

function createPatternAtRequestedSize(width, requestedHeight) {
    const pattern = samplePattern(width, requestedHeight);
    const correctedStitches = CrochetStitchPatternRules.correctTwoRowTallSpots(
        pattern.colors,
        width,
        requestedHeight,
        twoColorInput.checked ? [0x333333, 0xffffff] : null
    );
    return { ...pattern, height: requestedHeight, correctedStitches };
}

function renderGrid(width, height) {
    requestedDimensions = { width, height };
    const pattern = createPatternAtRequestedSize(width, height);
    height = pattern.height;
    guideImage = uploadedImage;
    stitchColors = pattern.colors;
    guideImageDataUrl = pattern.canvas.toDataURL("image/png");
    twoColorPattern = twoColorInput.checked;
    patternEdited = false;
    setupPattern(width, height);
    status.textContent = pattern.correctedStitches === 0
        ? `Grid generated successfully! ${width} × ${height} stitches.`
        : `Grid generated at the requested ${width} × ${height} size. ${pattern.correctedStitches} stitch${pattern.correctedStitches === 1 ? " was" : "es were"} adjusted to remove vertical same-color runs exactly 2 stitches tall.`;
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
    gridContainer.classList.add("has-pattern");
    currentRow = Math.min(currentRow, height + (mosaicEnabled ? 3 : 0));
    pixelEditor.setPattern(stitchColors, width, height);
    renderPatternCanvases();

    gridCanvas.hidden = false;
    gridPlaceholder.hidden = true;
    enlargeBtn.disabled = false;
    downloadBtn.disabled = false;
    saveProjectBtn.disabled = false;
    editorTab.disabled = false;
    crochetTab.disabled = false;
    mosaicModeInput.disabled = false;
    mosaicModeInput.checked = mosaicEnabled;
    editorDimensions.textContent = `${width} stitches wide · ${height} rows`;
    gridWidthInput.value = width;
    gridHeightInput.value = height;
    const workspaceDimensionsValue = getWorkspaceDimensions();
    workspaceDimensions.textContent = mosaicEnabled
        ? `Mosaic pattern · ${workspaceDimensionsValue.width} stitches wide · ${workspaceDimensionsValue.height} rows`
        : editorDimensions.textContent;
    currentRowInput.max = workspaceDimensionsValue.height;
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
    CrochetGridRenderer.drawRuleOverlay(
        editorRuleCanvas,
        CrochetStitchPatternRules.findTwoRowTallSpots(stitchColors, width, height),
        width,
        height
    );
    if (guideImage) {
        drawGuideImage(width, height);
    }
    if (mosaicEnabled) {
        renderMosaicPattern();
    } else {
        mosaicPatternData = null;
        workspaceDimensions.textContent = `${width} stitches wide · ${height} rows`;
        currentRowInput.max = height;
        currentRow = Math.min(currentRow, height);
    }
    mosaicModeDescription.hidden = !mosaicEnabled;
    updateGuidePreview();
    updateWorkspaceRow();
}

function drawGuideImage(width, height) {
    const context = editorGuideCanvas.getContext("2d");
    editorGuideCanvas.width = width * CrochetGridRenderer.stitchSize;
    editorGuideCanvas.height = height * CrochetGridRenderer.stitchSize;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, editorGuideCanvas.width, editorGuideCanvas.height);
    context.drawImage(guideImage, 0, 0, editorGuideCanvas.width, editorGuideCanvas.height);
}

function updateGuidePreview() {
    const hasGuide = Boolean(guideImage);
    const guideEnabled = hasGuide && showGuideImageInput.checked;

    showGuideImageInput.disabled = !hasGuide;
    guidePositionInput.disabled = !hasGuide;
    guideOpacityInput.disabled = !hasGuide;
    guideAvailability.textContent = hasGuide
        ? "The source image is saved with editable projects as a guide."
        : "No source image is available for this pattern.";
    guideOpacityValue.value = `${guideOpacityInput.value}%`;
    editorGuideCanvas.hidden = !guideEnabled;
    editorGuideCanvas.style.opacity = String(Number(guideOpacityInput.value) / 100);
    editorCanvas.style.opacity = guideEnabled && guidePositionInput.value === "under" ? "0.62" : "1";
    editorCanvas.parentElement.dataset.guidePosition = guidePositionInput.value;
}

function renderMosaicPattern() {
    if (!generatedDimensions || !stitchColors) return;

    mosaicPatternData = CrochetMosaicPattern.create(
        stitchColors,
        generatedDimensions.width,
        generatedDimensions.height,
        Number(thresholdInput.value)
    );
    CrochetMosaicPattern.draw(mosaicPatternData, gridCanvas);
    CrochetMosaicPattern.draw(mosaicPatternData, workspaceCanvas);
    workspaceDimensions.textContent =
        `Mosaic pattern · ${mosaicPatternData.width} stitches wide · ${mosaicPatternData.height} rows`;
    currentRowInput.max = mosaicPatternData.height;
    currentRow = Math.min(currentRow, mosaicPatternData.height);
    updateWorkspaceRow();
}

function updateMosaicMode() {
    mosaicEnabled = mosaicModeInput.checked;
    thresholdControl.hidden = !(twoColorInput.checked || mosaicEnabled);
    if (generatedDimensions) {
        renderPatternCanvases();
        status.textContent = mosaicEnabled
            ? "Mosaic crochet rules applied to the generated pattern."
            : "Standard crochet pattern restored.";
    }
}

function getWorkspaceDimensions() {
    return mosaicEnabled && mosaicPatternData
        ? { width: mosaicPatternData.width, height: mosaicPatternData.height }
        : generatedDimensions;
}

function updateWorkspaceRow() {
    const dimensions = getWorkspaceDimensions();
    if (!dimensions) return;

    currentRowInput.value = currentRow;
    currentRowStatus.textContent = `Row ${currentRow} of ${dimensions.height}`;
    previousRowBtn.disabled = currentRow <= 1;
    nextRowBtn.disabled = currentRow >= dimensions.height;
    if (mosaicEnabled && mosaicPatternData) {
        CrochetMosaicPattern.highlightRow(rowHighlightCanvas, mosaicPatternData, currentRow - 1);
    } else {
        CrochetGridRenderer.highlightRow(
            rowHighlightCanvas,
            dimensions.width,
            dimensions.height,
            currentRow - 1
        );
    }
}

function setCurrentRow(row) {
    const dimensions = getWorkspaceDimensions();
    if (!dimensions || !Number.isInteger(row)) return;

    currentRow = Math.max(1, Math.min(dimensions.height, row));
    updateWorkspaceRow();
}

function updateColorControls() {
    for (const control of [brightnessInput, contrastInput, saturationInput]) {
        document.getElementById(`${control.id}Value`).value = `${control.value}%`;
    }

    thresholdValue.value = thresholdInput.value;
    thresholdControl.hidden = !(twoColorInput.checked || mosaicEnabled);

    if (uploadedImage && generatedDimensions && !patternEdited) {
        renderGrid(generatedDimensions.width, requestedDimensions.height);
    } else if (patternEdited || mosaicEnabled) {
        renderPatternCanvases();
        if (patternEdited) {
            status.textContent = "Pattern edits are preserved. Generate again to apply color changes.";
        }
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
        stitches: stitchColors,
        guideImage: guideImageDataUrl,
        guideSettings: {
            visible: showGuideImageInput.checked,
            position: guidePositionInput.value,
            opacity: Number(guideOpacityInput.value)
        },
        mosaicEnabled
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
            guideImage = null;
            guideImageDataUrl = project.guideImage || null;
            stitchColors = Uint32Array.from(project.stitches);
            twoColorPattern = project.twoColor;
            patternEdited = false;
            currentRow = project.currentRow;
            twoColorInput.checked = project.twoColor;
            brightnessInput.value = project.adjustments.brightness;
            contrastInput.value = project.adjustments.contrast;
            saturationInput.value = project.adjustments.saturation;
            thresholdInput.value = project.adjustments.threshold;
            requestedDimensions = { width: project.width, height: project.height };
            showGuideImageInput.checked = project.guideSettings?.visible ?? false;
            guidePositionInput.value = project.guideSettings?.position ?? "above";
            guideOpacityInput.value = project.guideSettings?.opacity ?? 35;
            mosaicEnabled = project.mosaicEnabled ?? false;
            mosaicModeInput.checked = mosaicEnabled;

            updateColorControls();
            updateGuidePreview();
            setupPattern(project.width, project.height);
            originalImage.removeAttribute("src");
            originalImage.style.display = "none";
            generateBtn.disabled = true;
            showView("editor");
            status.textContent = "Editable pattern project opened.";

            if (guideImageDataUrl) {
                guideImage = new Image();
                guideImage.onload = function() {
                    if (generatedDimensions) drawGuideImage(generatedDimensions.width, generatedDimensions.height);
                    updateGuidePreview();
                };
                guideImage.onerror = function() {
                    guideImage = null;
                    updateGuidePreview();
                    status.textContent = "Pattern opened, but its saved guide image could not be loaded.";
                };
                guideImage.src = guideImageDataUrl;
            }
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
            guideImage = image;
            guideImageDataUrl = null;
            stitchColors = null;
            generatedDimensions = null;
            requestedDimensions = null;
            patternEdited = false;
            mosaicPatternData = null;
            pixelEditor.reset();
            originalImage.src = e.target.result;
            originalImage.style.display = "block";
            generateBtn.disabled = false;
            currentRow = 1;
            showGuideImageInput.checked = false;
            mosaicEnabled = false;
            mosaicModeInput.checked = false;
            mosaicModeDescription.hidden = true;
            updateGuidePreview();
            gridCanvas.hidden = true;
            gridContainer.classList.remove("has-pattern");
            gridPlaceholder.hidden = false;
            enlargeBtn.disabled = true;
            downloadBtn.disabled = true;
            crochetTab.disabled = true;
            editorTab.disabled = true;
            saveProjectBtn.disabled = true;
            mosaicModeInput.disabled = true;
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

showGuideImageInput.addEventListener("change", updateGuidePreview);
guidePositionInput.addEventListener("change", updateGuidePreview);
guideOpacityInput.addEventListener("input", updateGuidePreview);

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
        link.download = mosaicEnabled ? "mosaic-crochet-pattern.png" : "crochet-pattern.png";
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(function() {
            URL.revokeObjectURL(url);
        }, 1000);
    }, "image/png");
});

mosaicModeInput.addEventListener("change", updateMosaicMode);

updateColorControls();
