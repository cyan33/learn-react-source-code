# Update - Contd

在上节中，我们顺着 `setState` 的流程一路走到了 DOM Component 的 `updateDOMChildren` 这个方法。接下来我们看看这个方法是怎么实现的：

```js
_updateDOMChildren(prevProps, nextProps) {
  const prevType = typeof prevProps.children
  const nextType = typeof nextProps.children

  // Childless node, skip
  if (nextType === 'undefined') return

  // Much like the initial step in mounting, handle text differently than elements.
  if (nextType === 'string' || nextType === 'number') {
    this._domNode.textContent = nextProps.children
  } else {
    this.updateChildren(nextProps.children)
  }
}
```

可以看到，这个方法和 DOM Component 中的 `createInitialDOMChildren` 十分类似，因为在更新时，我们也要考虑 `children` 类型发生变化的情况。如果变为 `string || number`，那么直接修改 `domNode` 的 `textContent` 就可以了。但是大部分情况下，我们需要更复杂的 diff 对比。

我们也观察到，这个函数调用了父类 `MultiChild` 的 `updateChildren` 方法。而这个方法可以说是 React Virtual DOM Diff 算法的入口。在继续分析下去之前，有必要牢记这个方法实参的数据结构：

```js
children: ReactElement || Array<ReactElement>
```

## 预备工作之 `traverseAllChildren`

在 Mount 部分中，我们谈到过，React 的 DOM Component 并不是简单的遍历子树并逐个 mount，而是通过 `traverseAllChildren` 生成了一个 hash tree，并保存到了 `this._renderedChildren` 这个属性中。

现在，我们首先来看看 `traverseAllChildren` 是怎么实现的。

```js
const SEPARATOR = '.'
const SUBSEPARATOR = ':'

function getComponentKey(component, index) {
  // This is where we would use the key prop to generate a unique id that
  // persists across moves. However we're skipping that so we'll just use the
  // index.
  return index.toString(36)
}

function traverseAllChildren(children, callback, traverseContext) {
  return traverseAllChildrenImpl(children, '', callback, traverseContext)
}

function traverseAllChildrenImpl(
  children,
  nameSoFar,
  callback,
  traverseContext
) {
  if (
    typeof children === 'string' ||
    typeof children === 'number' ||
    !Array.isArray(children)
  ) {
    callback(
      traverseContext,
      children,
      nameSoFar + SEPARATOR + getComponentKey(children, 0)
    )
    return 1
  }

  let subtreeCount = 0
  const namePrefix = !nameSoFar ? SEPARATOR : namePrefix + SUBSEPARATOR

  children.forEach((child, i) => {
    subtreeCount += traverseAllChildrenImpl(
      child,
      namePrefix + getComponentKey(child, i),
      callback,
      traverseContext
    )
  })

  return subtreeCount
}
```

这个函数乍一看比较复杂，但是花时间分析一下，就会发现其实还是很简洁的。在此之前我们先看一下这个函数式怎么被调用用的。

比如说在 mounting 阶段我们记得有一个步骤是在 `mountChildren` 中调用 `instantiateChildren`，这个方法是这样的：

```js
function instantiateChildren(children) {
  let childInstances = {}

  traverseAllChildren(
    children,
    (traverseContext, children, name) => traverseContext[name] = children,
    childInstances
  )

  return childInstances
}
```

有几点需要注意：

1. 一般情况下我们不提倡使用 mutate 方法，但是在 `traverAllChildren` 这个函数里我们看出它直接利用 callback 修改了参数 `traverseContext`，也就是 `childInstances`。也正因为如此，我们生成了所谓的 hash tree。
1. `traverseAllChildren` 中的 `nameSoFar` 正是 hash tree 中的每个 Component 的 key。
1. 注意 `traverseAllChildren` 并不会无限地递归到 leaf node，而只是**一层**的遍历。只要当前 child 是 **单个元素（即使它是一个 wrapper）**就不会再往里递归。

[comment]: <> (Explain this in detail later)

通过 `instantiateChildren` 我们生成的 hash tree 的数据结构是类似这样的（我们将这个 tree 保存到了 `this._renderedChildren` 中）：

```js
{
  '.0.0': {_currentElement, ...}
  '.0.1': {_currentElement, ...}
}
```

## Back to Update

现在我们回到 update，还记得我们上篇讲到的流程图吗？

![update-process](assets/update-process.jpg)

我们上次讲到了 `updateDOMChildren` 这个方法，现在我们继续向下分析。

首先我们知道，组件由 `setState` 更新的时候会带来各种各样的变化，这其中包括 element `props` 变化，也包括 element 本身内容变化，甚至 element 的类型变化。

```js
updateDOMChildren(prevProps, nextProps) {
  const nextChildrenType = typeof nextProps.children

  // Childless node, skip
  if (nextType === 'undefined') return

  if (nextType === 'string' || nextType === 'number') {
    this._domNode.textContent = nextProps.children
  } else {
    this.updateChildren(nextProps.children)
  }
}
```

如果只是单纯地节点内容发生变化，那么只需要修改 `textContent`。接下来我们重点看 `MultiChild` 中的 `updateChildren` 这个方法。

## Core

接下来的这部分是 React 的核心。敲黑板划重点了！

