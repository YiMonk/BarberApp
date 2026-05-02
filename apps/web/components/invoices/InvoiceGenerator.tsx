"use client";

import { useState } from "react";
import { useInvoices, Invoice, InvoiceItem } from "@/hooks/useInvoices";
import { Button } from "@/components/ui/button";
import { Download, Mail, Eye } from "lucide-react";

interface InvoiceGeneratorProps {
  appointmentId: string;
  clientName: string;
  clientEmail: string;
  services: Array<{ name: string; price: number }>;
  onSuccess?: () => void;
}

export function InvoiceGenerator({
  appointmentId,
  clientName,
  clientEmail,
  services,
  onSuccess,
}: InvoiceGeneratorProps) {
  const { generateInvoice, downloadInvoice, sendInvoiceEmail, loading } = useInvoices(null);
  const [showPreview, setShowPreview] = useState(false);
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);

  const items: InvoiceItem[] = services.map((service) => ({
    service_name: service.name,
    quantity: 1,
    unit_price: service.price,
    total: service.price,
  }));

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
  const finalAmount = totalAmount - discount;

  const handleGenerate = async () => {
    const invoice: Omit<Invoice, "id"> = {
      appointment_id: appointmentId,
      provider_account_id: "",
      client_name: clientName,
      client_email: clientEmail,
      total_amount: totalAmount,
      discount_amount: discount > 0 ? discount : undefined,
      final_amount: finalAmount,
      items,
      notes: notes || undefined,
      issued_date: new Date().toISOString(),
      status: "issued",
    };

    const result = await generateInvoice(invoice);

    if (result.success) {
      await downloadInvoice(result.data as Invoice);
      onSuccess?.();
    }
  };

  const handleSendEmail = async () => {
    const invoice: Omit<Invoice, "id"> = {
      appointment_id: appointmentId,
      provider_account_id: "",
      client_name: clientName,
      client_email: clientEmail,
      total_amount: totalAmount,
      discount_amount: discount > 0 ? discount : undefined,
      final_amount: finalAmount,
      items,
      notes: notes || undefined,
      issued_date: new Date().toISOString(),
      status: "issued",
    };

    const result = await sendInvoiceEmail(invoice as Invoice);

    if (result.success) {
      onSuccess?.();
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg">Generar Factura</h3>

        {/* Items Preview */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>
                {item.service_name} x{item.quantity}
              </span>
              <span className="font-medium">${item.total}</span>
            </div>
          ))}

          <div className="border-t pt-2 flex justify-between font-medium">
            <span>Subtotal</span>
            <span>${totalAmount}</span>
          </div>

          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Descuento</span>
              <span>-${discount}</span>
            </div>
          )}

          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${finalAmount}</span>
          </div>
        </div>

        {/* Discount Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Descuento</label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
            min="0"
            max={totalAmount}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Términos de pago, notas especiales, etc."
            rows={2}
            maxLength={200}
            className="w-full px-3 py-2 border rounded-md text-sm"
            disabled={loading}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowPreview(!showPreview)}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            <Eye className="w-4 h-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? "Generando..." : "Descargar"}
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <Mail className="w-4 h-4 mr-2" />
            {loading ? "Enviando..." : "Enviar"}
          </Button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="font-semibold mb-4">Vista Previa</h3>
          <div className="bg-gray-50 p-6 rounded space-y-4 text-sm">
            <div>
              <p className="font-bold">FACTURA</p>
              <p className="text-gray-600">
                {new Date().toLocaleDateString("es-CL")}
              </p>
            </div>

            <div>
              <p className="font-medium">{clientName}</p>
              <p className="text-gray-600">{clientEmail}</p>
            </div>

            <div className="border-t border-b py-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{item.service_name}</span>
                  <span>${item.total}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-bold">
              <span>Total: ${finalAmount}</span>
            </div>

            {notes && (
              <div className="text-gray-600 italic">
                <p className="font-medium text-gray-900">Notas:</p>
                <p>{notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
