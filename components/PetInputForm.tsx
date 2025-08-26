
import React, { useState } from 'react';

interface PetInputFormProps {
  onAnalyze: (formData: {
    name: string;
    breed: string;
    age: string;
    quirks: string;
    imageFile: File;
  }) => void;
  isLoading: boolean;
}

export const PetInputForm: React.FC<PetInputFormProps> = ({ onAnalyze, isLoading }) => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [quirks, setQuirks] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) { // 4MB limit
        setError('Image size cannot exceed 4MB.');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !breed || !age || !quirks || !imageFile) {
      setError('Please fill out all fields and upload an image.');
      return;
    }
    setError(null);
    onAnalyze({ name, breed, age, quirks, imageFile });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-700 mb-6">Tell us about your pet</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="pet-image" className="block text-sm font-medium text-slate-600 mb-2">
            Pet's Photo
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <img src={imagePreview} alt="Pet preview" className="mx-auto h-32 w-32 object-cover rounded-full" />
              ) : (
                <svg
                  className="mx-auto h-12 w-12 text-slate-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 4v.01M28 8l4.586 4.586a2 2 0 010 2.828L16 32h-8v-8l12.586-12.586a2 2 0 012.828 0L28 8z"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              <div className="flex text-sm text-slate-600 justify-center">
                <label
                  htmlFor="pet-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-cyan-600 hover:text-cyan-500 focus-within:outline-none"
                >
                  <span>Upload a file</span>
                  <input id="pet-image" name="pet-image" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-slate-500">PNG, JPG, WEBP up to 4MB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pet-name" className="block text-sm font-medium text-slate-600">Pet's Name</label>
              <input type="text" id="pet-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="pet-age" className="block text-sm font-medium text-slate-600">Pet's Age</label>
              <input type="text" id="pet-age" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" placeholder="e.g., 2 years"/>
            </div>
        </div>

        <div>
          <label htmlFor="pet-breed" className="block text-sm font-medium text-slate-600">Breed / Type</label>
          <input type="text" id="pet-breed" value={breed} onChange={(e) => setBreed(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" placeholder="e.g., Golden Retriever, Tabby Cat"/>
        </div>

        <div>
          <label htmlFor="pet-quirks" className="block text-sm font-medium text-slate-600">Quirks & Habits</label>
          <textarea id="pet-quirks" value={quirks} onChange={(e) => setQuirks(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" placeholder="e.g., Chases its tail, sleeps in funny positions..."></textarea>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Personality'}
          </button>
        </div>
      </form>
    </div>
  );
};