首先我们用几句话概括一下整个更新的过程。在 React 里，我们首先对比 `prevRenderedChildren` 和 `nextRenderedChildren`，也就是所谓的 diff 操作。通过 diff，我们得出**需要 insert 的新节点，需要 remove 的节点，和需要调整顺序的节点**。并把它们保存在数组或对象这样的数据结构里。最后，我们逐个遍历这些数据结构并生成一个数组叫做 `updates`，用来保存所有需要执行的操作描述。最后，我们遍历 `updates`，执行真正的 DOM 操作。

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

`this._renderedChildren` 中保存着我们之前 mounting 中生成的 Component hash tree。但是 `nextChildren` 仍然是一个元素类型为 element 的数组。为了数据结构的一致，我们首先也需要对它进行 traverse 生成 hash tree：

```js
function flattenChildren(children) {
  const flattenedChildren = {}

  traverseChildren(
    children,
    (flattenedChildren, child, name) => flattenedChildren[name] = child,
    flattenedChildren
  )

  return flattenedChildren
}
```

注意到我们此处生成的 `nextRenderedChildren` 是一个 value 类型为 element 的 hash tree。而 `prevRenderedChildren` 的 value 类型为 component。

在“统一”了数据结构后，我们增加了一个中间件，`ChildReconciler`，专门用来处理 Children 的操作。接下来我们看一下其中的 `updateChildren` 这个方法。正如我们刚才说的吗，它的作用是得出**需要 insert 的新节点，需要 remove 的节点，和需要调整顺序的节点**。并把它们保存在数组或对象这样的数据结构里。

```js
function updateChildren(
  prevChildren, // instance tree
  nextChildren, // element tree
  mountNodes,
  removedNodes
) {
  // we use the index of the tree to track the updates of the component, like `0.0`
  Object.keys(nextChildren).forEach((childKey) => {
    const prevChildComponent = prevChildren[childKey]
    const prevElement = prevChildComponent && prevChildComponent._currentElement
    const nextElement = nextChildren[childKey]

    // three scenarios:
    // 1: the prev element exists and is of the same type as the next element
    // 2: the prev element exists but not of the same type (type has changed)
    // 3: the prev element doesn't exist (insert a new element)

    if (prevElement && shouldUpdateComponent(prevElement, nextElement)) {
      // this will do the recursive update of the sub tree
      // and this line is basically the actual update
      Reconciler.receiveComponent(prevChildComponent, nextElement)
      // and we do not need the new element
      // note that we are converting the `nextChildren` object from an
      // element tree to a component instance tree during all this process
      nextChildren[childKey] = prevChildComponent
    } else {
      // otherwise, we need to do the unmount and re-mount stuff
      if (prevChildComponent) {
        // only supports DOM node for now, should add composite component
        removedNodes[childKey] = prevChildComponent._domNode
        Reconciler.unmountComponent(prevChildComponent)
      }

      // instantiate the new child. (insert)
      const nextComponent = instantiateComponent(nextElement)
      nextChildren[childKey] = nextComponent

      mountNodes.push(Reconciler.mountComponent(nextComponent))
    }
  })

  // last but not least, remove the old children which no longer exist
  Object.keys(prevChildren).forEach((childKey) => {
    if (!nextChildren.hasOwnProperty(childKey)) {
      const prevChildComponent = prevChildren[childKey]
      removedNodes[childKey] = prevChildComponent
      Reconciler.unmountComponent(prevChildComponent)
    }
  })
}
```

仔细看一下，这个函数其实还是不复杂的。我们主要针对三种情况进行处理。在遍历 `nextChildren` 的时候，我们假定这个 hash tree 的每个 key 都存在对应的 `prevChild`。这三种情况分别是：

1. `prevElement` 存在且 和 `nextElement` 同样类型(`shouldUpdateComponent`)
1. `prevElement` 存在但是类型已经发生变化
1. `prevElement` 不存在，说明需要插入一个新的 `nextElement`

最后，由于我们遍历的是 `nextChildren`，接下来还需要遍历一下 `prevChildren`，如果 `prevElement` 的 key 不存在对应的 `nextElement`，说明这个节点在这次 update 中被删除了。我们将其加入 `removedNodes`。

> 值得注意的是，`nextChildren` 从最初的 value 类型为 element 的 hash tree，通过 `nextChildren[childKey] = prevChildComponent` 亦或是 `instantiateComponent` 转化成了 value 类型为 component 的 hash tree。

就这样，通过 `ChildReconciler.updateChildren`，我们通过 diff 算法，得出了所有的需要 mount 的节点，和需要移除的节点，并分别储存在 `mountNodes` 和 `removedNodes` 里面。（注意这两个变量的数据结构是不一样的）

最后，不妨思考一个问题，**到底什么是 Virtual DOM？**

其实读完这两篇文章之后，你应该已经有答案了。无论是从一开始调用 `setState` 后组件内的 `updateComponent` 还是之后的 `updateChildren`，我们始终没有触碰到真正的 DOM 元素，而利用的是 React Element，或是我们之前生成的 Component hash tree。这也是为什么在这个系列博客的第一篇中，文章末尾提出的问题 `What is the advantage(s) of using the element tree`。因为操作 DOM 是很费资源和时间的，但是操作原生的 JS 对象就大大减少了消耗。

所以所谓的 Virtual DOM，无非是**在 mounting 和 update 的过程中，将真正的 DOM 结构映射到了原生的 JS 对象（element tree 或 component tree），从而大大提高了 diff 的效率。**

在下一节，也是最后一节中，我们会讲解怎样将 `mountNodes` 和 `removedNodes` 映射到 `updates`，并且遍历 `updates` 做真正的 DOM 更新。
