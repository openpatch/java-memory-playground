import "./App.css"
import 'reactflow/dist/style.css';
import useStore, { RFState } from './store';
import { shallow } from 'zustand/shallow';
import { MemoryView } from "./MemoryView";
import { EditView } from "./EditView";

const selector = (state: RFState) => ({
  route: state.route
})

function App() {
  const { route } = useStore(
    selector,
    shallow
  );

  return (
    <div style={{ width: "100dvw", height: "100dvh" }}>
      {route === "view" &&
      <MemoryView />}
      {route === "edit" && <EditView />}
    </div>
  );
}

export default App;
