
import React from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { attributeOptions } from '../data/attributes';

import { UploadIcon } from './icons/UploadIcon';
import { PlayIcon } from './icons/PlayIcon';
import { PauseIcon } from './icons/PauseIcon';
import { StopIcon } from './icons/StopIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { LoadingSpinner } from './LoadingSpinner';

interface CSVRow {
  [key: string]: string;
}

interface ResultRow {
  status: 'pending' | 'processing' | 'completed' | 'error';
  keywords: string[];
  error?: string;
}

const ATTRIBUTE_KEYS = Object.keys(attributeOptions);
const RESERVED_KEYS = ['filename', 'title', 'content'];

const generateKeywordsFromApi = async (row: CSVRow): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
    
    const title = row.title || '';
    const content = row.content || '';

    const attributes = Object.entries(row)
      .filter(([key, value]) => !RESERVED_KEYS.includes(key.toLowerCase()) && value)
      .map(([key, value]) => ({ label: key, value }));

    const systemInstruction = `You are an expert in document analysis and search engine optimization. Your task is to generate a concise list of keywords from a given document title, description, and attributes. Follow these rules strictly:
1. Keywords must be in lowercase, unless they are acronyms which should be uppercase.
2. Filter out common words like "document", "information", "report", "the", "and", "a", "is", "in", "for", "to", "of".
3. Avoid repetition and synonyms. Use the most relevant term.
4. Limit keywords to a maximum of three words. Prefer single-word keywords for broad concepts and 2-3 word phrases for specific terms.
5. Extract keywords from the title, description, and the provided document attributes. The attributes provide important context.
6. The final output must be a JSON object with a single key "keywords" containing an array of strings.`;

    let attributesText = '';
    if (attributes.length > 0) {
      attributesText = '\n\nAttributes:\n' + attributes.map(attr => `- ${attr.label}: ${attr.value}`).join('\n');
    }

    const userPrompt = `Generate keywords for the following document:\n\nTitle: ${title}${attributesText}\n\nDescription: ${content}`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        keywords: { type: Type.ARRAY, description: 'A list of generated keywords.', items: { type: Type.STRING } },
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
      return result.keywords;
    } else {
      throw new Error('Could not parse keywords from the response.');
    }
};

const parseCSV = (text: string): { headers: string[], rows: CSVRow[] } => {
    const lines = text.trim().replace(/\r\n/g, '\n').split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const row: CSVRow = {};
      // This regex handles quoted fields
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      headers.forEach((header, i) => {
        const value = (values[i] || '').trim();
        row[header] = value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1) : value;
      });
      return row;
    });
    return { headers, rows };
};


