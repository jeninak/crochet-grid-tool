window.CrochetGridRenderer = (function() {
    const STITCH_SIZE = 12;

    function draw(imageData, width, height, canvas, twoColor = false) {
        const pixels = imageData.data;
        const colors = new Uint32Array(width * height);

        for (let index = 0; index < colors.length; index++) {
            const pixelIndex = index * 4;
            colors[index] =
                (pixels[pixelIndex] << 16) |
                (pixels[pixelIndex + 1] << 8) |
                pixels[pixelIndex + 2];
        }

        drawColors(colors, width, height, canvas, twoColor);
    }

    function drawColors(colors, width, height, canvas, twoColor = false, includeGrid = true) {
        const context = canvas.getContext("2d");

        canvas.width = width * STITCH_SIZE;
        canvas.height = height * STITCH_SIZE;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const color = colors[y * width + x];
                const red = (color >> 16) & 255;
                const green = (color >> 8) & 255;
                const blue = color & 255;
                context.fillStyle = `rgb(${red}, ${green}, ${blue})`;
                context.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
        }

        if (includeGrid) {
            drawGridLines(context, width, height, twoColor);
        }
    }

    function drawGridOverlay(canvas, width, height, twoColor = false) {
        canvas.width = width * STITCH_SIZE;
        canvas.height = height * STITCH_SIZE;
        drawGridLines(canvas.getContext("2d"), width, height, twoColor);
    }

    function drawRuleOverlay(canvas, spots, width, height) {
        canvas.width = width * STITCH_SIZE;
        canvas.height = height * STITCH_SIZE;
        if (spots.length === 0) return;

        const context = canvas.getContext("2d");
        context.fillStyle = "rgba(220, 38, 38, 0.38)";
        context.strokeStyle = "#dc2626";
        context.lineWidth = 2;

        for (const spot of spots) {
            for (const index of spot.indices) {
                const x = (index % width) * STITCH_SIZE;
                const y = Math.floor(index / width) * STITCH_SIZE;
                context.fillRect(x, y, STITCH_SIZE, STITCH_SIZE);
                context.strokeRect(x + 1, y + 1, STITCH_SIZE - 2, STITCH_SIZE - 2);
            }
        }
    }

    function drawGridLines(context, width, height, twoColor) {
        const minorColor = twoColor ? "#b6b6ae" : "#999999";
        const majorColor = twoColor ? "#85857e" : "#333333";

        for (let x = 0; x <= width; x++) {
            const majorLine = x % 10 === 0;
            const position = x * STITCH_SIZE + (majorLine ? 0 : 0.5);

            context.beginPath();
            context.lineWidth = majorLine ? 2 : 1;
            context.strokeStyle = majorLine ? majorColor : minorColor;
            context.moveTo(position, 0);
            context.lineTo(position, height * STITCH_SIZE);
            context.stroke();
        }

        for (let y = 0; y <= height; y++) {
            const majorLine = y % 10 === 0;
            const position = y * STITCH_SIZE + (majorLine ? 0 : 0.5);

            context.beginPath();
            context.lineWidth = majorLine ? 2 : 1;
            context.strokeStyle = majorLine ? majorColor : minorColor;
            context.moveTo(0, position);
            context.lineTo(width * STITCH_SIZE, position);
            context.stroke();
        }
    }

    function highlightRow(canvas, width, height, rowIndex) {
        const context = canvas.getContext("2d");
        canvas.width = width * STITCH_SIZE;
        canvas.height = height * STITCH_SIZE;

        if (rowIndex < 0 || rowIndex >= height) return;

        const top = rowIndex * STITCH_SIZE;

        context.fillStyle = "rgba(231, 169, 77, 0.38)";
        context.fillRect(0, top, canvas.width, STITCH_SIZE);
        context.strokeStyle = "#a75f25";
        context.lineWidth = 2;
        context.strokeRect(1, top + 1, canvas.width - 2, STITCH_SIZE - 2);
    }

    return { stitchSize: STITCH_SIZE, draw, drawColors, drawGridOverlay, drawRuleOverlay, highlightRow };
})();
