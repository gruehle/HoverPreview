## Hover Preview
This is a [Brackets](https://github.com/adobe/brackets) extension that shows a preview when the cursor is hovered over certain items. 

This currently works with gradients, colors and images. If you can think of other things you'd like to see in the preview, please let 
me know, or even better, submit a pull request.

## Usage

1. [Download](https://github.com/gruehle/HoverPreview/zipball/master) and unzip it; or clone this repo on GitHub
2. Copy the copied/cloned folder into the Brackets `extensions/user` folder
3. Restart Brackets. 

When the cursor is over a gradient value, color value or an image name, a preview of the value is shown.

## Screenshots

Here are a few screenshots of the extension in action.

Hovering over a color value:
<img src="https://raw.github.com/gruehle/HoverPreview/master/screenshots/Color.png" />

Hovering over a gradient:
<img src="https://raw.github.com/gruehle/HoverPreview/master/screenshots/Gradient.png" />

Hovering over an image filename:
<img src="https://raw.github.com/gruehle/HoverPreview/master/screenshots/Image.png" />

## Future

Add plug-in mechanism so other value providers can be added.

## History

* 14feb13 v0.3.1 - Make work with Brackets Sprint 20 (no functional changes)
* 28jan13 v0.3 - Changes:
  * Handle absolute URLs for images
  * Fixed flickering on image preview
  * Position preview below selection if it doesn't fit above
  * Made highlighting translucent so it doesn't block selection highlight
  * Support color names
  * Improve color matching regex
  * Fix intermittent uncaught exception
* 19oct12 v0.2 - Visual tweaks & bug fixes
* 04oct12 v0.1 - Initial Release
