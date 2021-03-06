const MultiChild = require('./MultiChild')
const DOM = require('./DOM')
const assert = require('./assert')

class DOMComponent extends MultiChild {
  constructor(element) {
    super()
    this._currentElement = element
    this._domNode = null
  }

  mountComponent() {
    // create real dom nodes
    const node = document.createElement(this._currentElement.type)
    this._domNode = node

    this._updateNodeProperties({}, this._currentElement.props)
    this._createInitialDOMChildren(this._currentElement.props)

    return node
  }

  unmountComponent() {
    this.unmountChildren()
  }

  updateComponent(prevElement, nextElement) {
    this._currentElement = nextElement
    this._updateNodeProperties(prevElement.props, nextElement.props)
    this._updateDOMChildren(prevElement.props, nextElement.props)
  }

  _updateNodeProperties(prevProps, nextProps) {
    let styleUpdates = {}

    // Loop over previous props so we know what we need to remove
    Object.keys(prevProps).forEach((propName) => {
      if (propName === 'style') {
        Object.keys(prevProps['style']).forEach((styleName) => {
          styleUpdates[styleName] = ''
        })
      } else {
        DOM.removeProperty(this._domNode, propName)
      }
    })

    // update / add new attributes
    Object.keys(nextProps).forEach((propName) => {
      let prevValue = prevProps[propName]
      let nextValue = nextProps[propName]

      if (prevValue === nextValue)  return

      if (propName === 'style') {
        Object.keys(nextProps['style']).forEach((styleName) => {
          // overwrite the existing styles
          styleUpdates[styleName] = nextProps.style[styleName]
        })
      } else {
        DOM.setProperty(this._domNode, propName, nextProps[propName])
      }
    })

    DOM.updateStyles(this._domNode, styleUpdates)
  }

  _createInitialDOMChildren(props) {
    // this is where we go into the children of the dom component and 
    // recursively mount and append each of the childNode to the parent node
    if (
      typeof props.children === 'string' ||
      typeof props.children === 'number'
    ) {
      const textNode = document.createTextNode(props.children)
      this._domNode.appendChild(textNode)
    } else if (props.children) {
      // Single element or Array
      const childrenNodes = this.mountChildren(props.children)
      DOM.appendChildren(this._domNode, childrenNodes)
    }
  }

  _updateDOMChildren(prevProps, nextProps) {
    const prevType = typeof prevProps.children
    const nextType = typeof nextProps.children
    assert(prevType === nextType)

    // Childless node, skip
    if (nextType === 'undefined') return

    // Much like the initial step in mounting, handle text differently than elements.
    if (nextType === 'string' || nextType === 'number') {
      this._domNode.textContent = nextProps.children
    } else {
      this.updateChildren(nextProps.children)
    }
  }
}

module.exports = DOMComponent
