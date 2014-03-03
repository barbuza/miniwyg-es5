const DomUtils = require("./lib/dom-utils.js");
const getImage = require("./lib/get-image.js");
const resizeImage = require("./lib/resize-image.js");

const defaultCaption = "caption";

class Miniwyg extends DomUtils {

  constructor(el) {
    this.el = el;
    this.createPanels();
    this.createEditor();
    this.setupEvents();
  }

  createPanels() {
    this.panel = this.createTag("div", {"class": "miniwyg-panel"}, [
      this.boldButton = this.createTag("span", {"class": "btn-bold"}),
      this.italicButton = this.createTag("span", {"class": "btn-italic"}),
      this.h1Button = this.createTag("span", {"class": "btn-h1"}),
      this.h2Button = this.createTag("span", {"class": "btn-h2"}),
      this.createTag("div", {"class": "panel-clip"})
    ]);
    this.embedPanel = this.createTag("div", {"class": "miniwyg-panel"}, [
      this.alignLeftButton = this.createTag("span", {"class": "btn-align-left"}),
      this.alignCenterButton = this.createTag("span", {"class": "btn-align-center"}),
      this.removeButton = this.createTag("span", {"class": "btn-remove"}),
      this.createTag("div", {"class": "panel-clip"})
    ]);
    document.body.appendChild(this.panel);
    document.body.appendChild(this.embedPanel);
  }

  panelTransitionEnded(e) {
    if (! (/\bshow\b/.test(e.target.className))) {
      this.removeClassName(e.target, "display");
    }
  }

  createEditor() {
    this.editor = this.createTag("div", {"class": "editor", "contenteditable": "true", "spellcheck": "false"}, [
    ]);
    if (this.el.value.trim().length) {
      this.editor.innerHTML = this.el.value;
    }
    this.wrapper = this.createTag("div", {"class": "miniwyg"}, [
      this.editor,
      this.plusButton = this.createTag("div", {"class": "plus-sign fa fa-plus-square-o"}),
      this.createTag("div", {"class": "bottom"})
    ]);
    this.editor.style.minHeight = this.el.offsetHeight + "px";
    const paraStyle = this.findCssRules(".miniwyg .editor > *")[0];
    this.elementSpacing = parseInt(paraStyle.style.marginTop);
    this.addClassName(this.el, "miniwyg-hidden-textarea");
    document.execCommand("defaultParagraphSeparator", false, "p")
    this.el.parentNode.insertBefore(this.wrapper, this.el);
    this.plusHeight = parseInt(window.getComputedStyle(this.plusButton)["height"]);
  }

  setupEvents() {
    this.editor.addEventListener("keydown", this.handleKeyDown.bind(this));
    this.editor.addEventListener("keyup", this.wrapOrphanContents.bind(this));
    this.editor.addEventListener("paste", this.pasteData.bind(this));
    this.editor.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.editor.addEventListener("mouseup", this.trySelectFigure.bind(this), true);
    this.panel.addEventListener("transitionend", this.panelTransitionEnded.bind(this));
    this.embedPanel.addEventListener("transitionend", this.panelTransitionEnded.bind(this));
    this.plusButton.addEventListener("mousedown", this.handleInsert.bind(this));
    this.editor.addEventListener("mouseup", () => setTimeout(this.checkSelection.bind(this), 0));
    this.editor.addEventListener("keyup", () => setTimeout(this.checkSelection.bind(this), 0));
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
    for (var parent of this.collectParents(this.el)) {
      if (parent.tagName.toLowerCase() === "form") {
        parent.addEventListener("submit", this.updateTextArea.bind(this));
      }
    }
  }

  applyBold(e) {
    if (! this.inHeading()) {
      document.execCommand("bold", false, null);
    }
  }

  applyItalic(e) {
    document.execCommand("italic", false, null);
  }

