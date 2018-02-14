function createElement(type, config, ...children) {
  return {
    type,
    props: {
      ...config,
      children
    }
  }
}

module.exports = {
  createElement
}
