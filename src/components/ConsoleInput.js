import React from "react";
import { minimalSetup } from "codemirror";
import { closeBrackets } from "@codemirror/autocomplete";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";

import "./ConsoleInput.css";
import BrowsingContextPicker from "./BrowsingContextPicker";

const HISTORY_BACK = Symbol();
const HISTORY_NEXT = Symbol();
const LS_HISTORY_KEY = "console-input-history";

class ConsoleInput extends React.Component {
  #codeMirrorEditor;
  #container;

  constructor(props) {
    super(props);

    // Load console input history
    let history;
    try {
      history = JSON.parse(localStorage.getItem(LS_HISTORY_KEY));
    } catch (e) {}

    if (!Array.isArray(history)) {
      history = [];
    }
    this.state = {
      currentHistoryPosition: null,
      history,
    };
    this.#container = React.createRef();
  }

  componentDidMount() {
    if (this.#codeMirrorEditor) {
      return;
    }

    const { props } = this;
    const self = this;

    let state = EditorState.create({
      extensions: [
        javascript(),
        keymap.of([
          {
            key: "Enter",
            run(cm) {
              const value = cm.state.doc.toString();
              props.onSubmit(value);

              self.setState((state) => {
                // XXX: We might want to have a limit for the number of item in the history
                const newHistory = [
                  ...state.history,
                  {
                    timestamp: Date.now(),
                    expression: value,
                  },
                ];

                // XXX: Maybe use indexedDB instead so it's not synchronous
                localStorage.setItem(
                  LS_HISTORY_KEY,
                  JSON.stringify(newHistory)
                );

                return {
                  currentHistoryPosition: state.history.length + 1,
                  history: newHistory,
                };
              });

              cm.dispatch({
                changes: {
                  from: 0,
                  to: cm.state.doc.length,
                },
              });

              return true;
            },
          },
          {
            key: "ArrowUp",
            run(cm) {
              if (!self.state.history?.length || !self.canCaretGoPrevious()) {
                return false;
              }

              self.historyPeruse(cm, HISTORY_BACK);
              return true;
            },
          },
          {
            key: "ArrowDown",
            run(cm) {
              if (!self.state.history?.length || !self.canCaretGoNext()) {
                return false;
              }

              self.historyPeruse(cm, HISTORY_NEXT);
              return true;
            },
          },
        ]),
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

  shouldComponentUpdate() {
    // Don't re-render once we have the editor created as we don't
    // want React to interact with CodeMirror.
    return !this.#codeMirrorEditor;
  }

  /**
   * Check if the caret is at a location that allows selecting the previous item
   * in history when the user presses the Up arrow key.
   *
   * @return boolean
   *         True if the caret is at a location that allows selecting the
   *         previous item in history when the user presses the Up arrow key,
   *         otherwise false.
   */
  canCaretGoPrevious() {
    const inputValue = this.#codeMirrorEditor.state.doc.toString();
    const { main } = this.#codeMirrorEditor.state.selection;
    return main.from === 0 || main.from === inputValue.length;
  }

  /**
   * Check if the caret is at a location that allows selecting the next item in
   * history when the user presses the Down arrow key.
   *
   * @return boolean
   *         True if the caret is at a location that allows selecting the next
   *         item in history when the user presses the Down arrow key, otherwise
   *         false.
   */
  canCaretGoNext() {
    const inputValue = this.#codeMirrorEditor.state.doc.toString();
    const multiline = /[\r\n]/.test(inputValue);

    const { main } = this.#codeMirrorEditor.state.selection;
    return (!multiline && main.from === 0) || main.from === inputValue.length;
  }

  historyPeruse(cm, direction) {
    if (direction !== HISTORY_BACK && direction !== HISTORY_NEXT) {
      console.error("Unknown", direction, "direction");
      return;
    }

    this.setState((state) => {
      let newPosition =
        direction === HISTORY_BACK
          ? state.currentHistoryPosition - 1
          : state.currentHistoryPosition + 1;

      if (direction === HISTORY_BACK && newPosition < 0) {
        newPosition = state.history.length - 1;
      } else if (
        direction === HISTORY_NEXT &&
        newPosition >= state.history.length
      ) {
        newPosition = 0;
      }

      const historyEntry = state.history.at(newPosition);

      cm.dispatch({
        changes: {
          from: 0,
          to: cm.state.doc.length,
          insert: historyEntry.expression,
        },
      });

      return {
        currentHistoryPosition: newPosition,
      };
    });
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
