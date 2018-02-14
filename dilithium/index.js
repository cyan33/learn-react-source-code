const Element = require('./Element')
const Component = require('./Component')
const Mount = require('./mount')

module.exports = {
  createElement: Element.createElement,
  Component,
  render: Mount.render
}
