import json
import os
import shutil
import openpyxl

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
EXCEL_PATH  = r"C:\Users\I769971\CLAUDE\Joe Lobeck\Top 100 Companies\Working File - CPG Sales Portal.xlsx"
HTML_PATH   = os.path.join(SCRIPT_DIR, '..', 'index.html')
COPY_PATH   = r"C:\Users\I769971\CLAUDE\Joe Lobeck\Top 100 Companies\CPG Sales Portal.html"
SHEET_NAME  = "CP ERP Top 100 - Updated"
DATA_START_ROW = 3  # Row 3 = Heineken (rank 12)

wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
ws = wb[SHEET_NAME]

companies = []
for row in ws.iter_rows(min_row=DATA_START_ROW, values_only=True):
    rank = row[0]
    name = str(row[1]).strip() if row[1] else ""

    if not name:
        continue
    if "(test)" in name.lower():
        continue

    if isinstance(rank, (int, float)):
        rank_int   = int(rank)
        # Companies outside the CGT top 100 get no rank displayed (null)
        display_rank = rank_int if rank_int <= 100 else None
    else:
        # Row has a name but no numeric rank — include without a rank
        display_rank = None

    def cell(i):
        v = row[i]
        return str(v).strip() if v is not None else ""

    company = {
        "rank":          display_rank,
        "name":          name,
        "category":      cell(2),
        "region":        cell(3),
        "scp":           cell(4),
        "advisor":       cell(5),
        "advisorEmail":  cell(6),
        "ae":            cell(7),
        "aeEmail":       cell(8),
        "landscape":     cell(9),
        "deployment":    cell(10),
        "previous":      cell(11),
        "landscapeType": cell(12),
        "projectStatus": cell(13),
        "contractSigned":cell(15),
        "notes":         cell(16),
    }
    companies.append(company)

companies_json = json.dumps(companies, ensure_ascii=False, separators=(',', ':'))
new_line = f'const COMPANIES = {companies_json};\n'

with open(HTML_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

replaced = False
for i, line in enumerate(lines):
    if line.strip().startswith('const COMPANIES = '):
        lines[i] = new_line
        replaced = True
        break

if not replaced:
    raise ValueError("Could not find COMPANIES array in index.html — aborting.")

with open(HTML_PATH, 'w', encoding='utf-8') as f:
    f.writelines(lines)

shutil.copy2(HTML_PATH, COPY_PATH)

print(f"Done — index.html updated with {len(companies)} companies.")
print(f"Copied -> {COPY_PATH}")
