import React from "react";

import "./BrowsingContextList.css";

class BrowsingContextList extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      contexts: [],
    };
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
      <div className={`BrowsingContextList ${this.props.className || ""}`}>
        {this.renderList(contextInfoList, true)}
      </div>
    );
  }
}

export default BrowsingContextList;
