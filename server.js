const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { Parser } = require('json2csv');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // bind to all IPs

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const DATA_DIR = path.join(__dirname, 'data');
const FEEDBACK_FILE = path.join(DATA_DIR, 'feedback.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');

async function ensureDataDirectory() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });

        try { await fs.access(FEEDBACK_FILE); }
        catch { await fs.writeFile(FEEDBACK_FILE, JSON.stringify([], null, 2)); }

        try { await fs.access(SUBMISSIONS_FILE); }
        catch {
            await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify({
                totalSubmissions: 0,
                submissions: [],
                lastUpdated: new Date().toISOString()
            }, null, 2));
        }
    } catch (error) {
        console.error('Error creating data directory:', error);
    }
}

const employees = [
            {id: 1, name: 'Jitendra Nikhade', number: 1},
            {id: 2, name: 'Surekha Pande', number: 2},
            {id: 3, name: 'Dattatray Raut', number: 3},
            {id: 4, name: 'Kalpana Chandele', number: 4},
            {id: 5, name: 'Nilesh Shekar', number: 5},
            {id: 6, name: 'Pawan Kulthe', number: 6},
            {id: 7, name: 'Nitin Ambade', number: 7},
            {id: 8, name: 'Kiran Supe', number: 8},
            {id: 9, name: 'Hemant Kadnake', number: 9},
            {id: 10, name: 'Naresh Nikhare', number: 10},
            {id: 11, name: 'Madhuri Nimkar', number: 11},
            {id: 12, name: 'Kishor Eknar', number: 12},
            {id: 13, name: 'Bhagwan Chandrawanshi', number: 13},
            {id: 14, name: 'Abhijeet Tekam', number: 14},
            {id: 16, name: 'Prakash Bonde', number: 16},
            {id: 17, name: 'Rushikesh Pullarwar', number: 17},
            {id: 18, name: 'Priya Lekurwale', number: 18},
            {id: 19, name: 'Dipak Dafade', number: 19},
            {id: 20, name: 'Shalini Kasare', number: 20},
            {id: 21, name: 'Samir Kahile', number: 21},
            {id: 22, name: 'Sachin Meshram', number: 22},
            {id: 23, name: 'Chandrakant Kubade', number: 23},
            {id: 24, name: 'Kavita Patil', number: 24},
            {id: 25, name: 'Nayankumar Hargule', number: 25},
            {id: 26, name: 'Parmeshwar Ambore', number: 26},
            {id: 27, name: 'Nitish Halde', number: 27},
            {id: 28, name: 'Ajay Mahadole', number: 28},
            {id: 29, name: 'Mohan Nagpure', number: 29},
            {id: 30, name: 'Paritosh Shukla', number: 30},
            {id: 31, name: 'Antariksh Kumbhare', number: 31},
            {id: 32, name: 'Shweta Lokhande', number: 32},
            {id: 33, name: 'Bharat Nimaje', number: 33},
            {id: 34, name: 'Chandrashekhar Ukey', number: 34},
            {id: 35, name: 'Navkiran shiraskar', number: 35},
            {id: 36, name: 'Prasanna Waradpande', number: 36},
            {id: 37, name: 'Vijay Dhage', number: 37},
            {id: 38, name: 'Manoj Shriwastav', number: 38},
            {id: 39, name: 'Vilash Kedar', number: 39},
            {id: 40, name: 'Gauri Zade', number: 40},
            {id: 41, name: 'Santosh Ghatol', number: 41},
            {id: 42, name: 'Hemant Bendale', number: 42},
            {id: 43, name: 'Shubham Pajgade', number: 43},
            {id: 44, name: 'Vikas Nandurkar', number: 44},
           {id: 45, name: 'Najim Patel', number: 45},
           {id: 46, name: 'Rahul Harinkhede', number: 46},
           {id: 47, name: 'Suraj Phule', number: 47},
           {id: 48, name: 'Prakash Tembhurne', number: 48},
           {id: 49, name: 'Sanjay Malwe', number: 49},
            {id: 50, name: 'Pradeep Wagh', number: 50},
            {id: 51, name: 'Madhukar Tikhe', number: 51},
            {id: 52, name: 'Suraj Dhone', number: 52},
            {id: 53, name: 'Sandeep Wadibhasme', number: 53},
            {id: 74, name: 'Vilas Shette', number: 74}];

function validateEmployee(number, name) {
    const employee = employees.find(emp => emp.number === number);
    if (!employee) return { valid: false, message: 'Employee number not found' };
    if (employee.name.toLowerCase() !== name.toLowerCase()) {
        return { valid: false, message: 'Name does not match employee number' };
    }
    return { valid: true, employee };
}

function validateRatings(ratings, evaluatorId) {
    const expectedCount = employees.length - 1;
    const receivedCount = Object.keys(ratings).length;

    if (receivedCount !== expectedCount) {
        return { valid: false, message: `Expected ${expectedCount} ratings, received ${receivedCount}` };
    }

    if (ratings[evaluatorId]) {
        return { valid: false, message: 'Cannot rate yourself' };
    }

    for (const [employeeId, rating] of Object.entries(ratings)) {
        const r = parseInt(rating);
        if (isNaN(r) || r < 1 || r > 10) {
            return { valid: false, message: `Invalid rating value: ${rating} for employee ${employeeId}` };
        }
    }
    return { valid: true };
}

