import React from 'react';
import { POI } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  poi: POI | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  poi,
  onConfirm,
  onCancel,
  isDeleting,
}) => {
  if (!poi) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in-95 duration-150">
        <div className="w-14 h-14 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="font-bold text-lg text-slate-900 mb-1">¿Eliminar este Punto de Interés?</h3>
        <p className="text-xs text-slate-500 mb-4">
          Estás a punto de eliminar <strong className="text-slate-800">"{poi.nombre}"</strong> ({poi.ciudad}). Esta acción se sincronizará con tu hoja de Google Sheets.
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
