'use client';

import { useState } from 'react';

export type VisibilityType = 'private' | 'public';

export function VisibilitySelector({
  initialVisibility = 'private',
  onChange,
}: {
  initialVisibility?: VisibilityType;
  onChange?: (visibility: VisibilityType) => void;
}) {
  const [visibility, setVisibility] = useState<VisibilityType>(initialVisibility);

  const handleChange = (newVisibility: VisibilityType) => {
    setVisibility(newVisibility);
    onChange?.(newVisibility);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleChange('private')}
        className={`px-3 py-1 rounded-md text-sm ${
          visibility === 'private' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        Private
      </button>
      <button
        onClick={() => handleChange('public')}
        className={`px-3 py-1 rounded-md text-sm ${
          visibility === 'public' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-200 text-gray-700'
        }`}
      >
        Public
      </button>
    </div>
  );
}
