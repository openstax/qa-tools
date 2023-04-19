import shutil
import sys
from hashlib import md5
from io import BytesIO
from pathlib import Path

from pdf2image import convert_from_bytes
from pikepdf import Pdf
from PIL import Image, ImageChops


def page_hash(page):
    page.contents_coalesce()
    buffer = BytesIO(page.Contents.get_stream_buffer())
    return md5(buffer.getvalue()).digest()


def page_image(page):
    pdf = Pdf.new()
    pdf.pages.append(page)
    buffer = BytesIO()
    pdf.save(buffer)
    image = convert_from_bytes(buffer.getvalue())[0]
    return image.convert('L')


def compare_pdfs(path_a, path_b):
    diff_folder = Path.cwd()/"pdf_compare"/path_a.stem

    if diff_folder.exists():
        shutil.rmtree(diff_folder)
    diff_folder.mkdir(parents=True)

    pdf_a = Pdf.open(path_a)
    pdf_b = Pdf.open(path_b)

    print(f"{len(pdf_a.pages)} total pages", file=sys.stderr)

    count = 0

    for page_number, pages in enumerate(zip(pdf_a.pages, pdf_b.pages)):
        page_a, page_b = pages

        hash_a = page_hash(page_a)
        hash_b = page_hash(page_b)

        if hash_a != hash_b:
            print(f"page {page_number + 1} has differences", file=sys.stderr)

            before = page_image(page_a)
            after = page_image(page_b)

            merge = ImageChops.darker(before, after).convert('L')

            diff = Image.merge('RGB', (after, before, merge))
            diff.save(diff_folder/f"{page_number + 1}.png")

            count += 1

    print(f"{count} pages have differences", file=sys.stderr)


def main():
    compare_pdfs(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == "__main__":
    main()