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
            guideImage: pattern.guideImage,
            guideSettings: pattern.guideSettings,
            mosaicEnabled: pattern.mosaicEnabled,
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
            currentRow > height + (project.mosaicEnabled === true ? 3 : 0)
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

        if (
            project.guideImage !== undefined &&
            (typeof project.guideImage !== "string" ||
                !project.guideImage.startsWith("data:image/png;base64,") ||
                project.guideImage.length > 2000000 ||
                !/^[A-Za-z0-9+/]+={0,2}$/.test(project.guideImage.slice("data:image/png;base64,".length)))
        ) {
            throw new Error("Saved guide image is invalid.");
        }

        const guideSettings = project.guideSettings;
        if (
            guideSettings !== undefined &&
            (!guideSettings ||
                typeof guideSettings.visible !== "boolean" ||
                !["above", "under"].includes(guideSettings.position) ||
                !Number.isInteger(guideSettings.opacity) ||
                guideSettings.opacity < 0 ||
                guideSettings.opacity > 100)
        ) {
            throw new Error("Guide display settings are invalid.");
        }

        if (project.mosaicEnabled !== undefined && typeof project.mosaicEnabled !== "boolean") {
            throw new Error("Mosaic pattern setting is invalid.");
        }
    }

    return { create, parse };
})();
