const ChildReconciler = require('./ChildReconciler')
const Reconciler = require('./Reconciler')
const { UPDATE_TYPES, OPERATIONS } = require('./operations')
const traverseAllChildren = require('./traverseAllChildren')

function flattenChildren(children) {
  const flattenedChildren = {}
  traverseAllChildren(
    children,
    (context, child, name) => context[name] = child,
    flattenedChildren
  )
  return flattenedChildren
}

// this is responsible for the real updates of the diffing tree
function processQueue(parentNode, updates) {
  updates.forEach(update => {
    switch (update.type) {
      case UPDATE_TYPES.INSERT:
        DOM.insertChildAfter(parentNode, update.content, update.afterNode)
        break

      case UPDATE_TYPES.MOVE:
        // this automatically removes and inserts the new child
        DOM.insertChildAfter(
          parentNode,
          parentNode.childNodes[fromIndex],
          update.afterNode
        )
        break

      case UPDATE_TYPES.REMOVE:
        DOM.removeChild(parentNode, update.fromNode)
        break

      default:
        assert(false)
    }
  })
}

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

    const childrenNodes = Object.keys(childrenComponents).map((childKey, i) => {
      const childComponent = childrenComponents[childKey]

      childComponent._mountIndex = i

      return Reconciler.mountComponent(childComponent)
    })

    return childrenNodes
  }

  unmountChildren() {
    ChildReconciler.unmountChildren(this._renderedChildren)
  }

  updateChildren(nextChildren) {
    let prevRenderedChildren = this._renderedChildren
    let nextRenderedChildren = flattenChildren(nextChildren)
    
    let mountNodes = []
    let removedNodes = {}
    
    ChildReconciler.updateChildren(
      prevRenderedChildren,
      nextRenderedChildren,
      mountNodes,
      removedNodes
    )
    // the core of the react virtual DOM diff algorithm goes here

    // We'll compare the current set of children to the next set.
    // We need to determine what nodes are being moved around, which are being
    // inserted, and which are getting removed. Luckily, the removal list was
    // already determined by the ChildReconciler.

    // We'll store a series of update operations here.
    let updates = []

    let lastIndex = 0
    let nextMountIndex = 0
    let lastPlacedNode = null

    Object.keys(nextRenderedChildren).forEach((childKey, nextIndex) => {
      let prevChild = prevRenderedChildren[childKey]
      let nextChild = nextRenderedChildren[childKey]

      // mark this as an update if they are identical
      if (prevChild === nextChild) {
        // We don't actually need to move if moving to a lower index. Other
        // operations will ensure the end result is correct.
        if (prevChild._mountIndex < lastIndex) {
          updates.push(OPERATIONS.move(prevChild, lastPlacedNode, nextIndex))
        }
        lastIndex = Math.max(prevChild._mountIndex, lastIndex)
        prevChild._mountIndex = nextIndex
      } else {
        // Otherwise we need to record an insertion. Removals will be handled below
        // First, if we have a prevChild then we know it's a removal.
        // We want to update lastIndex based on that.
        if (prevChild) {
          lastIndex = Math.max(prevChild._mountIndex, lastIndex)
        }

        nextChild._mountIndex = nextIndex
        updates.push(
          OPERATIONS.insert(
            nextChild,
            mountImages[nextMountIndex],
            lastPlacedNode,
          )
        )
        nextMountIndex ++
      }

      lastPlacedNode = nextChild._domNode
    })

    // enque the removal the non-exsiting nodes
    Object.keys(removedNodes).forEach((childKey) =>  {
      updates.push(
        OPERATIONS.remove(
          prevRenderedChildren[childKey],
          removedNodes[childKey]
        )
      )
    })

    // do the actual updates
    processQueue(this._domNode, updates)

    // at this point, nextRenderedChildren has already become a component tree
    // rather than the original element tree
    this._renderedChildren = nextRenderedChildren
  }
}

module.exports = MultiChild
