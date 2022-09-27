import React from "react";
import { minimalSetup } from "codemirror";
import { closeBrackets } from "@codemirror/autocomplete";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState, EditorSelection } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";

import "./ConsoleInput.css";

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
    return (
      <footer className="jsterm-input-container" ref={this.#container}></footer>
    );
  }
}

export default ConsoleInput;
