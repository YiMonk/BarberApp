"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    businessName: "",
    businessCategory: "",
    businessPhone: "",
    businessEmail: "",
    description: "",
  });

  // Redirect if not authenticated
  if (!authLoading && !user) {
    router.push("/login");
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNextStep = async () => {
    setError(null);

    if (step === 1) {
      if (!formData.businessName.trim()) {
        setError("Business name is required");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.businessCategory) {
        setError("Category is required");
        return;
      }
      setStep(3);
    } else if (step === 5) {
      // Final step - save everything
      setLoading(true);
      try {
        const { error: updateError } = await supabase
          .from("provider_accounts")
          .update({
            business_name: formData.businessName,
            category: formData.businessCategory,
            phone: formData.businessPhone,
            email: formData.businessEmail,
            description: formData.description,
            onboarding_completed: true,
          })
          .eq("auth_user_id", user?.id);

        if (updateError) throw updateError;

        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      } finally {
        setLoading(false);
      }
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 mx-1 rounded ${
                  s <= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Step {step} of 5
          </p>
        </div>

        {/* Form content */}
        <div className="bg-white rounded-lg shadow p-8">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Business Details</h2>
                <p className="text-gray-600">Tell us about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="e.g., Juan's Barbershop"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Service Category</h2>
                <p className="text-gray-600">What services do you provide?</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Category *
                </label>
                <select
                  name="businessCategory"
                  value={formData.businessCategory}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select category</option>
                  <option value="barbershop">Barbershop</option>
                  <option value="salon">Hair Salon</option>
                  <option value="nails">Nail Studio</option>
                  <option value="massage">Massage Therapy</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Contact Information</h2>
                <p className="text-gray-600">How clients can reach you</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="businessPhone"
                  value={formData.businessPhone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="businessEmail"
                  value={formData.businessEmail}
                  onChange={handleChange}
                  placeholder="business@example.com"
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Description</h2>
                <p className="text-gray-600">Tell clients about your business</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Business Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="e.g., Premium barbershop with 15 years of experience..."
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Ready to Launch!</h2>
                <p className="text-gray-600">
                  Your account is set up. You have a 14-day trial. Next, you'll
                  set up your schedule and services.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  ✓ Account created
                  <br />✓ Trial activated
                  <br />✓ Ready to add services
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            <Button
              onClick={handlePrevStep}
              disabled={step === 1}
              variant="outline"
              className="flex-1"
            >
              Back
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={loading}
              className="flex-1"
            >
              {step === 5
                ? loading
                  ? "Completing..."
                  : "Complete Setup"
                : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
