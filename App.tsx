import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { LoadingSpinner } from './components/LoadingSpinner';
import { TagIcon } from './components/icons/TagIcon';
import { AttributeInput } from './components/AttributeInput';
import { attributeOptions } from './data/attributes';

const App: React.FC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [productLine, setProductLine] = useState('');
  const [documentLevel, setDocumentLevel] = useState('');
  const [toolsPanel, setToolsPanel] = useState('');
  const [operationalControlPlan, setOperationalControlPlan] = useState('');
  const [func, setFunction] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [language, setLanguage] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string>('');

  const handleGenerateKeywords = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError('Please provide a title or description to generate keywords.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setKeywords([]);
    setCopySuccess('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

      const systemInstruction = `You are an expert in document analysis and search engine optimization. Your task is to generate a concise list of keywords from a given document title, description, and attributes. Follow these rules strictly:
1. Keywords must be in lowercase, unless they are acronyms which should be uppercase.
2. Filter out common words like "document", "information", "report", "the", "and", "a", "is", "in", "for", "to", "of".
3. Avoid repetition and synonyms. Use the most relevant term.
4. Limit keywords to a maximum of three words. Prefer single-word keywords for broad concepts and 2-3 word phrases for specific terms.
5. Extract keywords from the title, description, and the provided document attributes. The attributes provide important context.
6. The final output must be a JSON object with a single key "keywords" containing an array of strings.`;
      
      const attributes = [
        { label: 'Product Line', value: productLine },
        { label: 'Document Level', value: documentLevel },
        { label: 'Tools Panel', value: toolsPanel },
        { label: 'Operational Control Plan', value: operationalControlPlan },
        { label: 'Function', value: func },
        { label: 'Country', value: country },
        { label: 'Region', value: region },
        { label: 'Language', value: language },
      ].filter(attr => attr.value.trim() !== '');

      let attributesText = '';
      if (attributes.length > 0) {
        attributesText = '\n\nAttributes:\n' + attributes.map(attr => `- ${attr.label}: ${attr.value}`).join('\n');
      }

      const userPrompt = `Generate keywords for the following document:\n\nTitle: ${title}${attributesText}\n\nDescription: ${content}`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          keywords: {
            type: Type.ARRAY,
            description: 'A list of generated keywords.',
            items: {
              type: Type.STRING,
            },
          },
        },
        required: ['keywords'],
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.2,
        },
      });

      const result = JSON.parse(response.text);
      if (result && result.keywords) {
        setKeywords(result.keywords);
      } else {
        setError('Could not parse keywords from the response.');
      }

    } catch (err) {
      setError(err instanceof Error ? `An error occurred: ${err.message}` : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyKeywords = () => {
    const keywordsText = keywords.join(', ');
    navigator.clipboard.writeText(keywordsText).then(() => {
      setCopySuccess('Copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 2000);
    }, () => {
      setCopySuccess('Failed to copy!');
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10 animate-fade-in">
          <div className="flex justify-center items-center gap-3">
            <TagIcon className="w-9 h-9 text-cyan-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-slate-700 tracking-tight">
              Keyword Generator
            </h1>
          </div>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Generate optimized keywords from your document text to improve searchability.
          </p>
        </header>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 animate-slide-in-up">
            <form onSubmit={handleGenerateKeywords} className="space-y-6">
              <div>
                <label htmlFor="doc-title" className="block text-lg font-semibold text-slate-700">Document Title</label>
                <input
                  type="text"
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="e.g., OEPS Enhancements and Service Quality"
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-700">Document Attributes</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <AttributeInput
                    id="productLine"
                    label="Product Line"
                    value={productLine}
                    onChange={e => setProductLine(e.target.value)}
                    options={attributeOptions.productLine}
                  />
                  <AttributeInput
                    id="documentLevel"
                    label="Document Level"
                    value={documentLevel}
                    onChange={e => setDocumentLevel(e.target.value)}
                    options={attributeOptions.documentLevel}
                  />
                  <AttributeInput
                    id="toolsPanel"
                    label="Tools Panel"
                    value={toolsPanel}
                    onChange={e => setToolsPanel(e.target.value)}
                    options={attributeOptions.toolsPanel}
                  />
                  <AttributeInput
                    id="operationalControlPlan"
                    label="Operational Control Plan"
                    value={operationalControlPlan}
                    onChange={e => setOperationalControlPlan(e.target.value)}
                    options={attributeOptions.operationalControlPlan}
                  />
                  <AttributeInput
                    id="function"
                    label="Function"
                    value={func}
                    onChange={e => setFunction(e.target.value)}
                    options={attributeOptions.function}
                  />
                  <AttributeInput
                    id="country"
                    label="Country"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    options={attributeOptions.country}
                  />
                  <AttributeInput
                    id="region"
                    label="Region"
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    options={attributeOptions.region}
                  />
                  <AttributeInput
                    id="language"
                    label="Language"
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    options={attributeOptions.language}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="doc-content" className="block text-lg font-semibold text-slate-700">Document Description</label>
                <textarea
                  id="doc-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  className="mt-2 block w-full px-4 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Paste the main text of your document here..."
                ></textarea>
              </div>
              {error && <p className="text-sm text-red-600 animate-fade-in">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Generating...' : 'Generate Keywords'}
                </button>
              </div>
            </form>
          </div>

          <div className="relative min-h-[200px]">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-white/50 backdrop-blur-sm rounded-lg">
                <LoadingSpinner />
                <p className="mt-4 text-slate-600 font-medium">Analyzing document...</p>
              </div>
            )}
            {!isLoading && keywords.length > 0 && (
              <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-slate-700">Generated Keywords</h2>
                  <button onClick={handleCopyKeywords} className="px-4 py-2 text-sm font-medium text-cyan-700 bg-cyan-100 rounded-md hover:bg-cyan-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500">
                    {copySuccess || 'Copy All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {keywords.map((keyword, index) => (
                    <span key={index} className="bg-slate-200 text-slate-800 text-sm font-medium px-3 py-1.5 rounded-md animate-fade-in">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {!isLoading && keywords.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center h-full bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                <TagIcon className="w-12 h-12 text-slate-300 mb-4"/>
                <h3 className="text-xl font-semibold text-slate-500">Your Keywords Will Appear Here</h3>
                <p className="text-slate-400 mt-2">Fill out the form above to generate keywords for your document.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
