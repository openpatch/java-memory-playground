import {
  MemoryPlayground,
  MemoryPlaygroundEditor,
} from "@openpatch/java-memory-playground";

/**
 * Whether this is the teacher's playground.
 *
 * The diagram itself lives in the hash, so the mode is kept out of it. Both a
 * path and a query flag work, because the app is served statically and only the
 * query flag survives without a rewrite rule.
 */
const isEditor = () => {
  const { pathname, search } = window.location;
  return (
    pathname.replace(/\/+$/, "").endsWith("/edit") ||
    new URLSearchParams(search).has("edit")
  );
};

function App() {
  const Playground = isEditor() ? MemoryPlaygroundEditor : MemoryPlayground;

  return (
    <div style={{ height: "100dvh" }}>
      <Playground />
    </div>
  );
}

export default App;
