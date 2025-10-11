import "./App.css"
import '@xyflow/react/dist/style.css';
import useStore, { RFState } from './store';
import { shallow } from 'zustand/shallow';
import { MemoryView } from "./MemoryView";
import { ConfigView } from "./ConfigView";
import { ReactFlowProvider } from "@xyflow/react";
import { DnDProvider } from "./useDnD";

const selector = (state: RFState) => ({
  route: state.route
})

function App() {
  const { route } = useStore(
    selector,
    shallow
  );

  return (
    <ReactFlowProvider>
      <DnDProvider>
        <div style={{ height: "100dvh" }}>
          {route === "view" &&
            <MemoryView />}
          {route === "config" && <ConfigView />}
        </div>
      </DnDProvider>
    </ReactFlowProvider>
  );

}

export default App;
