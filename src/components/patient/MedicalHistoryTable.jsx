import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMedical } from '../../context/MedicalContext.jsx';
import RiskBadge from '../common/RiskBadge.jsx';
import Modal from '../common/Modal.jsx';
import { generateClinicalPdfReport } from '../../services/pdfReportGenerator.js';
import { 
  Download, 
  Search, 
  History, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Pill, 
  Stethoscope, 
  Sparkles,
  Info,
  ChevronRight
} from 'lucide-react';

export default function MedicalHistoryTable({ onSelectLog }) {
  const { currentUser } = useAuth();
  const { patientLogs, addToast } = useMedical();
  const [search, setSearch] = useState('');
  const [activeLogModal, setActiveLogModal] = useState(null);

  // Filter logs for current user (or show sample logs for demo patient)
  const userLogs = patientLogs.filter(
    (log) => log.patientId === currentUser?.id || log.patientName === currentUser?.name || log.patientId === currentUser?.email
  );

  const filteredLogs = userLogs.filter((log) => {
    const q = search.toLowerCase();
    return (
      (log.predictedDisease || '').toLowerCase().includes(q) ||
      (log.rawInput || '').toLowerCase().includes(q) ||
      (log.riskLevel || '').toLowerCase().includes(q) ||
      (log.date || '').includes(q)
    );
  });

  const handleDownloadLogPdf = (e, log) => {
    e?.stopPropagation();
    try {
      generateClinicalPdfReport({
        patient: currentUser,
        diagnosticResult: {
          disease: log.predictedDisease,
          diseaseCategory: log.diseaseCategory || 'Clinical Triage',
          confidence: log.confidence,
          riskLevel: log.riskLevel,
          treatmentAdvisory: log.treatmentAdvisory || {},
          prescriptions: log.prescriptions || [],
          aiMedicines: log.aiMedicines || [],
          doctorNotes: log.doctorNotes || '',
          prescribedBy: log.prescribedBy || 'Attending Physician'
        },
        symptomsList: log.symptoms || [],
        indicators: log.indicators || {}
      });
      addToast('success', `Exported clinical PDF for ${log.predictedDisease}`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Failed to generate PDF');
    }
  };

  const handleRowClick = (log) => {
    if (onSelectLog) {
      onSelectLog(log);
    } else {
      setActiveLogModal(log);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Diagnostic History & Prescriptions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Complete longitudinal health log of AI evaluations, clinical risk analyses, and official physician prescriptions
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search condition, risk..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No Past Diagnostic Records Found</h3>
          <p className="text-xs text-slate-500">
            Use the Symptom Checker to run an AI-assisted evaluation and save your first clinical record.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Evaluation Date</th>
                  <th className="py-3.5 px-4">Predicted Condition</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Prescription Status</th>
                  <th className="py-3.5 px-4">Physician Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredLogs.map((log) => {
                  const hasRx = log.prescriptions && log.prescriptions.length > 0;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-indigo-50/30 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(log)}
                    >
                      {/* Date */}
                      <td className="py-4 px-4 font-semibold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.date}</span>
                        </div>
                      </td>

                      {/* Predicted Disease */}
                      <td className="py-4 px-4 font-bold text-slate-900">
                        <div>{log.predictedDisease}</div>
                        <p className="text-[11px] font-normal text-slate-500 line-clamp-1 mt-0.5">
                          {log.rawInput || 'Clinical questionnaire'}
                        </p>
                      </td>

                      {/* Risk Level */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <RiskBadge level={log.riskLevel} size="sm" pulse={log.riskLevel === 'High'} />
                      </td>

                      {/* Prescription Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {hasRx ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 shadow-2xs">
                            <Pill className="w-3 h-3 text-emerald-600" />
                            {log.prescriptions.length} Meds Prescribed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Awaiting Doctor Rx
                          </span>
                        )}
                      </td>

                      {/* Review Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {log.reviewedByDoctor || hasRx ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Reviewed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Download PDF & View Action */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleDownloadLogPdf(e, log)}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            title="Download official PDF report"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveLogModal(log)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                            title="View prescription & details"
                          >
                            <span>View Rx</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Record Details & Prescription Modal */}
      {activeLogModal && (
        <Modal
          isOpen={Boolean(activeLogModal)}
          onClose={() => setActiveLogModal(null)}
          title={`Clinical Diagnostic & Prescription File`}
          subtitle={`Evaluated: ${activeLogModal.date} • Condition: ${activeLogModal.predictedDisease}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1 text-xs">
            {/* Condition Header */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 block mb-1">
                  Primary Diagnosis
                </span>
                <h3 className="text-base font-black text-slate-900">
                  {activeLogModal.predictedDisease}
                </h3>
              </div>
              <RiskBadge level={activeLogModal.riskLevel} size="md" />
            </div>

            {/* Official Doctor Prescription Section */}
            {activeLogModal.prescriptions && activeLogModal.prescriptions.length > 0 ? (
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 flex items-center gap-1.5 text-xs">
                    <Pill className="w-4 h-4 text-emerald-700" />
                    Official Doctor Prescribed Medications ({activeLogModal.prescriptions.length})
                  </h4>
                  {activeLogModal.prescribedBy && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Prescribed by {activeLogModal.prescribedBy}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {activeLogModal.prescriptions.map((rx, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-emerald-600" />
                          {rx.name}
                        </span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded">
                          {rx.dosage}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-3 text-[11px] text-slate-600">
                        <span><strong>Frequency:</strong> {rx.frequency}</span>
                        <span><strong>Duration:</strong> {rx.duration}</span>
                      </div>
                      {rx.instructions && (
                        <p className="text-[10px] text-slate-500 italic bg-slate-50 p-1 rounded">
                          ℹ️ {rx.instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {activeLogModal.doctorNotes && (
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-100">
                    <p className="font-bold text-slate-800 text-[11px] mb-0.5">Doctor's Clinical Notes:</p>
                    <p className="text-slate-600 italic text-[11px]">{activeLogModal.doctorNotes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-700" />
                  Prescription Awaiting Physician Review
                </div>
                <p className="text-slate-600 text-[11px]">
                  Your triage evaluation has been logged. Once your attending physician reviews and signs the prescription, your medication schedule will appear here.
                </p>

                {/* Show AI suggested medications as informational advisory */}
                {activeLogModal.aiMedicines && activeLogModal.aiMedicines.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      AI Recommended Medication Protocols (Advisory):
                    </p>
                    <div className="space-y-1.5">
                      {activeLogModal.aiMedicines.map((med, idx) => (
                        <div key={idx} className="p-2 bg-white rounded-lg border border-amber-100 text-[11px] flex justify-between">
                          <span className="font-bold text-slate-800">{med.name} ({med.dosage})</span>
                          <span className="text-slate-500">{med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Download PDF Button */}
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleDownloadLogPdf(null, activeLogModal)}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download PDF Clinical Report
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
