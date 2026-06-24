import os
import fitz  # PyMuPDF

def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts all text from a PDF file using the PyMuPDF library.
    
    Args:
        pdf_path (str): Path to the input PDF file.
        
    Returns:
        str: Accumulated text content of all pages in the PDF.
    """
    # Verify the input PDF exists
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"The specified PDF file was not found: {pdf_path}")
        
    # Open the PDF file
    doc = fitz.open(pdf_path)
    
    extracted_text_list = []
    
    # Iterate through each page to extract text
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()
        extracted_text_list.append(text)
        
    # Join all pages with a newline character and return
    return "\n".join(extracted_text_list)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Extract all text from a PDF file using PyMuPDF.")
    parser.add_argument("pdf_path", type=str, help="Path to the input PDF file.")
    
    args = parser.parse_args()
    
    try:
        text = extract_text_from_pdf(args.pdf_path)
        print(f"Successfully extracted text from '{args.pdf_path}':\n")
        print(text)
    except Exception as e:
        print(f"Error: {e}")
