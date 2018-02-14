const assert = require('./assert')
const instantiateComponent = require('./instantiateComponent')
const Reconciler = require('./Reconciler')

class Component {
  constructor(props) {
    this.props = props
    this._renderedComponent = null
    this._renderedNode = null
    this._currentElement = null
    assert(this.render)
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
}

module.exports = Component
