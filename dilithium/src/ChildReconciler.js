const traverseAllChildren = require('./traverseAllChildren')

function instantiateChild(childInstances, child, name) {
  // don't know wtf happened here, cannot resolve it at first time
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

module.exports = {
  instantiateChildren,
}
