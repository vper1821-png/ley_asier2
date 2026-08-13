import { useState } from 'react';
import { useI18n } from '../i18n/context';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { api } from '../api/api';

export default function AIAnalysis() {
  const { t } = useI18n();
  const { token } = useAuth();
  const { addToast } = useToast();
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setResult('');
    try {
      const data = await api.post('/ai/analyze', new URLSearchParams({ prompt: prompt.trim(), token }));
      if (data.error) {
        addToast('error', 'AI Error', data.error);
        setResult(data.error);
      } else {
        setResult(data.response || 'No response');
      }
    } catch {
      addToast('error', 'Connection Error', 'Could not reach AI service');
      setResult('Error connecting to AI service');
    }
    setAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-border-theme flex-shrink-0">
        <h2 className="text-[14px] font-semibold text-text-heading">{t('ai.title')}</h2>
        <p className="text-[11px] text-text-muted mt-0.5">{t('ai.desc')}</p>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div className="bg-bg-panel/60 border border-border-theme rounded-lg p-4">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder={t('ai.analyzeSecurity')}
            className="w-full bg-bg-base border border-border-theme rounded-lg p-3 text-[12px] text-white placeholder-text-subtle focus:outline-none focus:border-primary-500 resize-none h-24" />
          <button onClick={handleAnalyze} disabled={analyzing || !prompt.trim()}
            className="mt-3 px-4 py-2 rounded-lg text-[12px] font-medium bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-30 disabled:pointer-events-none">
            {analyzing ? (
              <span className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Analyzing...
              </span>
            ) : t('ai.analyze')}
          </button>
        </div>
        {result && (
          <div className="bg-bg-panel/60 border border-border-theme rounded-lg p-4">
            <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2">Result</p>
            <p className="text-[12px] text-text-body whitespace-pre-wrap">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
