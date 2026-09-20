import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import RiskBadge from '../common/RiskBadge.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { api } from '../../services/api.js';
import { generateClinicalPdfReport } from '../../services/pdfReportGenerator.js';
import { 
  Download, 
  Stethoscope, 
  Save, 
  User, 
  Activity, 
  ShieldAlert, 
  FileText, 
  HeartHandshake, 
  Clock,
  Pill,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function PatientDetailModal({ isOpen, onClose, log }) {
  const { issuePrescription, updatePatientLog, addToast } = useMedical();

  const [doctorNotes, setDoctorNotes] = useState(log?.doctorNotes || '');
  const [caseStatus, setCaseStatus] = useState(log?.status || 'Under Treatment');
  const [isSaving, setIsSaving] = useState(false);

  // AI suggestions list
  const [aiSuggestions, setAiSuggestions] = useState(log?.aiMedicines || []);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // Active Prescriptions in editor
  const [medicines, setMedicines] = useState(
    log?.prescriptions && log.prescriptions.length > 0
      ? log.prescriptions
      : (log?.aiMedicines && log.aiMedicines.length > 0 ? log.aiMedicines : [])
  );

  // Synchronize when log changes
  useEffect(() => {
    if (log) {
      setDoctorNotes(log.doctorNotes || '');
      setCaseStatus(log.status || (log.prescriptions?.length > 0 ? 'Under Treatment' : 'Awaiting Provider Review'));

      if (log.prescriptions && log.prescriptions.length > 0) {
        setMedicines(log.prescriptions);
      } else if (log.aiMedicines && log.aiMedicines.length > 0) {
        setMedicines(log.aiMedicines);
      } else {
        setMedicines([]);
      }

      if (log.aiMedicines && log.aiMedicines.length > 0) {
        setAiSuggestions(log.aiMedicines);
      } else if (log.predictedDisease) {
        // Fetch recommendations from backend
        setIsLoadingSuggestions(true);
        api.getMedicineSuggestions(log.predictedDisease)
          .then((res) => {
            if (res && Array.isArray(res.suggestions)) {
              setAiSuggestions(res.suggestions);
              if (!log.prescriptions || log.prescriptions.length === 0) {
                setMedicines(res.suggestions);
              }
            }
          })
          .catch((err) => console.warn('Could not fetch AI medicine suggestions:', err))
          .finally(() => setIsLoadingSuggestions(false));
      }
    }
  }, [log]);

  if (!log) return null;

  // Adopt all AI suggestions into the prescription editor
  const handleAdoptAiSuggestions = () => {
    if (aiSuggestions.length === 0) return;
    setMedicines([...aiSuggestions]);
    addToast('info', `Adopted ${aiSuggestions.length} AI suggested medications into prescription.`);
  };

  // Add empty medication row
  const handleAddMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      {
        name: '',
        dosage: '500 mg',
        frequency: 'Twice daily after meals',
        duration: '5 days',
        type: 'Prescription Drug',
        instructions: 'Take with plenty of water after food'
      }
    ]);
  };

  // Update a field in a medication row
  const handleUpdateMedicine = (index, field, value) => {
    setMedicines((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Remove a medication row
  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save official prescription
  const handleSavePrescription = async (e) => {
    e.preventDefault();

    // Filter out rows with empty names
    const validMedicines = medicines.filter((m) => m.name && m.name.trim().length > 0);

    setIsSaving(true);
    try {
      await issuePrescription({
        logId: log.id,
        patientEmail: log.patientId || log.email,
        diagnosis: log.predictedDisease,
        medicines: validMedicines,
        doctorNotes,
        caseStatus
      });
      onClose();
    } catch (err) {
      console.error('Error saving prescription:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = () => {
    try {
      generateClinicalPdfReport({
        patient: {
          name: log.patientName,
          id: log.patientId,
          age: log.age || 30,
          gender: log.gender || 'Not Specified',
          phone: log.phone || 'Verified Patient',
          location: log.location || 'Bangalore, India'
        },
        diagnosticResult: {
          disease: log.predictedDisease,
          diseaseCategory: log.diseaseCategory || 'Clinical Triage',
          confidence: log.confidence,
          riskLevel: log.riskLevel,
          treatmentAdvisory: log.treatmentAdvisory || {},
          prescriptions: medicines.length > 0 ? medicines : (log.prescriptions || []),
          doctorNotes: doctorNotes || log.doctorNotes,
          prescribedBy: log.prescribedBy || 'Attending Physician'
        },
        symptomsList: log.symptoms || [],
        indicators: log.indicators || {}
      });
      addToast('success', 'Official clinical report & prescription exported successfully.');
    } catch (err) {
      console.error(err);
      addToast('error', 'Error generating PDF report.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Clinical File & Prescription: ${log.patientName}`}
      subtitle={`Triage ID: ${log.id} • Condition: ${log.predictedDisease}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
        {/* Top Summary Box */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 font-black text-base flex items-center justify-center">
              {log.patientName.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">{log.patientName}</h4>
              <p className="text-xs text-slate-500">
                Patient ID: {log.patientId} • Age: {log.age || 30} • Record Date: {log.date}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <RiskBadge level={log.riskLevel} size="md" pulse={log.riskLevel === 'High'} />
            <button
              onClick={handleDownloadPdf}
              className="p-2 rounded-xl bg-white border border-slate-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF Rx
            </button>
          </div>
        </div>

        {/* Diagnosis & Model Confidence */}
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              AI Primary Diagnostic Evaluation
            </span>
            <span className="text-xs font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200">
              {log.confidence}% Confidence
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900">{log.predictedDisease}</h3>
          {log.description && (
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.description}</p>
          )}
        </div>

        {/* Presentation & Biomarkers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Reported Chief Complaint
            </h5>
            <p className="text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              "{log.rawInput || 'Selected via interactive symptom evaluation'}"
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              Recorded Biomarker Indicators
            </h5>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Blood Pressure:</span>
                <span className="font-bold text-slate-800">{log.indicators?.bloodPressure || log.indicators?.blood_pressure || 'Normal'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Fever Profile:</span>
                <span className="font-bold text-slate-800">{log.indicators?.fever || 'Normal'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Breathing:</span>
                <span className="font-bold text-slate-800">{log.indicators?.breathing || log.indicators?.difficulty_breathing || 'Normal'}</span>
              </div>
              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <span className="text-slate-500 block">Cough:</span>
                <span className="font-bold text-slate-800">{log.indicators?.cough || 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggested Medications Section */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/40 border border-indigo-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-950">
                  AI Clinical Medication Recommendations
                </h4>
                <p className="text-[11px] text-indigo-600">
                  Evidence-based pharmacotherapy guidelines tailored for {log.predictedDisease}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdoptAiSuggestions}
              disabled={aiSuggestions.length === 0}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Adopt AI Suggestions into Prescription</span>
            </button>
          </div>

          {isLoadingSuggestions ? (
            <div className="py-4 text-center text-xs text-indigo-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span>Analyzing clinical drug interactions & protocols...</span>
            </div>
          ) : aiSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {aiSuggestions.map((med, idx) => (
                <div
                  key={idx}
                  className="bg-white/90 p-3 rounded-xl border border-indigo-100/90 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-indigo-600" />
                      {med.name}
                    </span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold border border-indigo-200 whitespace-nowrap">
                      {med.type || 'Medication'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                    <span><strong className="text-slate-700">Dose:</strong> {med.dosage}</span>
                    <span><strong className="text-slate-700">Freq:</strong> {med.frequency}</span>
                    <span><strong className="text-slate-700">Duration:</strong> {med.duration}</span>
                  </div>
                  {med.instructions && (
                    <p className="text-[10px] text-slate-500 italic bg-slate-50/70 p-1.5 rounded border border-slate-100">
                      ℹ️ {med.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No specific AI medication protocols indexed for this query.</p>
          )}
        </div>

        {/* Doctor Prescription & Treatment Protocol Editor */}
        <form onSubmit={handleSavePrescription} className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-emerald-700" />
              Official Physician Prescription & Action Plan
            </h4>
            <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-300 font-semibold">
              Signed by Certified Physician
            </span>
          </div>

          {/* Medication Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Prescribed Medications ({medicines.length})
              </label>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] rounded-lg shadow-2xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add Medication
              </button>
            </div>

            {medicines.length === 0 ? (
              <div className="p-4 bg-white/70 border border-dashed border-emerald-300 rounded-xl text-center text-xs text-slate-500">
                No medications currently prescribed. Click "Adopt AI Suggestions" above or "+ Add Medication" to prescribe.
              </div>
            ) : (
              <div className="space-y-2.5">
                {medicines.map((med, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      {/* Name */}
                      <div className="sm:col-span-4">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Medicine Name</label>
                        <input
                          type="text"
                          required
                          value={med.name}
                          onChange={(e) => handleUpdateMedicine(idx, 'name', e.target.value)}
                          placeholder="e.g. Paracetamol"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold text-slate-800"
                        />
                      </div>

                      {/* Dosage */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Dosage</label>
                        <input
                          type="text"
                          value={med.dosage}
                          onChange={(e) => handleUpdateMedicine(idx, 'dosage', e.target.value)}
                          placeholder="e.g. 650 mg"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                      </div>

                      {/* Frequency */}
                      <div className="sm:col-span-3">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Frequency</label>
                        <input
                          type="text"
                          value={med.frequency}
                          onChange={(e) => handleUpdateMedicine(idx, 'frequency', e.target.value)}
                          placeholder="e.g. Twice daily"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                      </div>

                      {/* Duration */}
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={(e) => handleUpdateMedicine(idx, 'duration', e.target.value)}
                          placeholder="e.g. 5 days"
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-800"
                        />
                      </div>

                      {/* Delete */}
                      <div className="sm:col-span-1 flex items-end justify-center pb-0.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Remove medication"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Special Instructions */}
                    <div>
                      <input
                        type="text"
                        value={med.instructions || ''}
                        onChange={(e) => handleUpdateMedicine(idx, 'instructions', e.target.value)}
                        placeholder="Instructions (e.g. Take after breakfast with warm water)"
                        className="w-full px-2.5 py-1 text-[11px] bg-slate-50/80 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Case Management Status
              </label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                <option value="Under Treatment">Under Treatment (Prescription Issued)</option>
                <option value="Completed">Completed & Discharged</option>
                <option value="Awaiting Provider Review">Awaiting Provider Review</option>
                <option value="Referred to Specialist">Referred to Specialist Hospital</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Clinical Notes & Dietary / Follow-up Guidance
            </label>
            <textarea
              rows={3}
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="e.g. Advised rest, hydration, complete medication course. Review in OPD after 5 days if fever persists."
              className="w-full p-3 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 resize-none"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSaving}
              className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
            >
              {isSaving ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Sign & Issue Official Prescription</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
