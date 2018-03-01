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

## 预备工作

在 Mount 部分中，我们谈到过，React 的 DOM Component 并不是简单的遍历子树并逐个 mount，而是通过 `traverseAllChildren` 生成了一个 hash tree，并保存到了 `this._renderedChildren` 这个属性中。

现在，我们首先来看看 `traverseAllChildren` 是怎么实现的。

```js
function traverseAllChildren() {

}

function traverseAllChildrenImpl(
  
) {

}
```
