"""
Clinical Candidate Detection Module
MedAssist AI — Detects Parameter and Value Candidates Preserving Raw Source Text and Bounding Boxes
"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .models import SpatialLine, TableRow, TableCell, BoundingBox, RegionType, CandidateCategory


class RawCandidate(BaseModel):
    raw_parameter: str
    raw_value: str
    raw_unit: str = ""
    raw_reference: str = ""
    raw_flag: str = ""
    raw_method: str = ""
    page: int
    bbox: BoundingBox
    source_text: str = ""
    section: Optional[str] = None
    subsection: Optional[str] = None
    line_index: Optional[int] = None


class CandidateDetector:
    """
    Scans table rows and candidate spatial lines to extract raw candidate measurement tuples.
    Preserves exact source text, token coordinates, and page numbers.
    """

    # Comprehensive row regex patterns
    # Unit pattern (rejects standalone abnormality flag words so they are not misidentified as units)
    UNIT_PATTERN = r'(?!(?:H|L|High|Low|Borderline|Normal|Abnormal)\b)(?:x\s*10[\^]?\d+\s*[\/]\s*[μu]?l|x10\d+\s*[\/]\s*[μu]?l|[\/]?cumm|cells[\/]cumm|million[\/]cumm|lakhs[\/]cumm|g[\/]dl|gm[\/]dl|mg[\/]dl|mmol[\/]l|meq[\/]l|u[\/]l|iu[\/]l|uiu[\/]ml|ng[\/]dl|pg[\/]ml|pg|fl|\%|ratio|[a-zA-Z\%\/\_\^\d]+(?:\/[a-zA-Z\d]+)?)'
    REF_UNIT = r'(?:x\s*10[\^]?\d+\s*[\/]\s*[μu]?l|x10\d+\s*[\/]\s*[μu]?l|[\/]?cumm|cells[\/]cumm|million[\/]cumm|lakhs[\/]cumm|g[\/]dl|gm[\/]dl|mg[\/]dl|mmol[\/]l|meq[\/]l|u[\/]l|iu[\/]l|uiu[\/]ml|ng[\/]dl|pg[\/]ml|pg|fl|\%|ratio)'
    
    # Reference range with optional embedded/trailing unit
    REF_PATTERN = r'(?:(?:Normal|Bio\.?\s*Ref\.?\s*(?:Range|Interval))\s*[:\.]?\s*)?(?:(?:<=|>=|<|>|=)?\s*[\d,\.]+\s*(?:[\-\–\:]|to)\s*[\d,\.]+(?:\s*' + REF_UNIT + r')?|[<>=]\s*[\d,\.]+(?:\s*' + REF_UNIT + r')?|\([\d,\.]+\s*[\-\–\:]\s*[\d,\.]+\)|\-)'
    
    # Pure numerical reference range without embedded unit (for Pattern B / C where unit follows)
    PURE_REF_PATTERN = r'(?:(?:Normal|Bio\.?\s*Ref\.?\s*(?:Range|Interval))\s*[:\.]?\s*)?((?:<=|>=|<|>|=)?\s*[\d,\.]+\s*(?:[\-\–\:]|to)\s*[\d,\.]+|[<>=]\s*[\d,\.]+|\([\d,\.]+\s*[\-\–\:]\s*[\d,\.]+\)|\-)'

    # Pattern 1: [Param Name] [Flag/Method?] [Value] [Unit] [Reference Range] [Flag?] [Methodology?]
    PATTERN_A = re.compile(
        r'^\s*([A-Za-z][A-Za-z0-9\s\(\)\-\/\.\,\_\%\[\]\;\:]{1,65}?)\s+'
        r'(?:([HL]|High|Low|Borderline|Abnormal|Normal)\s+)?'
        r'((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*|\b(?:positive|negative|normal|reactive|abnormal|trace|nil)\b)\s+'
        r'(' + UNIT_PATTERN + r')\s+'
        r'(' + REF_PATTERN + r')'
        r'(?:\s+(high|low|normal|abnormal|borderline|h|l|\*))?'
        r'(?:\s+([A-Za-z0-9\s\-\/\.\,\_\(\)]+))?'
        r'\s*$',
        re.I
    )

    # Pattern 2: [Param Name] [Value] [Flag?] [Reference Range] [Unit]
    PATTERN_B = re.compile(
        r'^\s*([A-Za-z][A-Za-z0-9\s\(\)\-\/\.\,\_\%\[\]\;\:]{1,65}?)\s+'
        r'((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*|\b(?:positive|negative|normal|reactive|abnormal|trace|nil)\b)\s+'
        r'(?:(high|low|normal|abnormal|borderline|h|l|\*)\s+)?'
        + PURE_REF_PATTERN + r'\s+'
        r'(' + UNIT_PATTERN + r')\s*$',
        re.I
    )

    # Pattern 3: Drlogy / 4-5 column format: [Param Name] [Value] [Flag?] [Ref] [Unit]
    PATTERN_C = re.compile(
        r'^\s*([A-Za-z][A-Za-z0-9\s\(\)\-\/\.\,\_\%\[\]\;\:]{1,65}?)\s+'
        r'((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*)\s+'
        r'(?:(High|Low|Borderline|Abnormal|Normal|H|L)\s+)?'
        + PURE_REF_PATTERN +
        r'(?:\s+(' + UNIT_PATTERN + r'))?'
        r'\s*$',
        re.I
    )

    # Pattern 4: General match with optional unit/ref
    PATTERN_GEN = re.compile(
        r'^\s*([A-Za-z][A-Za-z0-9\s\(\)\-\/\.\,\_\%\[\]\;\:]{1,65}?)\s+'
        r'(?:([HL]|High|Low)\s+)?'
        r'((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*|\b(?:positive|negative|normal|reactive|abnormal|trace|nil)\b)'
        r'(?:\s+(' + UNIT_PATTERN + r'))?'
        r'(?:\s+(?:(?:Normal|Bio\.?\s*Ref\.?\s*(?:Range|Interval))\s*[:\.]?\s*)?(' + REF_PATTERN + r'))?'
        r'(?:\s+(high|low|normal|abnormal|borderline|h|l|\*))?'
        r'(?:\s+([A-Za-z0-9\s\-\/\.\,\_\(\)]+))?'
        r'\s*$',
        re.I
    )

    # Pattern 5: Value-start line when parameter name is split across preceding line(s)
    VALUE_START_PATTERN = re.compile(
        r'^\s*((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*|\b(?:positive|negative|normal|reactive|abnormal|trace|nil)\b)\s+'
        r'(?:([HL]|High|Low|Borderline|Abnormal|Normal)\s+)?'
        r'(' + UNIT_PATTERN + r')\s+'
        r'(' + REF_PATTERN + r')'
        r'(?:\s+(high|low|normal|abnormal|borderline|h|l|\*))?'
        r'(?:\s+([A-Za-z0-9\s\-\/\.\,\_\(\)]+))?'
        r'\s*$',
        re.I
    )

    # Inline colon pattern: "Fasting Blood Sugar: 155 mg/dL"
    PATTERN_COLON = re.compile(
        r'^\s*([A-Za-z0-9\s\(\)\-\/\_]{2,50})\s*[:\-]\s*((?:<=|>=|<|>|=)?\s*-?\d[\d,\.]*|\b(?:positive|negative|normal|reactive)\b)\s*([a-zA-Z\%\/\_]+)?',
        re.I
    )

    @classmethod
    def detect_candidates(
        cls,
        lines: List[SpatialLine],
        section_name: Optional[str] = None
    ) -> List[RawCandidate]:
        candidates: List[RawCandidate] = []

        current_section = section_name
        current_subsection = None
        skip_indices = set()

        for idx, line in enumerate(lines):
            if idx in skip_indices:
                continue

            # Track section context
            if line.region_type == RegionType.TEST_SECTION:
                current_section = line.text.strip()
                current_subsection = None
                continue

            # Skip lines in non-measurement regions
            if line.region_type in [
                RegionType.PATIENT_METADATA,
                RegionType.HEADER,
                RegionType.FOOTER,
                RegionType.CLINICAL_NOTES,
                RegionType.INTERPRETATION,
                RegionType.TABLE_HEADER
            ]:
                continue

            line_str = line.text.strip()
            if not line_str or len(line_str) < 3:
                continue

            # Skip full-line address, accreditation, or signature text
            if re.search(r'\b(?:road|mumbai|delhi|bangalore|iso\s*certified|nabl|accredited|end\s*of\s*report|page\s*\d+\s*of\s*\d+)\b', line_str, re.I):
                continue

            # Pre-clean line string: remove background watermarks and normalize whitespace
            cleaned_line_str = re.sub(r'\b(?:drlogy\.com|smart\s*pathology\s*lab)\b', '', line_str, flags=re.I)
            cleaned_line_str = re.sub(r'\s+', ' ', cleaned_line_str).strip()

            # 1. Standard single line match
            candidate = cls._match_line(line, cleaned_line_str, idx, current_section, current_subsection)
            if candidate:
                candidates.append(candidate)
                continue

            # 2. Check if line starts with a numeric value and parameter name was on the previous line(s)
            mV = cls.VALUE_START_PATTERN.match(cleaned_line_str)
            if mV and idx > 0:
                val, flag1, unit, ref, flag2, meth = mV.groups()
                flag = flag1 or flag2 or ""
                prev_line = lines[idx - 1]
                prev_text = prev_line.text.strip()
                if (
                    prev_text
                    and len(prev_text) > 1
                    and not re.match(r'^\d', prev_text)
                    and prev_line.region_type not in [
                        RegionType.HEADER, RegionType.FOOTER, RegionType.TABLE_HEADER,
                        RegionType.TEST_SECTION, RegionType.CLINICAL_NOTES, RegionType.PATIENT_METADATA
                    ]
                ):
                    full_param = prev_text
                    # Check if next line is a continuation (like "(TLC)", "(PCT)", "count", "ratio", "granulocyte")
                    if idx + 1 < len(lines):
                        next_line = lines[idx + 1]
                        next_text = next_line.text.strip()
                        if next_text and (
                            re.match(r'^\([A-Za-z0-9\-]+\)$', next_text)
                            or next_text.lower() in ['count', 'granulocyte', 'ratio', 'indices', 'cv', 'sd', 'cells']
                        ):
                            full_param = f"{prev_text} {next_text}"
                            skip_indices.add(idx + 1)

                    candidates.append(RawCandidate(
                        raw_parameter=cls._clean_param_name(full_param),
                        raw_value=val.strip(),
                        raw_unit=unit.strip() if unit else "",
                        raw_reference=cls._clean_reference(ref) if ref else "",
                        raw_flag=flag.strip() if flag else "",
                        raw_method=meth.strip() if meth else "",
                        page=line.page,
                        bbox=line.bbox,
                        source_text=f"{full_param} {cleaned_line_str}",
                        section=current_section,
                        subsection=current_subsection,
                        line_index=idx
                    ))

        return candidates

    @classmethod
    def _clean_param_name(cls, raw_name: str) -> str:
        cleaned = re.sub(r'^\d+[\.\)]\s*', '', raw_name.strip())
        cleaned = re.sub(r'\b(?:drlogy\.com|smart\s*pathology\s*lab)\b', '', cleaned, flags=re.I)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    @classmethod
    def _clean_reference(cls, raw_ref: str) -> str:
        if not raw_ref:
            return ""
        cleaned = raw_ref.strip()
        # Remove trailing unit from reference (e.g. "13 - 17 g/dl" -> "13 - 17")
        cleaned = re.sub(
            r'\s+(?:x\s*10[\^]?\d+\s*[\/]\s*[μu]?l|x10\d+\s*[\/]\s*[μu]?l|[\/]?cumm|cells[\/]cumm|million[\/]cumm|lakhs[\/]cumm|g[\/]dl|gm[\/]dl|mg[\/]dl|mmol[\/]l|meq[\/]l|u[\/]l|iu[\/]l|uiu[\/]ml|ng[\/]dl|pg[\/]ml|pg|fl|\%|ratio)\s*$',
            '',
            cleaned,
            flags=re.I
        )
        return cleaned.strip()

    @classmethod
    def _match_line(
        cls,
        line: SpatialLine,
        line_str: str,
        line_idx: int,
        section: Optional[str],
        subsection: Optional[str]
    ) -> Optional[RawCandidate]:
        # Check Pattern A
        mA = cls.PATTERN_A.match(line_str)
        if mA:
            raw_name, flag1, val, unit, ref, flag2, meth = mA.groups()
            flag = flag1 or flag2 or ""
            return RawCandidate(
                raw_parameter=cls._clean_param_name(raw_name),
                raw_value=val.strip(),
                raw_unit=unit.strip() if unit else "",
                raw_reference=cls._clean_reference(ref) if ref else "",
                raw_flag=flag.strip() if flag else "",
                raw_method=meth.strip() if meth else "",
                page=line.page,
                bbox=line.bbox,
                source_text=line.text,
                section=section,
                subsection=subsection,
                line_index=line_idx
            )

        # Check Pattern B
        mB = cls.PATTERN_B.match(line_str)
        if mB:
            raw_name, val, flag, ref, unit = mB.groups()
            return RawCandidate(
                raw_parameter=cls._clean_param_name(raw_name),
                raw_value=val.strip(),
                raw_unit=unit.strip() if unit else "",
                raw_reference=cls._clean_reference(ref) if ref else "",
                raw_flag=flag.strip() if flag else "",
                page=line.page,
                bbox=line.bbox,
                source_text=line.text,
                section=section,
                subsection=subsection,
                line_index=line_idx
            )

        # Check Pattern C (Drlogy style)
        mC = cls.PATTERN_C.match(line_str)
        if mC:
            raw_name, val, flag, ref, unit = mC.groups()
            return RawCandidate(
                raw_parameter=cls._clean_param_name(raw_name),
                raw_value=val.strip(),
                raw_unit=unit.strip() if unit else "",
                raw_reference=cls._clean_reference(ref) if ref else "",
                raw_flag=flag.strip() if flag else "",
                page=line.page,
                bbox=line.bbox,
                source_text=line.text,
                section=section,
                subsection=subsection,
                line_index=line_idx
            )

        # Check Pattern General
        mGen = cls.PATTERN_GEN.match(line_str)
        if mGen:
            raw_name, flag1, val, unit, ref, flag2, meth = mGen.groups()
            flag = flag1 or flag2 or ""
            if raw_name and val and (unit or ref or flag):
                return RawCandidate(
                    raw_parameter=cls._clean_param_name(raw_name),
                    raw_value=val.strip(),
                    raw_unit=unit.strip() if unit else "",
                    raw_reference=cls._clean_reference(ref) if ref else "",
                    raw_flag=flag.strip() if flag else "",
                    raw_method=meth.strip() if meth else "",
                    page=line.page,
                    bbox=line.bbox,
                    source_text=line.text,
                    section=section,
                    subsection=subsection,
                    line_index=line_idx
                )

        # Check Colon Match
        mCol = cls.PATTERN_COLON.search(line_str)
        if mCol:
            raw_name, val, unit = mCol.groups()
            if raw_name and val:
                return RawCandidate(
                    raw_parameter=cls._clean_param_name(raw_name),
                    raw_value=val.strip(),
                    raw_unit=unit.strip() if unit else "",
                    page=line.page,
                    bbox=line.bbox,
                    source_text=line.text,
                    section=section,
                    subsection=subsection,
                    line_index=line_idx
                )

        return None
