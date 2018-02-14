function createElement(type, config, children) {
  const props = Object.assign({}, config)
  const childrenLength = [].slice.call(arguments).length - 2

  if (childrenLength > 1) {
    props.children = [].slice.call(arguments, 2)
  } else if (childrenLength === 1) {
    props.children = children
  }

  return {
    type,
    props
  }
}

module.exports = {
  createElement
}
