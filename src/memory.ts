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

export type Memory = {
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
  options: {
    hideSidebar: boolean;
  };
  klasses: Record<string, Klass>;
  objects: Record<string, Obj>;
  variables: Record<string, Variable>;
};

export const initialMemory: Memory = {
  options: {
    hideSidebar: false,
  },
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
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
  variables: {
    "@v00": {
      name: "myList",
      dataType: "List",
      value: "@11",
      position: {
        x: 100,
        y: 100,
      },
    },
    "@v01": {
      name: "tmp1",
      dataType: "List",
      value: null,
      position: {
        x: 100,
        y: 150,
      },
    },
    "@v02": {
      name: "tmp2",
      dataType: "List",
      value: null,
      position: {
        x: 100,
        y: 200,
      },
    },
  },
};
