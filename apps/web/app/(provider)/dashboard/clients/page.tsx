"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { useClients } from "@/hooks/useClients";
import { ClientForm } from "@/components/clients/ClientForm";
import { ClientList } from "@/components/clients/ClientList";
import { Button } from "@/components/ui/button";

export default function ClientsPage() {
  const { user } = useAuthContext();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState("");
  const {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClientNotes,
    toggleWhatsappReminders,
  } = useClients(providerId);

  useEffect(() => {
    const fetchProviderId = async () => {
      if (!user?.id) return;

      const { data, error: err } = await supabase
        .from("provider_accounts")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (err) {
        console.error("Error fetching provider:", err);
        return;
      }

      setProviderId(data.id);
    };

    fetchProviderId();
  }, [user?.id]);

  useEffect(() => {
    if (providerId) {
      fetchClients();
    }
  }, [providerId, fetchClients]);

  const handleCreateClient = async (data: {
    firstName: string;
    phone?: string;
    email?: string;
    lastName?: string;
    notes?: string;
  }) => {
    const result = await createClient(
      data.firstName,
      data.phone,
      data.email,
      data.lastName,
      data.notes
    );

    if (result.success) {
      setShowForm(false);
    }

    return result;
  };

  const handleSaveNotes = async (linkId: string) => {
    await updateClientNotes(linkId, editingNote);
    setEditingNoteId(null);
  };

  const handleEditNotes = (linkId: string) => {
    const client = clients.find((c) => c.id === linkId);
    if (client) {
      setEditingNoteId(linkId);
      setEditingNote(client.internal_notes || "");
    }
  };

  if (loading && clients.length === 0) {
    return <div className="p-6">Loading clients...</div>;
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Clients</h1>
          <p className="text-gray-600 mt-1">
            Manage your client database and preferences
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingNoteId(null);
            setShowForm(!showForm);
          }}
          disabled={showForm || editingNoteId !== null}
        >
          {showForm ? "Cancel" : "+ Add Client"}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-8 p-6 bg-white border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">New Client</h2>
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={() => setShowForm(false)}
            loading={loading}
          />
        </div>
      )}

      {/* Edit notes modal */}
      {editingNoteId && (
        <div className="mb-8 p-6 bg-white border border-blue-200 rounded-lg bg-blue-50">
          <h2 className="text-lg font-semibold mb-3">Edit Notes</h2>
          <textarea
            value={editingNote}
            onChange={(e) => setEditingNote(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-md text-sm mb-4"
            placeholder="Add internal notes about this client..."
          />
          <div className="flex gap-2">
            <Button
              onClick={() => handleSaveNotes(editingNoteId)}
              disabled={loading}
            >
              Save Notes
            </Button>
            <Button
              onClick={() => setEditingNoteId(null)}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Clients list */}
      <ClientList
        clients={clients}
        onToggleReminders={toggleWhatsappReminders}
        onEditNotes={handleEditNotes}
        loading={loading}
      />

      {/* Info */}
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Tip:</strong> Manual clients don't need to sign up.
          They'll receive appointment reminders and invitations via WhatsApp.
        </p>
      </div>
    </main>
  );
}
