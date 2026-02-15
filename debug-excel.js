
const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const filePath = "D:\\Developing works\\Animal Hospital automation\\초진환자+검진 관리표.xlsx";
// 기존 패턴: YYYY-MM
// const MONTH_SHEET_PATTERN = /^\d{4}-\d{2}$/;
// 디버깅을 위해 모든 시트 이름을 확인

try {
    console.log(`Reading file: ${filePath}`);
    if (!fs.existsSync(filePath)) {
        console.error("File does not exist!");
        process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    console.log("All Sheet Names:", workbook.SheetNames);

    const sheetNames = workbook.SheetNames;
    sheetNames.forEach((sheetName, index) => {
        console.log(`\n[Sheet ${index + 1}] Name: "${sheetName}"`);
        const sheet = workbook.Sheets[sheetName];
        // A1 셀 값 확인
        const a1 = sheet["A1"] ? sheet["A1"].v : "EMPTY";
        console.log(`  Cell A1: ${a1}`);

        // 행 개수 대략 확인
        const ref = sheet["!ref"];
        console.log(`  Reference: ${ref}`);
    });

} catch (error) {
    console.error("Error reading file:", error);
}
