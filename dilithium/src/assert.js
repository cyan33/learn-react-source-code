function assert(val) {
  if (!Boolean(val)) {
    throw new Error('assertion failure')
  }
}

module.exports = assert
