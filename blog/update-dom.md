# Update the Real DOM

首先回顾一下上篇文章的进度。

```js
updateChildren(nextChildren) {
  // component tree
  let prevRenderedChildren = this._renderedChildren
  // element tree
  let nextRenderedChildren = flattenChildren(nextChildren)

  let mountNodes = []
  let removedNodes = {}

  ChildReconciler.updateChildren(
    prevRenderedChildren,
    nextRenderedChildren,
    mountNodes,
    removedNodes
  )

  // ...
}
```

我们通过 `ChildReconciler.updateChildren`，mutate 修改了 `nextRenderedChildren`, `mountNodes` 和 `removedNodes`。在后两个变量中，分别储存着 diff 后**需要新插入的元素和需要被移除的元素**。

## Create the `OPERATION` Object

接下来，我们要根据这两个变量，构建 `updates`。但是在此之前，我们先对 `updates` 的数据结构做好约定。由于最终我们要根据 `updates` 进行真正的 DOM 操作，所以其中必然包含了每个 DOM 操作需要的全部信息。所以在这里我们写了这样一个 helper function，用来生成每一个 DOM 操作的更新信息：

```js
const UPDATE_TYPES = {
  INSERT: 1,
  MOVE: 2,
  REMOVE: 3
}

const OPERATIONS = {
  insert(node, afterNode) {
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
```

由此就能像这样通过 `OPERATIONS` 这个对象内部的方法，生成一个atomic 的更新对象，并添加到 `updates` 中去。

```js
updates.push(OPERATIONS.insert(node, afternode))
```

## Build the `updates`

到了真正要构建 `updates` 的时候了。

```js
updateChildren(nextChildren) {
  // component tree
  let prevRenderedChildren = this._renderedChildren
  // element tree
  let nextRenderedChildren = flattenChildren(nextChildren)

  let mountNodes = []
  let removedNodes = {}

  ChildReconciler.updateChildren(
    prevRenderedChildren,
    nextRenderedChildren,
    mountNodes,
    removedNodes
  )

  // We'll compare the current set of children to the next set.
  // We need to determine what nodes are being moved around, which are being
  // inserted, and which are getting removed. Luckily, the removal list was
  // already determined by the ChildReconciler.

  // We'll generate a series of update operations here based on the
  // bookmarks that we've made just now
  let updates = []

  let lastIndex = 0
  let nextMountIndex = 0
  let lastPlacedNode = null

  Object.keys(nextRenderedChildren).forEach((childKey, nextIndex) => {
    let prevChild = prevRenderedChildren[childKey]
    let nextChild = nextRenderedChildren[childKey]

    // mark this as an update if they are identical
    if (prevChild === nextChild) {
      // We don't actually need to move if moving to a lower index.
      // Other operations will ensure the end result is correct.
      if (prevChild._mountIndex < lastIndex) {
        updates.push(OPERATIONS.move(nextChild, lastPlacedNode))
      }

      lastIndex = Math.max(prevChild._mountIndex, lastIndex)
      prevChild._mountIndex = nextIndex
    } else {
      // Otherwise we need to record an insertion.
      // First, if we have a prevChild then we know it's a removal.
      // We want to update lastIndex based on that.
      if (prevChild) {
        lastIndex = Math.max(prevChild._mountIndex, lastIndex)
      }

      nextChild._mountIndex = nextIndex
      updates.push(
        OPERATIONS.insert(
          mountNodes[nextMountIndex],
          lastPlacedNode
        )
      )
      nextMountIndex ++
    }

    // keep track of lastPlacedNode
    lastPlacedNode = nextChild._domNode
  })

  // enque the removal the non-exsiting nodes
  Object.keys(removedNodes).forEach((childKey) =>  {
    updates.push(
      OPERATIONS.remove(
        prevRenderedChildren[childKey],
        removedNodes[childKey]
      )
    )
  })

  // ...
}
```

有几点需要解释一下：

1. 整个函数就是分别往 `updates` 里面 push 了三个东西：`insert`, `move` 和 `remove` 的一系列操作。

1. 首先我们看到，只有在 `prevChild._mountIndex < lastIndex` 也就是将更新过后的 `prevChild` 移动到一个*更高*的索引的时候，我们才 push 一个 move 操作。而当将其 move 到一个*更低*索引的时候，我们可以置之不顾。为什么？因为后续的操作会将一些节点删除或者移动，最终结果是该节点自动往更低索引处走了。

1. 用 `lastIndex` 来记录**上一个 `prevChild` 的 `mountIndex`**，这个变量的唯一用处是比对**当前的 `prevChild` 是在相对往哪里移动**，如果 `prevChild._mountIndex < lastIndex` 说明当前的节点在当前的 update 中应该往**下（高索引处）**移动。

1. 用 `lastPlacedNode` 来记录上一个被放置的节点。用来作为 `insertAfter` 的第三个参数。

1. 最后遍历 `removedNodes` 得出 `updates` 中的 `remove` 操作。

经过这样的操作之后，我们有了关于本次 patch 的所有相关信息，只需要遍历 `updates`，进行真正的 DOM 修改即可。

这个函数的最后两行：

```js
// do the actual updates
processQueue(this._domNode, updates)
// re-bookmark
this._renderedChildren = nextRenderedChildren
```

至于 `processQueue`，则是针对 updates 跑 DOM 操作：

```js
function processQueue(parentNode, updates) {
  updates.forEach(update => {
    switch (update.type) {
      case UPDATE_TYPES.INSERT:
        DOM.insertAfter(parentNode, update.content, update.afterNode)
        break

      case UPDATE_TYPES.MOVE:
        // this automatically removes and inserts the new child
        DOM.insertAfter(
          parentNode,
          update.content,
          update.afterNode
        )
        break

      case UPDATE_TYPES.REMOVE:
        DOM.removeChild(parentNode, update.fromNode)
        break

      default:
        assert(false)
    }
  })
}
```

对于三类操作，分别执行相应的 DOM 修改。

至此，我们已经分析完了所有的 Virtual DOM Diff 以及 update 的操作。

你可以回顾一下 README 中的 [What Will You Learn](../README.md#what-youll-learn) 来回顾复习一下这个系列博客的所学知识。

## 参考资料

[Paul O Shannessy - Building React From Scratch](https://www.youtube.com/watch?v=_MAD4Oly9yg)

[Building React from Scratch](https://github.com/zpao/building-react-from-scratch)

[Tech Talk: What is the Virtual DOM?](https://www.youtube.com/watch?v=d7pyEDqBDeE)

[Let's Build a Virtual DOM from Scratch](https://www.youtube.com/watch?v=l2Tu0NqH0qU)
