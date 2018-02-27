# Mounting - Contd

在上一节中，我们了解到，React 所有的复合组件（包括 class component 和 functional component）的 mounting 全部 defer 到了 DOM Component 的 mounting 中。并且，在 DOM Component 中的 `mountComponent` 方法中，我们留下了两个问题。

```js
mountComponent() {
  // create real dom nodes
  const node = document.createElement(this._currentElement.type)
  this._domNode = node

  this._updateNodeProperties({}, this._currentElement.props)
  this._createInitialDOMChildren(this._currentElement.props)

  return node
}
```

第一，怎样将当前 element 的 `props` 属性映射到当前 DOM 节点的属性？

第二，React 是怎样递归 mount 子组件的？

本篇博客主要讲解这两个问题。

## `updateNodeProperties`

我们回顾一下 `props` 的来源和数据结构。首先，`props` 是从 JSX 中来的：

```jsx
  <div
    className="container"
    style={{
      color: 'red',
      fontSize: '24px'
    }}
  >
    Hello World
  </div>
```

编译后的结果是：

```js
React.createElement(
  'div',
  {
    className: 'container',
    style: {
      color: 'red',
      fontSize: '24px'
    }
  },
  'Hello World'
);
```

运行 `createElement` 后，最终返回值，也就是 Element，变成了这样的数据结构：

```js
{
  type: 'div',
  props: {
    className: 'container',
    children: 'Hello World',
    style: {
      color: 'red',
      fontSize: '24px'
    }
  },
}
```

可以看出，`props` 就是一个**不完全的**和HTML属性之间的映射。为什么说是**不完全**呢？有以下两个原因：

1. 有些属性并不是 DOM 属性，也不会被挂载在 DOM 上。比如 `children`。
2. `props` 的属性名和 HTML 的 property 并不存在一一对应的关系。比如说 `className` 对应的应该是 `class`。

除此之外，我们还应该考虑很重要的一点，那就是当组件更新，`props.style` 中的更新方式应该是怎样的呢？（这一部分本应放在 `updating` 再讲，但是为了整个函数的连贯性，我们在此一并讲完。）举个例子：

当一个组件的 `style` 由

```js
{
  fontSize: '36px'
}
```

变为 

```js
{
  color: 'red'
}
```

的时候，我们不仅应该设置 `color: red`，而且应该讲之前的 `fontSize` 去除，恢复为默认值。

总而言之，用一句话概括 `updateNodeProperties` 的过程：**先重置之前的 props，再设置新的 props**

代码如下（为了简化整个过程，我们忽略了第二点）:

```js
function updateNodeProperties(prevProps, nextProps) {
  let styleUpdates = {}

  Object.keys(prevProps).forEach((propName) => {
    if (propName === 'style') {
      Object.keys(prevProps.style).forEach((styleName) => {
        styleUpdates[styleName] = ''
      })
    } else {
      DOM.removeProperty(this._domNode, propName)
    }
  })

  Object.keys(nextProps).forEach((propName) => {
    if (propName === 'style') {
      Object.keys(nextProps.style).forEach((styleName) => {
        styleUpdates[styleName] = nextProps.style[styleName]
      })
    } else {
      DOM.setProperty(this._domNode, propName, nextProps[propName])
    }
  })

  // update styles based on the `styleUpdates` object
  updateStyles(this._domNode, styleUpdates)
}

function updateStyles(node, style) {
  Object.keys(style).forEach((styleName) => {
    node.style[styleName] = style[styleName]
  })
}
```

## `createInitialDOMChildren`

在设置好最外层 DOM 节点的属性后，剩下的任务是将遍历 `props.children` 并 mount 每一个子节点，并且 append 到当前的 DOM 节点上。在上节我们提到，借助于 Reconciller 的**多态**，我们统一了 React 各类组件的接口，其中之一就是 `mountComponent` 这个方法。不管是什么类型的组件，调用这个方法都会返回对应的真正的 DOM 节点。这样一来，`createInitialDOMChildren` 就很好实现了。

不考虑到之后的 update，我们的第一想法或许是这样的：

```js
_createInitialDOMChildren(props) {
  if (
    typeof props.children === 'string' ||
    typeof props.children === 'number'
  ) {
    const textNode = document.createTextNode(props.children)
    this._domNode.appendChild(textNode)
  } else if (props.children) {
    const children = Array.isArray(props.children) ? props.children : [props.children]
    children.forEach((child, i) => {
      // element => component
      const childComponent = instantiateComponent(child)
      childComponent._mountIndex = i
      // component => DOM node
      const childNode = Reconciler.mountComponent(child)

      DOM.appendChildren(this._domNode, childrenNodes)
    })
  }
}
```

到此为止我们实现了 mounting 的操作。

让我们来想一下这样做的优劣。

优点是显而易见的，直观明了，没有多余的操作。但是缺点却非常致命，每次 mount 之后，我们并没有**保存对 mount 节点的信息**，这就使之后 Virtual DOM 的 Diff 实现变得无从下手。事实上，React 并不是简单地像上文这样 mount component，与此同时，还在这个过程中生成了一个 hash tree。

`DOMComponent` 继承了 `MultiChild`，关于 mounting 和 update 的大部分复杂的操作都在在这个类里面，例如在这个过程中调用的 `mountChildren`。从源码中看出，与上面我们写的 `_createInitialChildren` 细微的差别是，源码中并没有简单的使用 `forEach` 直接遍历，而是使用了一个函数，叫做 `traverseAllChildren`，利用这个方法，在每次 mounting 和 update 的过程中，得以以一种附加 callback 的方式遍历所有子节点，并返回上文我们说的 hash tree。如果你有兴趣，可以阅读：

[DOMComponent.js](../dilithium/src/DOMComponent.js)
[MultiChild.js](../dilithium/src/MultiChild.js)
[traverseAllChildren.js](../dilithium/src/traverAllChildren.js)

在下篇中我们会讲解由 React 是怎么实现 `setState`，以及其引发的一系列更新操作的。
