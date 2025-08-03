import { useState, useEffect } from 'react';
import { getCaptcha, fetchCaseDetails } from '../api'; // Assuming these are correctly imported

export default function CaseForm({ onResult }) {
  const [caseType, setCaseType] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState('');
  const [captchaInput, setCaptchaInput] = useState(''); // Renamed to avoid conflict
  const [captchaImageUrl, setCaptchaImageUrl] = useState(''); // Renamed for clarity
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); // State for handling errors

  // Load captcha on page load
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const imgUrl = await getCaptcha(); // Assuming getCaptcha returns an image URL or base64 string
      setCaptchaImageUrl(imgUrl);
      setError(''); // Clear any previous captcha errors
    } catch (err) {
      console.error('Error loading captcha:', err);
      setError('Failed to load captcha. Please try refreshing.');
      setCaptchaImageUrl(''); // Clear image on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const data = await fetchCaseDetails(caseType, caseNumber, filingYear, captchaInput);
      onResult(data.data); // Assuming data.data holds the actual case details
      setCaptchaInput(''); // Clear captcha input on successful submission
    } catch (err) {
      console.error('Fetch error:', err);
      // More specific error handling based on API response
      setError(err.response?.data?.error || 'Failed to fetch case details. Please check your inputs and try again.');
    } finally {
      setLoading(false);
      await loadCaptcha(); // Always refresh captcha after attempt
    }
  };

  return (
    <div className="case-form-container">
      <h2 className="form-title">Delhi High Court Case Details</h2>
      <form onSubmit={handleSubmit} className="case-form">
        <div className="form-group">
          <label htmlFor="caseType">Case Type:</label>
          <select
            id="caseType"
            value={caseType}
            onChange={(e) => setCaseType(e.target.value)}
            required
            className="form-input"
          >
            <option value="">Select Case Type</option>
            {/* These options should ideally come from an API if dynamic */}
            <option value="FAO">FAO</option>
            <option value="CrlA">CrlA</option>
            <option value="W.P.(C)">W.P.(C)</option>
            {/* Add more options as needed */}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="caseNumber">Case Number:</label>
          <input
            type="number"
            id="caseNumber"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            required
            className="form-input"
            placeholder="e.g., 12345"
          />
        </div>

        <div className="form-group">
          <label htmlFor="filingYear">Filing Year:</label>
          <input
            type="number"
            id="filingYear"
            value={filingYear}
            onChange={(e) => setFilingYear(e.target.value)}
            required
            className="form-input"
            placeholder="e.g., 2023"
            maxLength="4" // Ensure only 4 digits for year
          />
        </div>

        <div className="form-group">
          <label htmlFor="captcha">Captcha:</label>
          <div className="captcha-group">
            {captchaImageUrl ? (
              <img src={captchaImageUrl} alt="Captcha" className="captcha-image" />
            ) : (
              <span className="captcha-placeholder">Loading Captcha...</span>
            )}
            <button type="button" onClick={loadCaptcha} className="refresh-button" title="Refresh Captcha">
              ↻
            </button>
          </div>
          <input
            type="text"
            id="captcha"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
            className="form-input"
            placeholder="Enter captcha text"
            autoComplete="off" // Prevent browser autofill
          />
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" disabled={loading} className="submit-button">
          {loading ? 'Fetching...' : 'Fetch Case Details'}
        </button>
      </form>
    </div>
  );
}