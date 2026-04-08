import React, { useState, useRef } from 'react';
import { X, Upload, Save, Building2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkshop } from '../lib/WorkshopContext';
import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings } = useWorkshop();
  const [name, setName] = useState(settings.name);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    // Create a local preview immediately
    const localPreviewUrl = URL.createObjectURL(file);
    const previousLogoUrl = logoUrl;
    setLogoUrl(localPreviewUrl);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storageRef = ref(storage, `workshop/logo_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Add a timeout of 30 seconds
      const timeoutId = setTimeout(() => {
        if (isUploading) {
          console.error("Upload timed out");
          setIsUploading(false);
          setLogoUrl(previousLogoUrl);
          alert('O upload demorou muito tempo. Verifique sua conexão ou as permissões do Firebase Storage.');
        }
      }, 30000);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error: any) => {
          clearTimeout(timeoutId);
          console.error("Error uploading logo:", error);
          setLogoUrl(previousLogoUrl);
          setIsUploading(false);
          
          let errorMessage = 'Erro ao fazer upload da imagem.';
          if (error.code === 'storage/unauthorized') {
            errorMessage = 'Sem permissão para fazer upload no Storage. Verifique se o Storage está ativado e com as regras corretas no Console do Firebase.';
          } else if (error.code === 'storage/quota-exceeded') {
            errorMessage = 'Cota do Storage excedida.';
          }
          alert(`${errorMessage} (${error.code})`);
        }, 
        async () => {
          clearTimeout(timeoutId);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            setLogoUrl(url);
            setIsUploading(false);
            URL.revokeObjectURL(localPreviewUrl);
          } catch (urlErr) {
            console.error("Error getting download URL:", urlErr);
            setIsUploading(false);
            alert('Erro ao obter link da imagem após upload.');
          }
        }
      );
    } catch (error: any) {
      console.error("Critical error in upload:", error);
      setLogoUrl(previousLogoUrl);
      setIsUploading(false);
      alert('Erro crítico ao iniciar upload.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({ name, logoUrl });
      onClose();
    } catch (error: any) {
      console.error("Error saving settings:", error);
      let msg = 'Erro ao salvar configurações.';
      try {
        const errObj = JSON.parse(error.message);
        if (errObj.error.includes('Missing or insufficient permissions')) {
          msg = 'Você não tem permissão para alterar as configurações da oficina.';
        }
      } catch (e) {
        // Not a JSON error
      }
      alert(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-primary/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="bg-primary p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Building2 className="text-secondary" size={24} />
                <h3 className="text-xl font-black font-headline uppercase tracking-tight">Configurações</h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Nome da Oficina</label>
                  <input 
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-low border border-surface-high rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium"
                    placeholder="Ex: Precision Parts"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Logo da Oficina</label>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full relative flex items-center justify-center gap-3 py-4 border-2 border-dashed border-surface-high rounded-2xl hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-50 overflow-hidden"
                  >
                    {isUploading && (
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="absolute inset-0 bg-primary/5 z-0"
                      />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      {isUploading ? (
                        <>
                          <Loader2 className="animate-spin text-primary" size={24} />
                          <div className="text-left">
                            <p className="text-sm font-bold text-primary">Enviando... {Math.round(uploadProgress)}%</p>
                            <p className="text-[10px] text-on-surface-variant">Aguarde a conclusão</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                            <Upload className="text-primary" size={20} />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold text-primary">Clique para enviar</p>
                            <p className="text-[10px] text-on-surface-variant">PNG, JPG ou SVG (Máx. 2MB)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </button>
                </div>

                {logoUrl && (
                  <div className="p-4 bg-surface-low rounded-2xl border border-surface-high flex flex-col items-center gap-3">
                    <div className="flex justify-between items-center w-full">
                      <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Logo Atual</p>
                      <button 
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                      >
                        Remover
                      </button>
                    </div>
                    <div className="h-24 w-full flex items-center justify-center bg-white rounded-xl border border-surface-high p-3">
                      <img 
                        src={logoUrl} 
                        alt="Preview Logo" 
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-white border border-surface-high rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-high transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex-1 px-6 py-3 bg-secondary text-white rounded-xl text-sm font-bold shadow-lg shadow-secondary/20 hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : (
                    <>
                      <Save size={18} />
                      Salvar
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
