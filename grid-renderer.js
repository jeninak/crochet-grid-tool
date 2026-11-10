window.CrochetGridRenderer = (function() {
    const STITCH_SIZE = 12;

    function draw(imageData, width, height, canvas) {
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

        drawGridLines(context, width, height);
    }

    function drawGridLines(context, width, height) {
        for (let x = 0; x <= width; x++) {
            const majorLine = x % 10 === 0;
            const position = x * STITCH_SIZE + (majorLine ? 0 : 0.5);

            context.beginPath();
            context.lineWidth = majorLine ? 2 : 1;
            context.strokeStyle = majorLine ? "#333333" : "#999999";
            context.moveTo(position, 0);
            context.lineTo(position, height * STITCH_SIZE);
            context.stroke();
        }

        for (let y = 0; y <= height; y++) {
            const majorLine = y % 10 === 0;
            const position = y * STITCH_SIZE + (majorLine ? 0 : 0.5);

            context.beginPath();
            context.lineWidth = majorLine ? 2 : 1;
            context.strokeStyle = majorLine ? "#333333" : "#999999";
            context.moveTo(0, position);
            context.lineTo(width * STITCH_SIZE, position);
            context.stroke();
        }
    }

    return { draw };
})();
