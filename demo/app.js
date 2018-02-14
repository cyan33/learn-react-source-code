const Dilithium = require('../dilithium')

class App extends Dilithium.Component {
  render() {
    return (
      <h1>Hello World</h1>
    )
  }
}

Dilithium.render(<App />, document.getElementById('root'))
