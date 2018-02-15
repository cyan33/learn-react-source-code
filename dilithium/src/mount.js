const instantiateComponent = require('./instantiateComponent')
const Reconciler = require('./Reconciler')
const DOM = require('./DOM')

function render(element, node) {
  // todo: add update
  mount(element, node)
}

function mount(element, node) {
  let component = instantiateComponent(element)
  let renderedNode = Reconciler.mountComponent(component)
  
  DOM.empty(node)
  DOM.appendChildren(node, renderedNode)
}

module.exports = {
  render,
}
