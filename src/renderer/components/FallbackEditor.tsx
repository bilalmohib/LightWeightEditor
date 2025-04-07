import React, { useState, useRef, useEffect } from 'react';

interface FallbackEditorProps {
  content: string;
  onContentChange?: (content: string) => void;
}

const FallbackEditor: React.FC<FallbackEditorProps> = ({ content, onContentChange }) => {
  const [value, setValue] = useState(content || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    setValue(content || '');
  }, [content]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (onContentChange) {
      onContentChange(newValue);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      <div className="p-2 bg-gray-800 text-white text-xs">
        Simple Editor Mode (Monaco Editor failed to load)
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        className="flex-1 bg-gray-900 text-white font-mono p-4 resize-none outline-none border-none"
        style={{
          tabSize: 2,
          fontSize: '14px',
          lineHeight: 1.5,
        }}
      />
    </div>
  );
};

export default FallbackEditor; 