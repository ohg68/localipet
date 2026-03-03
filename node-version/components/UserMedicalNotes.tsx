"use client";

import { Stethoscope, FileText, Activity, Syringe, Microscope, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface MedicalNote {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date | string;
    organization: {
        name: string;
    };
    vet: {
        firstName: string;
        lastName: string;
    };
}

export default function UserMedicalNotes({ notes }: { notes: MedicalNote[] }) {
    const [expandedNote, setExpandedNote] = useState<string | null>(null);

    const getIconForType = (type: string) => {
        switch (type) {
            case 'SURGERY': return <Activity className="w-4 h-4 text-rose-500" />;
            case 'ALLERGY': return <Stethoscope className="w-4 h-4 text-orange-500" />;
            case 'LAB': return <Microscope className="w-4 h-4 text-purple-500" />;
            case 'VACCINE': return <Syringe className="w-4 h-4 text-blue-500" />;
            default: return <FileText className="w-4 h-4 text-primary" />;
        }
    };

    if (notes.length === 0) {
        return (
            <div className="card p-6 text-center opacity-60">
                <Stethoscope className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-500 italic">No hay registros médicos compartidos por veterinarias.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4" /> Historial Clínico
            </h3>

            {notes.map((note) => (
                <div
                    key={note.id}
                    className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                        className="w-full p-4 flex items-center justify-between text-left"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-gray-50 rounded-xl shrink-0">
                                {getIconForType(note.type)}
                            </div>
                            <div className="min-w-0">
                                <h4 className="font-bold text-gray-900 text-sm truncate">{note.title}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                                    {note.organization.name} • {new Date(note.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        {expandedNote === note.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>

                    {expandedNote === note.id && (
                        <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                                    {note.content}
                                </p>
                                <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                                        {note.type}
                                    </span>
                                    <span className="text-[9px] font-medium text-gray-400 italic">
                                        Registrado por {note.vet.firstName} {note.vet.lastName}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
