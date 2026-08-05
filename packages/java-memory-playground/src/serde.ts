import { fromUint8Array, toUint8Array } from "js-base64";
import { inflate, deflate } from "pako";

type State = any;

const pakoSerde = {
  serialize: (state: string): string => {
    const data = new TextEncoder().encode(state);
    const compressed = deflate(data, { level: 9 });
    return fromUint8Array(compressed, true);
  },
  deserialize: (state: string): string => {
    const data = toUint8Array(state);
    return inflate(data, { to: "string" });
  },
};

export const serializeState = (state: State) => {
  const json = JSON.stringify(state);
  const serialized = pakoSerde.serialize(json);
  return `pako:${serialized}`;
};

export const deserializeState = (state: string): State => {
  let serialized;
  if (state.includes(":")) {
    let tempType;
    [tempType, serialized] = state.split(":");
    if (tempType !== "pako") {
      throw new Error(`Unknown serde type: ${tempType}`);
    }
  }
  if (serialized) {
    const json = pakoSerde.deserialize(serialized);
    return JSON.parse(json);
  }
  return {};
};
