import { DataType, Klasses } from "./memory";

/**
 * Reads the class structure out of Java source.
 *
 * Only declarations are read — class names, and the name and type of each
 * field. Method bodies are skipped wholesale and nothing is executed or
 * interpreted: the source is a convenient way to write down the shape of the
 * objects a diagram will contain, not a program the playground runs.
 */

export type ParsedClasses = {
  klasses: Klasses;
  /** Things the teacher probably wants to know about, in reading order. */
  problems: string[];
};

const MODIFIERS = new Set([
  "public",
  "private",
  "protected",
  "static",
  "final",
  "transient",
  "volatile",
  "abstract",
  "native",
  "synchronized",
  "strictfp",
  "default",
]);

/**
 * Replaces comments and literals with spaces of the same length.
 *
 * Keeping the length means every offset still lines up, and blanking them means
 * a brace or semicolon inside a string cannot throw off the scan.
 */
const blankNonCode = (source: string): string => {
  const out = source.split("");
  let i = 0;

  const blankUntil = (end: number) => {
    for (let k = i; k < end && k < out.length; k++) {
      if (out[k] !== "\n") out[k] = " ";
    }
  };

  while (i < source.length) {
    const two = source.slice(i, i + 2);

    if (two === "//") {
      const end = source.indexOf("\n", i);
      blankUntil(end === -1 ? source.length : end);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (two === "/*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      blankUntil(stop);
      i = stop;
      continue;
    }
    if (source[i] === '"' || source[i] === "'") {
      const quote = source[i];
      let k = i + 1;
      while (k < source.length && source[k] !== quote) {
        if (source[k] === "\\") k++;
        k++;
      }
      blankUntil(Math.min(k + 1, source.length));
      i = k + 1;
      continue;
    }
    i++;
  }

  return out.join("");
};

/** The index just past the `}` matching the `{` at `open`. */
const matchBrace = (source: string, open: number): number => {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
};

/** Splits on a character that is not nested inside <>, () or []. */
const splitTopLevel = (text: string, separator: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of text) {
    if (char === "<" || char === "(" || char === "[") depth++;
    if (char === ">" || char === ")" || char === "]") depth--;
    if (char === separator && depth <= 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
};

/**
 * The playground's type for a Java one.
 *
 * Generics are dropped, because the diagram has no notion of them, and any
 * array becomes the playground's `Array`, whose element type belongs to the
 * object rather than to the class.
 */
const toDataType = (javaType: string): DataType => {
  const trimmed = javaType.trim();
  if (trimmed.endsWith("[]")) return "Array";

  const withoutGenerics = trimmed.replace(/<.*>$/s, "").trim();
  // A qualified name is shown by its last part: java.lang.String is String.
  const parts = withoutGenerics.split(".");
  return parts[parts.length - 1];
};

/** Splits `Type name` into its two halves, generics and arrays included. */
const splitTypeAndRest = (declaration: string): [string, string] | null => {
  let depth = 0;
  for (let i = 0; i < declaration.length; i++) {
    const char = declaration[i];
    if (char === "<" || char === "[") depth++;
    else if (char === ">" || char === "]") depth--;
    else if (/\s/.test(char) && depth === 0) {
      const type = declaration.slice(0, i).trim();
      const rest = declaration.slice(i + 1).trim();
      if (!type || !rest) return null;
      return [type, rest];
    }
  }
  return null;
};

const isIdentifier = (text: string) => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(text);

/** Reads one field declaration, which may declare several names at once. */
const readField = (
  statement: string,
  problems: string[],
): Array<[string, DataType]> => {
  const words = statement.trim().split(/\s+/);
  while (words.length > 0 && MODIFIERS.has(words[0])) words.shift();
  const rest = words.join(" ").trim();
  if (!rest) return [];

  // A field cannot be a class, enum or record header, nor an annotation.
  if (/^(class|interface|enum|record|@)/.test(rest)) return [];

  const split = splitTypeAndRest(rest);
  if (!split) return [];
  const [javaType, declarators] = split;

  const fields: Array<[string, DataType]> = [];
  splitTopLevel(declarators, ",").forEach((declarator) => {
    // Drop any initializer; the diagram gets its values from the objects.
    const name = declarator.split("=")[0].trim();
    // `int values[]` is an array too, written the other way round.
    const trailingArray = name.endsWith("[]");
    const bare = name.replace(/\[\s*\]$/, "").trim();

    if (!isIdentifier(bare)) {
      if (bare) problems.push(`Could not read the field "${bare}"`);
      return;
    }
    fields.push([bare, trailingArray ? "Array" : toDataType(javaType)]);
  });

  return fields;
};

/** Reads the fields declared directly in a class body. */
const readBody = (body: string, problems: string[]): Klasses[string] => {
  const attributes: Record<string, DataType> = {};
  let statement = "";
  let i = 0;

  while (i < body.length) {
    const char = body[i];

    if (char === "{") {
      // A method, constructor or initializer: its body is not our business.
      const end = matchBrace(body, i);
      statement = "";
      i = end === -1 ? body.length : end;
      continue;
    }

    if (char === ";") {
      // A name followed by `(` is a method or constructor declaration.
      if (!/\w\s*\(/.test(statement)) {
        readField(statement, problems).forEach(([name, type]) => {
          attributes[name] = type;
        });
      }
      statement = "";
      i++;
      continue;
    }

    statement += char;
    i++;
  }

  return { attributes };
};

/** Reads the components of a record header as fields. */
const readRecordComponents = (
  header: string,
  problems: string[],
): Record<string, DataType> => {
  const attributes: Record<string, DataType> = {};
  splitTopLevel(header, ",").forEach((component) => {
    readField(component, problems).forEach(([name, type]) => {
      attributes[name] = type;
    });
  });
  return attributes;
};

const DECLARATION = /\b(class|record)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g;

export const parseJavaClasses = (source: string): ParsedClasses => {
  const problems: string[] = [];
  const klasses: Klasses = {};

  if (!source.trim()) return { klasses, problems };

  const code = blankNonCode(source);

  DECLARATION.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = DECLARATION.exec(code)) !== null) {
    const [, keyword, name] = match;
    const after = match.index + match[0].length;

    if (klasses[name]) {
      problems.push(`"${name}" is declared more than once`);
    }

    let attributes: Record<string, DataType> = {};

    if (keyword === "record") {
      const open = code.indexOf("(", after);
      if (open !== -1) {
        const close = matchBrace(
          code.replace(/\(/g, "{").replace(/\)/g, "}"),
          open,
        );
        if (close !== -1) {
          attributes = readRecordComponents(
            source.slice(open + 1, close - 1),
            problems,
          );
        }
      }
    }

    const open = code.indexOf("{", after);
    if (open === -1) {
      problems.push(`"${name}" has no body`);
      klasses[name] = { attributes };
      continue;
    }
    const close = matchBrace(code, open);
    if (close === -1) {
      problems.push(`"${name}" is missing a closing brace`);
      klasses[name] = { attributes };
      continue;
    }

    // The blanked copy is character-for-character the same as the source
    // outside comments and literals, so field names read from it are real.
    const fromBody = readBody(code.slice(open + 1, close - 1), problems)
      .attributes;

    klasses[name] = { attributes: { ...attributes, ...fromBody } };

    // The scan deliberately continues inside the body: a nested class is a
    // class too, and readBody has already skipped its fields for the outer one.
  }

  if (Object.keys(klasses).length === 0) {
    problems.push("No class declarations found");
  }

  return { klasses, problems };
};

/** Writes the current classes back out as Java, for editing as source. */
export const toJavaSource = (klasses: Klasses): string =>
  Object.entries(klasses)
    .map(([name, klass]) => {
      const fields = Object.entries(klass.attributes ?? {})
        .map(([field, type]) => `    ${type === "Array" ? "Object[]" : type} ${field};`)
        .join("\n");
      return `class ${name} {\n${fields}${fields ? "\n" : ""}}`;
    })
    .join("\n\n");
