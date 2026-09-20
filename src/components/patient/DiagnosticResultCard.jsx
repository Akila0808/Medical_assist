import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import { generateClinicalPdfReport } from '../../services/pdfReportGenerator.js';
import RiskBadge from '../common/RiskBadge.jsx';
import { 
  Download, 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Sparkles, 
  HeartHandshake, 
  Utensils, 
  ShieldAlert, 
  Stethoscope, 
  FileText,
  Pill,
  Info
} from 'lucide-react';

export default function DiagnosticResultCard({ diagnosis, selectedSymptoms = [], indicators = {}, onBookSpecialist }) {
  const { currentUser } = useAuth();
  const { addToast } = useMedical();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!diagnosis) return null;

  const handleDownloadPdf = () => {
    try {
      setIsDownloading(true);
      generateClinicalPdfReport({
        patient: currentUser,
        diagnosticResult: {
          disease: diagnosis.predictedDisease || diagnosis.disease,
          diseaseCategory: diagnosis.diseaseCategory || 'Clinical Triage',
          confidence: diagnosis.confidence,
          riskLevel: diagnosis.riskLevel,
          treatmentAdvisory: diagnosis.treatmentAdvisory || {},
          aiMedicines: diagnosis.aiMedicines || diagnosis.ai_medicines || [],
          prescriptions: diagnosis.prescriptions || []
        },
        symptomsList: diagnosis.matchedSymptoms || selectedSymptoms,
        indicators: diagnosis.indicators || indicators
      });
      addToast('success', 'Official clinical report PDF generated and downloaded.');
    } catch (err) {
      console.error('PDF generation error:', err);
      addToast('error', 'Could not generate PDF report. Please retry.');
    } finally {
      setIsDownloading(false);
    }
  };

  const advisory = diagnosis.treatmentAdvisory || {};
  const aiMedicines = diagnosis.aiMedicines || diagnosis.ai_medicines || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden transition-all">
      {/* Header Banner with Gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white relative">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 border border-indigo-400/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-indigo-200">
            <Sparkles className="w-3 h-3 text-amber-300" />
            AI Diagnostic Risk Analysis
          </div>
          <RiskBadge level={diagnosis.riskLevel} size="md" pulse={true} />
        </div>

        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
          {diagnosis.predictedDisease || diagnosis.disease}
        </h3>
        <p className="text-xs text-indigo-200/80 mt-1">
          Clinical Category: <span className="font-semibold text-white">{diagnosis.diseaseCategory || 'Internal Medicine'}</span>
        </p>

        {/* Confidence Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-indigo-200 font-medium">Diagnostic Confidence Score</span>
            <span className="font-extrabold text-white text-sm">{diagnosis.confidence || 88}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                diagnosis.confidence >= 80
                  ? 'bg-gradient-to-r from-indigo-400 to-emerald-400'
                  : 'bg-gradient-to-r from-amber-400 to-indigo-400'
              }`}
              style={{ width: `${diagnosis.confidence || 85}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Clinical Summary Description */}
        {diagnosis.description && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1">Clinical Overview:</p>
            {diagnosis.description}
          </div>
        )}

        {/* Advisory Protocols Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Immediate Action */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 mb-1.5">
              <HeartHandshake className="w-4 h-4 text-indigo-600" />
              Immediate Clinical Action
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {advisory.immediateAction || 'Rest in comfortable posture, monitor core vitals, and maintain steady hydration.'}
            </p>
          </div>

          {/* Precautions */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950 mb-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Precautions & Triggers
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {advisory.precautions || 'Avoid heavy exertion, maintain continuous symptom log, and avoid known dietary irritants.'}
            </p>
          </div>

          {/* Dietary Advice */}
          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-950 mb-1.5">
              <Utensils className="w-4 h-4 text-emerald-600" />
              Dietary & Hydration Plan
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {advisory.dietary || 'High-fluid regimen, warm broths, electrolyte replenishments, and low-sodium nutrition.'}
            </p>
          </div>

          {/* Red Flag Warnings */}
          <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-950 mb-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Emergency Red Flags
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {advisory.redFlags || 'Severe chest discomfort, sudden dyspnea, or persistent high fever necessitate emergency ER consultation.'}
            </p>
          </div>
        </div>

        {/* AI Suggested Medication Guidance */}
        {aiMedicines && aiMedicines.length > 0 && (
          <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                    AI Suggested Clinical Medications
                  </h4>
                  <p className="text-[11px] text-indigo-600">
                    Standard pharmacotherapy protocols for {diagnosis.predictedDisease || diagnosis.disease}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-md">
                Subject to Doctor Rx
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {aiMedicines.map((med, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-2xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">{med.name}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                      {med.dosage}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <span>{med.frequency} • {med.duration}</span>
                  </div>
                  {med.instructions && (
                    <p className="text-[10px] text-slate-500 italic pt-0.5">
                      ℹ️ {med.instructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200 text-[10px] text-amber-800">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-700" />
              <span>
                <strong>Clinical Advisory:</strong> Medication suggestions are computer-generated guidance protocols based on clinical literature. Do not consume without a licensed doctor's official signed prescription.
              </span>
            </div>
          </div>
        )}

        {/* Recommended Specialist Referral */}
        <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-indigo-300 flex-shrink-0">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Recommended Specialist Referral</p>
              <p className="text-sm font-bold text-white">
                {advisory.specialist || 'General Medicine / Internal Medicine'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Download PDF & Booking */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold text-xs border border-indigo-200 shadow-sm flex items-center justify-center gap-2 transition-all"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4 text-indigo-600" />
            )}
            <span>Download Clinical PDF Report</span>
          </button>

          <button
            type="button"
            onClick={onBookSpecialist}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Schedule Specialist Consultation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
