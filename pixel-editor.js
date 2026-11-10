window.CrochetPixelEditor = (function() {
    function create(canvas, colorInput, undoButton, stitchSize, onChange) {
        const context = canvas.getContext("2d");
        const history = [];
        let colors = null;
        let width = 0;
        let height = 0;
        let stroke = null;

        function setPattern(patternColors, patternWidth, patternHeight) {
            colors = patternColors;
            width = patternWidth;
            height = patternHeight;
            history.length = 0;
            stroke = null;
            updateUndoButton();
        }

        function reset() {
            colors = null;
            width = 0;
            height = 0;
            history.length = 0;
            stroke = null;
            updateUndoButton();
        }

        function updateUndoButton() {
            undoButton.disabled = history.length === 0;
        }

        function stitchAt(event) {
            if (!colors) return null;

            const bounds = canvas.getBoundingClientRect();
            const x = Math.floor((event.clientX - bounds.left) * canvas.width / bounds.width / stitchSize);
            const y = Math.floor((event.clientY - bounds.top) * canvas.height / bounds.height / stitchSize);

            if (x < 0 || y < 0 || x >= width || y >= height) return null;
            return { x, y, index: y * width + x };
        }

        function paint(event) {
            if (!stroke || event.pointerId !== stroke.pointerId) return;

            const stitch = stitchAt(event);
            if (!stitch || stroke.seen.has(stitch.index)) return;

            stroke.seen.add(stitch.index);
            const color = Number.parseInt(colorInput.value.slice(1), 16);
            const previousColor = colors[stitch.index];
            if (color === previousColor) return;

            stroke.changes.push({ index: stitch.index, color: previousColor });
            colors[stitch.index] = color;
            context.fillStyle = colorInput.value;
            context.fillRect(stitch.x * stitchSize, stitch.y * stitchSize, stitchSize, stitchSize);
        }

        function finishStroke() {
            if (!stroke) return;

            if (stroke.changes.length > 0) {
                history.push(stroke.changes);
                if (history.length > 50) history.shift();
                updateUndoButton();
                onChange("paint");
            }

            stroke = null;
        }

        function undo() {
            const changes = history.pop();
            if (!changes || !colors) return;

            for (const change of changes) {
                colors[change.index] = change.color;
            }

            updateUndoButton();
            onChange("undo");
        }

        canvas.addEventListener("pointerdown", function(event) {
            if (event.button !== 0 || !colors) return;

            stroke = {
                pointerId: event.pointerId,
                changes: [],
                seen: new Set()
            };
            canvas.setPointerCapture(event.pointerId);
            paint(event);
        });

        canvas.addEventListener("pointermove", paint);
        canvas.addEventListener("pointerup", finishStroke);
        canvas.addEventListener("pointercancel", finishStroke);
        undoButton.addEventListener("click", undo);

        return { setPattern, reset, undo };
    }

    return { create };
})();
