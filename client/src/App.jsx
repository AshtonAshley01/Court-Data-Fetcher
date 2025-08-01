import { useState, useEffect } from 'react';
import { getCaptcha, fetchCaseDetails } from './api';
import CaseForm from './components/CaseForm';
import CaseDetails from './components/CaseDetails';

function App() {
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [caseType, setCaseType] = useState('FAO');
  const [caseNumber, setCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  // Fetch captcha on component mount
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      const captchaText = await getCaptcha();
      setCaptcha(captchaText);
    } catch (error) {
      console.error('Error fetching captcha:', error);
      setCaptcha('Error loading captcha');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCaptcha = () => {
    fetchCaptcha();
    setCaptchaInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setCaseData(null);
      setLoading(true);
      const data = await fetchCaseDetails(caseType, caseNumber, filingYear, captchaInput);
      setCaseData(data.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch case details. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-4xl font-bold mb-6">Delhi High Court Case Fetcher</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg w-96 space-y-4">
        <div>
          <label className="block mb-1">Case Type:</label>
          <select 
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
          >
            <option value="FAO">FAO</option>
            <option value="CS(OS)">CS(OS)</option>
          </select>
        </div>

        <div>
          <label className="block mb-1">Case Number:</label>
          <input 
            type="text"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Filing Year:</label>
          <input 
            type="text"
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            value={filingYear}
            onChange={(e) => setFilingYear(e.target.value)}
          />
        </div>

        <div>
          <label className="block mb-1">Captcha:</label>
          <div className="flex items-center space-x-2">
            <span className="bg-gray-100 p-2 rounded text-black font-mono text-lg min-w-[80px] text-center">
              {loading ? 'Loading...' : captcha}
            </span>
            <button 
              type="button" 
              className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
              onClick={handleRefreshCaptcha}
              disabled={loading}
            >
              ↻
            </button>
          </div>
          <input 
            type="text"
            placeholder="Enter captcha" 
            className="mt-2 w-full p-2 rounded bg-gray-700 border border-gray-600"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full bg-green-600 py-2 rounded hover:bg-green-700 disabled:opacity-50" disabled={loading}>
          {loading ? 'Fetching...' : 'Fetch Case Details'}
        </button>
      </form>

      {error && <p className="mt-4 text-red-500">{error}</p>}
      {caseData && <CaseDetails data={caseData} />}
    </div>
  );
}

export default App;
