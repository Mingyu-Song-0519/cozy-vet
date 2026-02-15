
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const filePath = "D:\\Developing works\\Animal Hospital automation\\초진환자+검진 관리표.xlsx";
const MONTH_SHEET_PATTERN = /^\d{4}-\d{2}$/;

try {
  console.log(`Reading file: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  
  console.log("All Sheet Names:", workbook.SheetNames);
  
  const validSheets = workbook.SheetNames.filter(
    (sheet) => MONTH_SHEET_PATTERN.test(sheet) && !sheet.includes("복사용")
  );
  
  console.log("Valid Sheets (YYYY-MM pattern):", validSheets);
  
  if (validSheets.length === 0) {
    console.error("❌ No valid sheets found! The parser expects sheet names like '2024-02'.");
  } else {
    validSheets.forEach(sheetName => {
      console.log(`\n--- Inspecting contents of sheet: ${sheetName} ---`);
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: "" });
      
      console.log(`Total rows: ${rows.length}`);
      if (rows.length > 3) {
        console.log("Header row (index 2):", rows[2]); // Assuming header is at index 2 (row 3)
        console.log("First data row (index 3):", rows[3]);
      }
    });
  }

} catch (error) {
  console.error("Error reading file:", error);
}
