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

export type Klass = {
  attributes: Record<string, DataType>;
};

export type Attribute = {
  dataType: DataType;
  value: string | number | boolean | null;
};

export type Obj = {
  klass: string;
  attributes: Record<string, Attribute>;
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

export type MethodCall = {
  name: String;
  index: number;
  localVariables: Record<string, Attribute>;
  position: {
    x: number;
    y: number;
  };
};

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
    createNewOnEdgeDrop?: boolean;
  };
  klasses: Record<string, Klass>;
  objects: Record<string, Obj>;
  variables: Record<string, Variable>;
  methodCalls: Record<number, MethodCall>;
};

export const initialMemory: Memory = {
  options: {
    hideSidebar: false,
    hideCallMethod: false,
    hideDeclareGlobalVariable: true,
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
          value: null,
        },
        tmp2: {
          dataType: "List",
          value: null,
        },
      },
      index: 0,
      position: {
        x: 0,
        y: 0
      }
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
          value: null,
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
          value: null,
        },
        content: {
          dataType: "Message",
          value: null,
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
