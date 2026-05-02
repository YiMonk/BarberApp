"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { useCoupons } from "@/hooks/useCoupons";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Copy } from "lucide-react";

export function CouponManager() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const { coupons, loading, error, fetchCoupons, createCoupon, deleteCoupon } =
    useCoupons(providerId);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    description: "",
    max_uses: 0,
    valid_until: "",
  });

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      try {
        const { data } = await supabase
          .from("provider_accounts")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();

        if (data) {
          setProviderId(data.id);
        }
      } catch (err) {
        console.error("Error fetching provider ID:", err);
      }
    };

    fetchProviderId();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) {
      fetchCoupons();
    }
  }, [providerId, fetchCoupons]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "discount_value" || name === "max_uses" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await createCoupon({
      code: formData.code.toUpperCase(),
      discount_type: formData.discount_type,
      discount_value: formData.discount_value,
      description: formData.description,
      max_uses: formData.max_uses || undefined,
      valid_from: new Date().toISOString(),
      valid_until: formData.valid_until
        ? new Date(formData.valid_until).toISOString()
        : undefined,
      active: true,
      provider_account_id: providerId!,
    });

    if (result.success) {
      setFormData({
        code: "",
        discount_type: "percentage",
        discount_value: 10,
        description: "",
        max_uses: 0,
        valid_until: "",
      });
      setShowForm(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este cupón?")) {
      await deleteCoupon(couponId);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return <div className="text-center text-gray-500">Cargando cupones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cupones y Descuentos</h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cupón
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="DESCUENTO20"
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="percentage">Porcentaje (%)</option>
                <option value="fixed">Cantidad Fija ($)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor de Descuento</label>
              <input
                type="number"
                name="discount_value"
                value={formData.discount_value}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 border rounded-md text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Máximo de Usos</label>
              <input
                type="number"
                name="max_uses"
                value={formData.max_uses}
                onChange={handleChange}
                min="0"
                placeholder="0 = sin límite"
                className="w-full px-3 py-2 border rounded-md text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Válido Hasta</label>
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Ej: Descuento de cumpleaños"
              rows={2}
              maxLength={200}
              className="w-full px-3 py-2 border rounded-md text-sm"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Crear Cupón
            </Button>
            <Button
              type="button"
              onClick={() => setShowForm(false)}
              variant="outline"
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {coupons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay cupones. Crea uno para comenzar.
        </div>
      ) : (
        <div className="space-y-2">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="p-4 bg-white rounded-lg border flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <code className="px-3 py-1 bg-gray-100 rounded font-mono font-bold">
                    {coupon.code}
                  </code>
                  <button
                    onClick={() => handleCopyCode(coupon.code)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Copiar código"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}% de descuento`
                      : `$${coupon.discount_value} de descuento`}
                  </p>
                  {coupon.description && <p>{coupon.description}</p>}
                  <p>
                    Usos: {coupon.current_uses}
                    {coupon.max_uses ? `/${coupon.max_uses}` : " (sin límite)"}
                  </p>
                  {coupon.valid_until && (
                    <p>
                      Válido hasta:{" "}
                      {new Date(coupon.valid_until).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {!coupon.active && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
                    Inactivo
                  </span>
                )}
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
