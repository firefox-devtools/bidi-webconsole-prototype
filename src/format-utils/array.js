import { formatConsoleOutput } from "./index";

const MODE = {
  TINY: Symbol("TINY"),
};

export function formatArray(object, mode) {
  let brackets;
  let items;
  const needSpace = function (space) {
    return space ? { left: "[ ", right: " ]" } : { left: "[", right: "]" };
  };

  if (mode === MODE.TINY) {
    const isEmpty = object.length === 0;
    if (isEmpty) {
      items = [];
    } else {
      items = ["…"];
    }
    brackets = needSpace(false);
  } else {
    items = arrayIterator(object, 10);
    brackets = needSpace(!!items.length);
  }
  return [brackets.left, ...items, brackets.right].join("");
}

function arrayIterator(array, max) {
  const items = [];

  for (let i = 0; i < array.length && i < max; i++) {
    let item;
    try {
      item =
        array[i].type === "array"
          ? formatArray(array[i], MODE.TINY)
          : formatConsoleOutput(array[i]);
    } catch (exc) {
      item = formatConsoleOutput(exc);
    }

    item += i === array.length - 1 ? "" : ", ";
    items.push(item);
  }

  if (array.length > max) {
    items.push("…");
  }

  return items;
}

export function addArrayLength(arrayLength) {
  return arrayLength > 2 ? `(${arrayLength})` : "";
}
