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