window.CrochetPatternProject = (function() {
    function create(pattern) {
        return {
            format: "crochet-grid-tool",
            version: 1,
            width: pattern.width,
            height: pattern.height,
            currentRow: pattern.currentRow,
            twoColor: pattern.twoColor,
            adjustments: pattern.adjustments,
            stitches: Array.from(pattern.stitches)
        };
    }

    function parse(serialized) {
        const project = JSON.parse(serialized);
        validate(project);
        return project;
    }

    function validate(project) {
        if (!project || project.format !== "crochet-grid-tool" || project.version !== 1) {
            throw new Error("File is not a supported crochet pattern project.");
        }

        const { width, height, currentRow, stitches, adjustments } = project;
        if (
            !Number.isInteger(width) ||
            !Number.isInteger(height) ||
            width < 1 ||
            height < 1 ||
            width > 300 ||
            height > 300 ||
            !Number.isInteger(currentRow) ||
            currentRow < 1 ||
            currentRow > height
        ) {
            throw new Error("Pattern dimensions or current row are invalid.");
        }

        if (
            !Array.isArray(stitches) ||
            stitches.length !== width * height ||
            stitches.some(color => !Number.isInteger(color) || color < 0 || color > 0xffffff)
        ) {
            throw new Error("Pattern stitch data is invalid.");
        }

        if (
            typeof project.twoColor !== "boolean" ||
            !adjustments ||
            !Number.isFinite(adjustments.brightness) ||
            !Number.isFinite(adjustments.contrast) ||
            !Number.isFinite(adjustments.saturation) ||
            !Number.isFinite(adjustments.threshold) ||
            adjustments.brightness < 0 || adjustments.brightness > 200 ||
            adjustments.contrast < 0 || adjustments.contrast > 200 ||
            adjustments.saturation < 0 || adjustments.saturation > 200 ||
            adjustments.threshold < 0 || adjustments.threshold > 255
        ) {
            throw new Error("Pattern settings are invalid.");
        }
    }

    return { create, parse };
})();
