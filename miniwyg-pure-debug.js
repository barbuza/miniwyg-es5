(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var DomUtils = require("./lib/dom-utils.js");
var getImage = require("./lib/get-image.js");
var resizeImage = require("./lib/resize-image.js");

var defaultCaption = "caption";

var Miniwyg = function(el) {
  this.el = el;
  this.createPanels();
  this.createEditor();
  this.setupEvents();
};
Miniwyg.prototype = Object.create(DomUtils.prototype);
Miniwyg.prototype.constructor = Miniwyg;

Miniwyg.prototype.createPanels = function() {
  this.panel = this.createTag("div", {
    "class": "miniwyg-panel"
  }, [
    this.boldButton = this.createTag("span", {
      "class": "btn-bold"
    }),
    this.italicButton = this.createTag("span", {
      "class": "btn-italic"
    }),
    this.h1Button = this.createTag("span", {
      "class": "btn-h1"
    }),
    this.h2Button = this.createTag("span", {
      "class": "btn-h2"
    }),
    this.createTag("div", {
      "class": "panel-clip"
    })
  ]);
  this.embedPanel = this.createTag("div", {
    "class": "miniwyg-panel"
  }, [
    this.alignLeftButton = this.createTag("span", {
      "class": "btn-align-left"
    }),
    this.alignCenterButton = this.createTag("span", {
      "class": "btn-align-center"
    }),
    this.removeButton = this.createTag("span", {
      "class": "btn-remove"
    }),
    this.createTag("div", {
      "class": "panel-clip"
    })
  ]);
  document.body.appendChild(this.panel);
  document.body.appendChild(this.embedPanel);
};

Miniwyg.prototype.panelTransitionEnded = function(e) {
  if (!(/\bshow\b/.test(e.target.className))) {
    this.removeClassName(e.target, "display");
  }
};

Miniwyg.prototype.createEditor = function() {
  this.editor = this.createTag("div", {
    "class": "editor",
    "contenteditable": "true",
    "spellcheck": "false"
  });
  if (this.el.value.trim().length) {
    this.editor.innerHTML = this.el.value;
  }
  this.wrapper = this.createTag("div", {
    "class": "miniwyg"
  }, [
    this.editor,
    this.plusButton = this.createTag("div", {
      "class": "plus-sign fa fa-plus-square-o"
    }),
    this.createTag("div", {
      "class": "bottom"
    })
  ]);
  this.editor.style.minHeight = this.el.offsetHeight + "px";
  var paraStyle = this.findCssRules(".miniwyg .editor > *")[0];
  this.elementSpacing = parseInt(paraStyle.style.marginTop);
  this.addClassName(this.el, "miniwyg-hidden-textarea");
  document.execCommand("defaultParagraphSeparator", false, "p");
  this.el.parentNode.insertBefore(this.wrapper, this.el);
  this.plusHeight = parseInt(window.getComputedStyle(this.plusButton).height);
};

Miniwyg.prototype.setupEvents = function() {
  this.editor.addEventListener("keydown", this.handleKeyDown.bind(this));
  this.editor.addEventListener("keyup", this.wrapOrphanContents.bind(this));
  this.editor.addEventListener("paste", this.pasteData.bind(this));
  this.editor.addEventListener("mousemove", this.handleMouseMove.bind(this));
  this.editor.addEventListener("mouseup", this.trySelectFigure.bind(this), true);
  this.panel.addEventListener("transitionend", this.panelTransitionEnded.bind(this));
  this.embedPanel.addEventListener("transitionend", this.panelTransitionEnded.bind(this));
  this.plusButton.addEventListener("mousedown", this.handleInsert.bind(this));
  this.editor.addEventListener("mouseup", (function(e) {
    setTimeout(this.checkSelection.bind(this, e), 0);
  }).bind(this));
  this.editor.addEventListener("keyup", (function(e) {
    setTimeout(this.checkSelection.bind(this, e), 0);
  }).bind(this));
  this.boldButton.addEventListener("mousedown", this.applyBold.bind(this));
  this.italicButton.addEventListener("mousedown", this.applyItalic.bind(this));
  this.h1Button.addEventListener("mousedown", this.applyH1.bind(this));
  this.h2Button.addEventListener("mousedown", this.applyH2.bind(this));
  this.alignLeftButton.addEventListener("mousedown", this.embedAlignLeft.bind(this));
  this.alignCenterButton.addEventListener("mousedown", this.embedAlignCenter.bind(this));
  this.removeButton.addEventListener("mousedown", this.embedRemove.bind(this));
  document.body.addEventListener("DOMNodeRemoved", this.handleNodeRemoved.bind(this));
  document.body.parentNode.addEventListener("mousedown", this.hidePanel.bind(this));
  document.body.parentNode.addEventListener("mousemove", this.handleMouseLeave.bind(this));
  var parents = this.collectParents(this.el);
  for (var i = 0; i < parents.length; i++) {
    if (parents[i].tagName.toLowerCase() === "form") {
      parents[i].addEventListener("submit", this.updateTextArea.bind(this));
    }
  }
};

Miniwyg.prototype.applyBold = function(e) {
  if (!this.inHeading()) {
    document.execCommand("bold", false, null);
  }
};

Miniwyg.prototype.applyItalic = function(e) {
  document.execCommand("italic", false, null);
};

Miniwyg.prototype.applyH1 = function(e) {
  if (this.inHeading()) {
    document.execCommand("formatBlock", false, "p");
  } else {
    document.execCommand("formatBlock", false, "h1");
  }
};

Miniwyg.prototype.applyH2 = function(e) {
  if (this.inHeading()) {
    document.execCommand("formatBlock", false, "p");
  } else {
    document.execCommand("formatBlock", false, "h2");
  }

};

Miniwyg.prototype.embedAlignLeft = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.addClassName(this.selectedFigure, "align-left");
  this.removeClassName(this.alignCenterButton, "active");
  this.addClassName(this.alignLeftButton, "active");
  this.showEmbedPanel();
};

Miniwyg.prototype.embedAlignCenter = function(e) {
  e.stopPropagation();
  e.preventDefault();
  this.removeClassName(this.selectedFigure, "align-left");
  this.addClassName(this.alignCenterButton, "active");
  this.removeClassName(this.alignLeftButton, "active");
  this.showEmbedPanel();
};

Miniwyg.prototype.embedRemove = function(e) {
  this.selectedFigure.parentNode.removeChild(this.selectedFigure);
};

Miniwyg.prototype.insertImage = function(img) {
  var url = resizeImage(img, 700, 300);
  var figure = this.createTag("figure", {
    "contenteditable": false
  }, [
    this.createTag("img", {
      "src": url
    }),
    this.createTag("figcaption", {
      "contenteditable": true
    }, [defaultCaption])
  ]);
  if (this.insertOrder === "insert") {
    this.editor.appendChild(figure);
    this.editor.appendChild(this.createTag("p"));
  } else if (this.insertOrder === "before") {
    this.editor.insertBefore(figure, this.insertTarget);
  }
};

Miniwyg.prototype.handleNodeRemoved = function(e) {
  if (e.target.nodeType === document.ELEMENT_NODE && e.target.tagName.toLowerCase() === "figure") {
    this.hideEmbedPanel();
  }
};

Miniwyg.prototype.handleInsert = function() {
  getImage(this.insertImage.bind(this));
};

Miniwyg.prototype.handleMouseLeave = function(e) {
  if (e.target !== this.plusButton) {
    this.removeClassName(this.plusButton, "show");
  }
};

Miniwyg.prototype.handleKeyDown = function(e) {
  if (e.target.tagName.toLowerCase() === "figcaption" && e.keyCode === 13) {
    e.stopPropagation();
    e.preventDefault();
    var figure = e.target.parentNode;
    var next = this.getNextElement(figure);
    if (!next) {
      next = this.editor.appendChild(this.createTag("p"));
    }
    if (["p", "h1", "h2", "h3"].indexOf(next.tagName.toLowerCase()) !== -1) {
      this.startSelection(next);
    }
  }
};

Miniwyg.prototype.handleMouseMove = function(e) {
  e.stopPropagation();
  if (e.target === this.editor) {
    if (!(this.editor.firstChild && this.editor.firstChild.nodeType === document.ELEMENT_NODE)) {
      this.removeClassName(this.plusButton, "show");
      return;
    }
    this.addClassName(this.plusButton, "show");
    var nextChild = null;
    for (var i = 0; i < this.editor.childNodes.length; i++) {
      if (this.editor.childNodes[i].offsetTop > e.layerY) {
        nextChild = this.editor.childNodes[i];
        break;
      }
    }
    var bottomLine;
    if (nextChild) {
      bottomLine = nextChild.offsetTop;
      this.insertTarget = nextChild;
      this.insertOrder = "before";
    } else if (this.editor.lastChild) {
      bottomLine = this.editor.lastChild.offsetTop + this.editor.lastChild.offsetHeight + this.elementSpacing;
      this.insertTarget = null;
      this.insertOrder = "insert";
    } else {
      bottomLine = this.editor.offsetHeight;
      this.insertTarget = null;
      this.insertOrder = "insert";
    }
    this.plusButton.style.top = bottomLine - (this.elementSpacing / 2) - (this.plusHeight / 2) + "px";
  } else {
    this.removeClassName(this.plusButton, "show");
  }
};

