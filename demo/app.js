const Dilithium = require('../dilithium')

class App extends Dilithium.Component {
  render() {
    return (
      <div>
        <div>
          <h1>Hello Worlds</h1>
        </div>
        <h1>Hello World</h1>
      </div>
    )
  }
}

Dilithium.render(<App />, document.getElementById('root'))
