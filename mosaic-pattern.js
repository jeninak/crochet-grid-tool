window.CrochetMosaicPattern = (function() {
    const STITCH_SIZE = 12;
    const COLOR_A = 0x333333;
    const COLOR_B = 0xffffff;
    const LABEL_WIDTH = 76;

    function create(colors, width, height, threshold) {
        const target = Array.from(colors, color => {
            const red = (color >> 16) & 255;
            const green = (color >> 8) & 255;
            const blue = color & 255;
            const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
            return luminance < threshold ? COLOR_A : COLOR_B;
        });

        const chartHeight = height + 3;
        const chartWidth = width + 2;
        const rows = Array.from({ length: chartHeight }, (_, index) => ({
            number: index + 1,
            yarn: index % 2 === 0 ? "A" : "B",
            color: index % 2 === 0 ? COLOR_A : COLOR_B,
            marks: new Uint8Array(chartWidth)
        }));

        for (let targetRow = 0; targetRow < height; targetRow++) {
            const imageRow = targetRow + 2;
            const baseColor = rows[imageRow].color;
            const overlayRow = rows[targetRow + 3];

            for (let x = 0; x < width; x++) {
                if (target[targetRow * width + x] !== baseColor) {
                    overlayRow.marks[x + 1] = 1;
                }
            }
        }

        return { width: chartWidth, height: chartHeight, sourceWidth: width, sourceHeight: height, rows };
    }

    function draw(chart, canvas) {
        const context = canvas.getContext("2d");
        canvas.width = LABEL_WIDTH + chart.width * STITCH_SIZE;
        canvas.height = chart.height * STITCH_SIZE;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "bold 9px Arial, sans-serif";

        for (const row of chart.rows) {
            const top = (row.number - 1) * STITCH_SIZE;
            const fill = row.color === COLOR_A ? "#333333" : "#ffffff";
            const markColor = row.color === COLOR_A ? "#ffffff" : "#333333";
            context.fillStyle = "#f5f4ee";
            context.fillRect(0, top, LABEL_WIDTH, STITCH_SIZE);
            context.fillStyle = "#293a33";
            context.font = "9px Arial, sans-serif";
            context.fillText(`${row.number} · ${row.yarn}`, LABEL_WIDTH / 2, top + STITCH_SIZE / 2);
            context.font = "bold 9px Arial, sans-serif";
            context.fillStyle = fill;
            context.fillRect(LABEL_WIDTH, top, chart.width * STITCH_SIZE, STITCH_SIZE);

            for (let x = 0; x < chart.width; x++) {
                if (!row.marks[x]) continue;
                context.fillStyle = markColor;
                context.fillText("X", LABEL_WIDTH + x * STITCH_SIZE + STITCH_SIZE / 2, top + STITCH_SIZE / 2);
            }
        }

        drawGrid(context, chart.width, chart.height);
    }

    function drawGrid(context, width, height) {
        for (let x = 0; x <= width; x++) {
            const major = x % 10 === 0;
            const position = LABEL_WIDTH + x * STITCH_SIZE + (major ? 0 : 0.5);
            context.beginPath();
            context.lineWidth = major ? 2 : 1;
            context.strokeStyle = major ? "#77776f" : "#b6b6ae";
            context.moveTo(position, 0);
            context.lineTo(position, height * STITCH_SIZE);
            context.stroke();
        }

        for (let y = 0; y <= height; y++) {
            const major = y % 10 === 0;
            const position = y * STITCH_SIZE + (major ? 0 : 0.5);
            context.beginPath();
            context.lineWidth = major ? 2 : 1;
            context.strokeStyle = major ? "#77776f" : "#b6b6ae";
            context.moveTo(LABEL_WIDTH, position);
            context.lineTo(LABEL_WIDTH + width * STITCH_SIZE, position);
            context.stroke();
        }
    }

    function highlightRow(canvas, chart, rowIndex) {
        const context = canvas.getContext("2d");
        canvas.width = LABEL_WIDTH + chart.width * STITCH_SIZE;
        canvas.height = chart.height * STITCH_SIZE;

        if (rowIndex < 0 || rowIndex >= chart.height) return;

        const top = rowIndex * STITCH_SIZE;
        context.fillStyle = "rgba(231, 169, 77, 0.38)";
        context.fillRect(0, top, canvas.width, STITCH_SIZE);
        context.strokeStyle = "#a75f25";
        context.lineWidth = 2;
        context.strokeRect(1, top + 1, canvas.width - 2, STITCH_SIZE - 2);
    }

    return { create, draw, highlightRow };
})();
