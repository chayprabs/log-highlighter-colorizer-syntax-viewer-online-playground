'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { highlightLog } from '@/lib/highlighter';

const SAMPLE_LOG = `2024-01-15 10:30:45.123 INFO Starting application server
[2024-01-15] GET /api/users?id=123&active=true HTTP/1.1 200 OK
POST /api/users {"name": "John", "email": "john@example.com"} 201 Created
Error: Connection failed to 192.168.1.100:8080 - null pointer exception
User 550e8400-e29b-41d4-a716-446655440000 logged in from 10.0.0.1/24
WARN: Config file not found at /etc/app/config.yml
DELETE /api/users/456 status=pending 204 No Content
Downloaded file from https://cdn.example.com/repo/release-v2.0.0.tar.gz?token=abc123
localhost:3000 processing request from [::1]:54321
TRACE: Memory at 0x7f8c8c0c0c0c allocated for buffer`;

export default function Home() {
  const [input, setInput] = useState(SAMPLE_LOG);
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const processInput = useCallback((text: string) => {
    const result = highlightLog(text);
    setOutput(result);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInput(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      processInput(newValue);
    }, 200);
  };

  useEffect(() => {
    processInput(input);
  }, [input, processInput]);

  const handleCopyHTML = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClear = () => {
    setInput('');
  };

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-400 mb-2">Tailspin Web</h1>
          <p className="text-gray-400">A web port of the tailspin log file highlighter</p>
        </header>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="input" className="text-sm font-medium text-gray-300">
                Input Log
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleClear}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setInput(SAMPLE_LOG)}
                  className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                >
                  Sample
                </button>
              </div>
            </div>
            <textarea
              id="input"
              value={input}
              onChange={handleInputChange}
              className="w-full h-80 bg-gray-800 text-gray-100 p-4 rounded-lg border border-gray-700 font-mono text-sm resize-none focus:outline-none focus:border-cyan-500"
              placeholder="Paste your log content here..."
              spellCheck={false}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-300">
                Highlighted Output
              </label>
              <button
                onClick={handleCopyHTML}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {copied ? 'Copied!' : 'Copy HTML'}
              </button>
            </div>
            <div
              className="w-full h-80 bg-gray-950 text-gray-100 p-4 rounded-lg border border-gray-700 font-mono text-sm overflow-auto whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: output }}
            />
          </div>
        </div>

        <section className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-200 mb-3">Highlight Groups</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-pink-400">Dates</span>
              <span className="text-gray-500">2024-01-15, 15:04:05, ISO8601</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">Keywords</span>
              <span className="text-gray-500">null, true, false, GET, POST</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">URLs</span>
              <span className="text-gray-500">https://example.com/path</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">Numbers</span>
              <span className="text-gray-500">42, 3.14, 1000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">IPv4</span>
              <span className="text-gray-500">192.168.1.1</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">Quotes</span>
              <span className="text-gray-500">&quot;quoted text&quot;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">Paths</span>
              <span className="text-gray-500">/usr/local/bin</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400">UUIDs</span>
              <span className="text-gray-500">550e8400-e29b-41d4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Key-Value</span>
              <span className="text-gray-500">key=value</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400">Status 2xx</span>
              <span className="text-gray-500">200 OK</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">Status 3xx</span>
              <span className="text-gray-500">301 Redirect</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">Status 4xx/5xx</span>
              <span className="text-gray-500">404 Not Found</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
