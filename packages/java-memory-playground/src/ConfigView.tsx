import { useShallow } from "zustand/shallow";
import useStore from "./storeContext";
import { RFState } from "./store";
import { useCallback, useState, useEffect } from "react";
import { DataType, builtInDataTypes } from "./memory";
import { SimpleInputDialog } from "./SimpleInputDialog";
import { optionPresets } from "./presets";
import { ClassSource } from "./ClassSource";
import { ConfirmDialog } from "./ConfirmDialog";
import { hasImpact, klassImpact, KlassImpact } from "./klassImpact";

const selector = (state: RFState) => ({
  storedKlasses: state.klasses,
  storedOptions: state.options,
  steps: state.steps,
  applyKlasses: state.applyKlasses,
  setRoute: state.setRoute,
  t: state.getTranslations(),
});

/** How many consequences are worth listing before the rest are a number. */
const MAX_LISTED = 8;

export const ConfigView = () => {
  const {
    storedKlasses,
    storedOptions,
    steps,
    applyKlasses,
    setRoute,
    t,
  } = useStore(useShallow(selector));

  const [klasses, setKlasses] = useState(storedKlasses);
  const [options, setOptions] = useState(storedOptions);
  const [addingAttribute, setAddingAttribute] = useState<string | null>(null);
  const [editingAttribute, setEditingAttribute] = useState<{
    klassName: string;
    attrName: string;
    currentDataType: DataType;
  } | null>(null);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrType, setNewAttrType] = useState<DataType>("String");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showAddClassDialog, setShowAddClassDialog] = useState(false);
  // Source first: a teacher usually has the classes written down already.
  const [classTab, setClassTab] = useState<"source" | "list">("source");
  const [pendingImpact, setPendingImpact] = useState<KlassImpact | null>(null);

  // Get available data types: primitives + Array + defined classes
  const availableDataTypes = [
    ...builtInDataTypes,
    "Array",
    ...Object.keys(klasses),
  ];

  // Track changes
  useEffect(() => {
    const klassesChanged = JSON.stringify(klasses) !== JSON.stringify(storedKlasses);
    const optionsChanged = JSON.stringify(options) !== JSON.stringify(storedOptions);
    setHasUnsavedChanges(klassesChanged || optionsChanged);
  }, [klasses, options, storedKlasses, storedOptions]);

  const commit = useCallback(() => {
    // Class definitions belong to the whole diagram, so the store reconciles
    // every step's objects rather than only the one on screen.
    applyKlasses(klasses, options);
    setPendingImpact(null);
    setHasUnsavedChanges(false);
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 2000);
  }, [applyKlasses, klasses, options]);

  const onSave = useCallback(() => {
    // Only ask when there is something to lose — pasting a whole file over the
    // old classes can quietly delete what the objects were holding, but adding
    // a field cannot, and a dialog that always appears is one nobody reads.
    const impact = klassImpact(steps, klasses);
    if (hasImpact(impact)) {
      setPendingImpact(impact);
      return;
    }
    commit();
  }, [commit, klasses, steps]);

  const onView = useCallback(() => {
    if (hasUnsavedChanges) {
      if (window.confirm(t.unsavedChangesLeave)) {
        setRoute("view");
      }
    } else {
      setRoute("view");
    }
  }, [setRoute, hasUnsavedChanges]);

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
    setShowAddClassDialog(true);
  }, []);

  const handleAddKlassConfirm = useCallback((name: string) => {
    setKlasses((prev) => ({
      ...prev,
      [name]: {
        attributes: {},
      },
    }));
    setShowAddClassDialog(false);
  }, []);

  const handleRemoveKlass = useCallback((name: string) => {
    if (window.confirm(t.confirmDeleteClass(name))) {
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
    <div style={{
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
    }}>
      <div style={{
        backgroundColor: "var(--jmp-surface)",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid var(--jmp-border)",
        marginBottom: "16px"
      }}>
        <h1 style={{
          margin: "0 0 16px 0",
          color: "var(--jmp-text)",
          fontSize: "24px",
          fontWeight: "600"
        }}>{t.configuration}</h1>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            onClick={onSave}
            style={{
              // The one primary action on the page, so it gets the one accent.
              backgroundColor: hasUnsavedChanges
                ? "var(--jmp-accent)"
                : "var(--jmp-text-faint)",
              color: "var(--jmp-surface)",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >{hasUnsavedChanges ? t.save : t.saved}</button>
          <button
            onClick={onView}
            style={{
              backgroundColor: "var(--jmp-surface)",
              color: "var(--jmp-text)",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: "500",
              border: "1px solid var(--jmp-border)",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >{t.backToDiagram}</button>
          {showSaveSuccess && (
            <span style={{
              color: "var(--jmp-success)",
              fontSize: "14px",
              fontWeight: "500"
            }}>
              ✓ Changes saved successfully
            </span>
          )}
        </div>
      </div>

      <div style={{
        backgroundColor: "var(--jmp-surface)",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid var(--jmp-border)",
        marginBottom: "16px"
      }}>
        <h2 style={{
          margin: "0 0 16px 0",
          color: "var(--jmp-text)",
          fontSize: "18px",
          fontWeight: "600"
        }}>{t.options}</h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
          <span style={{ fontSize: "14px", color: "var(--jmp-text-muted)" }}>{t.presets}:</span>
          {(
            [
              ["references", t.presetReferences],
              ["stack", t.presetStack],
              ["everything", t.presetEverything],
            ] as const
          ).map(([name, label]) => (
            <button key={name} onClick={() => setOptions({ ...optionPresets[name] })}>
              {label}
            </button>
          ))}
        </div>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "12px"
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.disableGarbageCollector || false}
              onChange={(e) =>
                handleOptionChange("disableGarbageCollector", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.disableGarbageCollector}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideSidebar || false}
              onChange={(e) => handleOptionChange("hideSidebar", e.target.checked)}
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideSidebar}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideCallMethod || false}
              onChange={(e) =>
                handleOptionChange("hideCallMethod", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideCallMethod}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideDeclareGlobalVariable || false}
              onChange={(e) =>
                handleOptionChange("hideDeclareGlobalVariable", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideDeclareGlobalVariable}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideNewArray || false}
              onChange={(e) =>
                handleOptionChange("hideNewArray", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideNewArray}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.createNewOnEdgeDrop || false}
              onChange={(e) =>
                handleOptionChange("createNewOnEdgeDrop", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.createNewOnEdgeDrop}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.inlineStrings ?? true}
              onChange={(e) =>
                handleOptionChange("inlineStrings", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.inlineStrings}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.hideStepChanges || false}
              onChange={(e) =>
                handleOptionChange("hideStepChanges", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.hideStepChanges}
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            color: "var(--jmp-text-muted)",
            cursor: "pointer"
          }}>
            <input
              type="checkbox"
              checked={options.gcPrediction || false}
              onChange={(e) =>
                handleOptionChange("gcPrediction", e.target.checked)
              }
              style={{
                width: "16px",
                height: "16px",
                cursor: "pointer"
              }}
            />
            {t.optionLabels.gcPrediction}
          </label>
        </div>
      </div>

      <div style={{
        backgroundColor: "var(--jmp-surface)",
        borderRadius: "8px",
        padding: "24px",
        border: "1px solid var(--jmp-border)"
      }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h2 style={{
              margin: "0",
              color: "var(--jmp-text)",
              fontSize: "18px",
              fontWeight: "600"
            }}>{t.classes}</h2>
            <div style={{ display: "flex", gap: "4px" }}>
              {(
                [
                  ["source", t.classSource],
                  ["list", t.classList],
                ] as const
              ).map(([name, label]) => (
                <button
                  key={name}
                  onClick={() => setClassTab(name)}
                  aria-pressed={classTab === name}
                  style={{
                    backgroundColor: classTab === name ? "var(--jmp-text)" : "var(--jmp-surface)",
                    color: classTab === name ? "var(--jmp-surface)" : "var(--jmp-text-muted)",
                    padding: "6px 12px",
                    fontSize: "13px",
                    fontWeight: "500",
                    border: "1px solid var(--jmp-border)",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {classTab === "list" && (
            <button
              onClick={handleAddKlass}
              style={{
                backgroundColor: "var(--jmp-text)",
                color: "var(--jmp-surface)",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: "500",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >{t.addClass}</button>
          )}
        </div>

        {classTab === "source" && (
          <ClassSource klasses={klasses} onChange={setKlasses} t={t} />
        )}

        <div style={{
          display: classTab === "list" ? "flex" : "none",
          flexDirection: "column",
          gap: "16px",
        }}>
          {Object.entries(klasses).map(([klassName, klass]) => (
            <div
              key={klassName}
              style={{
                border: "1px solid var(--jmp-border)",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "var(--jmp-surface-sunken)"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingBottom: "12px",
                  borderBottom: "1px solid var(--jmp-border)"
                }}
              >
                <h3 style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "var(--jmp-text)"
                }}>
                  {klassName}
                </h3>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleAddAttribute(klassName)}
                    style={{
                      backgroundColor: "var(--jmp-surface)",
                      color: "var(--jmp-text)",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "500",
                      border: "1px solid var(--jmp-border)",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Add Attribute
                  </button>
                  <button
                    onClick={() => handleRemoveKlass(klassName)}
                    style={{
                      backgroundColor: "var(--jmp-surface)",
                      color: "var(--jmp-danger)",
                      padding: "6px 12px",
                      fontSize: "13px",
                      fontWeight: "500",
                      border: "1px solid var(--jmp-danger-soft)",
                      borderRadius: "6px",
                      cursor: "pointer"
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div>
                {Object.keys(klass.attributes).length === 0 ? (
                  <p style={{
                    color: "var(--jmp-text-muted)",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "16px",
                    margin: 0,
                    fontSize: "14px"
                  }}>
                    No attributes defined
                  </p>
                ) : (
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      backgroundColor: "var(--jmp-surface)",
                      borderRadius: "6px",
                      overflow: "hidden",
                      border: "1px solid var(--jmp-border)"
                    }}
                  >
                    <thead>
                      <tr style={{
                        backgroundColor: "var(--jmp-surface-sunken)",
                        borderBottom: "1px solid var(--jmp-border)"
                      }}>
                        <th style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "var(--jmp-text-muted)",
                          fontSize: "13px"
                        }}>
                          {t.attributeName}
                        </th>
                        <th style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: "var(--jmp-text-muted)",
                          fontSize: "13px"
                        }}>
                          {t.dataType}
                        </th>
                        <th style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: "var(--jmp-text-muted)",
                          fontSize: "13px"
                        }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(klass.attributes).map(
                        ([attrName, dataType]) => (
                          <tr
                            key={attrName}
                            style={{
                              borderBottom: "1px solid var(--jmp-border)"
                            }}
                          >
                            <td style={{
                              padding: "10px 12px",
                              color: "var(--jmp-text)",
                              fontSize: "14px"
                            }}>{attrName}</td>
                            <td style={{
                              padding: "10px 12px",
                              color: "var(--jmp-text-muted)",
                              fontSize: "14px"
                            }}>{dataType}</td>
                            <td
                              style={{
                                padding: "10px 12px",
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
                                style={{
                                  marginRight: "8px",
                                  backgroundColor: "var(--jmp-surface)",
                                  color: "var(--jmp-text)",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  border: "1px solid var(--jmp-border)",
                                  borderRadius: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleRemoveAttribute(klassName, attrName)
                                }
                                style={{
                                  backgroundColor: "var(--jmp-surface)",
                                  color: "var(--jmp-danger)",
                                  padding: "4px 10px",
                                  fontSize: "12px",
                                  fontWeight: "500",
                                  border: "1px solid var(--jmp-danger-soft)",
                                  borderRadius: "4px",
                                  cursor: "pointer"
                                }}
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
            backgroundColor: "var(--jmp-scrim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={handleCancelAddAttribute}
        >
          <div
            style={{
              backgroundColor: "var(--jmp-surface)",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "400px",
              maxWidth: "90vw",
              border: "1px solid var(--jmp-border)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--jmp-text)"
            }}>
              Add Attribute to {addingAttribute}
            </h3>
            <div style={{ marginBottom: "16px" }}>
              <label style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--jmp-text-muted)"
              }}>
                {t.attributeName}
              </label>
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--jmp-border)",
                  fontSize: "14px",
                  boxSizing: "border-box"
                }}
                placeholder={t.attributeName}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--jmp-text-muted)"
              }}>
                {t.dataType}
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--jmp-border)",
                  fontSize: "14px",
                  backgroundColor: "var(--jmp-surface)",
                  cursor: "pointer",
                  boxSizing: "border-box"
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
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end"
              }}
            >
              <button
                onClick={handleCancelAddAttribute}
                style={{
                  backgroundColor: "var(--jmp-surface)",
                  color: "var(--jmp-text-muted)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid var(--jmp-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >{t.cancel}</button>
              <button
                onClick={handleConfirmAddAttribute}
                style={{
                  backgroundColor: "var(--jmp-text)",
                  color: "var(--jmp-surface)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >{t.addAttribute}</button>
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
            backgroundColor: "var(--jmp-scrim)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={handleCancelEditAttribute}
        >
          <div
            style={{
              backgroundColor: "var(--jmp-surface)",
              padding: "24px",
              borderRadius: "8px",
              minWidth: "400px",
              maxWidth: "90vw",
              border: "1px solid var(--jmp-border)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--jmp-text)"
            }}>
              Edit Attribute: {editingAttribute.attrName}
            </h3>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "14px",
                fontWeight: "500",
                color: "var(--jmp-text-muted)"
              }}>
                {t.dataType}
              </label>
              <select
                value={newAttrType}
                onChange={(e) => setNewAttrType(e.target.value as DataType)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--jmp-border)",
                  fontSize: "14px",
                  backgroundColor: "var(--jmp-surface)",
                  cursor: "pointer",
                  boxSizing: "border-box"
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
              style={{
                display: "flex",
                gap: "8px",
                justifyContent: "flex-end"
              }}
            >
              <button
                onClick={handleCancelEditAttribute}
                style={{
                  backgroundColor: "var(--jmp-surface)",
                  color: "var(--jmp-text-muted)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "1px solid var(--jmp-border)",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >{t.cancel}</button>
              <button
                onClick={handleConfirmEditAttribute}
                style={{
                  backgroundColor: "var(--jmp-text)",
                  color: "var(--jmp-surface)",
                  padding: "8px 16px",
                  fontSize: "14px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >{t.save}</button>
            </div>
          </div>
        </div>
      )}

      {/* What applying these classes costs the objects already drawn */}
      {pendingImpact && (
        <ConfirmDialog
          title={t.applyClassesTitle}
          confirmLabel={t.applyClassesConfirm}
          cancelLabel={t.cancel}
          destructive
          onConfirm={commit}
          onCancel={() => setPendingImpact(null)}
        >
          <p style={{ margin: "0 0 12px 0" }}>{t.applyClassesIntro}</p>
          {(() => {
            const lines = [
              ...pendingImpact.orphaned.map(({ klass, count }) =>
                t.applyClassesOrphaned(klass, count),
              ),
              ...pendingImpact.dropped.map(({ klass, field, count }) =>
                t.applyClassesDropped(klass, field, count),
              ),
            ];
            const shown = lines.slice(0, MAX_LISTED);
            return (
              <ul
                style={{
                  margin: 0,
                  padding: "12px 12px 12px 32px",
                  backgroundColor: "var(--jmp-danger-soft)",
                  border: "1px solid var(--jmp-danger-soft)",
                  borderRadius: "6px",
                  color: "var(--jmp-danger-text)",
                }}
              >
                {shown.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                {lines.length > shown.length && (
                  <li style={{ listStyle: "none", marginLeft: "-16px" }}>
                    {t.applyClassesMore(lines.length - shown.length)}
                  </li>
                )}
              </ul>
            );
          })()}
        </ConfirmDialog>
      )}

      {/* Add Class Dialog */}
      {showAddClassDialog && (
        <SimpleInputDialog
          title={t.addClass}
          label={t.className}
          placeholder={t.classNamePlaceholder}
          onConfirm={handleAddKlassConfirm}
          onCancel={() => setShowAddClassDialog(false)}
        />
      )}
    </div>
  );
};
