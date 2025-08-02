import { useState, useEffect } from 'react';
import axios from 'axios'; // ✅ Import axios
import { getCaptcha, fetchCaseDetails } from './api';

function App() {
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState(''); // ✅ Added state
  const [caseTypes, setCaseTypes] = useState([]);              // ✅ Added state
  const [caseNumber, setCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch case types
    axios.get('http://localhost:3001/api/case-types')
      .then(res => setCaseTypes(res.data.caseTypes))
      .catch(err => console.error('Error fetching case types:', err));

    // Fetch captcha
    axios.get('http://localhost:3001/api/captcha')
      .then(res => setCaptcha(res.data.captcha))
      .catch(err => console.error('Error fetching captcha:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setCaseData(null);
      setLoading(true);
      const response = await fetchCaseDetails(selectedCaseType, caseNumber, filingYear, captchaInput);
      setCaseData(response.data);
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
            value={selectedCaseType}
            onChange={e => setSelectedCaseType(e.target.value)}
          >
            <option value="">Select</option>
            {caseTypes.map((type, idx) => (
              <option key={idx} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1">Case Number:</label>
          <input
            type="text"
            value={caseNumber}
            onChange={e => setCaseNumber(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1">Filing Year:</label>
          <input
            type="text"
            value={filingYear}
            onChange={e => setFilingYear(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
        </div>

        <div>
          <label className="block mb-1">Captcha:</label>
          <div className="flex items-center space-x-2">
            <span className="bg-gray-100 p-2 rounded text-black font-mono text-lg min-w-[80px] text-center">
              {captcha || 'Loading...'}
            </span>
            <button
              type="button"
              className="bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
              onClick={() =>
                axios.get('http://localhost:3001/api/captcha').then(res => setCaptcha(res.data.captcha))
              }
            >
              ↻
            </button>
          </div>
          <input
            type="text"
            placeholder="Enter captcha"
            className="mt-2 w-full p-2 rounded bg-gray-700 border border-gray-600"
            value={captchaInput}
            onChange={e => setCaptchaInput(e.target.value)}
          />
        </div>

        <button type="submit" className="w-full bg-green-600 py-2 rounded hover:bg-green-700">
          {loading ? 'Fetching...' : 'Fetch Case Details'}
        </button>
      </form>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {caseData && (
        <div className="bg-gray-800 mt-6 p-4 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-2">Case Details</h2>
          <p><strong>Petitioner:</strong> {caseData.petitioner}</p>
          <p><strong>Respondent:</strong> {caseData.respondent}</p>
          <p><strong>Filing Date:</strong> {caseData.filingDate}</p>
          <p><strong>Next Hearing Date:</strong> {caseData.nextHearingDate}</p>
        </div>
      )}
    </div>
  );
}

export default App;
