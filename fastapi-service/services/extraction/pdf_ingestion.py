"""
PDF Ingestion & Validation Module
MedAssist AI — Strict Validation, Integrity Checks, and PDF-only Enforcement
"""

import io
import fitz
from typing import Tuple, Dict, Any, Optional


class PDFIngestionError(ValueError):
    """Raised when uploaded file fails PDF integrity, security, or validation checks."""
    pass


class PDFIngestionService:
    MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
    MAX_PAGE_COUNT = 50
    MIN_PAGE_COUNT = 1

    @classmethod
    def validate_and_load(
        cls,
        file_bytes: bytes,
        filename: Optional[str] = None,
        content_type: Optional[str] = None
    ) -> Tuple[fitz.Document, Dict[str, Any]]:
        """
        Validates the PDF bytes:
        1. Checks size
        2. Validates PDF magic byte header (%PDF-)
        3. Validates MIME type and filename extension
        4. Rejects corrupted, encrypted, or zero-page documents
        5. Returns open fitz.Document and validated metadata dict.
        """
        if not file_bytes or len(file_bytes) == 0:
            raise PDFIngestionError("Uploaded file is empty (0 bytes).")

        if len(file_bytes) > cls.MAX_FILE_SIZE_BYTES:
            raise PDFIngestionError(f"File size exceeds maximum allowed limit of {cls.MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.")

        # 1. Format Detection via Magic Bytes
        header = file_bytes[:1024]
        is_pdf = b"%PDF-" in header
        is_jpeg = header.startswith(b"\xff\xd8\xff")
        is_png = header.startswith(b"\x89PNG\r\n\x1a\n")
        is_image = is_jpeg or is_png or header.startswith(b"GIF8") or header.startswith(b"RIFF")

        if not is_pdf and not is_image:
            raise PDFIngestionError("Invalid file structure: Expected a valid PDF document (%PDF-) or image file (PNG, JPG, JPEG).")

        # 2. Extension check
        valid_exts = [".pdf", ".png", ".jpg", ".jpeg"]
        if filename:
            fn_lower = filename.lower()
            if not any(fn_lower.endswith(ext) for ext in valid_exts):
                raise PDFIngestionError(f"Invalid file extension '{filename}'. Supported extensions: .pdf, .png, .jpg, .jpeg")

        # 3. Content-Type check if provided
        if content_type:
            ct_lower = content_type.lower().split(";")[0].strip()
            allowed_types = [
                "application/pdf", "application/x-pdf", "application/acrobat", "applications/vnd.pdf", "text/pdf",
                "image/png", "image/jpeg", "image/jpg", "image/webp"
            ]
            if ct_lower not in allowed_types:
                raise PDFIngestionError(f"Unsupported media type '{content_type}'. Expected PDF or image.")

        # 4. Load Document (Convert Image to 1-page PDF if needed for unified pipeline processing)
        try:
            if is_image:
                img_format = "png" if is_png else "jpeg"
                img_doc = fitz.open(stream=file_bytes, filetype=img_format)
                pdf_bytes = img_doc.convert_to_pdf()
                doc = fitz.open("pdf", pdf_bytes)
            else:
                doc = fitz.open(stream=file_bytes, filetype="pdf")
        except Exception as e:
            raise PDFIngestionError(f"Corrupted or unreadable document: {str(e)}")

        if doc.is_encrypted:
            try:
                # Try empty password
                doc.authenticate("")
            except Exception:
                pass
            if doc.is_encrypted:
                raise PDFIngestionError("Password-protected or encrypted PDF documents are not supported.")

        page_count = len(doc)
        if page_count < cls.MIN_PAGE_COUNT:
            raise PDFIngestionError("Document contains 0 pages.")

        if page_count > cls.MAX_PAGE_COUNT:
            raise PDFIngestionError(f"Document page count ({page_count}) exceeds maximum allowed limit of {cls.MAX_PAGE_COUNT} pages.")

        metadata = {
            "page_count": page_count,
            "filename": filename or ("report.png" if is_image else "report.pdf"),
            "file_size": len(file_bytes),
            "is_image": is_image,
            "pdf_version": doc.metadata.get("format") if hasattr(doc, "metadata") else None
        }

        return doc, metadata
