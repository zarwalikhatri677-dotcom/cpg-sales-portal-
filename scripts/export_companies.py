import json
import openpyxl

EXCEL_PATH = r"C:\Users\I769971\CLAUDE\Top 100\Book3.xlsx"
OUTPUT_PATH = "data/companies.json"
SHEET_NAME = "CP ERP Top 100"
HEADER_ROW = 3
DATA_START_ROW = 4

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
ws = wb[SHEET_NAME]

companies = []
for row in ws.iter_rows(min_row=DATA_START_ROW, values_only=True):
    rank = row[0]
    # Stop at empty rows or legend rows (rank must be a number)
    if not isinstance(rank, (int, float)):
        continue

    company = {
        "rank": int(rank),
        "name": str(row[1]).strip() if row[1] else "",
        "category": str(row[2]).strip() if row[2] else "",
        "region": str(row[3]).strip() if row[3] else "",
        "scp": str(row[4]).strip() if row[4] else "",
        "advisor": str(row[5]).strip() if row[5] else "",
        "ae": str(row[6]).strip() if row[6] else "",
        "landscape": str(row[7]).strip() if row[7] else "",
        "deployment": str(row[8]).strip() if row[8] else "",
        "previous": str(row[9]).strip() if row[9] else "",
        "landscapeType": str(row[10]).strip() if row[10] else "",
        "projectStatus": str(row[11]).strip() if row[11] else "",
        "contractSigned": str(row[13]).strip() if row[13] else "",
        "notes": str(row[14]).strip() if row[14] else "",
    }
    companies.append(company)

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(companies, f, ensure_ascii=False, indent=2)

print(f"Exported {len(companies)} companies to {OUTPUT_PATH}")
