# Guidance

要阅读 React 源码，你并不需要是一个非常有经验的 React 开发者。在学习了半个月之后，我个人认为，你甚至不需要会 React，理论上依旧也可以达到目的。但是，对 React 有一个良好的使用经验可以在你阅读源码的时候起到一个对照和辅助作用，这一点是十分有帮助的。

在阅读 React 源码之前，最重要的一个概念是搞明白这个问题：

**在 React 里，Component, Element, Instance 之间有什么区别和联系？**

Answer:

- **Element** 是一个纯 JavaScript Object。React 正是使用它来描述整个 DOM 树的结构。对于每一个组件来说，render 函数返回的也正是一个 element，而不是真正的 DOM 节点。我们使用的 JSX，其实是 React.createElement 函数的语法糖，这个函数返回的是 Element。它的结构是：

```js
{
  type: 'div',
  props: {
    className,
    children,
  }
}
```

其中，children 的数据结构是 Element 的数组，或者单个 Element。由此，Element 的数据结构满足了递归的需要。

- **Component** 在 React 中，Component 有几种类型：
  - DOMComponent: `div, span, ul` 等
  - CompositeComponent: 复合组件，又分为 functional component 和 class component
  - TextComponent: number or string

由于我们在使用 React 实现组件化的时候，使用的有且只有 CompositeComponent，所以，我们的每一个组件，其实都是一个 Component。但是当 React 试图去 render 这些组件的时候，**会将 Element 转化成 Component，进而转化成真正的 DOM 节点**。

- **Instance** 是 Component 的实例化之后的对象，我们在 Component 中使用的 `this` 就是 instance。这也是 `setState` 和诸多生命周期函数所在的地方。从这一点出发，可以把 Component 理解为 Class，instance是实例化后的结果。

在解决这个问题之后，遇到 React 代码里的函数名和参数中带有 "element", "component" 的，一定要自动条件反射到对应的概念，比如说 `instantiateComponent`, `mountComponent`，`createElement`，等等。

除此之外，如果你还没有信心直接开始阅读源码，建议（按次序）阅读以下四篇官方的 React Advanced Guide。对于理解 React 的架构和一些重要概念很有帮助。

[JSX in Depth](https://reactjs.org/docs/jsx-in-depth.html)

[Implementation Details](https://reactjs.org/docs/implementation-notes.html)

[Reconciliation](https://reactjs.org/docs/reconciliation.html)

[Codebase Overview](https://reactjs.org/docs/codebase-overview.html)

## Ask yourself Before Move On

在开始之前，为了检查一下自己的学习成果，不妨问一下自己这几个问题：

- How is the code organized in the React codebase
- What are `react` and `react-dom` responsible for, respectively
- What is the difference between components, elements, instances in React:
- How is React different from the traditional class-instance based composition
- How does React use the element tree, instead of instances to compose the DOM structure
- What is the advantage(s) of using the element tree
- How does the React recursively work out a final DOM tree from a mixture of DOM components and React components during the render process