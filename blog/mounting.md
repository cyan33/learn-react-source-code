# Day2 - Mounting

在做好一定的预备知识的学习后，本篇我们只研究一个问题：

**React 是如何把 Component 中的 JSX 映射到页面上真正的 DOM 节点的**。

## 面向测试编程

我们首先写一个小 demo，用于测试我们最终的代码：

```js
const Dilithium = require('../dilithium')

class App extends Dilithium.Component {
  render() {
    return (
      <div>
        <div>
          <h1 style={{ color: 'red' }} >Heading 1</h1>
          <SmallHeader />
          <h2 style={{ color: 'yellow' }} >Heading 2</h2>
        </div>
        <h3>Heading 3</h3>
      </div>
    )
  }
}

class SmallHeader extends Dilithium.Component {
  render() {
    return (
      <h5>SmallHeader</h5>
    )
  }
}

Dilithium.render(<App />, document.getElementById('root'))
```

可以看出，基本用法是跟 React 一致的。

至于 `Dilithium.render` 函数，我们有如下的实现：

```js
function render(element, node) {
  // todo: add update
  mount(element, node)
}
```

## The Mounting Process Overview

在我们开始分析之前，首先给出这个答案的流程图：

![mount-process](assets/mount-process.jpg)

根据这个流程，我们给出 `mount` 的实现：

```js
function mount(element, node) {
  const component = instantiateComponent(element)
  const renderedNode = component.mountComponent()

  // these are just helper functions of native DOM functions
  // you can check them out in dilithium/src/DOM.js
  DOM.empty(node)
  DOM.appendChildren(node, renderedNode)
}
```

然后根据流程的各个环节逐步开始分析。

## JSX -> Element

在 React 中，我们使用的组件有两种，class component 或是 functional component. 对于 class component 来说，render 函数是组件内必不可少的；而对于 functional component，组件没有生命周期和 local state，组件函数返回值等同于 class component 中 render 函数的返回值。

