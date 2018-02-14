function render(element, node) {
  // todo: add update
  mount(element, node)
}

function mount(element, node) {
  let component = instantiateComponent(element);
  let renderedNode = Reconciler.mountComponent(component)
  
  DOM.empty(node)
  DOM.appendChild(node, renderedNode)
}

module.exports = {
  render,
}
