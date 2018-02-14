/**
 * element => component
 */

function instantiateComponent(element) {
  let componentInstance

  if (typeof element.type === 'function') {
    // todo: add functional component
    // only supports class component for now
    componentInstance = new element.type(element.props)
    componentInstance._construct(element)
  } else if (typeof element.type === string) {
    componentInstance = new DOMComponent(element)
  } else if (typeof element === 'string' || typeof element === 'number') {
    componentInstance = new DOMComponent({
      type: 'span',
      props: { children: element }
    })
  }

  return componentInstance
}

module.exports = instantiateComponent
