import React from "react";

import "./BrowsingContextList.css";

class BrowsingContextList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contexts: [],
      style: {},
    };

    this.ref = React.createRef();
  }

  componentDidUpdate(props) {
    // When the component get visible, check if it doesn't fit at the bottom of the button
    // if not set the styles for the position above the button
    if (!props.isVisible && this.props.isVisible) {
      const menuHeight = this.ref.current?.getBoundingClientRect().height || 0;
      const menuPosition =
        this.ref.current?.parentElement.getBoundingClientRect().top || 0;
      const inputHeight = 21;

      if (window.innerHeight - menuPosition - inputHeight < menuHeight) {
        this.setState({
          style: {
            bottom: `${window.innerHeight - menuPosition}px`,
          },
        });
      }
    }
  }

  exctractContextInfo = (context) => {
    return {
      id: context.context,
      children: context.children.map(this.exctractContextInfo),
      url: context.url,
    };
  };

  renderList = (contexts, isTopLevel) => {
    return (
      <ul>
        {contexts.map((context) => (
          <li
            key={context.id || context.url}
            className={`${
              this.props.selectedId === context.id
                ? "BrowsingContextEl_selected"
                : ""
            }${isTopLevel ? " BrowsingContextEl_top" : ""}`}
          >
            <button
              className="BrowsingContext"
              onClick={(event) => {
                event.stopPropagation();
                this.props.setSelectedContext(context.id, context.url);
                this.props.close();
              }}
              title={context.url}
            >
              {context.url}
            </button>
            {this.renderList(context.children)}
          </li>
        ))}
      </ul>
    );
  };

  render() {
    if (!this.props.isVisible) {
      return null;
    }
    const contextInfoList = this.props.contexts.map(this.exctractContextInfo);
    return (
      <div
        className={`BrowsingContextList ${this.props.className || ""}`}
        ref={this.ref}
        style={this.state.style}
      >
        {this.renderList(contextInfoList, true)}
      </div>
    );
  }
}

export default BrowsingContextList;
