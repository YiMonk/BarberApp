"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Plus, Trash2, Edit2 } from "lucide-react";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  commission: number;
  active: boolean;
}

interface StaffManagementProps {
  providerId: string;
}

export function StaffManagement({ providerId }: StaffManagementProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "staff",
    commission: 0,
  });

  const handleAddStaff = () => {
    if (!formData.name.trim() || !formData.email.trim()) return;

    if (editingId) {
      setStaff(
        staff.map((s) =>
          s.id === editingId
            ? { ...s, ...formData }
            : s
        )
      );
      setEditingId(null);
    } else {
      const newMember: StaffMember = {
        id: Date.now().toString(),
        ...formData,
        active: true,
      };
      setStaff([...staff, newMember]);
    }

    setFormData({ name: "", email: "", role: "staff", commission: 0 });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    setStaff(staff.filter((s) => s.id !== id));
  };

  const handleEdit = (member: StaffMember) => {
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      commission: member.commission,
    });
    setEditingId(member.id);
    setShowForm(true);
  };

  const totalCommission = staff.reduce((sum, s) => sum + s.commission, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" />
            Equipo
          </h2>
          <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Agregar
          </Button>
        </div>

        {showForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 space-y-3">
            <input
              type="text"
              placeholder="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="staff">Personal</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
            <input
              type="number"
              placeholder="Comisión (%)"
              value={formData.commission}
              onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="flex gap-2">
              <Button onClick={handleAddStaff} className="flex-1 bg-green-600 hover:bg-green-700">
                {editingId ? "Actualizar" : "Agregar"}
              </Button>
              <Button onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 bg-gray-400 hover:bg-gray-500">
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-600">Total de Personal</p>
          <p className="text-3xl font-bold text-blue-600">{staff.length}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm text-gray-600">Comisión Promedio</p>
          <p className="text-3xl font-bold text-purple-600">
            {staff.length > 0 ? (totalCommission / staff.length).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {staff.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rol</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Comisión</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{member.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                        {member.role === "staff" ? "Personal" : member.role === "manager" ? "Gerente" : "Admin"}
                      </span>
                    </td>
                    <td className="px-6 py-4">{member.commission}%</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(member)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
