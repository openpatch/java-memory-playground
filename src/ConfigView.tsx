import { shallow } from "zustand/shallow";
import useStore, { RFState } from "./store";
import { useCallback, useState } from "react";
import { DataType } from "./memory";

const selector = (state: RFState) => ({
  updateMemory: state.updateMemory,
  memory: state.memory,
  setRoute: state.setRoute,
});

export const ConfigView = () => {
  const { memory, updateMemory, setRoute } = useStore(selector, shallow);

  const [klasses, setKlasses] = useState(memory.klasses);
  const [options, setOptions] = useState(memory.options);

  const onSave = useCallback(() => {
    updateMemory({
      ...memory,
      klasses,
      options,
    });
  }, [memory, klasses, options, updateMemory]);

  const onView = useCallback(() => {
    setRoute("view");
  }, [setRoute]);

  const onEdit = useCallback(() => {
    setRoute("edit");
  }, [setRoute]);

  const handleOptionChange = useCallback(
    (key: string, value: boolean) => {
      setOptions((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleAddKlass = useCallback(() => {
    const name = window.prompt("Enter class name:");
    if (name && name.trim()) {
      setKlasses((prev) => ({
        ...prev,
        [name.trim()]: {
          attributes: {},
        },
      }));
    }
  }, []);

  const handleRemoveKlass = useCallback((name: string) => {
    if (window.confirm(`Are you sure you want to delete class "${name}"?`)) {
      setKlasses((prev) => {
        const newKlasses = { ...prev };
        delete newKlasses[name];
        return newKlasses;
      });
    }
  }, []);

  const handleAddAttribute = useCallback((klassName: string) => {
    const attrName = window.prompt("Enter attribute name:");
    if (attrName && attrName.trim()) {
      const dataType = window.prompt(
        `Enter data type for "${attrName}" (e.g., String, int, boolean, or custom class name):`
      );
      if (dataType && dataType.trim()) {
        setKlasses((prev) => ({
          ...prev,
          [klassName]: {
            ...prev[klassName],
            attributes: {
              ...prev[klassName].attributes,
              [attrName.trim()]: dataType.trim() as DataType,
            },
          },
        }));
      }
    }
  }, []);

  const handleRemoveAttribute = useCallback(
    (klassName: string, attrName: string) => {
      if (
        window.confirm(
          `Are you sure you want to delete attribute "${attrName}" from class "${klassName}"?`
        )
      ) {
        setKlasses((prev) => {
          const newKlasses = { ...prev };
          const newAttributes = { ...newKlasses[klassName].attributes };
          delete newAttributes[attrName];
          newKlasses[klassName] = {
            ...newKlasses[klassName],
            attributes: newAttributes,
          };
          return newKlasses;
        });
      }
    },
    []
  );

  const handleEditAttribute = useCallback(
    (klassName: string, attrName: string, currentDataType: DataType) => {
      const newDataType = window.prompt(
        `Edit data type for "${attrName}" (current: ${currentDataType}):`,
        currentDataType
      );
      if (newDataType && newDataType.trim()) {
        setKlasses((prev) => ({
          ...prev,
          [klassName]: {
            ...prev[klassName],
            attributes: {
              ...prev[klassName].attributes,
              [attrName]: newDataType.trim() as DataType,
            },
          },
        }));
      }
    },
    []
  );

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Configuration</h1>

      <div className="button-group">
        <button onClick={onSave}>Save</button>
        <button onClick={onView}>View</button>
        <button onClick={onEdit}>Edit JSON</button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h2>Options</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.disableGarbageCollector || false}
              onChange={(e) =>
                handleOptionChange("disableGarbageCollector", e.target.checked)
              }
            />
            Disable Garbage Collector
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.hideSidebar || false}
              onChange={(e) => handleOptionChange("hideSidebar", e.target.checked)}
            />
            Hide Sidebar
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.hideCallMethod || false}
              onChange={(e) =>
                handleOptionChange("hideCallMethod", e.target.checked)
              }
            />
            Hide Call Method
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.hideDeclareGlobalVariable || false}
              onChange={(e) =>
                handleOptionChange("hideDeclareGlobalVariable", e.target.checked)
              }
            />
            Hide Declare Global Variable
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.hideNewArray || false}
              onChange={(e) =>
                handleOptionChange("hideNewArray", e.target.checked)
              }
            />
            Hide New Array
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={options.createNewOnEdgeDrop || false}
              onChange={(e) =>
                handleOptionChange("createNewOnEdgeDrop", e.target.checked)
              }
            />
            Create New On Edge Drop
          </label>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "10px",
          }}
        >
          <h2>Classes</h2>
          <button onClick={handleAddKlass}>Add Class</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {Object.entries(klasses).map(([klassName, klass]) => (
            <div
              key={klassName}
              style={{
                border: "2px solid #ccc",
                borderRadius: "8px",
                padding: "15px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <h3 style={{ margin: 0 }}>{klassName}</h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={() => handleAddAttribute(klassName)}>
                    Add Attribute
                  </button>
                  <button onClick={() => handleRemoveKlass(klassName)}>
                    Delete Class
                  </button>
                </div>
              </div>

              <div>
                {Object.keys(klass.attributes).length === 0 ? (
                  <p style={{ color: "#666", fontStyle: "italic" }}>
                    No attributes defined
                  </p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      backgroundColor: "white",
                    }}
                  >
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Attribute Name
                        </th>
                        <th style={{ padding: "8px", textAlign: "left" }}>
                          Data Type
                        </th>
                        <th style={{ padding: "8px", textAlign: "right" }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(klass.attributes).map(
                        ([attrName, dataType]) => (
                          <tr
                            key={attrName}
                            style={{ borderBottom: "1px solid #eee" }}
                          >
                            <td style={{ padding: "8px" }}>{attrName}</td>
                            <td style={{ padding: "8px" }}>{dataType}</td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "right",
                              }}
                            >
                              <button
                                onClick={() =>
                                  handleEditAttribute(
                                    klassName,
                                    attrName,
                                    dataType
                                  )
                                }
                                style={{ marginRight: "8px" }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAttribute(klassName, attrName)
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