export const BulkGenerator: React.FC = () => {
    const [file, setFile] = React.useState<File | null>(null);
    const [csvData, setCsvData] = React.useState<{ headers: string[], rows: CSVRow[] }>({ headers: [], rows: [] });
    const [results, setResults] = React.useState<ResultRow[]>([]);
    const [status, setStatus] = React.useState<'idle' | 'running' | 'paused' | 'done'>('idle');
    const [currentIndex, setCurrentIndex] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);
    const [copySuccess, setCopySuccess] = React.useState<string>('');

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (selectedFile.type !== 'text/csv') {
                setError('Please upload a valid CSV file.');
                return;
            }
            setFile(selectedFile);
            setError(null);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const parsed = parseCSV(text);
                if (parsed.rows.length === 0 || parsed.headers.length === 0) {
                    setError('CSV is empty or invalid.');
                    return;
                }
                setCsvData(parsed);
                setResults(Array(parsed.rows.length).fill({ status: 'pending', keywords: [] }));
            };
            reader.readAsText(selectedFile);
        }
    };

    const handleReset = () => {
        setStatus('idle');
        setFile(null);
        setCsvData({ headers: [], rows: [] });
        setResults([]);
        setCurrentIndex(0);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const toggleProcessing = () => {
        if (status === 'running') {
            setStatus('paused');
        } else {
            setStatus('running');
        }
    };

    const allKeywords = React.useMemo(() => Array.from(new Set(
        results
            .filter(r => r.status === 'completed' && r.keywords?.length > 0)
            .flatMap(r => r.keywords)
    )), [results]);

    const handleCopyKeywords = () => {
        const keywordsToCopy = allKeywords.join('; ');

        if (keywordsToCopy) {
            navigator.clipboard.writeText(keywordsToCopy).then(() => {
                setCopySuccess('Copied!');
                setTimeout(() => setCopySuccess(''), 2000);
            }, () => {
                setCopySuccess('Failed to copy!');
                setTimeout(() => setCopySuccess(''), 2000);
            });
        }
    };
    
    React.useEffect(() => {
        if (status !== 'running' || currentIndex >= csvData.rows.length) {
            if (status === 'running' && currentIndex >= csvData.rows.length) {
              setStatus('done');
            }
            return;
        }
    
        let isCancelled = false;
    
        const processRow = async () => {
            setResults(prev => {
                const newResults = [...prev];
                newResults[currentIndex] = { ...newResults[currentIndex], status: 'processing' };
                return newResults;
            });
    
            try {
                const keywords = await generateKeywordsFromApi(csvData.rows[currentIndex]);
                if (!isCancelled) {
                    setResults(prev => {
                        const newResults = [...prev];
                        newResults[currentIndex] = { status: 'completed', keywords };
                        return newResults;
                    });
                }
            } catch (err) {
                if (!isCancelled) {
                    setResults(prev => {
                        const newResults = [...prev];
                        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                        newResults[currentIndex] = { status: 'error', keywords: [], error: errorMessage };
                        return newResults;
                    });
                }
            } finally {
                if (!isCancelled) {
                    setCurrentIndex(prev => prev + 1);
                }
            }
        };
    
        processRow();
    
        return () => {
            isCancelled = true;
        };
    }, [status, currentIndex, csvData.rows]);

    const handleDownload = () => {
      const headers = [...csvData.headers, 'Keywords', 'Status'];
      const rows = csvData.rows.map((row, index) => {
          const result = results[index];
          const keywords = result.keywords.join('; ');
          const status = result.status === 'error' ? `Error: ${result.error}` : result.status;
          const originalValues = csvData.headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`);
          return [...originalValues, `"${keywords}"`, `"${status}"`].join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `keywords_${file?.name || 'results.csv'}`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

    const progress = csvData.rows.length > 0 ? (currentIndex / csvData.rows.length) * 100 : 0;

    return (
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 animate-slide-in-up space-y-6">
            {!file ? (
                <>
                    <h2 className="text-xl font-bold text-slate-700">Upload CSV for Bulk Generation</h2>
                    <div className="flex justify-center items-center w-full">
                        <label htmlFor="csv-upload" className="flex flex-col justify-center items-center w-full h-64 bg-slate-50 rounded-lg border-2 border-slate-300 border-dashed cursor-pointer hover:bg-slate-100 transition-colors">
                            <div className="flex flex-col justify-center items-center pt-5 pb-6">
                                <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
                                <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-slate-500">CSV file (up to 10MB)</p>
                                <p className="text-xs text-slate-400 mt-2">Required header: 'fileName'. Optional: 'title', 'content', and other attributes.</p>
                            </div>
                            <input id="csv-upload" type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileChange} />
                        </label>
                    </div>
                    {error && <p className="text-sm text-red-600 animate-fade-in">{error}</p>}
                </>
            ) : (
                <>
                    <div>
                        <h2 className="text-xl font-bold text-slate-700">Processing: <span className="font-medium text-cyan-600">{file.name}</span></h2>
                        <p className="text-sm text-slate-500">{csvData.rows.length} records found.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <button
                                onClick={toggleProcessing}
                                disabled={status === 'done'}
                                className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {status === 'running' ? <><PauseIcon className="w-5 h-5" /> Pause</> : <><PlayIcon className="w-5 h-5" /> {status === 'paused' ? 'Resume' : 'Start'}</>}
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-colors"
                            >
                                <StopIcon className="w-5 h-5" /> Reset
                            </button>
                             <button
                                onClick={handleCopyKeywords}
                                disabled={allKeywords.length === 0 || !!copySuccess}
                                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                {copySuccess || 'Copy Generated Keywords'}
                            </button>
                             <button
                                onClick={handleDownload}
                                disabled={status !== 'done'}
                                className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                            >
                                <DownloadIcon className="w-5 h-5" /> Download Results
                            </button>
                        </div>

                        <div className="w-full bg-slate-200 rounded-full h-4">
                            <div className="bg-cyan-600 h-4 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-sm text-slate-600 text-right">Processed {currentIndex} / {csvData.rows.length}</p>
                    </div>
                    
                    <div className="overflow-x-auto max-h-96 relative border rounded-lg">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">#</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">File Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Title</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Keywords</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {csvData.rows.map((row, index) => (
                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">{index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">{row.fileName || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 truncate max-w-xs">{row.title || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            {results[index]?.status === 'processing' && <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-cyan-500"></div>}
                                            {results[index]?.status === 'completed' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                                            {results[index]?.status === 'error' && <XCircleIcon className="w-6 h-6 text-red-500" title={results[index]?.error} />}
                                            {results[index]?.status === 'pending' && <span className="text-slate-400">Pending</span>}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            <div className="flex flex-wrap gap-1">
                                                {results[index]?.keywords.map((kw, i) => <span key={i} className="bg-slate-200 text-slate-700 text-xs font-medium px-2 py-1 rounded-md">{kw}</span>)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
