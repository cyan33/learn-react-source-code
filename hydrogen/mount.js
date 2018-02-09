const DATA_KEY = 'hydg_key'
let rootId = 1
let rootInstances = []

export function mount(component, node) {
  // render the component into the node for the first time
  if (typeof component === 'string') {
    mountTextNode(component, node)
  } else if (typeof component.type === 'function') {
    mountCompositeNode(component, node)
  } else {
    mountNativeNode(component, node)
  }
}

function mountTextNode(text, node) {
  document.createTextNode(text)
  node.appendChild(text)
}

function mountCompositeNode(component, node) {
  const componentNode = component.type(component.props)
  // delegate to mount one level deeper
  mount(componentNode, node)
}

function mountNativeNode(component, node) {
  const nativeNode = document.createElement(component.type)
  const children = component.props.children

  Object.keys(component.props).forEach((propName) => {
    if (propName !== 'children') {
      nativeNode.setAttribute(propName, component.props[propName])
    }
  })

  node.appendChild(nativeNode)

  children.filter((child) => !!child).forEach((child) => {
    mount(child, nativeNode)
  })
}
