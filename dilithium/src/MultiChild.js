const ChildReconciler = require('./ChildReconciler')
const Reconciler = require('./Reconciler')

class MultiChild {
  constructor() {
    this._renderedChildren = null
  }

  mountChildren(children) {
    // children elements => children nodes
    const childrenComponents = ChildReconciler.instantiateChildren(children)
    this._renderedChildren = childrenComponents
    
    /*
    {
      '.0.0': {_currentElement, ...}
      '.0.1': {_currentElement, ...}
    }
    */

    const childrenNodes = Object.keys(childrenComponents).map((childKey) => {
      const childComponent = childrenComponents[childKey]

      return Reconciler.mountComponent(childComponent)
    })

    return childrenNodes
  }
}

module.exports = MultiChild
