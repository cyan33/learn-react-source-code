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
      toIndex: component._mountIndex,
      afterNode: afterNode,
    }
  },

  move(component, afterNode, toIndex) {
    return {
      type: UPDATE_TYPES.MOVE,
      fromIndex: component._mountIndex,
      toIndex: toIndex,
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