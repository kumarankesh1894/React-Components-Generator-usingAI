// components/LivePreview.jsx
"use client";

export default function LivePreview({ code }) {
  return (
    <div className="border rounded bg-white p-4 mt-2">
      <h3 className="text-md font-semibold mb-2 text-gray-800">Live Preview</h3>
      <iframe
        title="Live Preview"
        className="w-full h-64 border rounded"
        sandbox="allow-scripts"
        srcDoc={`
          <html>
            <head><style>body { font-family: sans-serif; margin: 0; padding: 10px; }</style></head>
            <body>
              <div id="root"></div>
              <script type="text/javascript">
                try {
                  const root = document.getElementById("root");
                  const render = () => {
                    root.innerHTML = "";
                    eval(\`${code.replace(/`/g, "\\`")}\`);
                  };
                  render();
                } catch (e) {
                  root.innerHTML = "<pre style='color: red'>" + e + "</pre>";
                }
              </script>
            </body>
          </html>
        `}
      />
    </div>
  );
}
