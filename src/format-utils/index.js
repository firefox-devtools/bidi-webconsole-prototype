import { addArrayLength, formatArray } from "./array";

export const formatConsoleOutput = (remoteValue) => {
  const { type, value } = remoteValue;
  let formattedValue = "";

  switch (type) {
    case "undefined":
    case "null":
      formattedValue = type;
      break;
    case "string":
      formattedValue = value;
      break;
    case "number":
    case "boolean":
      formattedValue = value.toString();
      break;
    case "bigint":
      // eslint-disable-next-line no-undef
      formattedValue = `${BigInt(value).toString()}n`;
      break;
    case "array":
      formattedValue = `Array${addArrayLength(value.length)} ${formatArray(
        value
      )}`;
      break;
    case "date":
      formattedValue = `Date ${new Date(value).toString()}`;
      break;
    case "map":
      formattedValue = `Map {...}`;
      break;
    case "object":
      formattedValue = `Object {...}`;
      break;
    case "regexp":
      formattedValue = `/${value.pattern}/${value.flags}`;
      break;
    case "set":
      formattedValue = `Set${addArrayLength(value.length)} ${formatArray(
        value
      )}`;
      break;
    case "function":
      formattedValue = `function ()`;
      break;
    case "arraybuffer":
      formattedValue = `ArrayBuffer`;
      break;
    case "weakmap":
      formattedValue = `WeakMap`;
      break;
    case "weakset":
      formattedValue = `WeakSet`;
      break;
    case "typedarray":
      formattedValue = `TypedArray`;
      break;
    default:
      formattedValue = type[0].toUpperCase() + type.substring(1);
  }

  return formattedValue;
};