  applyH1(e) {
    if (this.inHeading()) {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, "h1");
    }
  }

  applyH2(e) {
    if (this.inHeading()) {
      document.execCommand("formatBlock", false, "p");
    } else {
      document.execCommand("formatBlock", false, "h2");
    }
  }

  embedAlignLeft(e) {
    e.stopPropagation();
    e.preventDefault();
    this.addClassName(this.selectedFigure, "align-left");
    this.removeClassName(this.alignCenterButton, "active");
    this.addClassName(this.alignLeftButton, "active");
    this.showEmbedPanel();
  }

  embedAlignCenter(e) {
    e.stopPropagation();
    e.preventDefault();
    this.removeClassName(this.selectedFigure, "align-left");
    this.addClassName(this.alignCenterButton, "active");
    this.removeClassName(this.alignLeftButton, "active");
    this.showEmbedPanel();
  }

  embedRemove(e) {
    this.selectedFigure.parentNode.removeChild(this.selectedFigure);
  }

  insertImage(img) {
    const url = resizeImage(img, 700, 300);
    const figure = this.createTag("figure", {"contenteditable": false}, [
      this.createTag("img", {"src": url}),
      this.createTag("figcaption", {"contenteditable": true}, [defaultCaption])
    ]);
    if (this.insertOrder === "insert") {
      this.editor.appendChild(figure);
      this.editor.appendChild(this.createTag("p"))
    } else if (this.insertOrder === "before") {
      this.editor.insertBefore(figure, this.insertTarget);
    }
  }

  handleNodeRemoved(e) {
    if (e.target.nodeType === document.ELEMENT_NODE && e.target.tagName.toLowerCase() === "figure") {
      this.hideEmbedPanel();
    }
  }

  handleInsert() {
    getImage(this.insertImage.bind(this));
  }

  handleMouseLeave(e) {
    if (e.target !== this.plusButton) {
      this.removeClassName(this.plusButton, "show");
    }
  }

  handleKeyDown(e) {
    if (e.target.tagName.toLowerCase() === "figcaption" && e.keyCode === 13) {
      e.stopPropagation();
      e.preventDefault();
      const figure = e.target.parentNode;
      var next = this.getNextElement(figure);
      if (! next) {
        next = this.editor.appendChild(this.createTag("p"));
      }
      if (["p", "h1", "h2", "h3"].indexOf(next.tagName.toLowerCase()) !== -1) {
        this.startSelection(next);
      }
    }
  }

  handleMouseMove(e) {
    e.stopPropagation();
    if (e.target === this.editor) {
      if (! (this.editor.firstChild && this.editor.firstChild.nodeType === document.ELEMENT_NODE)) {
        this.removeClassName(this.plusButton, "show");
        return;
      }
      this.addClassName(this.plusButton, "show");
      var nextChild = null;
      for (var child of Array.prototype.slice.call(this.editor.childNodes)) {
        if (child.offsetTop > e.layerY) {
          nextChild = child;
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
  }

  updateTextArea() {
    while (this.editor.lastChild.nodeType == document.ELEMENT_NODE &&
           this.editor.lastChild.tagName.toLowerCase() === "p" &&
           this.editor.lastChild.innerText.trim() === "") {
      this.editor.removeChild(this.editor.lastChild);
    }
    this.el.value = this.editor.innerHTML;
  }

  checkSelection() {
    const selection = window.getSelection();
    const anchor = selection.anchorNode;
    const selectedTree = this.collectParents(anchor);
    var inFigure;
    for (var parent of selectedTree) {
      if (parent.nodeType === document.ELEMENT_NODE && parent.tagName.toLowerCase() === "figure") {
        inFigure = true;
        break;
      }
    }
    if (! inFigure && ! selection.isCollapsed && selection.toString().trim().length && selection.type !== "Control") {
      const rect = selection.getRangeAt(0).getClientRects()[0];
      this.showPanel(rect.top + window.scrollY, rect.left + rect.width / 2);
    } else {
      this.hidePanel();
    }
    for (var child of Array.prototype.slice.call(this.editor.childNodes)) {
      if (child.nodeType === document.ELEMENT_NODE && child.tagName.toLowerCase() === "figure") {
        if (selectedTree.indexOf(child) === -1) {
          this.removeClassName(child, "figure-focus");
        } else {
          this.selectFigure(child);
        }
      }
    }
    if (! inFigure) {
      this.hideEmbedPanel();
    }
    var isBold;
    var isItalic;
    var isH1;
    var isH2;
    for (var child of Array.prototype.slice.call(selectedTree)) {
      if (child.nodeType === document.ELEMENT_NODE) {
        if (child.tagName.toLowerCase() === "b") {
          isBold = true;
        }
        if (child.tagName.toLowerCase() === "i") {
          isItalic = true;
        }
        if (child.tagName.toLowerCase() === "h1") {
          isH1 = true;
        }
        if (child.tagName.toLowerCase() === "h2") {
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

  }

  showPanel(top, left) {
    this.panel.style.top = top + "px";
    this.panel.style.left = left + "px";
    this.addClassName(this.panel, "display");
    setTimeout(() => this.addClassName(this.panel, "show"), 0);
  }

  showEmbedPanel() {
    const targetElement = this.selectedFigure.firstChild;
    const top = targetElement.offsetTop + this.wrapper.offsetTop;
    const left = this.wrapper.offsetLeft + targetElement.offsetLeft + targetElement.offsetWidth / 2;
    this.embedPanel.style.top = top + "px";
    this.embedPanel.style.left = left + "px";
    this.addClassName(this.embedPanel, "display");
    setTimeout(() => this.addClassName(this.embedPanel, "show"), 0);    
  }

  hidePanel() {
    this.removeClassName(this.panel, "show");
  }

  hideEmbedPanel() {
    this.removeClassName(this.embedPanel, "show");
  }

  selectFigure(node) {
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
  }

  trySelectFigure(ev) {
    const shouldChangeSelection = ev.target.tagName && ev.target.tagName.toLowerCase() === "img";
    const parents = this.collectParents(ev.target);
    this.selectedFigure = null;
    parents.unshift(ev.target);
    for (var parent of parents) {
      if (parent.tagName.toLowerCase() === "figure") {        
        this.selectFigure(parent);
        for (var child of Array.prototype.slice.call(this.editor.childNodes)) {
          if (child.nodeType === document.ELEMENT_NODE && child.tagName.toLowerCase() === "figure" && child != parent) {
            this.removeClassName(child, "figure-focus");
          }
        }
        if (shouldChangeSelection){
          if (this.selectedFigure.lastChild.innerText === defaultCaption) {
            this.selectNode(this.selectedFigure.lastChild);
          }  else {
            this.startSelection(this.selectedFigure.lastChild);
          }
        } 
        ev.stopPropagation();
        break;
      }
    }
    if (! this.selectedFigure) {
      this.hideEmbedPanel();
    }
  }

  pasteData(ev) {
    ev.preventDefault();
    if (ev.clipboardData && ev.clipboardData.getData) {
      const text = ev.clipboardData.getData("text/plain");
      if (text.trim().length) {
        for (var line of text.split(/(\r?\n)/g)) {
          if (line.trim().length) {
            const clean = line.trim().replace(/(<([^>]+)>)/ig, "");
            document.execCommand("InsertParagraph", false, null);
            document.execCommand("insertHtml", false, "<p>" + clean + "</p>");
          }
        }
        const firstChild = this.editor.firstChild;
        if (firstChild.nodeType === document.ELEMENT_NODE &&
            firstChild.tagName.toLowerCase() === "p" &&
            firstChild.innerText.trim() === "") {
          firstChild.parentNode.removeChild(firstChild);
        }
      }
    }
  }

  wrapOrphanContents(e) {
    if (! this.editor.firstChild) {
      document.execCommand("insertHtml", false, "<p></p>");
    }
    if (e.keyCode == 13) {
      for (var node of Array.prototype.slice.call(this.editor.childNodes)) {
        if (node.nodeType === document.TEXT_NODE) {
          this.wrapInto(node, "p");
        }
      }
    }
  }

}

new Miniwyg(document.getElementById("editor"));