Miniwyg.prototype.updateTextArea = function() {
  while (this.editor.lastChild.nodeType == document.ELEMENT_NODE &&
    this.editor.lastChild.tagName.toLowerCase() === "p" &&
    this.editor.lastChild.innerText.trim() === "") {
    this.editor.removeChild(this.editor.lastChild);
  }
  this.el.value = this.editor.innerHTML;
};

Miniwyg.prototype.checkSelection = function() {
  var selection = window.getSelection();
  var anchor = selection.anchorNode;
  var selectedTree = this.collectParents(anchor);
  var inFigure;
  var parent;
  for (var i = 0; i < selectedTree.length; i++) {
    if (selectedTree[i].nodeType === document.ELEMENT_NODE && selectedTree[i].tagName.toLowerCase() === "figure") {
      inFigure = true;
      break;
    }
  }
  if (!inFigure && !selection.isCollapsed && selection.toString().trim().length && selection.type !== "Control") {
    var rect = selection.getRangeAt(0).getClientRects()[0];
    this.showPanel(rect.top + window.scrollY, rect.left + rect.width / 2);
  } else {
    this.hidePanel();
  }

  var child;
  for (i = 0; i < this.editor.childNodes.length; i++) {
    child = this.editor.childNodes[i];
    if (child.nodeType === document.ELEMENT_NODE && child.tagName.toLowerCase() === "figure") {
      if (selectedTree.indexOf(child) === -1) {
        this.removeClassName(child, "figure-focus");
      } else {
        this.selectFigure(child);
      }
    }
  }

  if (!inFigure) {
    this.hideEmbedPanel();
  }
  var isBold;
  var isItalic;
  var isH1;
  var isH2;
  for (i = 0; i < selectedTree.length; i++) {
    if (selectedTree[i].nodeType === document.ELEMENT_NODE) {
      if (selectedTree[i].tagName.toLowerCase() === "b") {
        isBold = true;
      }
      if (selectedTree[i].tagName.toLowerCase() === "i") {
        isItalic = true;
      }
      if (selectedTree[i].tagName.toLowerCase() === "h1") {
        isH1 = true;
      }
      if (selectedTree[i].tagName.toLowerCase() === "h2") {
        isH2 = true;
      }
    }
  }

  if (isBold) {
    this.addClassName(this.boldButton, "active");
  } else {
    this.removeClassName(this.boldButton, "active");
  }
  if (isItalic) {
    this.addClassName(this.italicButton, "active");
  } else {
    this.removeClassName(this.italicButton, "active");
  }
  if (isH1) {
    this.addClassName(this.h1Button, "active");
  } else {
    this.removeClassName(this.h1Button, "active");
  }
  if (isH2) {
    this.addClassName(this.h2Button, "active");
  } else {
    this.removeClassName(this.h2Button, "active");
  }
};

Miniwyg.prototype.showPanel = function(top, left) {
  this.panel.style.top = top + "px";
  this.panel.style.left = left + "px";
  this.addClassName(this.panel, "display");
  setTimeout(this.addClassName.bind(this, this.panel, "show"), 0);
};

Miniwyg.prototype.showEmbedPanel = function() {
  var targetElement = this.selectedFigure.firstChild;
  var top = targetElement.offsetTop + this.wrapper.offsetTop;
  var left = this.wrapper.offsetLeft + targetElement.offsetLeft + targetElement.offsetWidth / 2;
  this.embedPanel.style.top = top + "px";
  this.embedPanel.style.left = left + "px";
  this.addClassName(this.embedPanel, "display");
  setTimeout(this.addClassName.bind(this, this.embedPanel, "show"), 0);
};

Miniwyg.prototype.hidePanel = function() {
  this.removeClassName(this.panel, "show");
};

Miniwyg.prototype.hideEmbedPanel = function() {
  this.removeClassName(this.embedPanel, "show");
};

Miniwyg.prototype.selectFigure = function(node) {
  this.addClassName(node, "figure-focus");
  this.selectedFigure = node;
  if (/\balign-left\b/.test(this.selectedFigure.className)) {
    this.addClassName(this.alignLeftButton, "active");
    this.removeClassName(this.alignCenterButton, "active");
  } else {
    this.addClassName(this.alignCenterButton, "active");
    this.removeClassName(this.alignLeftButton, "active");
  }
  this.showEmbedPanel();
};

Miniwyg.prototype.trySelectFigure = function(ev) {
  var shouldChangeSelection = ev.target.tagName && ev.target.tagName.toLowerCase() === "img";
  var parents = this.collectParents(ev.target);
  this.selectedFigure = null;
  parents.unshift(ev.target);

  var parent, child;
  for (var i = 0; i < parents.length; i++) {
    parent = parents[i];
    if (parent.tagName.toLowerCase() === "figure") {
      this.selectFigure(parent);
      for (var j = 0; j < this.editor.childNodes.length; j++) {
        child = this.editor.childNodes[j];
        if (child.nodeType === document.ELEMENT_NODE && child.tagName.toLowerCase() === "figure" && child != parent) {
          this.removeClassName(child, "figure-focus");
        }
      }
      if (shouldChangeSelection) {
        if (this.selectedFigure.lastChild.innerText === defaultCaption) {
          this.selectNode(this.selectedFigure.lastChild);
        } else {
          this.startSelection(this.selectedFigure.lastChild);
        }
      }
      ev.stopPropagation();
      break;
    }
  }
  if (!this.selectedFigure) {
    this.hideEmbedPanel();
  }
};

Miniwyg.prototype.pasteData = function(ev) {
  ev.preventDefault();
  if (ev.clipboardData && ev.clipboardData.getData) {
    var text = ev.clipboardData.getData("text/plain");
    if (text.trim().length) {
      var lines = text.split(/(\r?\n)/g);
      var line;
      for (var i = 0; i < lines.length; i++) {
        line = lines[i];
        if (line.trim().length) {
          var clean = line.trim().replace(/(<([^>]+)>)/ig, "");
          document.execCommand("InsertParagraph", false, null);
          document.execCommand("insertHtml", false, "<p>" + clean + "</p>");
        }
      }
      var firstChild = this.editor.firstChild;
      if (firstChild.nodeType === document.ELEMENT_NODE &&
        firstChild.tagName.toLowerCase() === "p" &&
        firstChild.innerText.trim() === "") {
        firstChild.parentNode.removeChild(firstChild);
      }
    }
  }
};

Miniwyg.prototype.wrapOrphanContents = function(e) {
  if (!this.editor.firstChild) {
    document.execCommand("insertHtml", false, "<p></p>");
  }
  if (e.keyCode == 13) {
    for (var i = 0; i < this.editor.childNodes.length; i++) {
      if (this.editor.childNodes[i].nodeType === document.TEXT_NODE) {
        this.wrapInto(this.editor.childNodes[i], "p");
      }
    }
  }
};

