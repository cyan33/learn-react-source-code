const traverseAllChildren = require('./traverseAllChildren')
const shouldUpdateComponent = require('./shouldUpdateComponent')
const Reconciler = require('./Reconciler')
const instantiateComponent = require('./instantiateComponent')

function instantiateChild(childInstances, child, name) {
  // don't know wtf happened here, cannot resolve it at top level
  // hack it in
  const initiateComponent = require('./instantiateComponent')

  if (!childInstances[name]) {
    childInstances[name] = initiateComponent(child)
  }
}

function instantiateChildren(children) {
  let childInstances = {}

  traverseAllChildren(children, instantiateChild, childInstances)

  return childInstances
}

function unmountChildren(renderedChildren) {
  if (!children)  return

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
  // we use the index of the tree to track the updates of the component, like `0.0`
  Object.keys(nextChildren).forEach((childKey) => {
    const prevChildComponent = prevChildren[childKey]
    const prevElement = prevChildComponent && prevChildComponent._currentElement
    const nextElement = nextChildren[childKey]

    // Update
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

      // instantiate the new child.
      const nextComponent = instantiateComponent(nextElement)
      nextChildren[childKey] = nextComponent

      mountNodes.push(Reconciler.mountComponent(nextComponent))
    }

    // last but not least, remove the old children which no longer exist
    Object.keys(prevChildren).forEach((childKey) => {
      if (!nextChildren.hasOwnProperty(childKey)) {
        const prevChildComponent = prevChildren[childKey]
        removedNodes[childKey] = prevChildComponent
        Reconciler.unmountComponent(prevChildComponent)
      }
    })
  })
}

module.exports = {
  instantiateChildren,
  unmountChildren,
}
