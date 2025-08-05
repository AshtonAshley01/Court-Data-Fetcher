import { useState, useEffect } from 'react';
import axios from 'axios';
import { getCaptcha, fetchCaseDetails } from './api';
import OrdersPage from './components/orders'

function App() {
  const [captcha, setCaptcha] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCaseType, setSelectedCaseType] = useState('');
  const [caseTypes, setCaseTypes] = useState([]);
  const [caseNumber, setCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState('');
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3001/api/case-types')
      .then(res => setCaseTypes(res.data.caseTypes))
      .catch(err => console.error('Error fetching case types:', err));

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
      // setCaseData(response.data);
      setCaseData(response);
      console.log("Fetched case data:", response.data);
    } catch (err) {
      console.error(err);
      setError('❌ Failed to fetch case details. Please verify inputs and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-blue-100 flex flex-col items-center justify-center px-4 py-6">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200">
        <h1 className="text-3xl font-extrabold text-center text-blue-800 mb-6">
          Delhi High Court Case Fetcher
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Case Type */}
          <div>
            <label htmlFor="caseType" className="block text-sm font-medium text-gray-700 mb-1">
              Case Type
            </label>
            <select
              id="caseType"
              value={selectedCaseType}
              onChange={e => setSelectedCaseType(e.target.value)}
              className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            >
              <option value="">Select a Case Type</option>
              {caseTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Case Number */}
          <div>
            <label htmlFor="caseNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Case Number
            </label>
            <input
              type="text"
              id="caseNumber"
              value={caseNumber}
              onChange={e => setCaseNumber(e.target.value)}
              placeholder="e.g., 12345"
              className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Filing Year */}
          <div>
            <label htmlFor="filingYear" className="block text-sm font-medium text-gray-700 mb-1">
              Filing Year
            </label>
            <input
              type="text"
              id="filingYear"
              value={filingYear}
              onChange={e => setFilingYear(e.target.value)}
              maxLength="4"
              placeholder="e.g., 2023"
              className="block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Captcha */}
          <div>
            <label htmlFor="captchaInput" className="block text-sm font-medium text-gray-700 mb-1">
              Captcha
            </label>
            <div className="flex items-center space-x-3">
              <span className="bg-gray-100 text-gray-900 p-3 rounded-lg text-xl font-mono tracking-wide border border-gray-300 shadow-inner w-28 text-center">
                {captcha || '----'}
              </span>
              <button
                type="button"
                onClick={() => axios.get('http://localhost:3001/api/captcha').then(res => setCaptcha(res.data.captcha))}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md"
              >
                ↻
              </button>
            </div>
            <input
              type="text"
              id="captchaInput"
              value={captchaInput}
              onChange={e => setCaptchaInput(e.target.value)}
              placeholder="Enter captcha"
              className="mt-2 block w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white text-lg rounded-lg shadow-lg transition transform hover:scale-[1.02]"
          >
            {loading ? 'Fetching...' : 'Fetch Case Details'}
          </button>
        </form>

        {/* Error Message */}
        {error && <p className="mt-4 text-center text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

        {/* Case Details */}
        {/* {caseData && (
          <div className="mt-6 bg-blue-50 p-5 rounded-lg border border-blue-200 shadow-inner">
            <h2 className="text-lg font-bold text-blue-800 mb-3 text-center">Case Details</h2>
            <div className="space-y-1 text-gray-700 text-sm">
              <p><strong>Petitioner:</strong> {caseData.petitioner || 'N/A'}</p>
              <p><strong>Respondent:</strong> {caseData.respondent || 'N/A'}</p>
              <p><strong>Filing Date:</strong> {caseData.filingDate || 'N/A'}</p>
              <p><strong>Next Hearing Date:</strong> {caseData.nextHearingDate || 'N/A'}</p>
            </div>
          </div>
        )} */}



        {caseData?.caseDetails ? (
          caseData.caseDetails.length > 0 ? (
            <div className="mt-6 bg-white p-5 rounded-2xl shadow-md border border-gray-200 w-full overflow-x-auto">
              <h2 className="text-xl font-bold text-blue-800 mb-4 text-center">
                Case Details
              </h2>

              {/* Responsive Table Wrapper */}
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 text-sm text-left rounded-lg">
                  <thead className="bg-blue-100">
                    <tr>
                      <th className="p-3 border text-center">S.No</th>
                      <th className="p-3 border">Diary/Case No.</th>
                      <th className="p-3 border">Petitioner vs Respondent</th>
                      <th className="p-3 border">Listing Date/Court No.</th>
                      <th className="p-3 border text-center">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {caseData.caseDetails.map((caseItem, idx) => (
                      <tr 
                        key={idx} 
                        className="hover:bg-gray-50 transition duration-150 ease-in-out"
                      >
                        <td className="p-3 border text-center font-medium">{caseItem.serialNo}</td>
                        <td className="p-3 border whitespace-pre-wrap">{caseItem.diaryOrCaseNo}</td>
                        <td className="p-3 border whitespace-pre-wrap">{caseItem.petitionerVsRespondent}</td>
                        <td className="p-3 border whitespace-pre-wrap">{caseItem.listingDateOrCourtNo}</td>
                        {/* <td className="p-3 border text-center"> */}
                        <td className="p-2 border">
                        {caseItem.ordersLink && typeof caseItem.ordersLink === 'string' ? (
                          <a
                            href={`/orders?link=${encodeURIComponent(caseItem.ordersLink)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            View Orders
                          </a>
                        ) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-center text-gray-600 text-base font-medium">
              No case data found.
            </p>
          )
        ) : null}


      </div>
    </div>
  );
}

export default App;
