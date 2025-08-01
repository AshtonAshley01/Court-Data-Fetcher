const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const playwright = require('playwright');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(path.join(__dirname, 'data.db'), (err) => {
    if (err) console.error('Error opening database:', err.message);
    else {
        console.log('Connected to SQLite DB');
        db.run(`
            CREATE TABLE IF NOT EXISTS queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                caseType TEXT,
                caseNumber TEXT,
                filingYear TEXT,
                rawResponse TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
});

// Health check
app.get('/api/health', (req, res) => res.json({ message: 'Server is healthy!' }));

// Fetch CAPTCHA image (optional, for manual input)
app.get('/api/captcha', async (req, res) => {
    try {
        const browser = await playwright.chromium.launch();
        const page = await browser.newPage();

        await page.goto('https://delhihighcourt.nic.in/app/get-case-type-status', {
            waitUntil: 'domcontentloaded'
        });

        // Wait for the captcha text to appear
        await page.waitForSelector('#captcha-code', { timeout: 10000 });

        // Extract captcha text instead of screenshot
        const captchaText = await page.$eval('#captcha-code', el => el.textContent.trim());

        await browser.close();

        res.json({ captcha: captchaText });
    } catch (error) {
        console.error('Error fetching captcha:', error);
        res.status(500).json({ error: 'Failed to fetch captcha' });
    }
});



// Main fetch endpoint
app.post('/api/fetch-case-data', async (req, res) => {
    const { caseType, caseNumber, filingYear, captcha } = req.body;

    if (!caseType || !caseNumber || !filingYear || !captcha) {
        return res.status(400).json({ error: 'All fields including captcha are required.' });
    }

    let browser;
    try {
        browser = await playwright.chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://delhihighcourt.nic.in/case-status', { waitUntil: 'domcontentloaded' });

        // Fill out the form
        await page.selectOption('#ddlCaseType', caseType);
        await page.fill('#txtCaseNumber', caseNumber);
        await page.fill('#txtCaseYear', filingYear);
        await page.fill('#txtCaptcha', captcha);

        await page.click('#btnSearch');
        await page.waitForSelector('#caseDetails', { timeout: 15000 });

        const rawResponse = await page.content();

        // Extract details using actual selectors
        const caseDetails = await page.evaluate(() => {
            return {
                petitioner: document.querySelector('#lblPetitioner')?.textContent.trim() || '',
                respondent: document.querySelector('#lblRespondent')?.textContent.trim() || '',
                filingDate: document.querySelector('#lblFilingDate')?.textContent.trim() || '',
                nextHearingDate: document.querySelector('#lblNextHearingDate')?.textContent.trim() || '',
                orders: Array.from(document.querySelectorAll('#ordersList a')).map(a => ({
                    text: a.textContent.trim(),
                    url: a.href
                }))
            };
        });

        // Save to database
        db.run(
            'INSERT INTO queries (caseType, caseNumber, filingYear, rawResponse) VALUES (?, ?, ?, ?)',
            [caseType, caseNumber, filingYear, rawResponse]
        );

        res.json({ message: 'Success', data: caseDetails });
    } catch (err) {
        console.error('Scraping error:', err);
        res.status(500).json({ error: 'Failed to fetch case data', details: err.message });
    } finally {
        if (browser) await browser.close();
    }
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
