# Java Memory Playground

A visual playground for understanding the internals of the stack and heap in Java applications. Create interactive diagrams to visualize objects, references, variables, and method calls.

## For Users

### Using the Playground

Visit **[jmp.openpatch.org](https://jmp.openpatch.org)** to start using the Java Memory Playground in your browser.

### Features

- **Visual Memory Modeling**: Create and visualize Java objects, variables, and method calls
- **Stack and Heap Visualization**: See how the stack (method calls and local variables) and heap (objects) interact
- **References**: Connect variables to objects with visual reference arrows
- **Class Definitions**: Define custom classes with attributes
- **Garbage Collection**: Simulate garbage collection to see which objects would be removed

### Saving and Sharing

When you click the **"Save (URL)"** button, your current project state is saved directly to the URL. This means:

- **Persistence**: The URL contains all your work - no account needed
- **Sharing**: Copy and share the URL with others to share your memory diagram
- **Reloading**: Bookmark or save the URL to return to your project later

The URL uses compressed encoding to efficiently store your entire project state in the browser's address bar.

### Teaching Use Case

For educators, the Java Memory Playground is perfect for teaching memory concepts:

1. **Prepare**: Create a memory diagram showing a specific concept (linked lists, object references, method call stack, etc.)
2. **Save**: Click "Save (URL)" to encode your diagram in the URL
3. **Share**: Copy the URL and share it with your students via email, LMS, or messaging
4. **Learn**: Students can open the URL to see your exact diagram, explore it, and modify it for learning

No setup or installation required for students - they just open the link and start learning!

## For Developers

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

Clone the repository and install dependencies:

```sh
git clone https://github.com/openpatch/java-memory-playground.git
cd java-memory-playground
npm install
```

### Development

Start the development server with hot reload:

```sh
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Building

Build the project for production:

```sh
npm run build
```

The build output will be in the `dist` directory.

### Testing

Run the test suite:

```sh
npm test
```

### Project Structure

- `src/` - Source code
  - `MemoryView.tsx` - Main canvas for creating memory diagrams
  - `ConfigView.tsx` - Configuration view for defining classes and options
  - `store.ts` - State management with URL persistence
  - `serde.ts` - Serialization/deserialization for URL encoding
  - `memory.ts` - Type definitions for memory objects
- `public/` - Static assets
- `dist/` - Build output (generated)

### Technologies

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **@xyflow/react** - Flow diagram rendering
- **Zustand** - State management
- **Pako** - Compression for URL encoding

## License

MIT
