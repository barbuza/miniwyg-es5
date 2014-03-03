class DomUtils {

  collectParents(el, parents = []) {
    const parentNode = el.parentNode;
    if (parentNode && parentNode.nodeType === document.ELEMENT_NODE) {
      parents.push(parentNode);
      return this.collectParents(parentNode, parents);
    } else {
      return parents;
    }
  }

  inHeading(tagnames = ["h1", "h2", "h3"]) {
    var parent = window.getSelection();
    if (parent) {
      parent = parent.focusNode;
      if (parent) {
        parent = parent.parentNode;
      }
    }
    if (parent) {
      const parents = this.collectParents(parent);
      parents.unshift(parent);
      for (var node of parents) {
        if (tagnames.indexOf(node.tagName.toLowerCase()) !== -1) {
          return true;
        }
      }
    }
    return false;
  }

  createTag(tagname, attrs = {}, children = []) {
    const el = document.createElement(tagname);
    for (var key in attrs) {
      el.setAttribute(key, attrs[key]);
    }
    for (var child of children) {
      if (typeof child === "string") {
        el.appendChild(document.createTextNode(child));
      } else {
        el.appendChild(child);
      }
    }
    return el;
  }

  getNextElement(node) {
    var next = node.nextSibling;
    if (next && next.nodeType === document.ELEMENT_NODE) {
      return next;
    } else if (next) {
      return this.getNextElement(next);
    } else {
      return null;
    }
  }

  wrapInto(node, tagname) {
    const wrapper = document.createElement(tagname);
    node.parentNode.insertBefore(wrapper, node);
    wrapper.appendChild(node);
  }

  addClassName(node, classname) {
    const classNames = node.className.split(/\s+/g);
    if (classNames.indexOf(classname) === -1) {
      classNames.push(classname);
    }
    node.className = classNames.join(" ");
  }

  removeClassName(node, classname) {
    const classNames = node.className.split(/\s+/g);
    const index = classNames.indexOf(classname);
    if (index !== -1) {
      classNames.splice(index, 1);
    }
    node.className = classNames.join(" ");
  }

  startSelection(node) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(node, 0);
    range.setEnd(node, 0);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  selectNode(node) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  findCssRules(selector) {
    const rules = [];
    for (var sheet of Array.prototype.slice.call(document.styleSheets)) {
      for (var rule of Array.prototype.slice.call(sheet.rules || [])) {
        if (rule.selectorText === selector) {
          rules.push(rule);
        }
      }
    }
    return rules;
  }

}


module.exports = DomUtils;
