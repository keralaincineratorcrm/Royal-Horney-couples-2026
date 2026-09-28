import jsPDF from 'jspdf';
import { Quotation } from '../types';
import { dataStore } from './supabase';

export const COMPANY_DETAILS = {
  get name() {
    return dataStore.getCompanySettings().companyName || 'Kerala Incinerator';
  },
  get tagline() {
    return dataStore.getCompanySettings().tagline || 'Clean Environment, Better Tomorrow.';
  },
  get category() {
    return dataStore.getCompanySettings().category || 'Commercial, Institutional & Domestic Waste Incinerators';
  },
  get address() {
    const s = dataStore.getCompanySettings();
    return s.officeAddress
      ? `${s.officeAddress} | Works: ${s.manufacturingHub}`
      : 'Central Works & Manufacturing Hub, Aimury, Perumbavoor, Ernakulam, Kerala - 683544';
  },
  get gstin() {
    return dataStore.getCompanySettings().gstin || '32AAACK1234F1Z8 (Kerala State)';
  },
  get phone() {
    return dataStore.getCompanySettings().phone || '+91 94471 20001 / +91 98460 34567';
  },
  get whatsapp() {
    return dataStore.getCompanySettings().whatsapp || '+91 94471 20001';
  },
  get email() {
    return dataStore.getCompanySettings().email || 'sales@keralaincinerator.com';
  },
  get website() {
    return dataStore.getCompanySettings().website || 'https://keralaincinerator.com';
  },
  get authorizedSignatory() {
    return dataStore.getCompanySettings().authorizedSignatoryLabel || 'Authorized Signatory';
  },
};