window.Miniwyg = Miniwyg;
},{"./lib/dom-utils.js":2,"./lib/get-image.js":3,"./lib/resize-image.js":4}],2:[function(require,module,exports){
var DomUtils = function() {

};

DomUtils.prototype.collectParents = function(el, parents) {
  if (parents === undefined) parents = [];
  var parentNode = el.parentNode;
  if (parentNode && parentNode.nodeType === document.ELEMENT_NODE) {
    parents.push(parentNode);
    return this.collectParents(parentNode, parents);
  } else {
    return parents;
  }
};

DomUtils.prototype.inHeading = function(tagnames) {
  if (tagnames === undefined) tagnames = ["h1", "h2", "h3"];
  var parent = window.getSelection();
  if (parent) {
    parent = parent.focusNode;
    if (parent) {
      parent = parent.parentNode;
    }
  }
  if (parent) {
    var parents = this.collectParents(parent);
    parents.unshift(parent);
    for (var i = 0; i < parents.length; i++) {
      if (tagnames.indexOf(parents[i].tagName.toLowerCase()) !== -1) {
        return true;
      }
    }
  }
  return false;
};

DomUtils.prototype.createTag = function(tagname, attrs, children) {
  if (attrs === undefined) attrs = {};
  if (children === undefined) children = [];
  var el = document.createElement(tagname);
  for (var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
  for (var i = 0; i < children.length; i++) {
    if (typeof children[i] === "string") {
      el.appendChild(document.createTextNode(children[i]));
    } else {
      el.appendChild(children[i]);
    }
  }
  return el;
};

DomUtils.prototype.getNextElement = function(node) {
  var next = node.nextSibling;
  if (next && next.nodeType === document.ELEMENT_NODE) {
    return next;
  } else if (next) {
    return this.getNextElement(next);
  } else {
    return null;
  }
};

DomUtils.prototype.wrapInto = function(node, tagname) {
  var wrapper = document.createElement(tagname);
  node.parentNode.insertBefore(wrapper, node);
  wrapper.appendChild(node);
};

DomUtils.prototype.addClassName = function(node, classname) {
  var classNames = node.className.split(/\s+/g);
  if (classNames.indexOf(classname) === -1) {
    classNames.push(classname);
  }
  node.className = classNames.join(" ");
};

DomUtils.prototype.removeClassName = function(node, classname) {
  var classNames = node.className.split(/\s+/g);
  var index = classNames.indexOf(classname);
  if (index !== -1) {
    classNames.splice(index, 1);
  }
  node.className = classNames.join(" ");
};

DomUtils.prototype.startSelection = function(node) {
  var selection = window.getSelection();
  var range = document.createRange();
  range.setStart(node, 0);
  range.setEnd(node, 0);
  selection.removeAllRanges();
  selection.addRange(range);
};

DomUtils.prototype.selectNode = function(node) {
  var selection = window.getSelection();
  var range = document.createRange();
  range.selectNodeContents(node);
  selection.removeAllRanges();
  selection.addRange(range);
};

DomUtils.prototype.findCssRules = function(selector) {
  var rules = [];
  var rule;
  for (var i = document.styleSheets.length - 1; i >= 0; i--) {
    for (var j = (document.styleSheets[i].cssRules || []).length - 1; j >= 0; j--) {
      rule = document.styleSheets[i].cssRules[j];
      if (rule.selectorText === selector) {
        rules.unshift(rule);
      }
    }
  }
  return rules;
};

module.exports = DomUtils;
},{}],3:[function(require,module,exports){
function getImage(callback) {
  var input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("accept", "image/*");
  input.addEventListener("change", function() {
    if (this.files && this.files[0]) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        var img = document.createElement("img");
        img.src = ev.target.result;
        img.onload = function() {
          callback(img);
        };
      };
      reader.readAsDataURL(this.files[0]);
    }
  });
  input.click();
}

module.exports = getImage;
},{}],4:[function(require,module,exports){
var resizeCanvas = null;
var resizeCtx = null;

function resizeImage(img, maxWidth, maxHeight, overlayText) {
  if (! resizeCtx) {
    resizeCanvas = document.createElement("canvas");
    resizeCtx = resizeCanvas.getContext("2d");
  }
  var width = img.width;
  var height = img.height;
  if (width > height) {
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
  } else {
    if (height > maxHeight) {
      width *= maxHeight / height;
      height = maxHeight;
    }
    if (width > maxWidth) {
      height *= maxWidth / width;
      width = maxWidth;
    }
  }
  resizeCanvas.width = width;
  resizeCanvas.height = height;
  resizeCtx.drawImage(img, 0, 0, width, height);
  if (overlayText) {
    resizeCtx.fillStyle = "white";
    resizeCtx.font = "36px Arial";
    resizeCtx.fillText(overlayText, 10, 45);
  }
  return resizeCanvas.toDataURL("image/jpeg", 0.85);
}

module.exports = resizeImage;

},{}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvVXNlcnMvYmFyYnV6YS9TaXRlcy9taW5pd3lnLWVzNi9ub2RlX21vZHVsZXMvZ3VscC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvYmFyYnV6YS9TaXRlcy9taW5pd3lnLWVzNi9zcmMvZmFrZV9kOWZkZjVlZC5qcyIsIi9Vc2Vycy9iYXJidXphL1NpdGVzL21pbml3eWctZXM2L3NyYy9saWIvZG9tLXV0aWxzLmpzIiwiL1VzZXJzL2JhcmJ1emEvU2l0ZXMvbWluaXd5Zy1lczYvc3JjL2xpYi9nZXQtaW1hZ2UuanMiLCIvVXNlcnMvYmFyYnV6YS9TaXRlcy9taW5pd3lnLWVzNi9zcmMvbGliL3Jlc2l6ZS1pbWFnZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIERvbVV0aWxzID0gcmVxdWlyZShcIi4vbGliL2RvbS11dGlscy5qc1wiKTtcbnZhciBnZXRJbWFnZSA9IHJlcXVpcmUoXCIuL2xpYi9nZXQtaW1hZ2UuanNcIik7XG52YXIgcmVzaXplSW1hZ2UgPSByZXF1aXJlKFwiLi9saWIvcmVzaXplLWltYWdlLmpzXCIpO1xuXG52YXIgZGVmYXVsdENhcHRpb24gPSBcImNhcHRpb25cIjtcblxudmFyIE1pbml3eWcgPSBmdW5jdGlvbihlbCkge1xuICB0aGlzLmVsID0gZWw7XG4gIHRoaXMuY3JlYXRlUGFuZWxzKCk7XG4gIHRoaXMuY3JlYXRlRWRpdG9yKCk7XG4gIHRoaXMuc2V0dXBFdmVudHMoKTtcbn07XG5NaW5pd3lnLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRG9tVXRpbHMucHJvdG90eXBlKTtcbk1pbml3eWcucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gTWluaXd5ZztcblxuTWluaXd5Zy5wcm90b3R5cGUuY3JlYXRlUGFuZWxzID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGFuZWwgPSB0aGlzLmNyZWF0ZVRhZyhcImRpdlwiLCB7XG4gICAgXCJjbGFzc1wiOiBcIm1pbml3eWctcGFuZWxcIlxuICB9LCBbXG4gICAgdGhpcy5ib2xkQnV0dG9uID0gdGhpcy5jcmVhdGVUYWcoXCJzcGFuXCIsIHtcbiAgICAgIFwiY2xhc3NcIjogXCJidG4tYm9sZFwiXG4gICAgfSksXG4gICAgdGhpcy5pdGFsaWNCdXR0b24gPSB0aGlzLmNyZWF0ZVRhZyhcInNwYW5cIiwge1xuICAgICAgXCJjbGFzc1wiOiBcImJ0bi1pdGFsaWNcIlxuICAgIH0pLFxuICAgIHRoaXMuaDFCdXR0b24gPSB0aGlzLmNyZWF0ZVRhZyhcInNwYW5cIiwge1xuICAgICAgXCJjbGFzc1wiOiBcImJ0bi1oMVwiXG4gICAgfSksXG4gICAgdGhpcy5oMkJ1dHRvbiA9IHRoaXMuY3JlYXRlVGFnKFwic3BhblwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwiYnRuLWgyXCJcbiAgICB9KSxcbiAgICB0aGlzLmNyZWF0ZVRhZyhcImRpdlwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwicGFuZWwtY2xpcFwiXG4gICAgfSlcbiAgXSk7XG4gIHRoaXMuZW1iZWRQYW5lbCA9IHRoaXMuY3JlYXRlVGFnKFwiZGl2XCIsIHtcbiAgICBcImNsYXNzXCI6IFwibWluaXd5Zy1wYW5lbFwiXG4gIH0sIFtcbiAgICB0aGlzLmFsaWduTGVmdEJ1dHRvbiA9IHRoaXMuY3JlYXRlVGFnKFwic3BhblwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwiYnRuLWFsaWduLWxlZnRcIlxuICAgIH0pLFxuICAgIHRoaXMuYWxpZ25DZW50ZXJCdXR0b24gPSB0aGlzLmNyZWF0ZVRhZyhcInNwYW5cIiwge1xuICAgICAgXCJjbGFzc1wiOiBcImJ0bi1hbGlnbi1jZW50ZXJcIlxuICAgIH0pLFxuICAgIHRoaXMucmVtb3ZlQnV0dG9uID0gdGhpcy5jcmVhdGVUYWcoXCJzcGFuXCIsIHtcbiAgICAgIFwiY2xhc3NcIjogXCJidG4tcmVtb3ZlXCJcbiAgICB9KSxcbiAgICB0aGlzLmNyZWF0ZVRhZyhcImRpdlwiLCB7XG4gICAgICBcImNsYXNzXCI6IFwicGFuZWwtY2xpcFwiXG4gICAgfSlcbiAgXSk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5wYW5lbCk7XG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5lbWJlZFBhbmVsKTtcbn07XG5cbk1pbml3eWcucHJvdG90eXBlLnBhbmVsVHJhbnNpdGlvbkVuZGVkID0gZnVuY3Rpb24oZSkge1xuICBpZiAoISgvXFxic2hvd1xcYi8udGVzdChlLnRhcmdldC5jbGFzc05hbWUpKSkge1xuICAgIHRoaXMucmVtb3ZlQ2xhc3NOYW1lKGUudGFyZ2V0LCBcImRpc3BsYXlcIik7XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmNyZWF0ZUVkaXRvciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVkaXRvciA9IHRoaXMuY3JlYXRlVGFnKFwiZGl2XCIsIHtcbiAgICBcImNsYXNzXCI6IFwiZWRpdG9yXCIsXG4gICAgXCJjb250ZW50ZWRpdGFibGVcIjogXCJ0cnVlXCIsXG4gICAgXCJzcGVsbGNoZWNrXCI6IFwiZmFsc2VcIlxuICB9KTtcbiAgaWYgKHRoaXMuZWwudmFsdWUudHJpbSgpLmxlbmd0aCkge1xuICAgIHRoaXMuZWRpdG9yLmlubmVySFRNTCA9IHRoaXMuZWwudmFsdWU7XG4gIH1cbiAgdGhpcy53cmFwcGVyID0gdGhpcy5jcmVhdGVUYWcoXCJkaXZcIiwge1xuICAgIFwiY2xhc3NcIjogXCJtaW5pd3lnXCJcbiAgfSwgW1xuICAgIHRoaXMuZWRpdG9yLFxuICAgIHRoaXMucGx1c0J1dHRvbiA9IHRoaXMuY3JlYXRlVGFnKFwiZGl2XCIsIHtcbiAgICAgIFwiY2xhc3NcIjogXCJwbHVzLXNpZ24gZmEgZmEtcGx1cy1zcXVhcmUtb1wiXG4gICAgfSksXG4gICAgdGhpcy5jcmVhdGVUYWcoXCJkaXZcIiwge1xuICAgICAgXCJjbGFzc1wiOiBcImJvdHRvbVwiXG4gICAgfSlcbiAgXSk7XG4gIHRoaXMuZWRpdG9yLnN0eWxlLm1pbkhlaWdodCA9IHRoaXMuZWwub2Zmc2V0SGVpZ2h0ICsgXCJweFwiO1xuICB2YXIgcGFyYVN0eWxlID0gdGhpcy5maW5kQ3NzUnVsZXMoXCIubWluaXd5ZyAuZWRpdG9yID4gKlwiKVswXTtcbiAgdGhpcy5lbGVtZW50U3BhY2luZyA9IHBhcnNlSW50KHBhcmFTdHlsZS5zdHlsZS5tYXJnaW5Ub3ApO1xuICB0aGlzLmFkZENsYXNzTmFtZSh0aGlzLmVsLCBcIm1pbml3eWctaGlkZGVuLXRleHRhcmVhXCIpO1xuICBkb2N1bWVudC5leGVjQ29tbWFuZChcImRlZmF1bHRQYXJhZ3JhcGhTZXBhcmF0b3JcIiwgZmFsc2UsIFwicFwiKTtcbiAgdGhpcy5lbC5wYXJlbnROb2RlLmluc2VydEJlZm9yZSh0aGlzLndyYXBwZXIsIHRoaXMuZWwpO1xuICB0aGlzLnBsdXNIZWlnaHQgPSBwYXJzZUludCh3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZSh0aGlzLnBsdXNCdXR0b24pLmhlaWdodCk7XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5zZXR1cEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCB0aGlzLmhhbmRsZUtleURvd24uYmluZCh0aGlzKSk7XG4gIHRoaXMuZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCB0aGlzLndyYXBPcnBoYW5Db250ZW50cy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5lZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcInBhc3RlXCIsIHRoaXMucGFzdGVEYXRhLmJpbmQodGhpcykpO1xuICB0aGlzLmVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vtb3ZlXCIsIHRoaXMuaGFuZGxlTW91c2VNb3ZlLmJpbmQodGhpcykpO1xuICB0aGlzLmVkaXRvci5hZGRFdmVudExpc3RlbmVyKFwibW91c2V1cFwiLCB0aGlzLnRyeVNlbGVjdEZpZ3VyZS5iaW5kKHRoaXMpLCB0cnVlKTtcbiAgdGhpcy5wYW5lbC5hZGRFdmVudExpc3RlbmVyKFwidHJhbnNpdGlvbmVuZFwiLCB0aGlzLnBhbmVsVHJhbnNpdGlvbkVuZGVkLmJpbmQodGhpcykpO1xuICB0aGlzLmVtYmVkUGFuZWwuYWRkRXZlbnRMaXN0ZW5lcihcInRyYW5zaXRpb25lbmRcIiwgdGhpcy5wYW5lbFRyYW5zaXRpb25FbmRlZC5iaW5kKHRoaXMpKTtcbiAgdGhpcy5wbHVzQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5oYW5kbGVJbnNlcnQuYmluZCh0aGlzKSk7XG4gIHRoaXMuZWRpdG9yLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZXVwXCIsIChmdW5jdGlvbihlKSB7XG4gICAgc2V0VGltZW91dCh0aGlzLmNoZWNrU2VsZWN0aW9uLmJpbmQodGhpcywgZSksIDApO1xuICB9KS5iaW5kKHRoaXMpKTtcbiAgdGhpcy5lZGl0b3IuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIChmdW5jdGlvbihlKSB7XG4gICAgc2V0VGltZW91dCh0aGlzLmNoZWNrU2VsZWN0aW9uLmJpbmQodGhpcywgZSksIDApO1xuICB9KS5iaW5kKHRoaXMpKTtcbiAgdGhpcy5ib2xkQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5hcHBseUJvbGQuYmluZCh0aGlzKSk7XG4gIHRoaXMuaXRhbGljQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5hcHBseUl0YWxpYy5iaW5kKHRoaXMpKTtcbiAgdGhpcy5oMUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuYXBwbHlIMS5iaW5kKHRoaXMpKTtcbiAgdGhpcy5oMkJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuYXBwbHlIMi5iaW5kKHRoaXMpKTtcbiAgdGhpcy5hbGlnbkxlZnRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCB0aGlzLmVtYmVkQWxpZ25MZWZ0LmJpbmQodGhpcykpO1xuICB0aGlzLmFsaWduQ2VudGVyQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgdGhpcy5lbWJlZEFsaWduQ2VudGVyLmJpbmQodGhpcykpO1xuICB0aGlzLnJlbW92ZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuZW1iZWRSZW1vdmUuYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTU5vZGVSZW1vdmVkXCIsIHRoaXMuaGFuZGxlTm9kZVJlbW92ZWQuYmluZCh0aGlzKSk7XG4gIGRvY3VtZW50LmJvZHkucGFyZW50Tm9kZS5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIHRoaXMuaGlkZVBhbmVsLmJpbmQodGhpcykpO1xuICBkb2N1bWVudC5ib2R5LnBhcmVudE5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlbW92ZVwiLCB0aGlzLmhhbmRsZU1vdXNlTGVhdmUuYmluZCh0aGlzKSk7XG4gIHZhciBwYXJlbnRzID0gdGhpcy5jb2xsZWN0UGFyZW50cyh0aGlzLmVsKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHBhcmVudHNbaV0udGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImZvcm1cIikge1xuICAgICAgcGFyZW50c1tpXS5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIHRoaXMudXBkYXRlVGV4dEFyZWEuYmluZCh0aGlzKSk7XG4gICAgfVxuICB9XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5hcHBseUJvbGQgPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5pbkhlYWRpbmcoKSkge1xuICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiYm9sZFwiLCBmYWxzZSwgbnVsbCk7XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmFwcGx5SXRhbGljID0gZnVuY3Rpb24oZSkge1xuICBkb2N1bWVudC5leGVjQ29tbWFuZChcIml0YWxpY1wiLCBmYWxzZSwgbnVsbCk7XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5hcHBseUgxID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5pbkhlYWRpbmcoKSkge1xuICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiZm9ybWF0QmxvY2tcIiwgZmFsc2UsIFwicFwiKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5leGVjQ29tbWFuZChcImZvcm1hdEJsb2NrXCIsIGZhbHNlLCBcImgxXCIpO1xuICB9XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5hcHBseUgyID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5pbkhlYWRpbmcoKSkge1xuICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiZm9ybWF0QmxvY2tcIiwgZmFsc2UsIFwicFwiKTtcbiAgfSBlbHNlIHtcbiAgICBkb2N1bWVudC5leGVjQ29tbWFuZChcImZvcm1hdEJsb2NrXCIsIGZhbHNlLCBcImgyXCIpO1xuICB9XG5cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmVtYmVkQWxpZ25MZWZ0ID0gZnVuY3Rpb24oZSkge1xuICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMuc2VsZWN0ZWRGaWd1cmUsIFwiYWxpZ24tbGVmdFwiKTtcbiAgdGhpcy5yZW1vdmVDbGFzc05hbWUodGhpcy5hbGlnbkNlbnRlckJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMuYWxpZ25MZWZ0QnV0dG9uLCBcImFjdGl2ZVwiKTtcbiAgdGhpcy5zaG93RW1iZWRQYW5lbCgpO1xufTtcblxuTWluaXd5Zy5wcm90b3R5cGUuZW1iZWRBbGlnbkNlbnRlciA9IGZ1bmN0aW9uKGUpIHtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLnNlbGVjdGVkRmlndXJlLCBcImFsaWduLWxlZnRcIik7XG4gIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMuYWxpZ25DZW50ZXJCdXR0b24sIFwiYWN0aXZlXCIpO1xuICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLmFsaWduTGVmdEJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIHRoaXMuc2hvd0VtYmVkUGFuZWwoKTtcbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmVtYmVkUmVtb3ZlID0gZnVuY3Rpb24oZSkge1xuICB0aGlzLnNlbGVjdGVkRmlndXJlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5zZWxlY3RlZEZpZ3VyZSk7XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5pbnNlcnRJbWFnZSA9IGZ1bmN0aW9uKGltZykge1xuICB2YXIgdXJsID0gcmVzaXplSW1hZ2UoaW1nLCA3MDAsIDMwMCk7XG4gIHZhciBmaWd1cmUgPSB0aGlzLmNyZWF0ZVRhZyhcImZpZ3VyZVwiLCB7XG4gICAgXCJjb250ZW50ZWRpdGFibGVcIjogZmFsc2VcbiAgfSwgW1xuICAgIHRoaXMuY3JlYXRlVGFnKFwiaW1nXCIsIHtcbiAgICAgIFwic3JjXCI6IHVybFxuICAgIH0pLFxuICAgIHRoaXMuY3JlYXRlVGFnKFwiZmlnY2FwdGlvblwiLCB7XG4gICAgICBcImNvbnRlbnRlZGl0YWJsZVwiOiB0cnVlXG4gICAgfSwgW2RlZmF1bHRDYXB0aW9uXSlcbiAgXSk7XG4gIGlmICh0aGlzLmluc2VydE9yZGVyID09PSBcImluc2VydFwiKSB7XG4gICAgdGhpcy5lZGl0b3IuYXBwZW5kQ2hpbGQoZmlndXJlKTtcbiAgICB0aGlzLmVkaXRvci5hcHBlbmRDaGlsZCh0aGlzLmNyZWF0ZVRhZyhcInBcIikpO1xuICB9IGVsc2UgaWYgKHRoaXMuaW5zZXJ0T3JkZXIgPT09IFwiYmVmb3JlXCIpIHtcbiAgICB0aGlzLmVkaXRvci5pbnNlcnRCZWZvcmUoZmlndXJlLCB0aGlzLmluc2VydFRhcmdldCk7XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmhhbmRsZU5vZGVSZW1vdmVkID0gZnVuY3Rpb24oZSkge1xuICBpZiAoZS50YXJnZXQubm9kZVR5cGUgPT09IGRvY3VtZW50LkVMRU1FTlRfTk9ERSAmJiBlLnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiZmlndXJlXCIpIHtcbiAgICB0aGlzLmhpZGVFbWJlZFBhbmVsKCk7XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmhhbmRsZUluc2VydCA9IGZ1bmN0aW9uKCkge1xuICBnZXRJbWFnZSh0aGlzLmluc2VydEltYWdlLmJpbmQodGhpcykpO1xufTtcblxuTWluaXd5Zy5wcm90b3R5cGUuaGFuZGxlTW91c2VMZWF2ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKGUudGFyZ2V0ICE9PSB0aGlzLnBsdXNCdXR0b24pIHtcbiAgICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLnBsdXNCdXR0b24sIFwic2hvd1wiKTtcbiAgfVxufTtcblxuTWluaXd5Zy5wcm90b3R5cGUuaGFuZGxlS2V5RG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKGUudGFyZ2V0LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJmaWdjYXB0aW9uXCIgJiYgZS5rZXlDb2RlID09PSAxMykge1xuICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHZhciBmaWd1cmUgPSBlLnRhcmdldC5wYXJlbnROb2RlO1xuICAgIHZhciBuZXh0ID0gdGhpcy5nZXROZXh0RWxlbWVudChmaWd1cmUpO1xuICAgIGlmICghbmV4dCkge1xuICAgICAgbmV4dCA9IHRoaXMuZWRpdG9yLmFwcGVuZENoaWxkKHRoaXMuY3JlYXRlVGFnKFwicFwiKSk7XG4gICAgfVxuICAgIGlmIChbXCJwXCIsIFwiaDFcIiwgXCJoMlwiLCBcImgzXCJdLmluZGV4T2YobmV4dC50YWdOYW1lLnRvTG93ZXJDYXNlKCkpICE9PSAtMSkge1xuICAgICAgdGhpcy5zdGFydFNlbGVjdGlvbihuZXh0KTtcbiAgICB9XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLmhhbmRsZU1vdXNlTW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgaWYgKGUudGFyZ2V0ID09PSB0aGlzLmVkaXRvcikge1xuICAgIGlmICghKHRoaXMuZWRpdG9yLmZpcnN0Q2hpbGQgJiYgdGhpcy5lZGl0b3IuZmlyc3RDaGlsZC5ub2RlVHlwZSA9PT0gZG9jdW1lbnQuRUxFTUVOVF9OT0RFKSkge1xuICAgICAgdGhpcy5yZW1vdmVDbGFzc05hbWUodGhpcy5wbHVzQnV0dG9uLCBcInNob3dcIik7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMucGx1c0J1dHRvbiwgXCJzaG93XCIpO1xuICAgIHZhciBuZXh0Q2hpbGQgPSBudWxsO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5lZGl0b3IuY2hpbGROb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKHRoaXMuZWRpdG9yLmNoaWxkTm9kZXNbaV0ub2Zmc2V0VG9wID4gZS5sYXllclkpIHtcbiAgICAgICAgbmV4dENoaWxkID0gdGhpcy5lZGl0b3IuY2hpbGROb2Rlc1tpXTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBib3R0b21MaW5lO1xuICAgIGlmIChuZXh0Q2hpbGQpIHtcbiAgICAgIGJvdHRvbUxpbmUgPSBuZXh0Q2hpbGQub2Zmc2V0VG9wO1xuICAgICAgdGhpcy5pbnNlcnRUYXJnZXQgPSBuZXh0Q2hpbGQ7XG4gICAgICB0aGlzLmluc2VydE9yZGVyID0gXCJiZWZvcmVcIjtcbiAgICB9IGVsc2UgaWYgKHRoaXMuZWRpdG9yLmxhc3RDaGlsZCkge1xuICAgICAgYm90dG9tTGluZSA9IHRoaXMuZWRpdG9yLmxhc3RDaGlsZC5vZmZzZXRUb3AgKyB0aGlzLmVkaXRvci5sYXN0Q2hpbGQub2Zmc2V0SGVpZ2h0ICsgdGhpcy5lbGVtZW50U3BhY2luZztcbiAgICAgIHRoaXMuaW5zZXJ0VGFyZ2V0ID0gbnVsbDtcbiAgICAgIHRoaXMuaW5zZXJ0T3JkZXIgPSBcImluc2VydFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBib3R0b21MaW5lID0gdGhpcy5lZGl0b3Iub2Zmc2V0SGVpZ2h0O1xuICAgICAgdGhpcy5pbnNlcnRUYXJnZXQgPSBudWxsO1xuICAgICAgdGhpcy5pbnNlcnRPcmRlciA9IFwiaW5zZXJ0XCI7XG4gICAgfVxuICAgIHRoaXMucGx1c0J1dHRvbi5zdHlsZS50b3AgPSBib3R0b21MaW5lIC0gKHRoaXMuZWxlbWVudFNwYWNpbmcgLyAyKSAtICh0aGlzLnBsdXNIZWlnaHQgLyAyKSArIFwicHhcIjtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLnBsdXNCdXR0b24sIFwic2hvd1wiKTtcbiAgfVxufTtcblxuTWluaXd5Zy5wcm90b3R5cGUudXBkYXRlVGV4dEFyZWEgPSBmdW5jdGlvbigpIHtcbiAgd2hpbGUgKHRoaXMuZWRpdG9yLmxhc3RDaGlsZC5ub2RlVHlwZSA9PSBkb2N1bWVudC5FTEVNRU5UX05PREUgJiZcbiAgICB0aGlzLmVkaXRvci5sYXN0Q2hpbGQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcInBcIiAmJlxuICAgIHRoaXMuZWRpdG9yLmxhc3RDaGlsZC5pbm5lclRleHQudHJpbSgpID09PSBcIlwiKSB7XG4gICAgdGhpcy5lZGl0b3IucmVtb3ZlQ2hpbGQodGhpcy5lZGl0b3IubGFzdENoaWxkKTtcbiAgfVxuICB0aGlzLmVsLnZhbHVlID0gdGhpcy5lZGl0b3IuaW5uZXJIVE1MO1xufTtcblxuTWluaXd5Zy5wcm90b3R5cGUuY2hlY2tTZWxlY3Rpb24gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgdmFyIGFuY2hvciA9IHNlbGVjdGlvbi5hbmNob3JOb2RlO1xuICB2YXIgc2VsZWN0ZWRUcmVlID0gdGhpcy5jb2xsZWN0UGFyZW50cyhhbmNob3IpO1xuICB2YXIgaW5GaWd1cmU7XG4gIHZhciBwYXJlbnQ7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0ZWRUcmVlLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHNlbGVjdGVkVHJlZVtpXS5ub2RlVHlwZSA9PT0gZG9jdW1lbnQuRUxFTUVOVF9OT0RFICYmIHNlbGVjdGVkVHJlZVtpXS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiZmlndXJlXCIpIHtcbiAgICAgIGluRmlndXJlID0gdHJ1ZTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICBpZiAoIWluRmlndXJlICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQgJiYgc2VsZWN0aW9uLnRvU3RyaW5nKCkudHJpbSgpLmxlbmd0aCAmJiBzZWxlY3Rpb24udHlwZSAhPT0gXCJDb250cm9sXCIpIHtcbiAgICB2YXIgcmVjdCA9IHNlbGVjdGlvbi5nZXRSYW5nZUF0KDApLmdldENsaWVudFJlY3RzKClbMF07XG4gICAgdGhpcy5zaG93UGFuZWwocmVjdC50b3AgKyB3aW5kb3cuc2Nyb2xsWSwgcmVjdC5sZWZ0ICsgcmVjdC53aWR0aCAvIDIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuaGlkZVBhbmVsKCk7XG4gIH1cblxuICB2YXIgY2hpbGQ7XG4gIGZvciAoaSA9IDA7IGkgPCB0aGlzLmVkaXRvci5jaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2hpbGQgPSB0aGlzLmVkaXRvci5jaGlsZE5vZGVzW2ldO1xuICAgIGlmIChjaGlsZC5ub2RlVHlwZSA9PT0gZG9jdW1lbnQuRUxFTUVOVF9OT0RFICYmIGNoaWxkLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJmaWd1cmVcIikge1xuICAgICAgaWYgKHNlbGVjdGVkVHJlZS5pbmRleE9mKGNoaWxkKSA9PT0gLTEpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVDbGFzc05hbWUoY2hpbGQsIFwiZmlndXJlLWZvY3VzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZWxlY3RGaWd1cmUoY2hpbGQpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmICghaW5GaWd1cmUpIHtcbiAgICB0aGlzLmhpZGVFbWJlZFBhbmVsKCk7XG4gIH1cbiAgdmFyIGlzQm9sZDtcbiAgdmFyIGlzSXRhbGljO1xuICB2YXIgaXNIMTtcbiAgdmFyIGlzSDI7XG4gIGZvciAoaSA9IDA7IGkgPCBzZWxlY3RlZFRyZWUubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc2VsZWN0ZWRUcmVlW2ldLm5vZGVUeXBlID09PSBkb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICAgIGlmIChzZWxlY3RlZFRyZWVbaV0udGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImJcIikge1xuICAgICAgICBpc0JvbGQgPSB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGVjdGVkVHJlZVtpXS50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaVwiKSB7XG4gICAgICAgIGlzSXRhbGljID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxlY3RlZFRyZWVbaV0udGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSBcImgxXCIpIHtcbiAgICAgICAgaXNIMSA9IHRydWU7XG4gICAgICB9XG4gICAgICBpZiAoc2VsZWN0ZWRUcmVlW2ldLnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gXCJoMlwiKSB7XG4gICAgICAgIGlzSDIgPSB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpc0JvbGQpIHtcbiAgICB0aGlzLmFkZENsYXNzTmFtZSh0aGlzLmJvbGRCdXR0b24sIFwiYWN0aXZlXCIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucmVtb3ZlQ2xhc3NOYW1lKHRoaXMuYm9sZEJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIH1cbiAgaWYgKGlzSXRhbGljKSB7XG4gICAgdGhpcy5hZGRDbGFzc05hbWUodGhpcy5pdGFsaWNCdXR0b24sIFwiYWN0aXZlXCIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucmVtb3ZlQ2xhc3NOYW1lKHRoaXMuaXRhbGljQnV0dG9uLCBcImFjdGl2ZVwiKTtcbiAgfVxuICBpZiAoaXNIMSkge1xuICAgIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMuaDFCdXR0b24sIFwiYWN0aXZlXCIpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMucmVtb3ZlQ2xhc3NOYW1lKHRoaXMuaDFCdXR0b24sIFwiYWN0aXZlXCIpO1xuICB9XG4gIGlmIChpc0gyKSB7XG4gICAgdGhpcy5hZGRDbGFzc05hbWUodGhpcy5oMkJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5yZW1vdmVDbGFzc05hbWUodGhpcy5oMkJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIH1cbn07XG5cbk1pbml3eWcucHJvdG90eXBlLnNob3dQYW5lbCA9IGZ1bmN0aW9uKHRvcCwgbGVmdCkge1xuICB0aGlzLnBhbmVsLnN0eWxlLnRvcCA9IHRvcCArIFwicHhcIjtcbiAgdGhpcy5wYW5lbC5zdHlsZS5sZWZ0ID0gbGVmdCArIFwicHhcIjtcbiAgdGhpcy5hZGRDbGFzc05hbWUodGhpcy5wYW5lbCwgXCJkaXNwbGF5XCIpO1xuICBzZXRUaW1lb3V0KHRoaXMuYWRkQ2xhc3NOYW1lLmJpbmQodGhpcywgdGhpcy5wYW5lbCwgXCJzaG93XCIpLCAwKTtcbn07XG5cbk1pbml3eWcucHJvdG90eXBlLnNob3dFbWJlZFBhbmVsID0gZnVuY3Rpb24oKSB7XG4gIHZhciB0YXJnZXRFbGVtZW50ID0gdGhpcy5zZWxlY3RlZEZpZ3VyZS5maXJzdENoaWxkO1xuICB2YXIgdG9wID0gdGFyZ2V0RWxlbWVudC5vZmZzZXRUb3AgKyB0aGlzLndyYXBwZXIub2Zmc2V0VG9wO1xuICB2YXIgbGVmdCA9IHRoaXMud3JhcHBlci5vZmZzZXRMZWZ0ICsgdGFyZ2V0RWxlbWVudC5vZmZzZXRMZWZ0ICsgdGFyZ2V0RWxlbWVudC5vZmZzZXRXaWR0aCAvIDI7XG4gIHRoaXMuZW1iZWRQYW5lbC5zdHlsZS50b3AgPSB0b3AgKyBcInB4XCI7XG4gIHRoaXMuZW1iZWRQYW5lbC5zdHlsZS5sZWZ0ID0gbGVmdCArIFwicHhcIjtcbiAgdGhpcy5hZGRDbGFzc05hbWUodGhpcy5lbWJlZFBhbmVsLCBcImRpc3BsYXlcIik7XG4gIHNldFRpbWVvdXQodGhpcy5hZGRDbGFzc05hbWUuYmluZCh0aGlzLCB0aGlzLmVtYmVkUGFuZWwsIFwic2hvd1wiKSwgMCk7XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5oaWRlUGFuZWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZW1vdmVDbGFzc05hbWUodGhpcy5wYW5lbCwgXCJzaG93XCIpO1xufTtcblxuTWluaXd5Zy5wcm90b3R5cGUuaGlkZUVtYmVkUGFuZWwgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5yZW1vdmVDbGFzc05hbWUodGhpcy5lbWJlZFBhbmVsLCBcInNob3dcIik7XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5zZWxlY3RGaWd1cmUgPSBmdW5jdGlvbihub2RlKSB7XG4gIHRoaXMuYWRkQ2xhc3NOYW1lKG5vZGUsIFwiZmlndXJlLWZvY3VzXCIpO1xuICB0aGlzLnNlbGVjdGVkRmlndXJlID0gbm9kZTtcbiAgaWYgKC9cXGJhbGlnbi1sZWZ0XFxiLy50ZXN0KHRoaXMuc2VsZWN0ZWRGaWd1cmUuY2xhc3NOYW1lKSkge1xuICAgIHRoaXMuYWRkQ2xhc3NOYW1lKHRoaXMuYWxpZ25MZWZ0QnV0dG9uLCBcImFjdGl2ZVwiKTtcbiAgICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLmFsaWduQ2VudGVyQnV0dG9uLCBcImFjdGl2ZVwiKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmFkZENsYXNzTmFtZSh0aGlzLmFsaWduQ2VudGVyQnV0dG9uLCBcImFjdGl2ZVwiKTtcbiAgICB0aGlzLnJlbW92ZUNsYXNzTmFtZSh0aGlzLmFsaWduTGVmdEJ1dHRvbiwgXCJhY3RpdmVcIik7XG4gIH1cbiAgdGhpcy5zaG93RW1iZWRQYW5lbCgpO1xufTtcblxuTWluaXd5Zy5wcm90b3R5cGUudHJ5U2VsZWN0RmlndXJlID0gZnVuY3Rpb24oZXYpIHtcbiAgdmFyIHNob3VsZENoYW5nZVNlbGVjdGlvbiA9IGV2LnRhcmdldC50YWdOYW1lICYmIGV2LnRhcmdldC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiaW1nXCI7XG4gIHZhciBwYXJlbnRzID0gdGhpcy5jb2xsZWN0UGFyZW50cyhldi50YXJnZXQpO1xuICB0aGlzLnNlbGVjdGVkRmlndXJlID0gbnVsbDtcbiAgcGFyZW50cy51bnNoaWZ0KGV2LnRhcmdldCk7XG5cbiAgdmFyIHBhcmVudCwgY2hpbGQ7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGFyZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHBhcmVudCA9IHBhcmVudHNbaV07XG4gICAgaWYgKHBhcmVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiZmlndXJlXCIpIHtcbiAgICAgIHRoaXMuc2VsZWN0RmlndXJlKHBhcmVudCk7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuZWRpdG9yLmNoaWxkTm9kZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgY2hpbGQgPSB0aGlzLmVkaXRvci5jaGlsZE5vZGVzW2pdO1xuICAgICAgICBpZiAoY2hpbGQubm9kZVR5cGUgPT09IGRvY3VtZW50LkVMRU1FTlRfTk9ERSAmJiBjaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwiZmlndXJlXCIgJiYgY2hpbGQgIT0gcGFyZW50KSB7XG4gICAgICAgICAgdGhpcy5yZW1vdmVDbGFzc05hbWUoY2hpbGQsIFwiZmlndXJlLWZvY3VzXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkQ2hhbmdlU2VsZWN0aW9uKSB7XG4gICAgICAgIGlmICh0aGlzLnNlbGVjdGVkRmlndXJlLmxhc3RDaGlsZC5pbm5lclRleHQgPT09IGRlZmF1bHRDYXB0aW9uKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3ROb2RlKHRoaXMuc2VsZWN0ZWRGaWd1cmUubGFzdENoaWxkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnN0YXJ0U2VsZWN0aW9uKHRoaXMuc2VsZWN0ZWRGaWd1cmUubGFzdENoaWxkKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgaWYgKCF0aGlzLnNlbGVjdGVkRmlndXJlKSB7XG4gICAgdGhpcy5oaWRlRW1iZWRQYW5lbCgpO1xuICB9XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS5wYXN0ZURhdGEgPSBmdW5jdGlvbihldikge1xuICBldi5wcmV2ZW50RGVmYXVsdCgpO1xuICBpZiAoZXYuY2xpcGJvYXJkRGF0YSAmJiBldi5jbGlwYm9hcmREYXRhLmdldERhdGEpIHtcbiAgICB2YXIgdGV4dCA9IGV2LmNsaXBib2FyZERhdGEuZ2V0RGF0YShcInRleHQvcGxhaW5cIik7XG4gICAgaWYgKHRleHQudHJpbSgpLmxlbmd0aCkge1xuICAgICAgdmFyIGxpbmVzID0gdGV4dC5zcGxpdCgvKFxccj9cXG4pL2cpO1xuICAgICAgdmFyIGxpbmU7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmUgPSBsaW5lc1tpXTtcbiAgICAgICAgaWYgKGxpbmUudHJpbSgpLmxlbmd0aCkge1xuICAgICAgICAgIHZhciBjbGVhbiA9IGxpbmUudHJpbSgpLnJlcGxhY2UoLyg8KFtePl0rKT4pL2lnLCBcIlwiKTtcbiAgICAgICAgICBkb2N1bWVudC5leGVjQ29tbWFuZChcIkluc2VydFBhcmFncmFwaFwiLCBmYWxzZSwgbnVsbCk7XG4gICAgICAgICAgZG9jdW1lbnQuZXhlY0NvbW1hbmQoXCJpbnNlcnRIdG1sXCIsIGZhbHNlLCBcIjxwPlwiICsgY2xlYW4gKyBcIjwvcD5cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBmaXJzdENoaWxkID0gdGhpcy5lZGl0b3IuZmlyc3RDaGlsZDtcbiAgICAgIGlmIChmaXJzdENoaWxkLm5vZGVUeXBlID09PSBkb2N1bWVudC5FTEVNRU5UX05PREUgJiZcbiAgICAgICAgZmlyc3RDaGlsZC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09IFwicFwiICYmXG4gICAgICAgIGZpcnN0Q2hpbGQuaW5uZXJUZXh0LnRyaW0oKSA9PT0gXCJcIikge1xuICAgICAgICBmaXJzdENoaWxkLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoZmlyc3RDaGlsZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG5NaW5pd3lnLnByb3RvdHlwZS53cmFwT3JwaGFuQ29udGVudHMgPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5lZGl0b3IuZmlyc3RDaGlsZCkge1xuICAgIGRvY3VtZW50LmV4ZWNDb21tYW5kKFwiaW5zZXJ0SHRtbFwiLCBmYWxzZSwgXCI8cD48L3A+XCIpO1xuICB9XG4gIGlmIChlLmtleUNvZGUgPT0gMTMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZWRpdG9yLmNoaWxkTm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmVkaXRvci5jaGlsZE5vZGVzW2ldLm5vZGVUeXBlID09PSBkb2N1bWVudC5URVhUX05PREUpIHtcbiAgICAgICAgdGhpcy53cmFwSW50byh0aGlzLmVkaXRvci5jaGlsZE5vZGVzW2ldLCBcInBcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuXG53aW5kb3cuTWluaXd5ZyA9IE1pbml3eWc7IiwidmFyIERvbVV0aWxzID0gZnVuY3Rpb24oKSB7XG5cbn07XG5cbkRvbVV0aWxzLnByb3RvdHlwZS5jb2xsZWN0UGFyZW50cyA9IGZ1bmN0aW9uKGVsLCBwYXJlbnRzKSB7XG4gIGlmIChwYXJlbnRzID09PSB1bmRlZmluZWQpIHBhcmVudHMgPSBbXTtcbiAgdmFyIHBhcmVudE5vZGUgPSBlbC5wYXJlbnROb2RlO1xuICBpZiAocGFyZW50Tm9kZSAmJiBwYXJlbnROb2RlLm5vZGVUeXBlID09PSBkb2N1bWVudC5FTEVNRU5UX05PREUpIHtcbiAgICBwYXJlbnRzLnB1c2gocGFyZW50Tm9kZSk7XG4gICAgcmV0dXJuIHRoaXMuY29sbGVjdFBhcmVudHMocGFyZW50Tm9kZSwgcGFyZW50cyk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHBhcmVudHM7XG4gIH1cbn07XG5cbkRvbVV0aWxzLnByb3RvdHlwZS5pbkhlYWRpbmcgPSBmdW5jdGlvbih0YWduYW1lcykge1xuICBpZiAodGFnbmFtZXMgPT09IHVuZGVmaW5lZCkgdGFnbmFtZXMgPSBbXCJoMVwiLCBcImgyXCIsIFwiaDNcIl07XG4gIHZhciBwYXJlbnQgPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gIGlmIChwYXJlbnQpIHtcbiAgICBwYXJlbnQgPSBwYXJlbnQuZm9jdXNOb2RlO1xuICAgIGlmIChwYXJlbnQpIHtcbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuICBpZiAocGFyZW50KSB7XG4gICAgdmFyIHBhcmVudHMgPSB0aGlzLmNvbGxlY3RQYXJlbnRzKHBhcmVudCk7XG4gICAgcGFyZW50cy51bnNoaWZ0KHBhcmVudCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXJlbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAodGFnbmFtZXMuaW5kZXhPZihwYXJlbnRzW2ldLnRhZ05hbWUudG9Mb3dlckNhc2UoKSkgIT09IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5Eb21VdGlscy5wcm90b3R5cGUuY3JlYXRlVGFnID0gZnVuY3Rpb24odGFnbmFtZSwgYXR0cnMsIGNoaWxkcmVuKSB7XG4gIGlmIChhdHRycyA9PT0gdW5kZWZpbmVkKSBhdHRycyA9IHt9O1xuICBpZiAoY2hpbGRyZW4gPT09IHVuZGVmaW5lZCkgY2hpbGRyZW4gPSBbXTtcbiAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWduYW1lKTtcbiAgZm9yICh2YXIga2V5IGluIGF0dHJzKSB7XG4gICAgZWwuc2V0QXR0cmlidXRlKGtleSwgYXR0cnNba2V5XSk7XG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgY2hpbGRyZW5baV0gPT09IFwic3RyaW5nXCIpIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNoaWxkcmVuW2ldKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGVsLmFwcGVuZENoaWxkKGNoaWxkcmVuW2ldKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGVsO1xufTtcblxuRG9tVXRpbHMucHJvdG90eXBlLmdldE5leHRFbGVtZW50ID0gZnVuY3Rpb24obm9kZSkge1xuICB2YXIgbmV4dCA9IG5vZGUubmV4dFNpYmxpbmc7XG4gIGlmIChuZXh0ICYmIG5leHQubm9kZVR5cGUgPT09IGRvY3VtZW50LkVMRU1FTlRfTk9ERSkge1xuICAgIHJldHVybiBuZXh0O1xuICB9IGVsc2UgaWYgKG5leHQpIHtcbiAgICByZXR1cm4gdGhpcy5nZXROZXh0RWxlbWVudChuZXh0KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxufTtcblxuRG9tVXRpbHMucHJvdG90eXBlLndyYXBJbnRvID0gZnVuY3Rpb24obm9kZSwgdGFnbmFtZSkge1xuICB2YXIgd3JhcHBlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnbmFtZSk7XG4gIG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUod3JhcHBlciwgbm9kZSk7XG4gIHdyYXBwZXIuYXBwZW5kQ2hpbGQobm9kZSk7XG59O1xuXG5Eb21VdGlscy5wcm90b3R5cGUuYWRkQ2xhc3NOYW1lID0gZnVuY3Rpb24obm9kZSwgY2xhc3NuYW1lKSB7XG4gIHZhciBjbGFzc05hbWVzID0gbm9kZS5jbGFzc05hbWUuc3BsaXQoL1xccysvZyk7XG4gIGlmIChjbGFzc05hbWVzLmluZGV4T2YoY2xhc3NuYW1lKSA9PT0gLTEpIHtcbiAgICBjbGFzc05hbWVzLnB1c2goY2xhc3NuYW1lKTtcbiAgfVxuICBub2RlLmNsYXNzTmFtZSA9IGNsYXNzTmFtZXMuam9pbihcIiBcIik7XG59O1xuXG5Eb21VdGlscy5wcm90b3R5cGUucmVtb3ZlQ2xhc3NOYW1lID0gZnVuY3Rpb24obm9kZSwgY2xhc3NuYW1lKSB7XG4gIHZhciBjbGFzc05hbWVzID0gbm9kZS5jbGFzc05hbWUuc3BsaXQoL1xccysvZyk7XG4gIHZhciBpbmRleCA9IGNsYXNzTmFtZXMuaW5kZXhPZihjbGFzc25hbWUpO1xuICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgY2xhc3NOYW1lcy5zcGxpY2UoaW5kZXgsIDEpO1xuICB9XG4gIG5vZGUuY2xhc3NOYW1lID0gY2xhc3NOYW1lcy5qb2luKFwiIFwiKTtcbn07XG5cbkRvbVV0aWxzLnByb3RvdHlwZS5zdGFydFNlbGVjdGlvbiA9IGZ1bmN0aW9uKG5vZGUpIHtcbiAgdmFyIHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcbiAgdmFyIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcbiAgcmFuZ2Uuc2V0U3RhcnQobm9kZSwgMCk7XG4gIHJhbmdlLnNldEVuZChub2RlLCAwKTtcbiAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpO1xuICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xufTtcblxuRG9tVXRpbHMucHJvdG90eXBlLnNlbGVjdE5vZGUgPSBmdW5jdGlvbihub2RlKSB7XG4gIHZhciBzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG4gIHZhciByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XG4gIHJhbmdlLnNlbGVjdE5vZGVDb250ZW50cyhub2RlKTtcbiAgc2VsZWN0aW9uLnJlbW92ZUFsbFJhbmdlcygpO1xuICBzZWxlY3Rpb24uYWRkUmFuZ2UocmFuZ2UpO1xufTtcblxuRG9tVXRpbHMucHJvdG90eXBlLmZpbmRDc3NSdWxlcyA9IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gIHZhciBydWxlcyA9IFtdO1xuICB2YXIgcnVsZTtcbiAgZm9yICh2YXIgaSA9IGRvY3VtZW50LnN0eWxlU2hlZXRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgZm9yICh2YXIgaiA9IChkb2N1bWVudC5zdHlsZVNoZWV0c1tpXS5jc3NSdWxlcyB8fCBbXSkubGVuZ3RoIC0gMTsgaiA+PSAwOyBqLS0pIHtcbiAgICAgIHJ1bGUgPSBkb2N1bWVudC5zdHlsZVNoZWV0c1tpXS5jc3NSdWxlc1tqXTtcbiAgICAgIGlmIChydWxlLnNlbGVjdG9yVGV4dCA9PT0gc2VsZWN0b3IpIHtcbiAgICAgICAgcnVsZXMudW5zaGlmdChydWxlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJ1bGVzO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBEb21VdGlsczsiLCJmdW5jdGlvbiBnZXRJbWFnZShjYWxsYmFjaykge1xuICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW5wdXRcIik7XG4gIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJmaWxlXCIpO1xuICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJhY2NlcHRcIiwgXCJpbWFnZS8qXCIpO1xuICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLmZpbGVzICYmIHRoaXMuZmlsZXNbMF0pIHtcbiAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHZhciBpbWcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaW1nXCIpO1xuICAgICAgICBpbWcuc3JjID0gZXYudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgaW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGNhbGxiYWNrKGltZyk7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgcmVhZGVyLnJlYWRBc0RhdGFVUkwodGhpcy5maWxlc1swXSk7XG4gICAgfVxuICB9KTtcbiAgaW5wdXQuY2xpY2soKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBnZXRJbWFnZTsiLCJ2YXIgcmVzaXplQ2FudmFzID0gbnVsbDtcbnZhciByZXNpemVDdHggPSBudWxsO1xuXG5mdW5jdGlvbiByZXNpemVJbWFnZShpbWcsIG1heFdpZHRoLCBtYXhIZWlnaHQsIG92ZXJsYXlUZXh0KSB7XG4gIGlmICghIHJlc2l6ZUN0eCkge1xuICAgIHJlc2l6ZUNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJjYW52YXNcIik7XG4gICAgcmVzaXplQ3R4ID0gcmVzaXplQ2FudmFzLmdldENvbnRleHQoXCIyZFwiKTtcbiAgfVxuICB2YXIgd2lkdGggPSBpbWcud2lkdGg7XG4gIHZhciBoZWlnaHQgPSBpbWcuaGVpZ2h0O1xuICBpZiAod2lkdGggPiBoZWlnaHQpIHtcbiAgICBpZiAod2lkdGggPiBtYXhXaWR0aCkge1xuICAgICAgaGVpZ2h0ICo9IG1heFdpZHRoIC8gd2lkdGg7XG4gICAgICB3aWR0aCA9IG1heFdpZHRoO1xuICAgIH1cbiAgICBpZiAoaGVpZ2h0ID4gbWF4SGVpZ2h0KSB7XG4gICAgICB3aWR0aCAqPSBtYXhIZWlnaHQgLyBoZWlnaHQ7XG4gICAgICBoZWlnaHQgPSBtYXhIZWlnaHQ7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGlmIChoZWlnaHQgPiBtYXhIZWlnaHQpIHtcbiAgICAgIHdpZHRoICo9IG1heEhlaWdodCAvIGhlaWdodDtcbiAgICAgIGhlaWdodCA9IG1heEhlaWdodDtcbiAgICB9XG4gICAgaWYgKHdpZHRoID4gbWF4V2lkdGgpIHtcbiAgICAgIGhlaWdodCAqPSBtYXhXaWR0aCAvIHdpZHRoO1xuICAgICAgd2lkdGggPSBtYXhXaWR0aDtcbiAgICB9XG4gIH1cbiAgcmVzaXplQ2FudmFzLndpZHRoID0gd2lkdGg7XG4gIHJlc2l6ZUNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gIHJlc2l6ZUN0eC5kcmF3SW1hZ2UoaW1nLCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgaWYgKG92ZXJsYXlUZXh0KSB7XG4gICAgcmVzaXplQ3R4LmZpbGxTdHlsZSA9IFwid2hpdGVcIjtcbiAgICByZXNpemVDdHguZm9udCA9IFwiMzZweCBBcmlhbFwiO1xuICAgIHJlc2l6ZUN0eC5maWxsVGV4dChvdmVybGF5VGV4dCwgMTAsIDQ1KTtcbiAgfVxuICByZXR1cm4gcmVzaXplQ2FudmFzLnRvRGF0YVVSTChcImltYWdlL2pwZWdcIiwgMC44NSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcmVzaXplSW1hZ2U7XG4iXX0=

