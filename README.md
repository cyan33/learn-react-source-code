# Learn React Source Code

* [Day1 - Guidance](blog/guidance.md)
* [Day2 - Mounting](blog/mounting.md)
* [Day3 - Mounting - Contd](blog/mounting-contd.md)
* [Day4 - Updating - The Process Flow](blog/update.md)
* [Day5 - Updating - Diff](blog/update-contd.md)
* [Day6 - Updating - Real DOM Update](blog/update-dom.md)

## What You'll Learn

* React 是怎样将 JSX mount 成为真正的 DOM 节点的
* React 是怎样用 Virtual DOM 的 Diff 算法更新 Element tree，然后映射到真正的 DOM 变化的
* 什么是 Virtual DOM，它的优势是什么，以及它和 React 是怎样结合使用的
* 对 React 的核心功能有一个更深入的理解

## What This Doesn't Cover

由于这是一个 React 的最小实现，它并没有实现 React 的全部功能，以下这些功能是这个代码库没有涵盖到的。（这个 list 在 Paul 2016 的演讲中被提及到）

* `defaultProps`
* `propTypes`
* `keys`
* `refs`
* batching
* events
* createClass
* warnings
* browser
* optimizations
* rendering null
* DOM updates
* SVG
* life cycle hooks
* error boundaries
* perf tooling and optimizing
* `PureComponents`
* functional components

但是当你读完整个博客和代码后，相信你已经会有对实现这其中的几个功能的一些初步思考。

## Run the Demo

```sh
> cd ./demo
> npm install
> npm run watch
```

Open the `index.html` manually.

## Disclaimers

1. Most code of Dilithium you've seen in this repo is originally written by [@zpao](https://github.com/zpao), at [building-react-from-scratch](https://github.com/zpao/building-react-from-scratch), but it's also slightly changed here. I'll keep digging some of the listed features and adding blog and source code on top of the current codebase.

2. The diffing algorithm used in the Dilithium is the stack reconcilliation, not the new fiber architecture.

3. The code snippets in the blogs are sometimes somewhat different from that in the codebase. This is for better readablity and a more smooth learning curve.

## Liscense

MIT[@Chang](github.com/cyan33)
