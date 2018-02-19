/**
 * A set of DOM helper functions
 */

function empty(node) {
  [].slice.call(node, node.childNodes).forEach(node.removeChild, node)
}

function updateStyles(node, styleObj) {
  Object.keys(styleObj).forEach((styleName) => {
    node.style[styleName] = styleObj[styleName]
  })
}

function setProperty(node, attr, value) {
  if (attr === 'children')  return
  node.setAttribute(attr, value)
}

function removeProperty(node, attr) {
  node.removeAttribute(attr);
}

function appendChildren(node, children) {
  if (Array.isArray(children)) {
    children.forEach((child) => node.appendChild(child))
  } else {
    node.appendChild(children)
  }
}

function removeChild(node, child) {
  node.removeChild(child)
}

function insertAfter(node, child, afterChild) {
  node.insertBefore(
    child,
    afterChild ? afterChild.nextSibling : node.firstChild
  )
}

function replaceNode(prevNode, newNode) {
  const parentNode = prevNode.parentNode
  empty(parentNode)
  parentNode.appendChild(newNode)
}

module.exports = {
  empty,
  setProperty,
  removeProperty,
  appendChildren,
  removeChild,
  insertAfter,
  updateStyles,
  replaceNode,
}
