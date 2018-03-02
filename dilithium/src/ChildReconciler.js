const traverseAllChildren = require('./traverseAllChildren')
const shouldUpdateComponent = require('./shouldUpdateComponent')
const Reconciler = require('./Reconciler')

function instantiateChild(childInstances, child, name) {
  // don't know wtf happened here, cannot resolve it at top level
  // hack it in
  const instantiateComponent = require('./instantiateComponent')

  if (!childInstances[name]) {
    childInstances[name] = instantiateComponent(child)
  }
}

function instantiateChildren(children) {
  let childInstances = {}

  traverseAllChildren(children, instantiateChild, childInstances)

  return childInstances
}

function unmountChildren(renderedChildren) {
  if (!renderedChildren)  return

  Object.keys(renderedChildren).forEach(childKey => {
    Reconciler.unmountComponent(renderedChildren[childKey])
  })
}

function updateChildren(
  prevChildren, // instance tree
  nextChildren, // element tree
  mountNodes,
  removedNodes
) {
  // hack in the import function
  const instantiateComponent = require('./instantiateComponent')

  // we use the index of the tree to track the updates of the component, like `0.0`
  Object.keys(nextChildren).forEach((childKey) => {
    const prevChildComponent = prevChildren[childKey]
    const prevElement = prevChildComponent && prevChildComponent._currentElement
    const nextElement = nextChildren[childKey]

    // three scenarios:
    // 1: the prev element exists and is of the same type as the next element
    // 2: the prev element exists but not of the same type
    // 3: the prev element doesn't exist

    if (prevElement && shouldUpdateComponent(prevElement, nextElement)) {
      // this will do the recursive update of the sub tree
      // and this line is basically the actual update
      Reconciler.receiveComponent(prevChildComponent, nextElement)
      // and we do not need the new element
      // note that we are converting the `nextChildren` object from an
      // element tree to a component instance tree during all this process
      nextChildren[childKey] = prevChildComponent
    } else {
      // otherwise, we need to do the unmount and re-mount stuff
      if (prevChildComponent) {
        // only supports DOM node for now, should add composite component
        removedNodes[childKey] = prevChildComponent._domNode
        Reconciler.unmountComponent(prevChildComponent)
      }

      // instantiate the new child. (insert)
      const nextComponent = instantiateComponent(nextElement)
      nextChildren[childKey] = nextComponent

      mountNodes.push(Reconciler.mountComponent(nextComponent))
    }
  })

  // last but not least, remove the old children which no longer exist
  Object.keys(prevChildren).forEach((childKey) => {
    if (!nextChildren.hasOwnProperty(childKey)) {
      const prevChildComponent = prevChildren[childKey]
      removedNodes[childKey] = prevChildComponent
      Reconciler.unmountComponent(prevChildComponent)
    }
  })
}

module.exports = {
  instantiateChildren,
  unmountChildren,
  updateChildren,
}
