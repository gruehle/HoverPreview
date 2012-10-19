/*
 * Copyright (c) 2012 Glenn Ruehle
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var CommandManager      = brackets.getModule("command/CommandManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        Menus               = brackets.getModule("command/Menus"),
        ProjectManager      = brackets.getModule("project/ProjectManager");
    
    var enabled = true,     // Only show preview if true
        previewMark,        // CodeMirror marker highlighting the preview text
        $previewContainer;  // Preview container
    
    function hidePreview() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }
        $previewContainer.empty();
        $previewContainer.hide();
    }
    
    function showPreview(content, xpos, ypos) {
        hidePreview();
        $previewContainer.append(content);
        $previewContainer.show();
        $previewContainer.offset({
            left: xpos - $previewContainer.width() / 2 - 10,
            top: ypos - $previewContainer.height() - 38
        });
    }
    
    function divContainsMouse($div, event) {
        var offset = $div.offset();
        
        return (event.clientX >= offset.left &&
                event.clientX <= offset.left + $div.width() &&
                event.clientY >= offset.top &&
                event.clientY <= offset.top + $div.height());
    }
    
    function queryPreviewProviders(editor, pos, token, line, event) {
        
        // TODO: Support plugin providers. For now we just hard-code...
        var cm = editor._codeMirror;
        var editorWidth = $(editor.getRootElement()).width();
        
        // Check for gradient
        var gradientRegEx = /-webkit-gradient\([^;]*;?|(-moz-|-ms-|-o-|-webkit-|\s)(linear-gradient\([^;]*);?|(-moz-|-ms-|-o-|-webkit-)(radial-gradient\([^;]*);?/;
        var gradientMatch = line.match(gradientRegEx);
        var prefix = "";
        var colorValue;
        
        // If it was a linear-gradient or radial-gradient variant, prefix with "-webkit-" so it
        // shows up correctly in Brackets.
        if (gradientMatch && gradientMatch[0].indexOf("-webkit-gradient") !== 0) {
            prefix = "-webkit-";
        }
        
        // For prefixed gradients, use the non-prefixed value as the color value. "-webkit-" will be added 
        // before this value
        if (gradientMatch && gradientMatch[2]) {
            colorValue = gradientMatch[2];
        }
        
        // Check for color
        var colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/i;
        var colorMatch = line.match(colorRegEx);
        
        var match = gradientMatch || colorMatch;
        if (match && pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
            var preview = "<div class='color-swatch-bg'><div class='color-swatch' style='background:" + prefix + (colorValue || match[0]) + ";'></div></div>";
            var startPos = {line: pos.line, ch: match.index},
                endPos = {line: pos.line, ch: match.index + match[0].length},
                startCoords = cm.charCoords(startPos),
                xPos;
            
            xPos = (Math.min(cm.charCoords(endPos).x, editorWidth) - startCoords.x) / 2 + startCoords.x;
            showPreview(preview, xPos, startCoords.y);
            previewMark = cm.markText(
                startPos,
                endPos,
                "preview-highlight"
            );
            return;
        }
        
        // Check for image name
        var urlRegEx = /url\(([^\)]*)\)/;
        var tokenString;
        var urlMatch = line.match(urlRegEx);
        if (urlMatch && pos.ch >= urlMatch.indx && pos.ch <= urlMatch.index + urlMatch[0].length) {
            tokenString = urlMatch[1];
        } else if (token.className === "string") {
            tokenString = token.string;
        }
        
        if (tokenString) {
            // Strip quotes, if present
            var quotesRegEx = /(\'|\")?([^(\'|\")]*)(\'|\")?/;
            tokenString = tokenString.replace(quotesRegEx, "$2");
            
            if (/(\.gif|\.png|\.jpg|\.jpeg|\.svg)$/i.test(tokenString)) {
                var sPos, ePos;
                var docPath = editor.document.file.fullPath;
                var imgPath = docPath.substr(0, docPath.lastIndexOf("/") + 1) + tokenString;
                
                if (urlMatch) {
                    sPos = {line: pos.line, ch: urlMatch.index};
                    ePos = {line: pos.line, ch: urlMatch.index + urlMatch[0].length};
                } else {
                    sPos = {line: pos.line, ch: token.start};
                    ePos = {line: pos.line, ch: token.end};
                }
                
                if (imgPath) {
                    var imgPreview = "<div class='image-preview'><img src=\"file:///" + imgPath + "\"></div>";
                    var coord = cm.charCoords(sPos);
                    showPreview(imgPreview, (cm.charCoords(ePos).x - coord.x) / 2 + coord.x, coord.y);
                    
                    // Hide the preview container until the image is loaded.
                    $previewContainer.hide();
                    $previewContainer.find("img").on("load", function () {
                        $previewContainer.show();
                    });
                    
                    previewMark = cm.markText(
                        sPos,
                        ePos,
                        "preview-highlight"
                    );
                    return;
                }
            }
        }
        
        hidePreview();
    }
    
    function handleMouseMove(event) {
        if (!enabled) {
            return;
        }
        
        // Figure out which editor we are over
        var fullEditor = EditorManager.getCurrentFullEditor();
        
        if (!fullEditor) {
            hidePreview();
            return;
        }
        
        // Check inlines first
        var inlines = fullEditor.getInlineWidgets(),
            i,
            editor;
        
        for (i = 0; i < inlines.length; i++) {
            var $inlineDiv = inlines[i].$editorsDiv;
            
            if (divContainsMouse($inlineDiv, event)) {
                editor = inlines[i].editors[0];
                break;
            }
        }
        
        // Check main editor
        if (!editor) {
            if (divContainsMouse($(fullEditor.getRootElement()), event)) {
                editor = fullEditor;
            }
        }
        
        if (editor && editor._codeMirror) {
            var cm = editor._codeMirror;
            var pos = cm.coordsChar({x: event.clientX, y: event.clientY});
            var token = cm.getTokenAt(pos);
            var line = cm.getLine(pos.line);
            
            queryPreviewProviders(editor, pos, token, line, event);
        } else {
            hidePreview();
        }
    }
    
    // Init: Listen to all mousemoves in the editor area
    $("#editor-holder")[0].addEventListener("mousemove", handleMouseMove, true);
    $("#editor-holder")[0].addEventListener("scroll", hidePreview, true);
    
    // Create the preview container
    $previewContainer = $("<div id='hover-preview-container' class='preview-bubble'>").appendTo($("body"));
    
    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "HoverPreview.css");
    
    // Add menu command
    var ENABLE_HOVER_PREVIEW      = "Enable Hover Preview";
    var CMD_ENABLE_HOVER_PREVIEW  = "gruehle.enableHoverPreview";

    function updateMenuItemCheckmark() {
        CommandManager.get(CMD_ENABLE_HOVER_PREVIEW).setChecked(enabled);
    }

    function toggleEnableHoverPreview() {
        enabled = !enabled;
        if (!enabled) {
            hidePreview();
        }
        updateMenuItemCheckmark();
    }
      
    CommandManager.register(ENABLE_HOVER_PREVIEW, CMD_ENABLE_HOVER_PREVIEW, toggleEnableHoverPreview);
    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(CMD_ENABLE_HOVER_PREVIEW);
    updateMenuItemCheckmark();
});
