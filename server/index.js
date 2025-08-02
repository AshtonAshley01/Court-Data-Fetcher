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
        await page.waitForSelector('#captcha-code', { timeout: 30000 });

        // Extract captcha text instead of screenshot
        const captchaText = await page.$eval('#captcha-code', el => el.textContent.trim());

        await browser.close();

        res.json({ captcha: captchaText });
    } catch (error) {
        console.error('Error fetching captcha:', error);
        res.status(500).json({ error: 'Failed to fetch captcha' });
    }
});


app.get('/api/case-types', async (req, res) => {
    try {
        const browser = await playwright.chromium.launch({ headless: true });
        const page = await browser.newPage();
        await page.goto('https://delhihighcourt.nic.in/app/get-case-type-status', {
            waitUntil: 'domcontentloaded'
        });

        // Scrape all case types
        const caseTypes = await page.$$eval('#case_type option', options =>
            options
                .map(o => o.textContent.trim())
                .filter(text => text && text !== 'Select')
        );

        await browser.close();

        res.json({ caseTypes });
    } catch (error) {
        console.error('Error fetching case types:', error);
        res.status(500).json({ error: 'Failed to fetch case types' });
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

        // Open the page
        await page.goto('https://delhihighcourt.nic.in/app/get-case-type-status', { waitUntil: 'domcontentloaded' });

        // Fill form
        await page.selectOption('#case_type', caseType);
        await page.fill('#case_number', caseNumber);
        await page.selectOption('#case_year', filingYear);
        await page.fill('#captchaInput', captcha);

        // Click search
        await Promise.all([
            page.click('#search'),
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null)
        ]);

        // Check if captcha error appears
        const errorText = await page.evaluate(() => {
            const errorEl = document.querySelector('.error, #error_message');
            return errorEl ? errorEl.textContent.trim() : null;
        });

        if (errorText && errorText.toLowerCase().includes('captcha')) {
            throw new Error('Invalid captcha or captcha expired');
        }

        // Wait for case details or table
        await page.waitForSelector('#caseTable, #caseDetails, .dataTables_wrapper', { timeout: 15000 });

        const caseDetails = await page.evaluate(() => {
            const table = document.querySelector('#caseTable');
            if (table) {
                return Array.from(table.querySelectorAll('tbody tr')).map(row =>
                    Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim())
                );
            }
            return {
                petitioner: document.querySelector('#lblPetitioner')?.textContent.trim() || '',
                respondent: document.querySelector('#lblRespondent')?.textContent.trim() || '',
                filingDate: document.querySelector('#lblFilingDate')?.textContent.trim() || '',
                nextHearingDate: document.querySelector('#lblNextHearingDate')?.textContent.trim() || ''
            };
        });

        res.json({ success: true, caseDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        if (browser) await browser.close();
    }
});


app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
