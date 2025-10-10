import { shallow } from "zustand/shallow";
import useStore, { RFState } from "./store";
import { useCallback, useState } from "react";
import { DataType, primitveDataTypes } from "./memory";

const selector = (state: RFState) => ({
  updateMemory: state.updateMemory,
  memory: state.memory,
  setRoute: state.setRoute,
});

export const ConfigView = () => {
  const { memory, updateMemory, setRoute } = useStore(selector, shallow);

  const [klasses, setKlasses] = useState(memory.klasses);
  const [options, setOptions] = useState(memory.options);
  const [addingAttribute, setAddingAttribute] = useState<string | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<{
    klassName: string;
    attrName: string;
    currentDataType: DataType;
  } | null>(null);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<DataType>("String");

  // Get available data types: primitives + Array + defined classes
  const availableDataTypes = [
    ...primitveDataTypes,
    "Array",
    ...Object.keys(klasses),
  ];

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
    setAddingAttribute(klassName);
    setNewAttrName("");
    setNewAttrType("String");
  }, []);

  const handleConfirmAddAttribute = useCallback(() => {
    if (addingAttribute && newAttrName.trim()) {
      setKlasses((prev) => ({
        ...prev,
        [addingAttribute]: {
          ...prev[addingAttribute],
          attributes: {
            ...prev[addingAttribute].attributes,
            [newAttrName.trim()]: newAttrType,
          },
        },
      }));
      setAddingAttribute(null);
      setNewAttrName("");
      setNewAttrType("String");
    }
  }, [addingAttribute, newAttrName, newAttrType]);

  const handleCancelAddAttribute = useCallback(() => {
    setAddingAttribute(null);
    setNewAttrName("");
    setNewAttrType("String");
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
      setEditingAttribute({ klassName, attrName, currentDataType });
      setNewAttrType(currentDataType);
    },
    []
  );

  const handleConfirmEditAttribute = useCallback(() => {
    if (editingAttribute) {
      setKlasses((prev) => ({
        ...prev,
        [editingAttribute.klassName]: {
          ...prev[editingAttribute.klassName],
          attributes: {
            ...prev[editingAttribute.klassName].attributes,
            [editingAttribute.attrName]: newAttrType,
          },
        },
      }));
      setEditingAttribute(null);
      setNewAttrType("String");
    }
  }, [editingAttribute, newAttrType]);

  const handleCancelEditAttribute = useCallback(() => {
    setEditingAttribute(null);
    setNewAttrType("String");
  }, []);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Configuration</h1>

      <div className="button-group">
        <button onClick={onSave}>Save</button>
        <button onClick={onView}>View</button>
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

      {/* Add Attribute Modal */}
      {addingAttribute && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCancelAddAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Add Attribute to {addingAttribute}</h3>
            <div style={{ marginTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Attribute Name:
              </label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                placeholder="Enter attribute name"
                autoFocus
              />
            </div>
            <div style={{ marginTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Data Type:
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                {availableDataTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="button-group"
              style={{ marginTop: "20px", display: "flex", gap: "8px" }}
            >
              <button onClick={handleConfirmAddAttribute}>Add</button>
              <button onClick={handleCancelAddAttribute}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Attribute Modal */}
      {editingAttribute && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCancelEditAttribute}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "8px",
              minWidth: "400px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              Edit Attribute: {editingAttribute.attrName}
            </h3>
            <div style={{ marginTop: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Data Type:
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                {availableDataTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div
              className="button-group"
              style={{ marginTop: "20px", display: "flex", gap: "8px" }}
            >
              <button onClick={handleConfirmEditAttribute}>Save</button>
              <button onClick={handleCancelEditAttribute}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
