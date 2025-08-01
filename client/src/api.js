import axios from 'axios';

const API_BASE = 'http://localhost:3001/api'; // Backend server

// Fetch captcha text
export async function getCaptcha() {
  const res = await axios.get(`${API_BASE}/captcha`);
  return res.data.captcha;
}

// Fetch case details
export async function fetchCaseDetails(caseType, caseNumber, filingYear, captcha) {
  const res = await axios.post(`${API_BASE}/fetch-case-data`, {
    caseType,
    caseNumber,
    filingYear,
    captcha
  });
  return res.data;
}
