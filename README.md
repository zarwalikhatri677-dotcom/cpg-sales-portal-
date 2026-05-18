# SAP CPG Sales Portal

Internal dashboard for SAP Consumer Industries HQ and AE team.

## Setup

1. Clone this repo
2. Open `app.js` and set `GITHUB_TOKEN`, `GITHUB_OWNER`, and `GITHUB_REPO` at the top
3. Run `scripts/export_companies.py` to generate `data/companies.json` from Book3.xlsx
4. Push to GitHub and enable GitHub Pages (Settings → Pages → Deploy from branch: main, / root)

## Usage

- **HQ:** Click "Request Update", pick a company, type your question, hit Send. Outlook will open with a pre-filled email to the AE.
- **AE:** Click "Submit Response", pick your company, type your answer, hit Submit.
