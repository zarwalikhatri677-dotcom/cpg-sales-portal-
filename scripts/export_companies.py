import json
import openpyxl

EXCEL_PATH = r"C:\Users\I769971\CLAUDE\Joe Lobeck\Top 100 Companies\Working File - CPG Sales Portal.xlsx"
OUTPUT_PATH = "data/companies.json"
SHEET_NAME = "CP ERP Top 100 - Updated"
DATA_START_ROW = 3  # Was 4 — changed to 3 to include Heineken (row 3 in Excel)

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
ws = wb[SHEET_NAME]

companies = []
for row in ws.iter_rows(min_row=DATA_START_ROW, values_only=True):
    rank = row[0]
    name = str(row[1]).strip() if row[1] else ""

    if not isinstance(rank, (int, float)):
        continue
    if not name:
        continue

    # Skip test accounts
    if "(test)" in name.lower():
        continue

    rank_int = int(rank)

    company = {
        # Companies outside the CGT top 100 get no rank number displayed
        "rank": rank_int if rank_int <= 100 else None,
        "name": name,
        "category": str(row[2]).strip() if row[2] else "",
        "region": str(row[3]).strip() if row[3] else "",
        "scp": str(row[4]).strip() if row[4] else "",
        "advisor": str(row[5]).strip() if row[5] else "",
        "advisorEmail": str(row[6]).strip() if row[6] else "",
        "ae": str(row[7]).strip() if row[7] else "",
        "aeEmail": str(row[8]).strip() if row[8] else "",
        "landscape": str(row[9]).strip() if row[9] else "",
        "deployment": str(row[10]).strip() if row[10] else "",
        "previous": str(row[11]).strip() if row[11] else "",
        "landscapeType": str(row[12]).strip() if row[12] else "",
        "projectStatus": str(row[13]).strip() if row[13] else "",
        "contractSigned": str(row[15]).strip() if row[15] else "",
        "notes": str(row[16]).strip() if row[16] else "",
        "aiEngagement": str(row[17]).strip() if len(row) > 17 and row[17] else "",
        "aiSolutions": str(row[18]).strip() if len(row) > 18 and row[18] else "",
    }
    companies.append(company)

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(companies, f, ensure_ascii=False, indent=2)

print(f"Exported {len(companies)} companies to {OUTPUT_PATH}")
