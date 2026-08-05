// Translations for the Java Memory Playground

export interface Translations {
  // Toolbar
  save: string;
  saveUrl: string;
  downloadPng: string;
  config: string;
  runGarbageCollector: string;
  undo: string;
  redo: string;

  // Sidebar
  newInstanceOf: (klass: string) => string;
  newArray: string;
  callMethod: string;
  declareGlobalVariable: string;

  // Nodes
  declareLocalVariable: string;
  returnMethod: string;

  // Dialogs
  ok: string;
  cancel: string;
  createMethodCall: string;
  methodName: string;
  methodNamePlaceholder: string;
  createGlobalVariable: string;
  variableName: string;
  variableNamePlaceholder: string;
  createObject: (type: string) => string;
  objectName: string;
  createArray: string;
  arrayLength: string;
  arrayElementType: string;
  declareLocalVariableTitle: string;

  // Config view
  configuration: string;
  classes: string;
  addClass: string;
  className: string;
  classNamePlaceholder: string;
  attributes: string;
  addAttribute: string;
  attributeName: string;
  dataType: string;
  options: string;
  backToDiagram: string;
  saved: string;
  unsavedChangesLeave: string;
  confirmDeleteClass: (name: string) => string;

  // Option labels
  optionLabels: {
    hideSidebar: string;
    hideCallMethod: string;
    hideDeclareGlobalVariable: string;
    hideNewArray: string;
    disableGarbageCollector: string;
    createNewOnEdgeDrop: string;
  };
}

const en: Translations = {
  save: "Save",
  saveUrl: "Save (URL)",
  downloadPng: "Download (PNG)",
  config: "Config",
  runGarbageCollector: "Run Garbage Collector",
  undo: "Undo",
  redo: "Redo",

  newInstanceOf: (klass) => `new ${klass}`,
  newArray: "new Array",
  callMethod: "Call Method",
  declareGlobalVariable: "Declare Global Variable",

  declareLocalVariable: "Declare Local Variable",
  returnMethod: "Return",

  ok: "OK",
  cancel: "Cancel",
  createMethodCall: "Create Method Call",
  methodName: "Method Name",
  methodNamePlaceholder: "e.g. App.main",
  createGlobalVariable: "Create Global Variable",
  variableName: "Variable Name",
  variableNamePlaceholder: "Enter variable name",
  createObject: (type) => `Create ${type}`,
  objectName: "Name",
  createArray: "Create Array",
  arrayLength: "Length",
  arrayElementType: "Element Type",
  declareLocalVariableTitle: "Declare Local Variable",

  configuration: "Configuration",
  classes: "Classes",
  addClass: "Add Class",
  className: "Class Name",
  classNamePlaceholder: "e.g. Node",
  attributes: "Attributes",
  addAttribute: "Add Attribute",
  attributeName: "Attribute Name",
  dataType: "Data Type",
  options: "Options",
  backToDiagram: "Back to Diagram",
  saved: "Saved",
  unsavedChangesLeave:
    "You have unsaved changes. Are you sure you want to leave?",
  confirmDeleteClass: (name) =>
    `Are you sure you want to delete class "${name}"?`,

  optionLabels: {
    hideSidebar: "Hide sidebar",
    hideCallMethod: "Hide „Call Method“",
    hideDeclareGlobalVariable: "Hide „Declare Global Variable“",
    hideNewArray: "Hide „new Array“",
    disableGarbageCollector: "Disable garbage collector",
    createNewOnEdgeDrop: "Create a new object when an edge is dropped",
  },
};

const de: Translations = {
  save: "Speichern",
  saveUrl: "Speichern (URL)",
  downloadPng: "Herunterladen (PNG)",
  config: "Einstellungen",
  runGarbageCollector: "Garbage Collector ausführen",
  undo: "Rückgängig",
  redo: "Wiederholen",

  newInstanceOf: (klass) => `neues ${klass}`,
  newArray: "neues Array",
  callMethod: "Methode aufrufen",
  declareGlobalVariable: "Globale Variable deklarieren",

  declareLocalVariable: "Lokale Variable deklarieren",
  returnMethod: "Zurückkehren",

  ok: "OK",
  cancel: "Abbrechen",
  createMethodCall: "Methodenaufruf erstellen",
  methodName: "Methodenname",
  methodNamePlaceholder: "z. B. App.main",
  createGlobalVariable: "Globale Variable erstellen",
  variableName: "Variablenname",
  variableNamePlaceholder: "Variablennamen eingeben",
  createObject: (type) => `${type} erstellen`,
  objectName: "Name",
  createArray: "Array erstellen",
  arrayLength: "Länge",
  arrayElementType: "Elementtyp",
  declareLocalVariableTitle: "Lokale Variable deklarieren",

  configuration: "Einstellungen",
  classes: "Klassen",
  addClass: "Klasse hinzufügen",
  className: "Klassenname",
  classNamePlaceholder: "z. B. Node",
  attributes: "Attribute",
  addAttribute: "Attribut hinzufügen",
  attributeName: "Attributname",
  dataType: "Datentyp",
  options: "Optionen",
  backToDiagram: "Zurück zum Diagramm",
  saved: "Gespeichert",
  unsavedChangesLeave:
    "Du hast ungespeicherte Änderungen. Möchtest du die Seite wirklich verlassen?",
  confirmDeleteClass: (name) =>
    `Möchtest du die Klasse „${name}“ wirklich löschen?`,

  optionLabels: {
    hideSidebar: "Seitenleiste ausblenden",
    hideCallMethod: "„Methode aufrufen“ ausblenden",
    hideDeclareGlobalVariable: "„Globale Variable deklarieren“ ausblenden",
    hideNewArray: "„neues Array“ ausblenden",
    disableGarbageCollector: "Garbage Collector deaktivieren",
    createNewOnEdgeDrop: "Neues Objekt erstellen, wenn eine Kante abgelegt wird",
  },
};

export const translations: Record<string, Translations> = {
  en,
  de,
};

/**
 * Detects the user's browser language and returns a supported language code.
 * Falls back to 'en' if the browser language is not supported.
 */
export function detectBrowserLanguage(): string {
  if (typeof window === "undefined" || !window.navigator) {
    return "en";
  }

  // Get browser language (e.g., 'en-US', 'de-DE', 'de')
  const browserLang =
    window.navigator.language || (window.navigator as any).userLanguage;

  if (!browserLang) {
    return "en";
  }

  // Extract the base language code (e.g., 'en' from 'en-US')
  const baseLang = browserLang.split("-")[0].toLowerCase();

  if (translations[baseLang]) {
    return baseLang;
  }

  return "en";
}

export function getLanguage(explicitLanguage?: string): string {
  if (
    explicitLanguage &&
    explicitLanguage !== "auto" &&
    translations[explicitLanguage]
  ) {
    return explicitLanguage;
  }

  return detectBrowserLanguage();
}

export function getTranslations(language: string = "en"): Translations {
  return translations[language] || translations.en;
}
