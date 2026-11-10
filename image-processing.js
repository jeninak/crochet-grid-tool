window.CrochetImageProcessing = (function() {
    function adjustColors(imageData, adjustments) {
        const data = imageData.data;
        const brightness = adjustments.brightness / 100;
        const contrast = adjustments.contrast / 100;
        const saturation = adjustments.saturation / 100;

        for (let i = 0; i < data.length; i += 4) {
            const red = data[i] * brightness;
            const green = data[i + 1] * brightness;
            const blue = data[i + 2] * brightness;
            const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;

            data[i] = adjustChannel(red, luminance, saturation, contrast);
            data[i + 1] = adjustChannel(green, luminance, saturation, contrast);
            data[i + 2] = adjustChannel(blue, luminance, saturation, contrast);
        }

        return imageData;
    }

    function applyTwoColor(imageData, threshold) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const luminance = data[i] * 0.2126 + data[i + 1] * 0.7152 + data[i + 2] * 0.0722;
            const color = luminance < threshold ? 51 : 255;
            data[i] = color;
            data[i + 1] = color;
            data[i + 2] = color;
        }

        return imageData;
    }

    function adjustChannel(value, luminance, saturation, contrast) {
        const saturated = luminance + (value - luminance) * saturation;
        const adjusted = (saturated - 128) * contrast + 128;
        return Math.max(0, Math.min(255, adjusted));
    }

    return { adjustColors, applyTwoColor };
})();
