import os
import fitz  # PyMuPDF

def convert_pdf_to_images(pdf_path: str, output_dir: str = "output_images", dpi: int = 150) -> None:
    """
    Converts each page of a PDF document into a separate PNG image file.
    
    Args:
        pdf_path (str): Path to the input PDF file.
        output_dir (str): Directory where output PNG images will be saved. Default is 'output_images'.
        dpi (int): Resolution of the output images. Default is 150 DPI.
    """
    # Verify the input PDF exists
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"The specified PDF file was not found: {pdf_path}")
        
    # Create the output directory if it doesn't exist
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"Created output directory: '{output_dir}'")
        
    # Open the PDF file
    doc = fitz.open(pdf_path)
    print(f"Processing '{pdf_path}' ({len(doc)} pages)...")
    
    # Iterate through each page of the document
    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        
        # Render the page to a pixmap (image)
        # 72 is the default PDF point system resolution. Zoom factor achieves requested DPI.
        zoom = dpi / 72
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix)
        
        # Define output filepath
        output_filename = f"page_{page_num + 1}.png"
        output_filepath = os.path.join(output_dir, output_filename)
        
        # Save the pixmap as a PNG image
        pix.save(output_filepath)
        print(f"  [+] Page {page_num + 1}/{len(doc)} saved to: {output_filepath}")

    print("\nSuccess: All pages successfully converted to images.")

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Convert PDF pages to PNG images using PyMuPDF.")
    parser.add_argument("pdf_path", type=str, help="Path to the input PDF file.")
    parser.add_argument("--output-dir", type=str, default="output_images", help="Directory to save images.")
    parser.add_argument("--dpi", type=int, default=150, help="Resolution in DPI (default: 150).")
    
    args = parser.parse_args()
    
    try:
        convert_pdf_to_images(args.pdf_path, args.output_dir, args.dpi)
    except Exception as e:
        print(f"Error: {e}")
