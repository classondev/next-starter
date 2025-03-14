import React, { useState, useRef, useEffect } from 'react';

interface EditableCellProps {
  value: string | number;
  type?: 'text' | 'number';
  className?: string;
  onSave: (value: string | number) => void;
}

export function EditableCell({ value, type = 'text', className = '', onSave }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) {
      const newValue = type === 'number' ? Number(editValue) || 0 : editValue;
      onSave(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full p-1 border rounded ${className}`}
        min={type === 'number' ? 0 : undefined}
        step={type === 'number' ? 'any' : undefined}
      />
    );
  }

  return (
    <div onDoubleClick={handleDoubleClick} className={`cursor-pointer ${className}`}>
      {value || <span className="text-muted-foreground">empty</span>}
    </div>
  );
} 