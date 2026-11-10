# Crochet Grid Tool

Crochet Grid Tool turns an image into a stitch-by-stitch chart. Generate a pattern, fine-tune individual stitches, save an editable project, and track your current row while you crochet.

## Features

- Convert PNG, JPEG, or WebP images into a crochet grid.
- Set the pattern width and height from 1 to 300 stitches.
- Adjust brightness, contrast, and saturation before generating the grid.
- Optionally simplify the image to white and dark grey, with an adjustable darkness threshold.
- Preview the chart at a larger size and download it as a PNG.
- Recolor individual stitches in the pixel editor. Click or drag to paint; use white to erase.
- Undo the most recent paint stroke.
- Track the row you are working on in a separate crochet workspace.
- Save and reopen an editable project containing the stitch colors, dimensions, color settings, and current row.

## Getting started

No installation or build step is required.

1. Download or clone this repository.
2. Open `index.html` in a modern browser.
3. Upload a PNG, JPEG, or WebP image and generate a pattern.

The app is a static website and processes the selected image in your browser.

![Pattern setup with an image, grid dimensions, and color adjustment controls](./assets/pattern-generation.png)

## How to use

### Create a pattern

1. In **Pattern setup**, choose an image.
2. Set the desired pattern width and height in stitches.
3. Optionally adjust brightness, contrast, and saturation. The default values leave the image unchanged.
4. To create a two-color chart, enable **Use two colors (white and dark grey)**. Adjust **Darkness threshold** to change which stitches are classified as dark.
5. Select **Generate crochet grid**.

Use **Preview larger** to inspect the chart. Select **Download PNG** to save an image of the pattern, including its grid lines.

Example input and generated chart:

<table>
  <tr>
    <th>Original image</th>
    <th>Generated crochet pattern</th>
  </tr>
  <tr>
    <td><img src="./assets/original.png" alt="Original image used to create the example pattern" width="360"></td>
    <td><img src="./assets/crochet-pattern.png" alt="Generated crochet chart with white and dark stitches" width="360"></td>
  </tr>
</table>

### Edit individual stitches

1. Generate a pattern or open a saved project.
2. Open **Pixel editor**.
3. Choose a color using the color picker, or select the dark-grey or white swatch.
4. Click or drag across stitches to apply the selected color. White can be used to replace a stitch with the background color.
5. Select **Undo last stroke** to revert the most recent click or drag.

Edits update the pattern and crochet workspace. Generating the pattern again from the source image replaces existing stitch edits.

![Pixel editor with stitch-color controls and an editable crochet grid](./assets/pixel-editor.png)

To compare stitch placement with the source, enable **Show original image guide**. Choose whether it appears on top of or underneath the stitches, then adjust its opacity. The guide is a visual aid only and does not change stitch colors.

### Track crochet progress

Open **Crochet workspace** to follow the chart while crocheting. Use **Previous row**, **Next row**, or the **Working row** field to move the highlight. Rows are numbered from top to bottom.

The row highlight is a temporary guide and is not included in the downloaded PNG.

![Crochet workspace with row navigation and the current row highlighted](./assets/workspace.png)

### Save and reopen a project

Select **Save editable project** to download a `.json` file. To continue later, open the tool and select **Open saved pattern**, then choose that project file. The saved project restores the stitch colors, dimensions, color settings, current row, and a resized copy of the source image for the pixel-editor guide.

Use the PNG download for viewing or printing. Use the JSON project to continue editing or crocheting later.

## Project files

- `index.html` — application structure and workflow views.
- `style.css` — layout and visual styling.
- `script.js` — application behavior and coordination.
- `image-processing.js` — image color adjustments and two-color conversion.
- `grid-renderer.js` — stitch grid, grid lines, and row highlight rendering.
- `pixel-editor.js` — stitch painting and undo behavior.
- `pattern-project.js` — editable project serialization and validation.
- `assets/` — project assets.

## License

This project is released under the [MIT License](./LICENSE).
