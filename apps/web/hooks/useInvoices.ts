import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Invoice {
  id: string;
  appointment_id: string;
  provider_account_id: string;
  client_name: string;
  client_email: string;
  total_amount: number;
  discount_amount?: number;
  final_amount: number;
  items: InvoiceItem[];
  notes?: string;
  issued_date: string;
  due_date?: string;
  status: "draft" | "issued" | "paid" | "cancelled";
}

export interface InvoiceItem {
  service_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export function useInvoices(providerId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const generateInvoice = useCallback(
    async (invoiceData: Omit<Invoice, "id">) => {
      if (!providerId) return { success: false, error: "No provider ID" };

      setLoading(true);
      setError(null);

      try {
        const invoicePayload = {
          ...invoiceData,
          provider_account_id: providerId,
          items: JSON.stringify(invoiceData.items),
        };

        const { data, error: err } = await supabase
          .from("invoices")
          .insert(invoicePayload)
          .select()
          .single();

        if (err) throw err;

        setInvoices((prev) => [data, ...prev]);
        return { success: true, data };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error generating invoice";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [providerId]
  );

  const generatePDF = useCallback(
    async (invoice: Invoice): Promise<Blob | null> => {
      try {
        // En producción, usar jsPDF o similar
        // Por ahora, retornar un placeholder
        return new Blob(
          [
            `
FACTURA #${invoice.id}
${new Date(invoice.issued_date).toLocaleDateString("es-CL")}

Cliente: ${invoice.client_name}
Email: ${invoice.client_email}

ITEMS:
${invoice.items.map((item) => `${item.service_name} x${item.quantity}: $${item.total}`).join("\n")}

Subtotal: $${invoice.total_amount}
${invoice.discount_amount ? `Descuento: -$${invoice.discount_amount}` : ""}
TOTAL: $${invoice.final_amount}

Estado: ${invoice.status}
          `,
          ],
          { type: "text/plain" }
        );
      } catch (err) {
        console.error("Error generating PDF:", err);
        return null;
      }
    },
    []
  );

  const downloadInvoice = useCallback(
    async (invoice: Invoice) => {
      const pdf = await generatePDF(invoice);
      if (!pdf) return;

      const url = URL.createObjectURL(pdf);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${invoice.id}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [generatePDF]
  );

  const sendInvoiceEmail = useCallback(
    async (invoice: Invoice) => {
      setLoading(true);

      try {
        const response = await fetch("/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: invoice.client_email,
            subject: `Factura #${invoice.id}`,
            type: "invoice",
            data: invoice,
          }),
        });

        if (!response.ok) throw new Error("Failed to send invoice email");

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error sending invoice";
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    invoices,
    loading,
    error,
    generateInvoice,
    downloadInvoice,
    sendInvoiceEmail,
  };
}
