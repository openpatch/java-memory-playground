import CodeMirror from "@uiw/react-codemirror";
import { langs } from "@uiw/codemirror-extensions-langs";
import { shallow } from "zustand/shallow";
import useStore, { RFState } from "./store";
import { useCallback, useState } from "react";
import { jsonSchema } from "codemirror-json-schema";

import memorySchema from "../schemas/memory.schema.json";

const selector = (state: RFState) => ({
  updateMemory: state.updateMemory,
  memory: state.memory,
  setRoute: state.setRoute,
});

export const EditView = () => {
  const { memory, updateMemory, setRoute } = useStore(selector, shallow);

  const [data, setData] = useState(JSON.stringify(memory, null, 2));

  const onChange = useCallback((value: string) => {
    setData(value);
  }, []);

  const onSave = useCallback(() => {
    updateMemory(JSON.parse(data));
  }, [data]);

  const onView = useCallback(() => {
    setRoute("view");
  }, []);

  return (
    <div>
      <CodeMirror
        height="90vh"
        value={data}
        onChange={onChange}
        extensions={[langs.json(), jsonSchema(memorySchema as any)]}
      />
      <div className="button-group">
        <button onClick={onSave}>Save</button>
        <button onClick={onView}>View</button>
      </div>
    </div>
  );
};
