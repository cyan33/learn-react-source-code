class Component {
  constructor(props) {
    if (!this.render) {
      throw Error('a component class must at least have a render method')
    }
    this.props = props;
  }

  mountComponent() {
    let renderedElement = this.render();

    let renderedComponent = new renderedElement.type();

    return renderedComponent.mountComponent();
  }
}