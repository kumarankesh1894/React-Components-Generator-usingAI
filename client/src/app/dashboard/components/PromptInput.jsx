export default function PromptInput({ prompt, setPrompt, handleGenerate, loading }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Generate a Component</h2>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the component you want..."
        className="w-full border p-3 rounded mb-4 min-h-[100px]"
      />
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}
