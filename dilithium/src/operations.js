const UPDATE_TYPES = {
  INSERT: 1,
  MOVE: 2,
  REMOVE: 3
}

const OPERATIONS = {
  insert(component, node, afterNode) {
    return {
      type: UPDATE_TYPES.INSERT,
      content: node,
      afterNode: afterNode,
    }
  },

  move(component, afterNode) {
    return {
      type: UPDATE_TYPES.MOVE,
      fromIndex: component._mountIndex,
      afterNode: afterNode,
    }
  },

  remove(component, node) {
    return {
      type: UPDATE_TYPES.REMOVE,
      fromIndex: component._mountIndex,
      fromNode: node,
    }
  }
}

module.exports = {
  UPDATE_TYPES,
  OPERATIONS
}