import { createElement, render, Component } from './toy-react'

class MyComponent extends Component {
  constructor () {
    super()
    this.state = {
      a: 1,
      b: 2
    }
  }
  render () {
    return <div>
      <h1>my component</h1>
      <span>a: {this.state.a.toString()} b: {this.state.b.toString()}</span>
      <button onclick={() => {this.state.a++; this.rerender()}}>add</button>
      <button onclick={() => {this.setState({a: this.state.a + 1})}}>add</button>
      {this.children}
    </div>
  }
}

render(<MyComponent id="a" class="c">
    <div>abc</div>
    <div></div>
    <div></div>
  </MyComponent>
, document.getElementById('root'))