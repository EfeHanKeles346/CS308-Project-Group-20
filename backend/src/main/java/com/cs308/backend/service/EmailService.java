package com.cs308.backend.service;

import com.cs308.backend.model.Order;
import com.cs308.backend.model.OrderItem;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.UnsupportedEncodingException;
import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(Locale.US);

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String storeName;
    private final String configuredUsername;

    public EmailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.username:}") String configuredUsername,
            @Value("${invoice.store.email:}") String storeEmail,
            @Value("${invoice.store.name:TechMind}") String storeName) {
        this.mailSender = mailSender;
        this.configuredUsername = configuredUsername;
        this.storeName = storeName;
        this.fromAddress = pickSender(storeEmail, configuredUsername);
    }

    public boolean isConfigured() {
        return configuredUsername != null && !configuredUsername.isBlank();
    }

    public void sendInvoiceEmail(Order order, byte[] invoicePdf) {
        if (!isConfigured()) {
            log.info("SMTP not configured — skipping invoice email for order {}", safeId(order));
            return;
        }
        if (order == null || order.getUserEmail() == null || order.getUserEmail().isBlank()) {
            log.warn("Cannot send invoice — order or recipient missing");
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            try {
                helper.setFrom(fromAddress, storeName);
            } catch (UnsupportedEncodingException ex) {
                helper.setFrom(fromAddress);
            }
            helper.setTo(order.getUserEmail());
            helper.setSubject("Your " + storeName + " invoice · Order #" + shortId(order.getOrderId()));
            helper.setText(buildEmailBody(order), true);

            String filename = "invoice-" + shortId(order.getOrderId()) + ".pdf";
            helper.addAttachment(filename, new ByteArrayResource(invoicePdf));

            mailSender.send(message);
            log.info("Invoice email sent to {} for order {}", order.getUserEmail(), shortId(order.getOrderId()));
        } catch (MessagingException ex) {
            log.error("Failed to send invoice email for order {}: {}", safeId(order), ex.getMessage());
        } catch (RuntimeException ex) {
            log.error("Unexpected error sending invoice email for order {}", safeId(order), ex);
        }
    }

    private String buildEmailBody(Order order) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><body style=\"font-family:Inter,Arial,sans-serif;")
            .append("background:#f8f9fb;margin:0;padding:32px 16px;color:#111827;\">");
        html.append("<div style=\"max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;")
            .append("border-radius:20px;padding:32px;box-shadow:0 4px 24px rgba(0,0,0,0.06);\">");

        html.append("<p style=\"margin:0 0 6px;font-size:11px;letter-spacing:0.14em;")
            .append("text-transform:uppercase;font-weight:700;color:#0891b2;\">Order Confirmation</p>");
        html.append("<h1 style=\"margin:0 0 18px;font-size:24px;color:#111827;\">Thanks for your order, ")
            .append(escape(firstName(order.getFullName()))).append("!</h1>");
        html.append("<p style=\"margin:0 0 22px;font-size:14px;line-height:1.6;color:#4b5563;\">")
            .append("Your payment has been approved. Your invoice is attached as a PDF for your records.")
            .append("</p>");

        html.append("<table style=\"width:100%;border-collapse:collapse;margin-bottom:20px;")
            .append("background:#f8f9fb;border-radius:12px;\">");
        appendInfoRow(html, "Order", "#" + shortId(order.getOrderId()));
        appendInfoRow(html, "Status", (order.getStatus() == null ? "PROCESSING" : order.getStatus()));
        appendInfoRow(html, "Total", MONEY.format(order.getTotalPrice()));
        html.append("</table>");

        List<OrderItem> items = order.getItems();
        if (items != null && !items.isEmpty()) {
            html.append("<h3 style=\"margin:0 0 10px;font-size:14px;color:#111827;\">Items</h3>");
            html.append("<table style=\"width:100%;border-collapse:collapse;font-size:13px;\">");
            for (OrderItem item : items) {
                double line = item.getUnitPrice() * item.getQuantity();
                html.append("<tr>")
                    .append("<td style=\"padding:8px 0;border-bottom:1px solid #e5e7eb;\">")
                    .append("<strong>").append(escape(item.getProductName())).append("</strong><br>")
                    .append("<span style=\"color:#6b7280;font-size:12px;\">Qty ")
                    .append(item.getQuantity()).append(" · ").append(MONEY.format(item.getUnitPrice()))
                    .append(" each</span></td>")
                    .append("<td style=\"padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;")
                    .append("font-weight:700;\">").append(MONEY.format(line)).append("</td>")
                    .append("</tr>");
            }
            html.append("</table>");
        }

        html.append("<p style=\"margin:24px 0 0;font-size:12px;color:#9ca3af;\">")
            .append("Need help? Just reply to this email.</p>");
        html.append("</div></body></html>");
        return html.toString();
    }

    private void appendInfoRow(StringBuilder html, String label, String value) {
        html.append("<tr>")
            .append("<td style=\"padding:10px 14px;font-size:12px;color:#6b7280;")
            .append("text-transform:uppercase;letter-spacing:0.08em;font-weight:700;\">")
            .append(escape(label)).append("</td>")
            .append("<td style=\"padding:10px 14px;text-align:right;font-size:14px;")
            .append("font-weight:700;color:#111827;\">").append(escape(value)).append("</td>")
            .append("</tr>");
    }

    private String pickSender(String storeEmail, String username) {
        if (storeEmail != null && !storeEmail.isBlank()) return storeEmail;
        if (username != null && !username.isBlank()) return username;
        return "no-reply@techmind.local";
    }

    private String shortId(String id) {
        if (id == null || id.isBlank()) return "—";
        return id.length() <= 10 ? id.toUpperCase(Locale.ROOT) : id.substring(0, 8).toUpperCase(Locale.ROOT);
    }

    private String safeId(Order order) {
        return order == null ? "?" : shortId(order.getOrderId());
    }

    private String firstName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "there";
        int space = fullName.indexOf(' ');
        return space > 0 ? fullName.substring(0, space) : fullName;
    }

    private String escape(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;");
    }
}
