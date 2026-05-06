package com.cs308.backend.service;

import com.cs308.backend.model.Address;
import com.cs308.backend.model.Order;
import com.cs308.backend.model.OrderItem;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class InvoiceService {

    private static final Color CYAN = new Color(8, 145, 178);
    private static final Color INK = new Color(17, 24, 39);
    private static final Color MUTED = new Color(107, 114, 128);
    private static final Color LINE = new Color(229, 231, 235);
    private static final Color TINT = new Color(248, 249, 251);
    private static final Color GREEN = new Color(16, 185, 129);

    private static final DateTimeFormatter DATE_FMT =
        DateTimeFormatter.ofPattern("MMMM d, yyyy · HH:mm").withZone(ZoneId.systemDefault());
    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(Locale.US);

    private final String storeName;
    private final String storeEmail;
    private final String storeAddress;
    private final String storeWebsite;

    public InvoiceService(
            @Value("${invoice.store.name:TechMind}") String storeName,
            @Value("${invoice.store.email:no-reply@techmind.local}") String storeEmail,
            @Value("${invoice.store.address:}") String storeAddress,
            @Value("${invoice.store.website:}") String storeWebsite) {
        this.storeName = storeName;
        this.storeEmail = storeEmail;
        this.storeAddress = storeAddress;
        this.storeWebsite = storeWebsite;
    }

    public byte[] buildInvoice(Order order) {
        if (order == null) {
            throw new IllegalArgumentException("order is required");
        }

        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 48, 48, 48, 48);

        try {
            PdfWriter.getInstance(document, buffer);
            document.open();

            document.add(buildHeader(order));
            document.add(buildMetaTable(order));
            document.add(spacer(18));
            document.add(buildBillToTable(order));
            document.add(spacer(22));
            document.add(buildItemsTable(order));
            document.add(spacer(14));
            document.add(buildTotalsBlock(order));
            document.add(spacer(26));
            document.add(buildFooter());
        } catch (DocumentException ex) {
            throw new IllegalStateException("Failed to build invoice PDF", ex);
        } finally {
            if (document.isOpen()) {
                document.close();
            }
        }

        return buffer.toByteArray();
    }

    private PdfPTable buildHeader(Order order) {
        PdfPTable header = newTable(new float[]{ 3f, 2f });

        PdfPCell left = emptyCell();
        Paragraph brand = new Paragraph(storeName.toUpperCase(Locale.ROOT),
            font(20f, Font.BOLD, INK));
        brand.setLeading(24f);
        left.addElement(brand);

        String subtitle = joinParts(" · ", storeWebsite, storeEmail);
        if (!subtitle.isBlank()) {
            Paragraph sub = new Paragraph(subtitle, font(9f, Font.NORMAL, MUTED));
            sub.setSpacingBefore(2f);
            left.addElement(sub);
        }
        if (storeAddress != null && !storeAddress.isBlank()) {
            Paragraph addr = new Paragraph(storeAddress, font(9f, Font.NORMAL, MUTED));
            left.addElement(addr);
        }

        PdfPCell right = emptyCell();
        right.setHorizontalAlignment(Element.ALIGN_RIGHT);
        Paragraph invoiceLabel = new Paragraph("INVOICE", font(28f, Font.BOLD, CYAN));
        invoiceLabel.setAlignment(Element.ALIGN_RIGHT);
        right.addElement(invoiceLabel);

        Paragraph statusLine = new Paragraph();
        statusLine.setAlignment(Element.ALIGN_RIGHT);
        String statusText = order.getStatus() == null ? "PROCESSING" : order.getStatus();
        statusLine.add(new Phrase("Status   ", font(9f, Font.NORMAL, MUTED)));
        statusLine.add(new Phrase(statusText, font(10f, Font.BOLD, GREEN)));
        statusLine.setSpacingBefore(4f);
        right.addElement(statusLine);

        header.addCell(left);
        header.addCell(right);
        header.setSpacingAfter(20f);
        return header;
    }

    private PdfPTable buildMetaTable(Order order) {
        PdfPTable meta = newTable(new float[]{ 1f, 1f, 1f });
        meta.setSpacingBefore(6f);
        meta.addCell(metaCell("Invoice Number", shortId(order.getOrderId())));
        meta.addCell(metaCell("Issue Date", formatDate(order.getCreatedAt())));
        meta.addCell(metaCell("Total", MONEY.format(order.getTotalPrice())));
        return meta;
    }

    private PdfPTable buildBillToTable(Order order) {
        PdfPTable billTo = newTable(new float[]{ 1f, 1f });
        billTo.setSpacingBefore(12f);

        PdfPCell soldTo = softCell();
        soldTo.addElement(kicker("SOLD TO"));
        soldTo.addElement(value(order.getFullName(), true));
        soldTo.addElement(value(order.getUserEmail(), false));

        PdfPCell shipTo = softCell();
        shipTo.addElement(kicker("DELIVERY ADDRESS"));
        Address address = order.getDeliveryAddress();
        if (address != null) {
            if (hasValue(address.getFullName())) {
                shipTo.addElement(value(address.getFullName(), true));
            }
            if (hasValue(address.getLine1())) {
                shipTo.addElement(value(address.getLine1(), false));
            }
            if (hasValue(address.getLine2())) {
                shipTo.addElement(value(address.getLine2(), false));
            }
            String cityLine = joinParts(", ", address.getCity(), address.getPostalCode());
            if (!cityLine.isBlank()) {
                shipTo.addElement(value(cityLine, false));
            }
            if (hasValue(address.getCountry())) {
                shipTo.addElement(value(address.getCountry(), false));
            }
            if (hasValue(address.getPhone())) {
                shipTo.addElement(value("Phone: " + address.getPhone(), false));
            }
        }

        billTo.addCell(soldTo);
        billTo.addCell(shipTo);
        return billTo;
    }

    private PdfPTable buildItemsTable(Order order) {
        PdfPTable items = newTable(new float[]{ 4f, 2f, 1f, 1.5f, 1.5f });
        items.setSpacingBefore(8f);

        items.addCell(headerCell("Product"));
        items.addCell(headerCell("Product ID"));
        items.addCell(headerCellRight("Qty"));
        items.addCell(headerCellRight("Unit Price"));
        items.addCell(headerCellRight("Subtotal"));

        List<OrderItem> lines = order.getItems();
        boolean alternate = false;
        if (lines != null) {
            for (OrderItem item : lines) {
                Color rowBg = alternate ? TINT : Color.WHITE;
                double subtotal = item.getUnitPrice() * item.getQuantity();

                items.addCell(bodyCell(item.getProductName() == null ? "—" : item.getProductName(), rowBg, Element.ALIGN_LEFT));
                items.addCell(bodyCell(shortId(item.getProductId()), rowBg, Element.ALIGN_LEFT));
                items.addCell(bodyCell(String.valueOf(item.getQuantity()), rowBg, Element.ALIGN_RIGHT));
                items.addCell(bodyCell(MONEY.format(item.getUnitPrice()), rowBg, Element.ALIGN_RIGHT));
                items.addCell(bodyCell(MONEY.format(subtotal), rowBg, Element.ALIGN_RIGHT));
                alternate = !alternate;
            }
        }

        return items;
    }

    private PdfPTable buildTotalsBlock(Order order) {
        double itemsTotal = 0.0;
        int itemCount = 0;
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemsTotal += item.getUnitPrice() * item.getQuantity();
                itemCount += item.getQuantity();
            }
        }
        double total = order.getTotalPrice();

        PdfPTable wrapper = newTable(new float[]{ 2f, 1.3f });
        PdfPCell spacerCell = emptyCell();
        spacerCell.setBorder(Rectangle.NO_BORDER);
        wrapper.addCell(spacerCell);

        PdfPCell totalsCell = emptyCell();
        totalsCell.setBorder(Rectangle.NO_BORDER);

        PdfPTable totals = new PdfPTable(2);
        totals.setWidthPercentage(100f);
        totals.addCell(summaryLabel("Items (" + itemCount + ")"));
        totals.addCell(summaryValue(MONEY.format(itemsTotal)));
        totals.addCell(summaryLabel("Shipping"));
        totals.addCell(summaryValueMuted("Free"));

        PdfPCell totalLabel = new PdfPCell(new Phrase("TOTAL", font(11f, Font.BOLD, INK)));
        totalLabel.setBorder(Rectangle.TOP);
        totalLabel.setBorderColor(LINE);
        totalLabel.setPaddingTop(10f);
        totalLabel.setPaddingBottom(8f);
        totalLabel.setHorizontalAlignment(Element.ALIGN_LEFT);

        PdfPCell totalValue = new PdfPCell(new Phrase(MONEY.format(total), font(16f, Font.BOLD, CYAN)));
        totalValue.setBorder(Rectangle.TOP);
        totalValue.setBorderColor(LINE);
        totalValue.setPaddingTop(6f);
        totalValue.setPaddingBottom(8f);
        totalValue.setHorizontalAlignment(Element.ALIGN_RIGHT);

        totals.addCell(totalLabel);
        totals.addCell(totalValue);
        totalsCell.addElement(totals);

        wrapper.addCell(totalsCell);
        return wrapper;
    }

    private Paragraph buildFooter() {
        Paragraph thanks = new Paragraph("Thank you for shopping with " + storeName + ".",
            font(10f, Font.BOLD, INK));
        thanks.setSpacingBefore(20f);

        Paragraph note = new Paragraph(
            "This is a computer-generated invoice for your records. If you have questions about this order, "
                + "reply to this email and our team will get back to you.",
            font(9f, Font.NORMAL, MUTED));
        note.setLeading(13f);
        note.setSpacingBefore(4f);

        Paragraph container = new Paragraph();
        container.add(thanks);
        container.add(note);
        return container;
    }

    private PdfPTable newTable(float[] widths) {
        PdfPTable table = new PdfPTable(widths);
        table.setWidthPercentage(100f);
        return table;
    }

    private PdfPCell emptyCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(0f);
        return cell;
    }

    private PdfPCell softCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(LINE);
        cell.setBackgroundColor(TINT);
        cell.setPadding(14f);
        return cell;
    }

    private PdfPCell metaCell(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.BOX);
        cell.setBorderColor(LINE);
        cell.setPadding(12f);
        cell.addElement(kicker(label));
        cell.addElement(value(value, true));
        return cell;
    }

    private PdfPCell headerCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(9f, Font.BOLD, Color.WHITE)));
        cell.setBackgroundColor(INK);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(9f);
        cell.setHorizontalAlignment(Element.ALIGN_LEFT);
        return cell;
    }

    private PdfPCell headerCellRight(String text) {
        PdfPCell cell = headerCell(text);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

    private PdfPCell bodyCell(String text, Color background, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(10f, Font.NORMAL, INK)));
        cell.setBackgroundColor(background);
        cell.setBorder(Rectangle.BOTTOM);
        cell.setBorderColor(LINE);
        cell.setPadding(9f);
        cell.setHorizontalAlignment(alignment);
        return cell;
    }

    private PdfPCell summaryLabel(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(10f, Font.NORMAL, MUTED)));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(4f);
        cell.setPaddingBottom(4f);
        return cell;
    }

    private PdfPCell summaryValue(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font(10f, Font.BOLD, INK)));
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingTop(4f);
        cell.setPaddingBottom(4f);
        cell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        return cell;
    }

    private PdfPCell summaryValueMuted(String text) {
        PdfPCell cell = summaryValue(text);
        cell.getPhrase().getFont().setColor(GREEN);
        return cell;
    }

    private Paragraph kicker(String text) {
        Paragraph p = new Paragraph(text, font(8f, Font.BOLD, MUTED));
        p.setLeading(11f);
        return p;
    }

    private Paragraph value(String text, boolean emphasise) {
        Paragraph p = new Paragraph(text == null ? "" : text,
            font(11f, emphasise ? Font.BOLD : Font.NORMAL, INK));
        p.setLeading(14f);
        p.setSpacingBefore(emphasise ? 4f : 0f);
        return p;
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setLeading(height);
        return p;
    }

    private Font font(float size, int style, Color color) {
        Font font = FontFactory.getFont(FontFactory.HELVETICA, size, style);
        font.setColor(color);
        return font;
    }

    private String shortId(String id) {
        if (id == null || id.isBlank()) return "—";
        return id.length() <= 10 ? id.toUpperCase(Locale.ROOT) : id.substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String formatDate(long millis) {
        if (millis <= 0) return "—";
        return DATE_FMT.format(Instant.ofEpochMilli(millis));
    }

    private String joinParts(String separator, String... parts) {
        StringBuilder out = new StringBuilder();
        for (String part : parts) {
            if (part == null || part.isBlank()) continue;
            if (out.length() > 0) out.append(separator);
            out.append(part);
        }
        return out.toString();
    }

    private boolean hasValue(String value) {
        return value != null && !value.isBlank();
    }
}
