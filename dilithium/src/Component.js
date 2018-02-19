const assert = require('./assert')
const shouldUpdateComponent = require('./shouldUpdateComponent')
const instantiateComponent = require('./instantiateComponent')
const Reconciler = require('./Reconciler')

class Component {
  constructor(props) {
    this.props = props
    this._renderedComponent = null
    this._renderedNode = null
    this._currentElement = null
    this._pendingState = null
    assert(this.render)
  }

  setState(partialState) {
    this._pendingState = Object.assign({}, this.state, partialState)
    this.performUpdateIfNecessary()
  }

  _construct(element) {
    this._currentElement = element
  }

  mountComponent() {
    // we simply assume the render method returns a single element
    let renderedElement = this.render()

    let renderedComponent = instantiateComponent(renderedElement)
    this._renderedComponent = renderedComponent

    let renderedNode = Reconciler.mountComponent(renderedComponent)
    this._renderedNode = renderedNode

    return renderedNode
  }

  unmountComponent() {
    if (!this._renderedComponent) return

    // call componentWillUnmount()

    // delegate the unmounting process to the rendered component
    Reconciler.unmountComponent(this._renderedComponent)
  }

  updateComponent(prevElement, nextElement) {
    if (prevElement !== nextElement) {
      // should get re-render because of the changes of props passed down from parents
      // react calls componentWillReceiveProps here
    }

    // re-bookmarking
    this._currentElement = nextElement

    this.props = nextElement.props
    this.state = this._pendingState
    this._pendingState = null

    let prevRenderedElement = this._renderedComponent._currentElement
    let nextRenderedElement = this.render()

    if (shouldUpdateComponent(prevRenderedElement, nextRenderedElement)) {
      Reconciler.receiveComponent(this._renderedComponent, nextRenderedElement)
    } else {
      // re-mount everything from this point
      Reconciler.unmountComponent(this._renderedComponent)

      const nextRenderedComponent = instantiateComponent(nextElement)
      this._renderedNode = Reconciler.mountComponent(nextRenderedComponent)
      DOM.replaceNode(this._renderedComponent._domNode, this._renderedNode)
    }
  }

  receiveComponent(nextElement) {
    // the new element that the current component should update itself to
    this.updateComponent(this._currentElement, nextElement)
  }

  performUpdateIfNecessary() {
    // react uses a batch here, we are just gonna call it directly without delay
    this.updateComponent(this._currentElement, this._currentElement)
  }
}

module.exports = Component