function validateReasons(ratings, reasons) {
    const needingReasons = Object.entries(ratings).filter(
        ([, r]) => parseInt(r) <= 3 || parseInt(r) >= 9
    );

    for (const [employeeId, rating] of needingReasons) {
        if (!reasons[employeeId] || reasons[employeeId].trim() === '') {
            const emp = employees.find(e => e.id == employeeId);
            return {
                valid: false,
                message: `Reason required for ${emp?.name || `Employee #${employeeId}`} (rating: ${rating})`
            };
        }
    }
    return { valid: true };
}

// 🚀 Submit Feedback
app.post('/api/feedback', async (req, res) => {
    try {
        const { evaluator, ratings, reasons, timestamp } = req.body;

        if (!evaluator || !ratings || !timestamp) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const empValidation = validateEmployee(evaluator.number, evaluator.name);
        if (!empValidation.valid) return res.status(400).json({ error: empValidation.message });

        const ratingsValidation = validateRatings(ratings, evaluator.id);
        if (!ratingsValidation.valid) return res.status(400).json({ error: ratingsValidation.message });

        const reasonsValidation = validateReasons(ratings, reasons || {});
        if (!reasonsValidation.valid) return res.status(400).json({ error: reasonsValidation.message });

        const feedbackData = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
        const existing = feedbackData.find(f => f.evaluator.id === evaluator.id);
        if (existing) {
            return res.status(409).json({ error: 'Already submitted', submittedAt: existing.completedAt });
        }

        const completedAt = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        const serverTimestamp = new Date().toISOString();
        const metadata = {
            totalRatings: Object.keys(ratings).length,
            lowScores: Object.values(ratings).filter(r => r <= 3).length,
            highScores: Object.values(ratings).filter(r => r >= 9).length,
            averageRating: (
                Object.values(ratings).reduce((sum, r) => sum + parseInt(r), 0) / Object.keys(ratings).length
            ).toFixed(2)
        };

        const entry = {
            id: Date.now().toString(),
            evaluator: {
                id: evaluator.id,
                name: evaluator.name,
                number: evaluator.number,
                designation: empValidation.employee.designation
            },
            ratings, reasons,
            timestamp,
            completedAt,
            serverTimestamp,
            metadata
        };

        feedbackData.push(entry);
        await fs.writeFile(FEEDBACK_FILE, JSON.stringify(feedbackData, null, 2));

        const submissionsData = JSON.parse(await fs.readFile(SUBMISSIONS_FILE, 'utf8'));
        submissionsData.totalSubmissions++;
        submissionsData.submissions.push({
            employeeId: evaluator.id,
            employeeName: evaluator.name,
            submittedAt: serverTimestamp
        });
        submissionsData.lastUpdated = serverTimestamp;
        await fs.writeFile(SUBMISSIONS_FILE, JSON.stringify(submissionsData, null, 2));

        // ✨ Generate CSV
        const flatData = Object.entries(ratings).map(([id, rating]) => {
            const e = employees.find(emp => emp.id == id);
            return {
                EvaluatorID: evaluator.id,
                EvaluatorName: evaluator.name,
                EvaluatedEmployeeID: id,
                EvaluatedEmployeeName: e?.name || '',
                Designation: e?.designation || '',
                Rating: rating,
                Reason: reasons[id] || ''
            };
        });

        const csv = new Parser().parse(flatData);
        const safeName = evaluator.name.replace(/\s+/g, '_');
        await fs.writeFile(path.join(DATA_DIR, `feedback_${safeName}.csv`), csv);

        res.json({ success: true, message: 'Submitted successfully', submissionId: entry.id, metadata });
    } catch (err) {
        console.error('Error saving feedback:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// 📥 Admin CSV Download
app.get('/api/download/:evaluatorName', async (req, res) => {
    const name = req.params.evaluatorName.replace(/\s+/g, '_');
    const file = path.join(DATA_DIR, `feedback_${name}.csv`);
    try {
        await fs.access(file);
        res.download(file);
    } catch {
        res.status(404).json({ error: 'CSV not found' });
    }
});

// 📊 Stats
app.get('/api/stats', async (req, res) => {
    try {
        const stats = JSON.parse(await fs.readFile(SUBMISSIONS_FILE, 'utf8'));
        const total = employees.length;
        res.json({
            totalEmployees: total,
            totalSubmissions: stats.totalSubmissions,
            remaining: total - stats.totalSubmissions,
            completionPercentage: ((stats.totalSubmissions / total) * 100).toFixed(1),
            lastUpdated: stats.lastUpdated
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// ✅ Submission Check
app.get('/api/check-submission/:employeeNumber', async (req, res) => {
    const empNum = parseInt(req.params.employeeNumber);
    const employee = employees.find(e => e.number === empNum);
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const feedbacks = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
    const existing = feedbacks.find(f => f.evaluator.id === employee.id);
    res.json({
        hasSubmitted: !!existing,
        submittedAt: existing?.completedAt || null,
        employee: {
            id: employee.id,
            name: employee.name,
            designation: employee.designation
        }
    });
});

// 👥 All Employees
app.get('/api/employees', (req, res) => {
    res.json(employees);
});

// 🔐 Admin Feedback List
app.get('/api/admin/feedback', async (req, res) => {
    if (req.headers.authorization !== 'Bearer admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const data = JSON.parse(await fs.readFile(FEEDBACK_FILE, 'utf8'));
        res.json(data);
    } catch {
        res.status(500).json({ error: 'Failed to load feedback' });
    }
});

// 🩺 Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', uptime: process.uptime(), totalEmployees: employees.length });
});

// 🏠 Serve index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error + 404
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal error', message: err.message });
});
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// 🟢 Start Server
ensureDataDirectory().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`✅ Server running at http://${HOST}:${PORT}`);
    });
});
