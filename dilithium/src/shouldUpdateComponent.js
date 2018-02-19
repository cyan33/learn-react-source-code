function shouldUpdateComponent(prevElement, nextElement) {
  // if it's still the same type, we update the component
  // instead of unmount and mount from scratch
  return prevElement.type === nextElement.type
}

module.exports = shouldUpdateComponent
