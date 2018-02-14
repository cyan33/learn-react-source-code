const Element = require('./src/Element')
const Component = require('./src/Component')
const Mount = require('./src/mount')

module.exports = {
  createElement: Element.createElement,
  Component,
  render: Mount.render
}
