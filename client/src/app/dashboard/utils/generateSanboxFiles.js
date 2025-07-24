// utils/generateSandboxFiles.js

function generateSandboxFiles(componentCode, cssCode = "") {
  const componentMatch = componentCode.match(/export default (\w+)/);
  const componentName = componentMatch ? componentMatch[1] : "MyComponent";

  const isTailwind =
    cssCode.toLowerCase().includes("tailwind") || componentCode.includes("className=");

  const files = {
    "/App.js": `
      import React from "react";
      import ${componentName} from "./${componentName}";

      export default function App() {
        return (
          <div className="${isTailwind ? "p-4 bg-green-100 min-h-screen" : "app-container"}">
            <${componentName}>Live Button</${componentName}>
          </div>
        );
      }
    `,
    [`/${componentName}.js`]: componentCode,
  };

  if (!isTailwind && cssCode.trim()) {
    files["/style.css"] = cssCode;
    files["/App.js"] = `
      import React from "react";
      import "./style.css";
      import ${componentName} from "./${componentName}";

      export default function App() {
        return (
          <div className="app-container">
            <${componentName}>Live Button</${componentName}>
          </div>
        );
      }
    `;
  }

  return files;
}

export default generateSandboxFiles;
