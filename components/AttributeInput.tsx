import React from 'react';

interface AttributeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  options: string[];
}

export const AttributeInput: React.FC<AttributeInputProps> = ({ id, label, value, onChange, options }) => {
  const dataListId = `${id}-list`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-600">{label}</label>
      <input
        id={id}
        type="text"
        list={dataListId}
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
        autoComplete="off"
      />
      <datalist id={dataListId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </div>
  );
};
