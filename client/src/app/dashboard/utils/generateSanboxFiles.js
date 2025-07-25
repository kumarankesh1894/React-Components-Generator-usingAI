function generateSandboxFiles(componentCode, cssCode = "") {
  // Step 1: Better TSX detection
  const isTSX =
    /\binterface\s+\w+/.test(componentCode) || // interface Something
    /\btype\s+\w+\s*=/.test(componentCode) || // type Something =
    /\b:\s*(string|number|boolean|any|unknown|React\.[A-Z])/.test(componentCode); // : string, : number, : React.FC, etc.

  const ext = isTSX ? "tsx" : "jsx";

  // Step 2: Extract component name
  const componentMatch = componentCode.match(/export default (\w+)/);
  const componentName = componentMatch ? componentMatch[1] : "MyComponent";

  // Step 3: Tailwind detection
  const isTailwind =
    cssCode.toLowerCase().includes("tailwind") ||
    componentCode.includes("className=") && cssCode.trim() === "";

  // Step 4: Construct base App component
  const importCss = !isTailwind && cssCode.trim() ? `import "./style.css";\n` : "";

  const appCode = `
    import React from "react";
    ${importCss}import ${componentName} from "./${componentName}";

    export default function App() {
      return (
        <div className="${isTailwind ? "p-4 bg-green-100 min-h-screen" : "app-container"}">
          <${componentName}>Live Button</${componentName}>
        </div>
      );
    }
  `;

  // Step 5: Create files
  const files = {
    [`/App.${ext}`]: appCode,
    [`/${componentName}.${ext}`]: componentCode,
  };

  // Step 6: Add style.css if present and not Tailwind
  if (!isTailwind && cssCode.trim()) {
    files["/style.css"] = cssCode;
  }

  return { files, isTSX };
}

export default generateSandboxFiles;
