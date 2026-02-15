
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const files = [
    "D:\\Developing works\\Animal Hospital automation\\초진환자+검진 관리표.xlsx",
    "D:\\Developing works\\Animal Hospital automation\\COZYAMC월간 초진_프로모션 관리표 - 복사본.xlsx"
];

function analyzeFile(filePath) {
    console.log(`\nAnalyzing file: ${path.basename(filePath)}`);
    try {
        if (!fs.existsSync(filePath)) {
            console.log("File not found!");
            return;
        }
        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer, { type: "buffer" });

        // Pattern to match month sheets
        const MONTH_SHEET_PATTERN = /^(\d{4}-\d{2})|(\d{2}년\s*\d{1,2}월)|(\d{4}년\s*\d{1,2}월)$/;

        const sheetName = workbook.SheetNames.find(name => MONTH_SHEET_PATTERN.test(name) && !name.includes("복사용"));

        if (!sheetName) {
            console.log("No matching month sheet found. Available sheets:", workbook.SheetNames.join(", "));
            return;
        }

        console.log(`Target Sheet: ${sheetName}`);
        const sheet = workbook.Sheets[sheetName];
        // Read first 10 rows
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0, defval: "" }).slice(0, 10);

        data.forEach((row, index) => {
            console.log(`[Row ${index}]`, JSON.stringify(row));
        });

    } catch (err) {
        console.error(`Error reading ${filePath}:`, err.message);
    }
}

files.forEach(analyzeFile);
