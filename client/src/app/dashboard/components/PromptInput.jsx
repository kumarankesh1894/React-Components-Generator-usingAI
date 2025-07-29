"use client";
import { useState, useRef } from "react";

export default function PromptInput({ prompt, setPrompt, handleGenerate, loading }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) {
      alert('Please select valid image files only.');
      return;
    }

    validFiles.forEach(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`File ${file.name} is too large. Please use images under 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = {
          id: Date.now() + Math.random(),
          name: file.name,
          dataUrl: e.target.result,
          file: file
        };
        setUploadedImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleGenerateWithImages = () => {
    handleGenerate(uploadedImages);
  };

  return (
    <div>
      {/* Text Input */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the component you want to create..."
        className="input-glass w-full min-h-[80px] sm:min-h-[100px] resize-vertical mb-4 text-sm sm:text-base"
      />

      {/* Image Upload Section */}
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-ghost flex items-center gap-2 text-xs sm:text-sm justify-center sm:justify-start"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">Upload Images</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <span className="text-xs text-gray-400 text-center sm:text-left">JPG, PNG, GIF (Max 5MB)</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Display Uploaded Images */}
        {uploadedImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3 mt-3">
            {uploadedImages.map((image) => (
              <div key={image.id} className="relative group">
                <img
                  src={image.dataUrl}
                  alt={image.name}
                  className="w-full h-20 sm:h-24 object-cover rounded-lg border border-white/20"
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <button
          onClick={handleGenerateWithImages}
          disabled={loading || (!prompt.trim() && uploadedImages.length === 0)}
          className="btn-primary flex items-center justify-center gap-2 text-sm sm:text-base py-3 sm:py-2 w-full sm:w-auto"
        >
          {loading && <div className="spinner"></div>}
          {loading ? "Generating..." : "Generate Component"}
        </button>
        
        {!prompt.trim() && uploadedImages.length === 0 && (
          <p className="text-xs text-gray-400 text-center sm:text-right">Enter a description or upload images</p>
        )}
      </div>
    </div>
  );
}
