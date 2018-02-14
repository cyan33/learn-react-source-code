const ChildReconciler = require('./ChildReconciler')

class MultiChild {
  constructor() {
    this._renderedChildren = null
  }

  mountChildren(children) {
    const childrenComponents = ChildReconciler.instantiateChildren(children)
    this._renderedChildren = childrenComponents

    /*
    {
      '.0.0': {_currentElement, ...}
      '.0.1': {_currentElement, ...}
    }
    */

    // const childrenNodes = childrenComponents.
  }
}

module.exports = MultiChild
