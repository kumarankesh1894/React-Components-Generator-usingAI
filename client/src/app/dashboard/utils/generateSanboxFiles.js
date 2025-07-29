function generateSandboxFiles(componentCode, cssCode = "") {
  // Step 0: Clean component code - remove any usage examples at the end
  let cleanedCode = componentCode;
  
  // Find the last export default statement
  const lastExportMatch = cleanedCode.lastIndexOf('export default');
  if (lastExportMatch !== -1) {
    // Find the end of the export statement (semicolon or end of line)
    const afterExport = cleanedCode.substring(lastExportMatch);
    const exportEndMatch = afterExport.match(/export default [^;\n]+[;\n]?/);
    
    if (exportEndMatch) {
      const exportEnd = lastExportMatch + exportEndMatch[0].length;
      // Remove anything after the export default statement (usage examples)
      cleanedCode = cleanedCode.substring(0, exportEnd).trim();
    }
  }
  
  // Step 1: Better TSX detection
  const isTSX =
    /\binterface\s+\w+/.test(componentCode) || // interface Something
    /\btype\s+\w+\s*=/.test(componentCode) || // type Something =
    /\b:\s*(string|number|boolean|any|unknown|React\.[A-Z])/.test(componentCode) || // : string, : number, : React.FC, etc.
    /useRef<[^>]+>/.test(componentCode) || // useRef<Type>
    /useState<[^>]+>/.test(componentCode) || // useState<Type>
    /\w+<[^>]+>/.test(componentCode); // Generic types

  const ext = isTSX ? "tsx" : "jsx";
  console.log("🔧 TypeScript detected:", isTSX, "Extension:", ext);

  // Step 2: Extract component name from cleaned code
  const componentMatch = cleanedCode.match(/export default (\w+)/);
  const componentName = componentMatch ? componentMatch[1] : "MyComponent";
  
  console.log("🔧 Component name extracted:", componentName);
  console.log("🔧 Component match:", componentMatch);
  console.log("🔧 Cleaned code snippet:", cleanedCode.substring(0, 300) + "...");

  // Step 3: Tailwind detection
  const isTailwind =
    cssCode.toLowerCase().includes("tailwind") ||
    cleanedCode.includes("className=") && cssCode.trim() === "";

  // Step 4: Construct base App component
  const needsCssImport = !isTailwind; // Always import CSS for consistent styling
  const importCss = needsCssImport ? `import "./style.css";\n` : "";

  // Step 4: Check if component takes children or is self-closing
  const takesChildren = cleanedCode.includes('children') || cleanedCode.includes('{children}');
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

  // Step 5: Create files using cleaned code
  // If not using TypeScript template, clean TypeScript syntax
  let finalCleanedCode = cleanedCode;
  if (!isTSX) {
    // Remove TypeScript generic syntax from hooks
    finalCleanedCode = finalCleanedCode
      .replace(/useRef<[^>]+>/g, 'useRef')
      .replace(/useState<[^>]+>/g, 'useState')
      .replace(/: NodeJS\.Timeout/g, '')
      .replace(/\| null>/g, '>')
      .replace(/<[^>]*>\(null\)/g, '(null)');
  }
  
  const files = {
    [`/App.${ext}`]: appCode,
    [`/${componentName}.${ext}`]: finalCleanedCode,
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
