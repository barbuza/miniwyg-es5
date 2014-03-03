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