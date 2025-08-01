import { useState, useEffect } from 'react';
import { getCaptcha, fetchCaseDetails } from '../api';

export default function CaseForm({ onResult }) {
  const [caseType, setCaseType] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [filingYear, setFilingYear] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [loading, setLoading] = useState(false);

  // Load captcha on page load
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    const img = await getCaptcha();
    setCaptchaImage(img);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await fetchCaseDetails(caseType, caseNumber, filingYear, captcha);
      onResult(data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to fetch case details.');
    } finally {
      setLoading(false);
      setCaptcha('');
      await loadCaptcha(); // Refresh captcha after each request
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Case Type:</label>
        <select value={caseType} onChange={(e) => setCaseType(e.target.value)} required>
          <option value="">Select Case Type</option>
          <option value="FAO">FAO</option>
          <option value="CrlA">CrlA</option>
          <option value="W.P.(C)">W.P.(C)</option>
        </select>
      </div>

      <div>
        <label>Case Number:</label>
        <input
          type="number"
          value={caseNumber}
          onChange={(e) => setCaseNumber(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Filing Year:</label>
        <input
          type="number"
          value={filingYear}
          onChange={(e) => setFilingYear(e.target.value)}
          required
        />
      </div>

      <div>
        <label>Captcha:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {captchaImage && <p className="captcha-text">{captcha}</p>}
          <button type="button" onClick={loadCaptcha}>↻</button>
        </div>
        <input
          type="text"
          value={captcha}
          onChange={(e) => setCaptcha(e.target.value)}
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Fetching...' : 'Fetch Case Details'}
      </button>
    </form>
  );
}
