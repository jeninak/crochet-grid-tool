window.CrochetStitchPatternRules = (function() {
    function findTwoRowTallSpots(colors, width, height) {
        const spots = [];

        for (let x = 0; x < width; x++) {
            let startY = 0;

            while (startY < height) {
                const color = colors[startY * width + x];
                let endY = startY + 1;
                while (endY < height && colors[endY * width + x] === color) endY++;

                if (endY - startY === 2) {
                    spots.push({
                        x,
                        color,
                        indices: [startY * width + x, (startY + 1) * width + x]
                    });
                }

                startY = endY;
            }
        }

        return spots;
    }

    function hasTwoRowTallSpots(colors, width, height) {
        return findTwoRowTallSpots(colors, width, height).length > 0;
    }

    function correctTwoRowTallSpots(colors, width, height, allowedColors) {
        if (allowedColors && allowedColors.length > 0) {
            return correctWithPalette(colors, width, height, Array.from(new Set(allowedColors)));
        }

        let changed = 0;

        for (let x = 0; x < width; x++) {
            let startY = 0;

            while (startY < height) {
                const color = colors[startY * width + x];
                let endY = startY + 1;
                while (endY < height && colors[endY * width + x] === color) endY++;

                if (endY - startY === 2) {
                    const replacement = findReplacementColor(colors, width, height, x, startY, color);
                    colors[replacement.index] = replacement.color;
                    changed++;
                }

                startY = endY;
            }
        }

        return changed;
    }

    function correctWithPalette(colors, width, height, palette) {
        let changed = 0;

        for (let x = 0; x < width; x++) {
            const originalColumn = new Uint32Array(height);
            for (let y = 0; y < height; y++) {
                originalColumn[y] = colors[y * width + x];
            }

            const layers = [];
            let states = new Map();

            for (let colorIndex = 0; colorIndex < palette.length; colorIndex++) {
                const color = palette[colorIndex];
                const key = `${colorIndex}:1`;
                states.set(key, {
                    colorIndex,
                    runLength: 1,
                    score: color === originalColumn[0] ? 0 : 10000,
                    previousKey: null
                });
            }
            layers.push(states);

            for (let y = 1; y < height; y++) {
                const nextStates = new Map();
                for (const [previousKey, previous] of states) {
                    for (let colorIndex = 0; colorIndex < palette.length; colorIndex++) {
                        const sameColor = colorIndex === previous.colorIndex;
                        if (!sameColor && previous.runLength === 2) continue;

                        const runLength = sameColor ? Math.min(3, previous.runLength + 1) : 1;
                        const color = palette[colorIndex];
                        const index = y * width + x;
                        let score = previous.score + (color === originalColumn[y] ? 0 : 10000);
                        if (x > 0 && colors[index - 1] !== color) score++;
                        if (x + 1 < width && colors[index + 1] !== color) score++;

                        const key = `${colorIndex}:${runLength}`;
                        const current = nextStates.get(key);
                        if (!current || score < current.score) {
                            nextStates.set(key, {
                                colorIndex,
                                runLength,
                                score,
                                previousKey
                            });
                        }
                    }
                }
                states = nextStates;
                layers.push(states);
            }

            let bestKey = null;
            let best = null;
            for (const [key, state] of states) {
                if (state.runLength !== 2 && (!best || state.score < best.score)) {
                    best = state;
                    bestKey = key;
                }
            }
            if (!best) {
                throw new Error("Could not create a valid stitch column using the selected colors.");
            }

            for (let y = height - 1; y >= 0; y--) {
                const state = layers[y].get(bestKey);
                const index = y * width + x;
                const color = palette[state.colorIndex];
                if (colors[index] !== color) {
                    colors[index] = color;
                    changed++;
                }
                bestKey = state.previousKey;
            }
        }

        return changed;
    }

    function findReplacementColor(colors, width, height, x, startY, current) {
        let best = null;
        const candidates = new Set();

        for (let y = startY; y <= startY + 1; y++) {
            for (let offsetY = -1; offsetY <= 1; offsetY++) {
                for (let offsetX = -1; offsetX <= 1; offsetX++) {
                    const neighborX = x + offsetX;
                    const neighborY = y + offsetY;
                    if (
                        (offsetX === 0 && offsetY === 0) ||
                        neighborX < 0 ||
                        neighborX >= width ||
                        neighborY < 0 ||
                        neighborY >= height
                    ) {
                        continue;
                    }
                    candidates.add(colors[neighborY * width + neighborX]);
                }
            }
        }

        best = findBestReplacement(colors, width, height, x, startY, current, candidates);
        if (best) return best;

        for (const shade of [0x33, 0x77, 0xcc, 0xff]) {
            candidates.add((shade << 16) | (shade << 8) | shade);
        }

        best = findBestReplacement(colors, width, height, x, startY, current, candidates, true);
        if (best) return best;

        throw new Error("Could not find a replacement color for a two-stitch vertical run.");
    }

    function findBestReplacement(colors, width, height, x, startY, current, candidates, preferContrast = false) {
        let best = null;
        for (let y = startY; y <= startY + 1; y++) {
            const index = y * width + x;
            const above = y > 0 ? colors[index - width] : null;
            const below = y + 1 < height ? colors[index + width] : null;

            for (const color of candidates) {
                if (color === current || color === above || color === below) continue;

                const candidate = {
                    index,
                    color,
                    horizontalEdges: countHorizontalEdges(colors, width, index, color),
                    colorDistance: distanceBetweenColors(current, color)
                };
                if (
                    !best ||
                    candidate.horizontalEdges < best.horizontalEdges ||
                    (candidate.horizontalEdges === best.horizontalEdges &&
                        (preferContrast
                            ? candidate.colorDistance > best.colorDistance
                            : candidate.colorDistance < best.colorDistance))
                ) {
                    best = candidate;
                }
            }
        }
        return best;
    }

    function countHorizontalEdges(colors, width, index, color) {
        const x = index % width;
        let edges = 0;
        if (x > 0 && colors[index - 1] !== color) edges++;
        if (x + 1 < width && colors[index + 1] !== color) edges++;
        return edges;
    }

    function distanceBetweenColors(left, right) {
        const redDifference = ((left >> 16) & 255) - ((right >> 16) & 255);
        const greenDifference = ((left >> 8) & 255) - ((right >> 8) & 255);
        const blueDifference = (left & 255) - (right & 255);
        return redDifference * redDifference +
            greenDifference * greenDifference +
            blueDifference * blueDifference;
    }

    return { findTwoRowTallSpots, hasTwoRowTallSpots, correctTwoRowTallSpots };
})();
