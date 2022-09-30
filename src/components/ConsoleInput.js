import React from "react";
import { minimalSetup } from "codemirror";
import { closeBrackets } from "@codemirror/autocomplete";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, EditorSelection } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";

import "./ConsoleInput.css";
import BrowsingContextPicker from "./BrowsingContextPicker";

class ConsoleInput extends React.Component {
  #codeMirrorEditor;
  #container;

  constructor(props) {
    super(props);

    this.state = {};
    this.#container = React.createRef();
  }

  componentDidMount() {
    if (this.#codeMirrorEditor) {
      return;
    }

    const { props } = this;
    let state = EditorState.create({
      extensions: [
        javascript(),
        keymap.of({
          key: "Enter",
          run(cm) {
            const value = cm.state.doc.toString();
            props.onSubmit(value);

            cm.dispatch({
              selection: EditorSelection.create([
                EditorSelection.range(0, value.length),
              ]),
            });

            return true;
          },
        }),
        closeBrackets(),
        minimalSetup,
      ],
    });

    this.#codeMirrorEditor = new EditorView({
      state,
      parent: this.#container.current,
    });

    this.#codeMirrorEditor.focus();
  }

  render() {
    const {
      browsingContexts,
      evaluationBrowsingContextId,
      setSelectedBrowsingContext,
    } = this.props;
    return (
      <footer className="jsterm-input-container" ref={this.#container}>
        <div className="webconsole-input-buttons">
          <BrowsingContextPicker
            buttonClassName="webconsole-evaluation-selector-button_input"
            buttonTitle="Select a browsing context to evaluate javascript"
            listClassName="BrowsingContextList_input"
            contexts={browsingContexts}
            selectedId={evaluationBrowsingContextId}
            setSelectedBrowsingContext={setSelectedBrowsingContext}
          />
        </div>
      </footer>
    );
  }
}

export default ConsoleInput;
