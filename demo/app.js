const Dilithium = require('../dilithium')

class App extends Dilithium.Component {
  render() {
    return (
      <div>
        <h3>Heading 3</h3>
        <SmallHeaderWithState />
      </div>
    )
  }
}

class SmallHeaderWithState extends Dilithium.Component {
  constructor() {
    super()
    this.state = { number: 0 }
    setInterval(() => {
      this.setState({
        number: this.state.number + 1
      })
    }, 1000)
  }

  render() {
    return (
      <div>
        <div style={{ 
          fontSize: '36px',
          color: 'red'
        }}>SmallHeader</div>
        { this.state.number }
      </div>
    )
  }
}

Dilithium.render(<App />, document.getElementById('root'))
