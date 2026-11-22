import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def generate_documents():
    base_dir = r"c:\Users\sudee\Desktop\Capstone\medassist-ai"
    txt_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.txt")
    md_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.md")
    docx_path = os.path.join(base_dir, "PROJECT_OVERVIEW_GUIDE_REVIEW.docx")

    # Read current txt to ensure we preserve everything
    with open(txt_path, "r", encoding="utf-8") as f:
        old_txt = f.read()

    print(f"Old txt length: {len(old_txt)} characters")

if __name__ == "__main__":
    generate_documents()
