"use client";

import { useState, useEffect } from "react";
import { Stethoscope, FileText, FilePlus, X, RefreshCw, Syringe, Activity, Microscope } from "lucide-react";
import clsx from "clsx";

interface MedicalNote {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: string;
    vet: {
        firstName: string;
        lastName: string;
    };
}

export default function MedicalNotesManager({ animalId, orgId, locale }: { animalId: string, orgId: string, locale: string }) {
    const [notes, setNotes] = useState<MedicalNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "GENERAL"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/vet/medical-notes?animalId=${animalId}&orgId=${orgId}`);
            if (res.ok) {
                const data = await res.json();
                setNotes(data.notes);
            }
        } catch (error) {
            console.error("Error fetching notes", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [animalId, orgId]);

    const handleCreateNote = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/vet/medical-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    animalId,
                    orgId,
                    title: formData.title,
                    content: formData.content,
                    type: formData.type
                })
            });

            if (res.ok) {
                setIsFormOpen(false);
                setFormData({ title: "", content: "", type: "GENERAL" });
                await fetchNotes();
            }
        } catch (error) {
            console.error("Error creating note", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getIconForType = (type: string) => {
        switch (type) {
            case 'SURGERY': return <Activity className="w-5 h-5 text-rose-500" />;
            case 'ALLERGY': return <Stethoscope className="w-5 h-5 text-orange-500" />;
            case 'LAB': return <Microscope className="w-5 h-5 text-purple-500" />;
            case 'VACCINE': return <Syringe className="w-5 h-5 text-blue-500" />;
            default: return <FileText className="w-5 h-5 text-primary" />;
        }
    };

    const getColorForType = (type: string) => {
        switch (type) {
            case 'SURGERY': return "bg-rose-50 text-rose-600";
            case 'ALLERGY': return "bg-orange-50 text-orange-600";
            case 'LAB': return "bg-purple-50 text-purple-600";
            case 'VACCINE': return "bg-blue-50 text-blue-600";
            default: return "bg-primary/10 text-primary";
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black italic text-gray-900">Historial Médico</h3>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-primary hover:bg-brand-600 text-white px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <FilePlus className="w-4 h-4" /> Añadir Entrada
                    </button>
                )}
            </div>

            {/* Formulario de Creación */}
            {isFormOpen && (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-primary/5 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-lg text-gray-900 italic">Nueva Evaluación</h4>
                        <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleCreateNote} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Asunto / Título</label>
                                <input
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    placeholder="Ej. Chequeo Rutinario"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Categoría</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                >
                                    <option value="GENERAL">Consulta General</option>
                                    <option value="SURGERY">Cirugía / Procedimiento</option>
                                    <option value="LAB">Exámenes de Laboratorio</option>
                                    <option value="ALLERGY">Alergia / Piel</option>
                                    <option value="VACCINE">Vacunación / Desparasitación</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Notas Clínicas</label>
                            <textarea
                                required
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm h-32 resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                placeholder="Escribe aquí el análisis de la mascota, temperatura, peso exacto y tratamiento recomendado..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t border-gray-50">
                            <button
                                type="button"
                                onClick={() => setIsFormOpen(false)}
                                className="px-5 py-2.5 text-gray-500 font-bold hover:bg-gray-50 rounded-full text-sm transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-primary hover:bg-brand-600 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4" />}
                                Guardar Historial
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Listado de Notas */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="py-12 flex justify-center opacity-50">
                        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
                    </div>
                ) : notes.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-100 rounded-3xl p-10 text-center">
                        <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h4 className="text-xl font-black italic text-gray-800">Expediente Vacío</h4>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto mt-2">No hay registros médicos para este paciente en el sistema de la clínica.</p>
                    </div>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-primary/20 transition-all flex gap-5 items-start">
                            <div className={clsx("p-4 rounded-2xl shrink-0 mt-1", getColorForType(note.type))}>
                                {getIconForType(note.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-black text-xl italic text-gray-900 truncate">{note.title}</h4>
                                        <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mt-1">
                                            DR/A. {note.vet.lastName.toUpperCase()} • {new Date(note.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={clsx("px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase", getColorForType(note.type))}>
                                        {note.type}
                                    </span>
                                </div>
                                <p className="text-gray-600 leading-relaxed font-medium mt-3 bg-gray-50 p-4 rounded-2xl whitespace-pre-line text-sm border border-gray-100">
                                    {note.content}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
