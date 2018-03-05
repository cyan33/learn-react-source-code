# `setState` and Update

React 中组件的更新大致有两种，第一种是由于单向数据流传到当前组件中 `props` 的变化导致，另一种是由于组件中 `setState` 引起的 local state 的变化导致。由于 `props` 的单项数据流始于最外层的组件中的 local state（如果不使用 Redux 等状态管理工具的话），我们不妨从 `setState` 入手，分析 React 是如何更新 DOM 的。

在继续下去之前，推荐阅读：

[Reconciliation](https://reactjs.org/docs/reconciliation.html)

在 React 中，`setState` 是异步的，这是因为 React 对 `setState` 进行了 batch 操作，即将短时间内的几个 `setState` 合并为一个。为什么要这么做呢？因为计算由 `setState` 而引发的 DOM diff 是很费时的，batch 使整个流程从**读取、修改、读取、修改、读取、修改……**变成了**读取、读取、读取、修改**，减少了大量的计算操作。

为了简化，我们暂不考虑 batch 的实现。并且不考虑 `setState` 接受一个回调函数作为参数的情况。

首先回忆一下，`setState` 只能在 Class Component 中使用，这意味着这个方法位于 `Component` 这个文件中：

```js
class Component {
  // ...
  setState(partialState) {
    this._pendingState = Object.assign({}, this.state, partialState)
    this.updateComponent(this._currentElement, this._currentElement)
  }

  updateComponent(prevElement, nextElement) {}
}
```

为什么这里要调用 `updateComponent` 的两个参数都是 `currentElement` 呢？我们知道 React 用一个 element 来表示一个组件的 DOM 结构。并且在上文提到，组件的更新无非有两种，一种是组件的 `props` 发生变化，这会改变 Element 的数据，而 state 的改变却并不会改变 Element。所以这里 element 在 `setState` 的操作中是没有变化的。

知道了这一点后，我们也知道要在 `updateComponent` 中区分这两种情况了。

```js
updateComponent(prevElement, nextElement) {
  if (prevElement !== nextElement) {
    // should get re-render because of the changes of props passed down from parents
    // react calls componentWillReceiveProps here
  }

  // re-bookmarking
  this._currentElement = nextElement

  this.props = nextElement.props
  this.state = this._pendingState
  this._pendingState = null

  const prevRenderedElement = this._renderedComponent._currentElement
  const nextRenderedElement = this.render()

  if (shouldUpdateComponent(prevRenderedComponent, nextRenderedComponent)) {
    Reconciler.receiveComponent(this._renderedComponent, nextElement)
  } else {
    // remount everything under this node
    Reconciler.unmountComponent(this._renderedComponent)

    const nextRenderedComponent = instantiateComponent(nextRenderedComponent)
    this._renderedNode = Reconciler.mountComponent(nextRenderedComponent)

    DOM.replaceNode(this._renderedComponent._domNode, this._renderedNode)
  }
}
```

在这段代码中，如上所述，我们首先通过判断 `prevElement` 和 `nextElement` 是否相等，来得出是 `props` 变化还是 `state` 变化导致的 re-render。如果 `Element` 发生变化，说明 `props` 发生了改变，React 此时也会调用 `componentWillReceiveProps` 这个生命周期函数。

接着，我们重新设置当前 component instance 的 `props` 和 `state`。由于 React 组件就是 `(props, state) => element` 的一个函数映射，所以此时我们通过 `render` 得出了新的 element。

接下来我们需要正式进入通过对边 `prevElement` 和 `nextElement` 进行  更新的环节。在 [Reconciliation](https://reactjs.org/docs/reconciliation.html) 中，我们了解到，现有的 [Tree Diff Algorithm](https://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf) 的复杂度是 O(n^3)，而 React 基于两个假设得出了一个 O(n) 的 Diff 算法，也就是我们所说的 Virtual DOM Diff Algorithm。

这两个假设是：

1. 不同类型的 Element 会生成不同的子树。例如 `div` 变化成 `ul`，或者复合组建由 `<Counter />` 变为 `<Header />`
1. 通过 `key` 这个属性，React 可以得知在重绘中需要具体更新哪几个节点。

我们暂且不考虑 `key` 的实现，只考虑第一点。这样一来也很简单地实现了 `shouldUpdateComponent` 这个函数。（**注意区分 shouldUpdateComponent 和 shouldComponentUpdate 两个方法，前者用来判断组件 element 的 type 有没有变化，后者是 React 组件内部的生命周期函数**）

```js
function shouldUpdateComponent(prevElement, nextElement) {
  return prevElement.type === nextElement.type
}
```

当 `element` 类型发生改变时，React 选择重新绘制由此向下的所有节点。所以我们看到了 `else` 部分的代码：首先销毁当前 component instance，然后重新 instantiate，并 mount component。

当 `element` 类型没有改变时，我们需要**更新**相应的 DOM 节点，而不是重新 mount。我们记得之前在 mounting 中讲到，React 通过 Reconciler 实现了 `mountComponent` 接口的多态。这里我们再介绍一个新的方法，叫做 `receiveComponent`（但是这个命名并不是很好）。它的实现如下：

```js
function receiveComponent(component, nextElement) {
  if (component._currentElement === nextElement)  return
  component.updateComponent(component._currentElement, nextElement)
}
```

实际上就是调用了对应组件内部的 `updateComponent` 这个方法。

需要额外注意的是，从最开始的 mounting，亦或是从 `setState` 开始的 updating，class component 内部的 `this._renderedComponent` 和 `this._currentElement` 是 **`render` 函数最外层的组件类型**，调用的 `updateComponent` 从 Class Component defer到了 DOM Component）。

举个例子：

```js
class Counter extends React.Component {
  constructor() {
    super()
    this.state = { count: 0 }
    setInterval(() => {
      this.setState({ count: this.state.count + 1 })
    }, 1000)
  }

  render() {
    return (
      <div>
        <span>{ this.state.count }</span>
      </div>
    )
  }
}
```

那么整个更新的流程图应该是这样的：

![update-process](assets/update-process.jpg)

由此可以看出，和 mounting 一样，真正的 updating 也是发生在 `DOMComponent` 里。

那么我们进一步去看 `DOMComponent` 内部是怎么进行 update 的。

```js
// DOMComponent.js
updateComponent(prevElement, nextElement) {
  this._currentElement = nextElement
  this._updateNodeProperties(prevElement.props, nextElement.props)
  this._updateDOMChildren(prevElement.props, nextElement.props)
}
```

非常简洁是不是？更新当前 DOM 节点的属性（上节已经讲过），然后递归更新子树。

但是到目前位置我们还并没有详细进入 `_updateDOMChildren` 这个函数的细节，而这正是 React Virtual DOM 的 Diff 算法的精华。

这一节我们着重分析 **React update 的整个流程**，下一节我们会分析这个函数带来的一系列操作，并开始分析 Diff 算法的内部细节。
