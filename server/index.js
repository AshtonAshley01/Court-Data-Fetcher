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

// Fetch CAPTCHA image (for manual input - still useful for debugging)
app.get('/api/captcha', async (req, res) => {
    try {
        const browser = await playwright.chromium.launch();
        const page = await browser.newPage();

        await page.goto('https://delhihighcourt.nic.in/app/get-case-type-status', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
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
            waitUntil: 'domcontentloaded',
            timeout: 60000
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

// Main fetch endpoint - now handles CAPTCHA internally
app.post('/api/fetch-case-data', async (req, res) => {
    const { caseType, caseNumber, filingYear } = req.body;

    if (!caseType || !caseNumber || !filingYear) {
        return res.status(400).json({ error: 'caseType, caseNumber, and filingYear are required.' });
    }

    let browser;
    try {
        browser = await playwright.chromium.launch({ 
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ] 
        });
        const page = await browser.newPage();

        console.log('Opening the court website...');
        // Open the page
        await page.goto('https://delhihighcourt.nic.in/app/get-case-type-status', { 
            waitUntil: 'domcontentloaded',
            timeout: 60000 
        });

        // Wait for the captcha to load and extract it
        console.log('Waiting for CAPTCHA to load...');
        await page.waitForSelector('#captcha-code', { timeout: 30000 });
        
        const captchaText = await page.$eval('#captcha-code', el => el.textContent.trim());
        console.log('CAPTCHA extracted:', captchaText);

        console.log('Filling form with provided data...');
        // Fill the form with the provided data
        await page.selectOption('#case_type', caseType);
        await page.fill('#case_number', caseNumber);
        await page.selectOption('#case_year', filingYear);
        await page.fill('#captchaInput', captchaText);

        console.log('Submitting form...');
        // Submit the form - no navigation expected, just AJAX call
        await page.click('#search');
        
        // Wait a moment for the AJAX request to initiate
        await page.waitForTimeout(2000);

        // Poll the table multiple times to wait for data to load
        console.log('Waiting for case data to load...');
        let caseDetails = [];
        
        for (let i = 0; i < 10; i++) {
            console.log(`Attempt ${i + 1}: Checking for table data...`);

            const hasData = await page.evaluate(() => {
                const rows = document.querySelectorAll('#caseTable tbody tr');
                
                if (!rows.length) return false;

                // If only one row exists and has dt-empty, no data yet
                if (rows.length === 1 && rows[0].querySelector('td.dt-empty')) {
                    return false;
                }

                return true; // Data rows available
            });

            if (hasData) {
                console.log('Data found in table, extracting...');
                
                // Extract table data
                caseDetails = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('#caseTable tbody tr'));

                    if (rows.length === 1 && rows[0].querySelector('td.dt-empty')) {
                        return []; // No case data
                    }

                    return rows.map(row => {
                        const cells = row.querySelectorAll('td');
                        console.log(cells);
                
                        // Extract orders link from the 2nd cell (diary/case no column)
                        const ordersLinkElement = cells[1]?.querySelector('a[href*="case-type-status-details"]');
                        const ordersLink = ordersLinkElement ? ordersLinkElement.href : '';
                
                        return {
                            serialNo: cells[0]?.innerText.trim() || '',
                            diaryOrCaseNo: cells[1]?.innerText.trim() || '',
                            ordersLink,
                            petitionerVsRespondent: cells[2]?.innerText.trim() || '',
                            listingDateOrCourtNo: cells[3]?.innerText.trim() || ''
                        };
                    });
                });
                
                break;
            }

            console.log('No data yet, waiting 1 seconds...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        console.log('Case details extracted:', caseDetails);

        // Fetch additional order details for each case
        for (const caseItem of caseDetails) {
            if (caseItem.ordersLink) {
                const ordersPage = await browser.newPage();
                await ordersPage.goto(caseItem.ordersLink, { waitUntil: 'domcontentloaded', timeout: 60000 });
        
                await ordersPage.waitForSelector('table', { timeout: 30000 });
        
                // Extract filing date & next hearing date
                const caseMeta = await ordersPage.evaluate(() => ({
                    filingDate: document.querySelector('#lblFilingDate')?.innerText.trim() || '',
                    nextHearingDate: document.querySelector('#lblNextHearingDate')?.innerText.trim() || ''
                }));
        
                const ordersData = await ordersPage.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    return rows.map(row => {
                        const cells = row.querySelectorAll('td');
                        console.log(cells);
                        return {
                            serialNo: cells[0]?.innerText.trim() || '',
                            caseNoOrOrderLink: cells[1]?.innerText.trim() || '',
                            dateOfOrder: cells[2]?.innerText.trim() || '',
                            corrigendum: cells[3]?.innerText.trim() || '',
                            hindiOrder: cells[4]?.innerText.trim() || '',
                            pdfLink: cells[1]?.querySelector('a')?.href || ''
                        };
                    });
                });
        
                caseItem.filingDate = caseMeta.filingDate;
                caseItem.nextHearingDate = caseMeta.nextHearingDate;
                caseItem.ordersData = ordersData;
        
                // delete caseItem.ordersLink; // remove raw link from response

                // Keep the ordersLink for frontend use
                caseItem.ordersLink = caseItem.ordersLink || '';
        
                await ordersPage.close();
            }
        }
        

        // Save the query in the database
        const rawResponse = JSON.stringify(caseDetails);
        db.run(
            'INSERT INTO queries (caseType, caseNumber, filingYear, rawResponse) VALUES (?, ?, ?, ?)',
            [caseType, caseNumber, filingYear, rawResponse],
            function (err) {
                if (err) console.error('Database error:', err.message);
                else console.log('Query saved to database with ID:', this.lastID);
            }
        );


        res.json({ 
            success: true, 
            caseDetails,
            captchaUsed: captchaText,
            message: caseDetails.length > 0 ? 'Case data found successfully' : 'No case data found for the given parameters'
        });

    } catch (err) {
        console.error('Error in fetch-case-data:', err);
        res.status(500).json({ 
            error: 'Failed to fetch case data', 
            details: err.message 
        });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
});


app.get('/api/case-orders', async (req, res) => {
    const { link } = req.query; // Pass the ordersLink as query

    if (!link) {
        return res.status(400).json({ error: 'Missing orders link' });
    }

    let browser;
    try {
        browser = await playwright.chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log('Opening case orders page:', link);
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 60000 });

        // Poll for orders table to ensure data is loaded
        let ordersData = [];
        for (let i = 0; i < 10; i++) {
            const hasOrders = await page.evaluate(() => {
                const rows = document.querySelectorAll('table tbody tr');
                if (!rows.length) return false;
                if (rows.length === 1 && rows[0].querySelector('td.dt-empty')) return false;
                return true;
            });

            if (hasOrders) {
                console.log('Orders table data found, extracting...');
                ordersData = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    return rows.map(row => {
                        const cells = row.querySelectorAll('td');
                        return {
                            serialNo: cells[0]?.innerText.trim() || '',
                            caseNoOrOrderLink: cells[1]?.innerText.trim() || '',
                            dateOfOrder: cells[2]?.innerText.trim() || '',
                            corrigendum: cells[3]?.innerText.trim() || '',
                            hindiOrder: cells[4]?.innerText.trim() || '',
                            pdfLink: cells[1]?.querySelector('a')?.href || ''
                        };
                    });
                });
                break;
            }

            console.log(`Orders not loaded yet. Retrying in 1s... (${i + 1}/10)`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        res.json({ success: true, ordersData });
    } catch (err) {
        console.error('Error fetching case orders:', err);
        res.status(500).json({ error: 'Failed to fetch case orders', details: err.message });
    } finally {
        if (browser) await browser.close();
    }
});



// Optional: Get query history
app.get('/api/query-history', (req, res) => {
    db.all('SELECT * FROM queries ORDER BY timestamp DESC LIMIT 50', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json({ queries: rows });
        }
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));