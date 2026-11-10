window.CrochetGridRenderer = (function() {
    const STITCH_SIZE = 12;

    function draw(imageData, width, height, canvas, twoColor = false) {
        const context = canvas.getContext("2d");
        const pixels = imageData.data;

        canvas.width = width * STITCH_SIZE;
        canvas.height = height * STITCH_SIZE;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const index = (y * width + x) * 4;
                context.fillStyle = `rgb(${pixels[index]}, ${pixels[index + 1]}, ${pixels[index + 2]})`;
                context.fillRect(x * STITCH_SIZE, y * STITCH_SIZE, STITCH_SIZE, STITCH_SIZE);
            }
        }

        drawGridLines(context, width, height, twoColor);
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

    return { draw, highlightRow };
})();
