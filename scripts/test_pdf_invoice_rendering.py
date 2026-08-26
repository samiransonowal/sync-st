import jinja2
import json
import os

HTML_TEMPLATE_PATH = "engine/google-apps-script/HTMLTemplate.html"
OUTPUT_HTML_PATH = "sample-documents/vyapar/sample_invoice_render.html"

def test_render():
    print("Testing HTML Invoice Rendering...")
    with open(HTML_TEMPLATE_PATH, "r", encoding="utf-8") as f:
        template_str = f.read()

    # Convert GAS template tags (<?= val ?> and <? if () { ?>) into python format for quick local visual testing
    # GAS template uses:
    # <?= data.client_name ?>
    # <? for (var i = 0; i < data.line_items.length; i++) { ?>
    
    clean_html = template_str.replace("<?= data.client_name ?>", "STIR FRY FILM")
    clean_html = clean_html.replace("<?= data.billing_address.replace(/\\n/g, '<br>') ?>", "Unit 402, Sunshine Towers, Lower Parel, Mumbai - 400013")
    clean_html = clean_html.replace("<? if (data.client_gstin) { ?><p><strong>GSTIN:</strong> <?= data.client_gstin ?></p><? } ?>", "<p><strong>GSTIN:</strong> 27AABCU9603R1ZM</p>")
    clean_html = clean_html.replace("<? if (data.client_pan) { ?><p><strong>PAN:</strong> <?= data.client_pan ?></p><? } ?>", "<p><strong>PAN:</strong> AABCU9603R</p>")
    clean_html = clean_html.replace("<?= data.invoice_no ?>", "ST/2026-27/144")
    clean_html = clean_html.replace("<?= data.invoice_date ?>", "24/08/2026")
    clean_html = clean_html.replace("<?= data.po_no || 'N/A' ?>", "PO-SFF-2026-091")
    clean_html = clean_html.replace("<?= data.place_of_supply ?>", "27-Maharashtra")
    clean_html = clean_html.replace("<?= data.payment_terms ?>", "30 Days (Due 23/09/2026)")
    clean_html = clean_html.replace("<?= data.due_date ?>", "23/09/2026")
    
    # Replace line items loop
    sample_row = """
    <tr>
        <td class="center-align">1</td>
        <td>Color Grading & DI Mastering Services — Project: "Stir Fry Commercial"<br>Colorist: Samiran Sonowal | Booking: 4 Hrs @ ₹5,000/hr</td>
        <td class="center-align">999612</td>
        <td class="center-align">4</td>
        <td class="right-align">5,000.00</td>
        <td class="center-align">18%</td>
        <td class="right-align">20,000.00</td>
    </tr>
    """
    
    start_tag = "<? for (var i = 0; i < data.line_items.length; i++) { ?>"
    end_tag = "<? } ?>"
    
    if start_tag in clean_html and end_tag in clean_html:
        part1 = clean_html.split(start_tag)[0]
        part2 = clean_html.split(end_tag)[1]
        clean_html = part1 + sample_row + part2
        
    clean_html = clean_html.replace("<?= parseFloat(data.subtotal).toLocaleString('en-IN', {minimumFractionDigits: 2}) ?>", "20,000.00")
    clean_html = clean_html.replace("<?= parseFloat(data.cgst).toLocaleString('en-IN', {minimumFractionDigits: 2}) ?>", "1,800.00")
    clean_html = clean_html.replace("<?= parseFloat(data.sgst).toLocaleString('en-IN', {minimumFractionDigits: 2}) ?>", "1,800.00")
    clean_html = clean_html.replace("<?= parseFloat(data.grand_total).toLocaleString('en-IN', {minimumFractionDigits: 2}) ?>", "23,600.00")
    clean_html = clean_html.replace("<?= data.cgst_percent ?>", "9")
    clean_html = clean_html.replace("<?= data.sgst_percent ?>", "9")
    clean_html = clean_html.replace("<?= data.amount_in_words ?>", "Twenty Three Thousand Six Hundred Rupees Only")
    clean_html = clean_html.replace("<? if (logoDataUri) { ?>", "<!-- Logo -->")
    clean_html = clean_html.replace("<? } else { ?>", "")
    clean_html = clean_html.replace("<? } ?>", "")
    
    with open(OUTPUT_HTML_PATH, "w", encoding="utf-8") as out:
        out.write(clean_html)
        
    print(f"✅ Rendered sample HTML invoice: {OUTPUT_HTML_PATH}")

if __name__ == "__main__":
    test_render()
