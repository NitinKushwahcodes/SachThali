// Multi-page profile creation stepper component matching Part E specification.
// Implements 5-page fast onboarding: P1 (Name, mandatory Age, Email/Phone), P2 (3-tap Gender), P3 (Body metrics),
// P4 (Purpose & conditional Health Condition inputs), P5 (Legal safety consent & submit).

import React, { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { ArrowRight, ArrowLeft, Check, ShieldAlert } from 'lucide-react';

export function OnboardingStepper({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    gender: 'prefer_not_to_say',
    weightKg: '',
    heightCm: '',
    purpose: 'general',
    hasHealthCondition: false,
    conditionDescription: '',
    conditionSeverity: 'mild',
    consultingDoctor: false,
  });
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const isNameValid = Boolean(formData.fullName && formData.fullName.trim().length > 0);
  const isAgeValid = Boolean(formData.age && Number(formData.age) > 0 && Number(formData.age) <= 120);

  const handleGenderSelect = (selectedGender) => {
    updateField('gender', selectedGender);
    setStep(3); // Advance immediately on gender tap
  };

  const handleSubmit = async () => {
    if (!formData.fullName || !formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!acceptedLegal) {
      setError('Please tick the consent box before creating your profile.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        fullName: formData.fullName.trim(),
        age: formData.age ? Number(formData.age) : null,
        email: formData.email || null,
        phone: formData.phone || null,
        gender: formData.gender,
        heightCm: formData.heightCm ? Number(formData.heightCm) : null,
        weightKg: formData.weightKg ? Number(formData.weightKg) : null,
        purpose: formData.purpose,
        hasHealthCondition: Boolean(formData.hasHealthCondition),
        conditionDescription: formData.hasHealthCondition ? formData.conditionDescription || null : null,
        conditionSeverity: formData.hasHealthCondition ? formData.conditionSeverity : null,
        consultingDoctor: formData.hasHealthCondition ? Boolean(formData.consultingDoctor) : null,
      };

      const result = await apiFetch('/profile', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (onComplete) onComplete(result);
    } catch (err) {
      setError(err.message || 'Failed to save profile targets');
    } finally {
      setIsSubmitting(false);
    }
  };

  const purposes = [
    { value: 'general', label: 'General Purpose', desc: 'Maintain health & track diet' },
    { value: 'diet_tracking', label: 'Daily Diet Tracking', desc: 'Log everyday meals' },
    { value: 'calorie_tracking', label: 'Calorie Tracking', desc: 'Monitor calorie intake' },
    { value: 'weight_loss', label: 'Weight Loss', desc: 'Healthy calorie deficit' },
    { value: 'weight_gain', label: 'Weight Gain', desc: 'Muscle & weight surplus' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-md max-w-lg mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Create Profile</h2>
        <span className="text-xs font-semibold text-[#3F8F5F] bg-emerald-50 px-3 py-1 rounded-full">
          Step {step} of 5
        </span>
      </div>

      {error && <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl font-semibold">{error}</div>}

      {/* PAGE 1: Name (mandatory), Age (mandatory), Email/Phone */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900">Let's start with your basics</h3>

          <div>
            <label className="text-xs text-gray-900 font-bold block mb-1">
              Full Name <span className="text-red-500">* (Mandatory)</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              placeholder="e.g. Nitin Sharma"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-900 font-bold block mb-1">
              Age <span className="text-red-500">* (Mandatory)</span>
            </label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => updateField('age', e.target.value)}
              placeholder="e.g. 26"
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
            />
            {!isAgeValid && formData.age !== '' && (
              <span className="text-[11px] text-red-500 mt-1 block">Please enter a valid age (1-120)</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="name@example.com"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-semibold block mb-1">Phone (Optional)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="+91 9876543210"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              disabled={!isAgeValid || !isNameValid}
              onClick={() => setStep(2)}
              className="w-full py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-colors shadow-sm flex items-center justify-center gap-2 text-sm disabled:opacity-40"
            >
              <span>Next: Gender</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 2: Gender (3 Tap Options, Instant Advance) */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900">What is your gender?</h3>
          <p className="text-xs text-gray-500">Tap one to continue automatically</p>

          <div className="space-y-3 pt-2">
            {[
              { val: 'male', label: 'Male 👨' },
              { val: 'female', label: 'Female 👩' },
              { val: 'prefer_not_to_say', label: 'Prefer not to say 🧑' },
            ].map((g) => (
              <button
                key={g.val}
                type="button"
                onClick={() => handleGenderSelect(g.val)}
                className={`w-full p-4 rounded-2xl border text-left font-bold text-sm transition-all flex justify-between items-center ${
                  formData.gender === g.val
                    ? 'border-[#3F8F5F] bg-emerald-50 text-[#3F8F5F] ring-2 ring-[#3F8F5F]'
                    : 'border-gray-200 text-gray-800 hover:border-gray-300'
                }`}
              >
                <span>{g.label}</span>
                <ArrowRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl text-xs"
          >
            Back
          </button>
        </div>
      )}

      {/* PAGE 3: Body Metrics (Weight & Height, Optional) */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900">Body Metrics (Optional)</h3>
          <p className="text-xs text-gray-500">Leave blank to use average healthy estimates</p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs text-gray-700 font-semibold block mb-1">Weight (kg)</label>
              <input
                type="number"
                value={formData.weightKg}
                onChange={(e) => updateField('weightKg', e.target.value)}
                placeholder="e.g. 68"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-700 font-semibold block mb-1">Height (cm)</label>
              <input
                type="number"
                value={formData.heightCm}
                onChange={(e) => updateField('heightCm', e.target.value)}
                placeholder="e.g. 172"
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F8F5F]"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="flex-1 py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] text-sm flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Next: Purpose</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 4: Purpose & Conditional Health Condition Section */}
      {step === 4 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-base font-bold text-gray-900">Why are you using SachThali?</h3>
            <p className="text-xs text-gray-500 mt-0.5">Select your primary reason</p>
          </div>

          <div className="space-y-2">
            {purposes.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => updateField('purpose', p.value)}
                className={`w-full p-3 rounded-2xl border text-left transition-all ${
                  formData.purpose === p.value
                    ? 'border-[#3F8F5F] bg-emerald-50 ring-2 ring-[#3F8F5F]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-bold text-gray-900 text-sm block">{p.label}</span>
                <span className="text-xs text-gray-500">{p.desc}</span>
              </button>
            ))}
          </div>

          {/* Conditional Health Condition Section */}
          <div className="border-t border-gray-200 pt-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-900">
                Do you have any health condition we should know about?
              </span>
              <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => updateField('hasHealthCondition', false)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    !formData.hasHealthCondition ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => updateField('hasHealthCondition', true)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                    formData.hasHealthCondition ? 'bg-[#3F8F5F] text-white shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {formData.hasHealthCondition && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 animate-fadeIn">
                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">Condition Description</label>
                  <input
                    type="text"
                    value={formData.conditionDescription}
                    onChange={(e) => updateField('conditionDescription', e.target.value)}
                    placeholder="e.g. Type 2 diabetes, thyroid, hypertension"
                    className="w-full border border-amber-300 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">Severity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['mild', 'moderate', 'severe'].map((sev) => (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => updateField('conditionSeverity', sev)}
                        className={`py-1.5 text-xs font-bold rounded-xl capitalize transition-all ${
                          formData.conditionSeverity === sev
                            ? 'bg-amber-800 text-white shadow-2xs'
                            : 'bg-white border border-amber-300 text-amber-900'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs font-bold text-amber-900">Consulting a doctor for this?</span>
                  <div className="flex bg-white border border-amber-300 p-0.5 rounded-xl gap-1">
                    <button
                      type="button"
                      onClick={() => updateField('consultingDoctor', true)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        formData.consultingDoctor ? 'bg-amber-800 text-white' : 'text-amber-900'
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => updateField('consultingDoctor', false)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg ${
                        !formData.consultingDoctor ? 'bg-amber-100 text-amber-900' : 'text-amber-900'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="flex-1 py-3 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] text-sm flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>Next: Confirmation</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* PAGE 5: Legal Consent & Final Submit */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-gray-900">Safety & Legal Consent</h3>

          <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 text-xs text-gray-700 space-y-2 text-left shadow-xs">
            <span className="font-bold text-gray-900 block">Please review before finishing:</span>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px] leading-relaxed">
              <li>SachThali gives suggestions based on nutrition math, not medical advice — it's not a doctor.</li>
              <li>If you're managing a health condition or taking medication, check with a doctor/dietitian before changing what you eat.</li>
              <li>We'll never suggest or promote anything intoxicating, addictive, or harmful.</li>
              <li>Every suggestion is just that — a suggestion. The final choice about what you eat is always yours.</li>
            </ul>

            <label className="flex items-center gap-2 pt-3 font-bold text-gray-900 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={acceptedLegal}
                onChange={(e) => setAcceptedLegal(e.target.checked)}
                className="w-4 h-4 text-[#3F8F5F] rounded focus:ring-[#3F8F5F]"
              />
              <span>I understand and agree</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl text-xs"
            >
              Back
            </button>

            <button
              type="button"
              disabled={!acceptedLegal || isSubmitting}
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-[#3F8F5F] text-white font-bold rounded-2xl hover:bg-[#34774E] transition-colors text-sm shadow-md flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Check size={18} />
              <span>{isSubmitting ? 'Creating Profile...' : 'Create My Profile'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
