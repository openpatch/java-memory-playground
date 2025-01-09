export const numericDataTypes = ["int", "float", "double", "char"];

export const primitveDataTypes = [
  "int",
  "float",
  "double",
  "char",
  "boolean",
  "String",
];

export type DataType =
  | "int"
  | "float"
  | "char"
  | "double"
  | "boolean"
  | "String"
  | "Array"
  | string;

interface KlassAttributes {
  [key: string]: DataType;
}

export type Klass = {
  attributes: KlassAttributes;
};

export type Attribute = {
  dataType: DataType;
  value?: string | number | boolean;
};

interface ObjAttributes {
  [key: string]: Attribute;
}

export type Obj = {
  klass: string;
  attributes: ObjAttributes;
  position: {
    x: number;
    y: number;
  };
};

export type Variable = {
  name: String;
  dataType: DataType;
  value: string | null;
  position: {
    x: number;
    y: number;
  };
};

interface localVariables {
  [key: string]: Attribute;
}

export type MethodCall = {
  name: string;
  index: number;
  localVariables: localVariables;
  position: {
    x: number;
    y: number;
  };
};

interface Klasses {
  [key: string]: Klass;
}

interface Objs {
  [key: string]: Obj;
}

interface Variables {
  [key: string]: Variable;
}

interface MethodCalls {
  [key: number]: MethodCall;
}

export type Memory = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  options: {
    hideSidebar?: boolean;
    hideCallMethod?: boolean;
    hideDeclareGlobalVariable?: boolean;
    hideNewArray?: boolean;
    createNewOnEdgeDrop?: boolean;
  };
  klasses: Klasses;
  objects: Objs;
  variables: Variables;
  methodCalls: MethodCalls;
};

export const initialMemory: Memory = {
  options: {
    hideSidebar: false,
    hideCallMethod: false,
    hideDeclareGlobalVariable: true,
    hideNewArray: false,
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
  methodCalls: {
    1: {
      name: "App.main",
      localVariables: {
        myList: {
          dataType: "List",
          value: "@11",
        },
        tmp1: {
          dataType: "List",
        },
        tmp2: {
          dataType: "List",
        },
      },
      index: 0,
      position: {
        x: 0,
        y: 0,
      },
    },
  },
  variables: {},
  klasses: {
    List: {
      attributes: {
        current: "Node",
        first: "Node",
      },
    },
    Node: {
      attributes: {
        next: "Node",
        content: "Message",
      },
    },
    Message: {
      attributes: {
        username: "String",
        text: "String",
        isRead: "boolean",
      },
    },
  },
  objects: {
    "@11": {
      klass: "List",
      attributes: {
        current: {
          dataType: "Node",
          value: "@33",
        },
        first: {
          dataType: "Node",
          value: "@33",
        },
      },
      position: {
        x: 250,
        y: 100,
      },
    },
    "@33": {
      klass: "Node",
      attributes: {
        next: {
          dataType: "Node",
        },
        content: {
          dataType: "Message",
          value: "@55",
        },
      },
      position: {
        x: 400,
        y: 100,
      },
    },
    "@44": {
      klass: "Node",
      attributes: {
        next: {
          dataType: "Node",
        },
        content: {
          dataType: "Message",
        },
      },
      position: {
        x: 600,
        y: 100,
      },
    },
    "@55": {
      klass: "Message",
      attributes: {
        username: {
          dataType: "String",
          value: '"mike"',
        },
        text: { dataType: "String", value: '"Hello World!"' },
        isRead: { dataType: "boolean", value: true },
      },
      position: {
        x: 400,
        y: 250,
      },
    },
  },
};
