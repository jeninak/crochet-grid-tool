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

    function drawCoordinateRulers(columnCanvas, rowCanvas, width, height, leadingOffset = 0) {
        const chartWidth = leadingOffset + width * STITCH_SIZE;
        const chartHeight = height * STITCH_SIZE;
        const columnContext = columnCanvas.getContext("2d");
        const rowContext = rowCanvas.getContext("2d");

        columnCanvas.width = chartWidth;
        columnCanvas.height = 24;
        rowCanvas.width = 38;
        rowCanvas.height = chartHeight;

        columnContext.fillStyle = "#f5f4ee";
        columnContext.fillRect(0, 0, columnCanvas.width, columnCanvas.height);
        columnContext.strokeStyle = "#8b928a";
        columnContext.fillStyle = "#4d5b52";
        columnContext.lineWidth = 1;
        columnContext.font = "9px Arial, sans-serif";
        columnContext.textAlign = "center";
        columnContext.textBaseline = "middle";

        for (let x = 0; x <= width; x++) {
            const position = leadingOffset + x * STITCH_SIZE + 0.5;
            columnContext.beginPath();
            columnContext.moveTo(position, 17);
            columnContext.lineTo(position, 24);
            columnContext.stroke();
        }

        for (let column = 1; column <= width; column++) {
            if (column !== 1 && column % 10 !== 0) continue;
            const center = leadingOffset + (column - 0.5) * STITCH_SIZE;
            columnContext.fillText(String(column), center, 8);
        }

        rowContext.fillStyle = "#f5f4ee";
        rowContext.fillRect(0, 0, rowCanvas.width, rowCanvas.height);
        rowContext.strokeStyle = "#8b928a";
        rowContext.fillStyle = "#4d5b52";
        rowContext.lineWidth = 1;
        rowContext.font = "9px Arial, sans-serif";
        rowContext.textAlign = "right";
        rowContext.textBaseline = "middle";

        for (let y = 0; y <= height; y++) {
            const position = y * STITCH_SIZE + 0.5;
            rowContext.beginPath();
            rowContext.moveTo(31, position);
            rowContext.lineTo(38, position);
            rowContext.stroke();
        }

        for (let row = 1; row <= height; row++) {
            if (row !== 1 && row % 10 !== 0) continue;
            rowContext.fillText(String(row), 28, (row - 0.5) * STITCH_SIZE);
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

    return {
        stitchSize: STITCH_SIZE,
        draw,
        drawColors,
        drawGridOverlay,
        drawRuleOverlay,
        drawCoordinateRulers,
        highlightRow
    };
})();
