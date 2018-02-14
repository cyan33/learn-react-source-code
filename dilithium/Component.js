const assert = require('./assert')
const instantiateComponent = require('./instantiateComponent')
const Reconciler = require('./Reconciler')

class Component {
  _renderedComponent = null
  _renderedNode = null
  _currentElement = null
  
  constructor(props) {
    this.props = props
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