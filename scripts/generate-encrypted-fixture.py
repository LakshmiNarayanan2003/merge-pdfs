"""Optional regeneration: python -m pip install pypdf==6.19.0 (isolated venv)."""
from pypdf import PdfReader, PdfWriter
from pypdf.generic import ArrayObject, ByteStringObject
writer = PdfWriter()
writer.append(PdfReader('tests/fixtures/one.pdf'))
writer._ID = ArrayObject([ByteStringObject(b'PDFMerge-fixture1')] * 2)
writer.encrypt('local-test-password', algorithm='RC4-128')
with open('tests/fixtures/encrypted.pdf', 'wb') as output:
    writer.write(output)