// Format currency in Indian standard
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateQuotationDoc(qtn: Quotation): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. TOP HEADER - Dark Navy background
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(0, 0, pageWidth, 42, 'F');

  // Accent Blue top strip
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Brand Name & Tagline
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('KERALA INCINERATOR', margin, 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(56, 189, 248); // #38BDF8
  doc.text(COMPANY_DETAILS.tagline.toUpperCase(), margin, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(COMPANY_DETAILS.address, margin, 29);
  doc.text(
    `GSTIN: ${COMPANY_DETAILS.gstin}  |  Helpline: ${COMPANY_DETAILS.phone}`,
    margin,
    34
  );
  doc.text(
    `Email: ${COMPANY_DETAILS.email}  |  Website: ${COMPANY_DETAILS.website}`,
    margin,
    39
  );

  // QUOTATION BADGE (Top Right)
  const badgeWidth = 56;
  const badgeHeight = 24;
  const badgeX = pageWidth - margin - badgeWidth;
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.roundedRect(badgeX, 10, badgeWidth, badgeHeight, 2, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('OFFICIAL QUOTATION', badgeX + badgeWidth / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(qtn.quotationNumber, badgeX + badgeWidth / 2, 24, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(224, 242, 254);
  doc.text(
    qtn.status === 'Accepted' ? 'STATUS: ACCEPTED' : `STATUS: ${qtn.status.toUpperCase()}`,
    badgeX + badgeWidth / 2,
    30,
    { align: 'center' }
  );

  // 2. METADATA SECTION - Two Columns
  const metaY = 48;
  const colWidth = (pageWidth - margin * 2 - 6) / 2;

  // Left Box: Customer Details
  doc.setFillColor(248, 250, 252); // #F8FAFC
  doc.setDrawColor(226, 232, 240); // #E2E8F0
  doc.roundedRect(margin, metaY, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('QUOTATION ISSUED TO:', margin + 4, metaY + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(qtn.customerName, margin + 4, metaY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  let custTextY = metaY + 17;
  if (qtn.customerAddress) {
    const splitAddr = doc.splitTextToSize(qtn.customerAddress, colWidth - 8);
    doc.text(splitAddr.slice(0, 2), margin + 4, custTextY);
    custTextY += Math.min(splitAddr.length, 2) * 4;
  }
  doc.text(`Location: ${qtn.customerPlace}`, margin + 4, custTextY);
  doc.text(`Phone: ${qtn.customerPhone}`, margin + 4, custTextY + 4);
  if (qtn.alternativePhone) {
    doc.text(`Alt Phone: ${qtn.alternativePhone}`, margin + 4, custTextY + 8);
  }

  // Right Box: Quotation Details & Prepared By
  const rightBoxX = margin + colWidth + 6;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightBoxX, metaY, colWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('QUOTATION PARTICULARS:', rightBoxX + 4, metaY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Quotation Date:', rightBoxX + 4, metaY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(qtn.quotationDate, rightBoxX + 42, metaY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Valid Until:', rightBoxX + 4, metaY + 17);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(qtn.validUntil || `${qtn.validityDays || 15} Days from date`, rightBoxX + 42, metaY + 17);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Sales Executive:', rightBoxX + 4, metaY + 22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(qtn.assignedToName || qtn.preparedByName || 'Sales Team', rightBoxX + 42, metaY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Contact Phone:', rightBoxX + 4, metaY + 27);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('+91 94471 20001', rightBoxX + 42, metaY + 27);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Payment Terms:', rightBoxX + 4, metaY + 32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('50% Adv, Bal on Delivery', rightBoxX + 42, metaY + 32);

  // 3. PRODUCT ITEMS TABLE
  const tableStartY = metaY + 44;
  const tableWidth = pageWidth - margin * 2;

  // Table Header
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(margin, tableStartY, tableWidth, 8.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  const colSl = margin + 3;
  const colDesc = margin + 14;
  const colQty = margin + 98;
  const colRate = margin + 116;
  const colDisc = margin + 140;
  const colTax = margin + 158;
  const colTotal = pageWidth - margin - 3;

  doc.text('Sl.', colSl, tableStartY + 5.5);
  doc.text('Item Description & Specification', colDesc, tableStartY + 5.5);
  doc.text('Qty', colQty, tableStartY + 5.5, { align: 'center' });
  doc.text('Unit Price', colRate, tableStartY + 5.5, { align: 'right' });
  doc.text('Discount', colDisc, tableStartY + 5.5, { align: 'right' });
  doc.text('GST', colTax, tableStartY + 5.5, { align: 'right' });
  doc.text('Line Total (INR)', colTotal, tableStartY + 5.5, { align: 'right' });

  // Table Rows
  let curY = tableStartY + 8.5;
  const items = qtn.items || [];

  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, curY, tableWidth, 12, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, curY + 12, pageWidth - margin, curY + 12);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(String(index + 1), colSl, curY + 5);

    // Product name
    doc.text(item.productName, colDesc, curY + 5);

    // Sub-description or capacity
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    const desc =
      item.description ||
      (item.capacity ? `Capacity: ${item.capacity}` : 'Commercial grade smokeless incinerator');
    doc.text(desc.slice(0, 48), colDesc, curY + 9.5);

    // Qty
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(8);
    doc.text(String(item.quantity), colQty, curY + 6, { align: 'center' });

    // Unit Price
    doc.text(item.unitPrice.toLocaleString('en-IN'), colRate, curY + 6, { align: 'right' });

    // Discount
    if (item.discount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`-${item.discount.toLocaleString('en-IN')}`, colDisc, curY + 6, { align: 'right' });
    } else {
      doc.setTextColor(148, 163, 184);
      doc.text('-', colDisc, curY + 6, { align: 'right' });
    }

    // Tax
    doc.setTextColor(71, 85, 105);
    doc.text(`${item.taxRate || 18}%`, colTax, curY + 6, { align: 'right' });

    // Line Total
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    const lineTot = item.totalAmount || (item.unitPrice * item.quantity - (item.discount || 0)) * 1.18;
    doc.text(Math.round(lineTot).toLocaleString('en-IN'), colTotal, curY + 6, { align: 'right' });

    curY += 12;
  });

  // Vertical border lines on table
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, tableStartY, tableWidth, curY - tableStartY, 'S');

  // 4. FINANCIAL SUMMARY & TERMS SECTION
  curY += 4;
  const summaryBoxWidth = 80;
  const summaryBoxX = pageWidth - margin - summaryBoxWidth;
  const termsBoxWidth = summaryBoxX - margin - 5;
  const summaryBoxHeight = 44;

  // Left: Terms and Conditions
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, curY, termsBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('TERMS & CONDITIONS:', margin + 4, curY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);

  let termLineY = curY + 11;
  const pTerms = qtn.paymentTerms || 'Payment: 50% advance with order, balance prior to delivery.';
  doc.text(`• ${pTerms.slice(0, 68)}`, margin + 4, termLineY);
  termLineY += 4.5;

  const dTerms = qtn.deliveryTerms || 'Delivery: 5-7 working days from order confirmation across Kerala.';
  doc.text(`• ${dTerms.slice(0, 68)}`, margin + 4, termLineY);
  termLineY += 4.5;

  const iTerms = qtn.installationTerms || 'Installation: Standard site installation & chimney set included.';
  doc.text(`• ${iTerms.slice(0, 68)}`, margin + 4, termLineY);
  termLineY += 4.5;

  const wTerms = qtn.warranty || 'Warranty: 12 months comprehensive warranty on fabrication.';
  doc.text(`• ${wTerms.slice(0, 68)}`, margin + 4, termLineY);
  termLineY += 4.5;

  if (qtn.remarks) {
    doc.text(`• Note: ${qtn.remarks.slice(0, 65)}`, margin + 4, termLineY);
  }

  // Right: Price Summary Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(summaryBoxX, curY, summaryBoxWidth, summaryBoxHeight, 2, 2, 'FD');

  const calcSubtotal = qtn.subtotal;
  const calcDiscount = qtn.discountTotal || qtn.discountAmount || 0;
  const calcTaxable = qtn.taxableAmount || Math.max(0, calcSubtotal - calcDiscount);
  const calcTax = qtn.taxTotal || Math.round((calcTaxable * (qtn.taxPercent || 18)) / 100);
  const calcTrans = qtn.transportationCharges || 0;
  const calcGrandTotal = qtn.totalAmount || calcTaxable + calcTax + calcTrans;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', summaryBoxX + 4, curY + 7);
  doc.text(`INR ${calcSubtotal.toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 7, {
    align: 'right',
  });

  if (calcDiscount > 0) {
    doc.text('Discount:', summaryBoxX + 4, curY + 12.5);
    doc.setTextColor(220, 38, 38);
    doc.text(`- INR ${calcDiscount.toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 12.5, {
      align: 'right',
    });
    doc.setTextColor(71, 85, 105);
  }

  doc.text('Taxable Value:', summaryBoxX + 4, curY + 18);
  doc.text(`INR ${calcTaxable.toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 18, {
    align: 'right',
  });

  doc.text(`GST (${qtn.taxPercent || 18}%):`, summaryBoxX + 4, curY + 23.5);
  doc.text(`INR ${calcTax.toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 23.5, {
    align: 'right',
  });

  if (calcTrans > 0) {
    doc.text('Transportation:', summaryBoxX + 4, curY + 29);
    doc.text(`INR ${calcTrans.toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 29, {
      align: 'right',
    });
  }

  // Grand Total Highlight Banner
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.roundedRect(summaryBoxX, curY + 33, summaryBoxWidth, 11, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL:', summaryBoxX + 4, curY + 40);

  doc.setFontSize(10.5);
  doc.setTextColor(56, 189, 248); // #38BDF8
  doc.text(`INR ${Math.round(calcGrandTotal).toLocaleString('en-IN')}`, pageWidth - margin - 4, curY + 40, {
    align: 'right',
  });

  // 5. SIGNATURE & COMPANY SEAL FOOTER
  const signY = curY + summaryBoxHeight + 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, signY, pageWidth - margin, signY);

  // Left Bank & Payment Info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Direct Bank Transfer Account:', margin, signY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Account Name: Kerala Incinerator Pvt Ltd', margin, signY + 10);
  doc.text('Bank: State Bank of India | Branch: Perumbavoor Main', margin, signY + 14);
  doc.text('A/C No: 384792019482 | IFSC Code: SBIN0070154', margin, signY + 18);
  doc.text('UPI ID: keralaincinerator@sbi', margin, signY + 22);

  // Right Signatory Box
  const signBoxRight = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('For KERALA INCINERATOR', signBoxRight, signY + 6, { align: 'right' });

  // Stylized digital verification stamp
  doc.setDrawColor(37, 99, 235);
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(signBoxRight - 46, signY + 10, 46, 10, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(37, 99, 235);
  doc.text('OFFICIALLY VERIFIED & ISSUED', signBoxRight - 23, signY + 14, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Ref: ${qtn.quotationNumber}`, signBoxRight - 23, signY + 18, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Authorized Signatory', signBoxRight, signY + 25, { align: 'right' });

  // Bottom Notice
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This is a computer-generated commercial quotation issued by Kerala Incinerator. All prices include applicable taxes as specified.',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}

export function generateQuotationPDF(qtn: Quotation): void {
  const doc = generateQuotationDoc(qtn);
  doc.save(`${qtn.quotationNumber.replace(/[\/\\]/g, '-')}_Kerala_Incinerator.pdf`);
}

export function printQuotationPdf(qtn: Quotation): void {
  const doc = generateQuotationDoc(qtn);
  const blob = doc.output('blob');
  const blobUrl = URL.createObjectURL(blob);
  const printWindow = window.open(blobUrl, '_blank');
  if (printWindow) {
    printWindow.addEventListener('load', () => {
      printWindow.print();
    });
  } else {
    // Fallback: download if popup blocker stops it
    doc.save(`${qtn.quotationNumber.replace(/[\/\\]/g, '-')}_Kerala_Incinerator.pdf`);
  }
}

export function shareQuotationWhatsApp(qtn: Quotation): void {
  const cleanPhone = qtn.customerPhone.replace(/[^0-9]/g, '');
  const productList = qtn.items && qtn.items.length > 0
    ? qtn.items.map((i) => i.productName).join(', ')
    : 'Incinerator Solution';

  const formattedAmount = `Rs. ${Math.round(qtn.totalAmount).toLocaleString('en-IN')}`;
  const validDate = qtn.validUntil || `${qtn.validityDays || 15} Days`;

  const message = `Hello ${qtn.customerName},

Greetings from Kerala Incinerator.

Please find our quotation *${qtn.quotationNumber}* for *${productList}*.

Quotation Amount: *${formattedAmount}*
Valid Until: *${validDate}*

We are happy to discuss any questions or requirements.

Regards,
*Kerala Incinerator*
Aimury, Perumbavoor, Kerala
Website: https://keralaincinerator.com/
Helpline: +91 94471 20001`;

  const encodedMsg = encodeURIComponent(message);
  const targetUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodedMsg}`
    : `https://wa.me/?text=${encodedMsg}`;

  window.open(targetUrl, '_blank');
}

export const generateQuotationPdf = generateQuotationPDF;
export const shareQuotationOnWhatsApp = shareQuotationWhatsApp;

