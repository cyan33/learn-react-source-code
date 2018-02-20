const Dilithium = require('../dilithium')

class App extends Dilithium.Component {
  render() {
    return (
      <div>
        <h3>Heading 3</h3>
        <SmallHeader />
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