无论是 render 函数的返回值，还是函数是组件的返回值，它们都是 JSX。JSX 是 `React.createElement(type, props, ...children)` 函数的语法糖，如果你还不熟悉，建议先阅读[JSX in Depth](https://reactjs.org/docs/jsx-in-depth.html)，然后可以在 [Try it out](https://babeljs.io/repl/) 中试一下 JSX 和 `createElement` 的映射关系。

我们知道，JSX 只是调用了函数 `React.createElement`，并把对应的 JSX 结构映射到了 `createElement` 相应的参数中去。例如：

```html
<div className="container">
  good
  <span>Hello world</span>
</div>
```

会被编译成：

```js
React.createElement(
  "div",
  { className: "container" },
  "good",
  React.createElement(
    "span",
    null,
    "Hello world"
  )
);
```

那么 `createElement` 这个函数又做了什么事情呢？

```js
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
```

一言以蔽之，`createElement` 就是将 `children` 合并进了当前 Element 对象，成为了其中的 `children` 属性。

这样，对于一个 JSX 结构，我们最终得到了一个数据结构如下的**纯 JS Object**，也就是 Element。

```js
{
  type: string | function | class
  props: {
    children
  }
}
```

> Note:
> 暂时不支持函数式组件

## Element -> Component

有了 Element 后，我们需要将 Element 中对应的组件类型（`type`）实例化，也就是 `instantiateComponent`。在前文提到，element type 有三种：

1. string, 例如 `"div", "ul"` 等原生 DOM 结构。
2. function, 函数式组件（暂不支持）
3. class component

但是我们也要考虑另一种情况，element 本身是一个字符串或数字（并没有被组件包裹）。这样，我们根据不同情况，分别生成不同的组件类型：

```js
function instantiateComponent(element) {
  let componentInstance

  if (typeof element.type === 'function') {
    // todo: add functional component
    // only supports class component for now
    componentInstance = new element.type(element.props)
    componentInstance._construct(element)
  } else if (typeof element.type === 'string') {
    componentInstance = new DOMComponent(element)
  } else if (typeof element === 'string' || typeof element === 'number') {
    // to reduce overhead, we wrap the text with a span
    componentInstance = new DOMComponent({
      type: 'span',
      props: { children: element }
    })
  }

  return componentInstance
}
```

## Component -> DOM Nodes

在讨论这点之前，我们先讨论一下“多态”（polymorphism）。这是 OOP 中很重要的一个概念，在 `instantiateComponent` 中，我们根据参数 `element` 类型的不同，调用了不同的方法，本质上是一种“函数多态”。而在这一环节，我们专门将多态抽离出来，构成一个 `Reconciller：

```js
// Reconciller

function mountComponent(component) {
  return component.mountComponent()
}
```

同时，我们在不同类型中的 component 中，分别实现**同名**的方法（`mountComponent`）：

在 Class Component 中，我们看到，`mountComponent` 和实际的 `mount` 流程非常相似，都是 element -> component -> node。这里由于 class component 本身没有对应的 DOM 映射，所以 mount 的过程 defer 到了下一层组件。

```js
// Component
class Component {
  constructor(props) {
    this.props = props
    this.currentElement = null
    this._renderedComponent = null
    this._renderedNode = null
  }

  _construct(element) {
    this.currentElement = element
  }

  mountComponent() {
    // we simply assume the render method returns a single element
    const renderedElement = this.render()

    const renderedComponent = instantiateComponent(renderedElement)
    this._renderedComponent = renderedComponent

    const renderedNode = Reconciler.mountComponent(renderedComponent)
    this._renderedNode = renderedNode

    return renderedNode
  }
}
```

```js
class DOMComponent {
  constructor(element) {
    this._currentElement = element
    this._domNode = null
  }

  mountComponent() {
    // create real dom nodes
    const node = document.createElement(this._currentElement.type)
    this._domNode = node

    this._updateNodeProperties({}, this._currentElement.props)
    this._createInitialDOMChildren(this._currentElement.props)

    return node
  }
}
```

我们暂不分析 `_updateNodeProperties` 和 `_createInitialDOMChildren` 这两个函数方法的细节（留到下篇博客），从字面意思可以看出，这两个函数分别是将 `element.props` 挂载到真正的 DOM 节点上，以及递归 mount 子节点。最终返回当前这个 DOM 节点。

回顾一下 `mount` 函数：

```js
function mount(element, node) {
  const component = instantiateComponent(element)
  const renderedNode = component.mountComponent()

  DOM.empty(node)
  DOM.appendChildren(node, renderedNode)
}
```

到这里 `const renderedNode = component.mountComponent()`，我们已经拿到了真正的 DOM 节点，剩下的工作非常简单。首先清空 container 里的内容，然后将 renderedNode append 上去。

如下是两个 DOM helper function：

```js
function empty(node) {
  [].slice.call(node.childNodes).forEach((child) => {
    node.removeChild(child)
  })
}

function appendChildren(node, children) {
  if (Array.isArray(children)) {
    children.forEach((child) => {
      node.appendChild(child)
    })
  } else {
    node.appendChild(children)
  }
}
```

至此，我们已经走完了 mounting 整个的流程。完整的代码实现（仅 mounting 部分）在[这里](https://github.com/cyan33/learn-react-source-code/tree/mount)

在理解这个流程的时候，我个人认为有这几个个关键点，你也可以把它们作为检验你是否真正理解这个过程的几个题目。

1. Element, Component, Instance 的区别是什么
2. 四种不同的 Element 类型分别是怎样 mount 成真正的 DOM 节点的
3. Class Component 是怎样 defer mount 的
4. DOM Component 是怎样实现真正的 mount 的

但是，在最后的 DOM Component 中，我们有两个问题/函数还没有讲，分别是：

1. `updateNodeProperties`
2. `createInitialDOMChildren`

其中正是 `createInitialDOMChildren` 实现了 Element tree 的递归 mount。我们将在下一篇博客中完成最后这部分的分析。
