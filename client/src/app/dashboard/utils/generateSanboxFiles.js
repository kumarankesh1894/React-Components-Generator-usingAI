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
  const needsCssImport = !isTailwind; // Always import CSS for consistent styling
  const importCss = needsCssImport ? `import "./style.css";\n` : "";

  // Step 4: Check if component takes children or is self-closing
  const takesChildren = componentCode.includes('children') || componentCode.includes('{children}');
  const componentUsage = takesChildren ? 
    `<${componentName}>Live Component</${componentName}>` : 
    `<${componentName} />`;

  const appCode = `import React from "react";
${importCss}import ${componentName} from "./${componentName}";

export default function App() {
  return (
    <div className="${isTailwind ? "p-4 bg-gray-100 min-h-screen flex items-center justify-center" : "app-container"}">
      ${componentUsage}
    </div>
  );
}`;

  // Step 5: Create files
  const files = {
    [`/App.${ext}`]: appCode,
    [`/${componentName}.${ext}`]: componentCode,
  };

  // Step 6: Add style.css if present and not Tailwind
  if (!isTailwind && cssCode.trim()) {
    const defaultAppStyles = `
.app-container {
  padding: 2rem;
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

`;
    files["/style.css"] = defaultAppStyles + cssCode;
  } else if (!isTailwind) {
    // Add minimal default styles even without custom CSS
    files["/style.css"] = `
.app-container {
  padding: 2rem;
  min-height: 100vh;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}`;
  }

  return { files, isTSX };
}

export default generateSandboxFiles;
