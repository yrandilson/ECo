/**
 * Componente Melhorado de Upload de Fotos
 * 
 * Funcionalidades:
 * - Upload múltiplo (até 5 fotos)
 * - Preview das imagens
 * - Compressão automática
 * - Drag and drop
 * - Validação de tipo e tamanho
 * - Progress bar
 * - Remove individual
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Camera, ImagePlus, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { toast } from 'sonner';

export interface UploadedPhoto {
  id: string;
  file: File;
  preview: string;
  uploadProgress: number;
  uploaded: boolean;
  url?: string;
  error?: string;
}

interface PhotoUploaderProps {
  maxPhotos?: number;
  maxSizeMB?: number;
  onPhotosChange?: (photos: UploadedPhoto[]) => void;
  initialPhotos?: UploadedPhoto[];
}

export function PhotoUploaderEnhanced({
  maxPhotos = 5,
  maxSizeMB = 10,
  onPhotosChange,
  initialPhotos = [],
}: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotosUpdate = useCallback(
    (newPhotos: UploadedPhoto[]) => {
      setPhotos(newPhotos);
      onPhotosChange?.(newPhotos);
    },
    [onPhotosChange]
  );

  /**
   * Comprimir imagem antes de enviar
   */
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          // Calcular dimensões mantendo aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1920; // Max 1920px
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension;
              width = maxDimension;
            } else {
              width = (width / height) * maxDimension;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Desenhar imagem redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Converter para Blob com qualidade 0.8
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Falha ao comprimir imagem'));
                return;
              }
              
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              
              console.log(
                `[PhotoUploader] Comprimido: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
              );
              
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8
          );
        };
        
        img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    });
  };

  /**
   * Processar arquivos selecionados
   */
  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validar número de fotos
    if (photos.length + fileArray.length > maxPhotos) {
      toast.error(`Você pode enviar no máximo ${maxPhotos} fotos`);
      return;
    }
    
    const newPhotos: UploadedPhoto[] = [];
    
    for (const file of fileArray) {
      // Validar tipo
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} não é uma imagem válida`);
        continue;
      }
      
      // Validar tamanho
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} é muito grande (máx: ${maxSizeMB}MB)`);
        continue;
      }
      
      try {
        // Comprimir imagem
        const compressedFile = await compressImage(file);
        
        // Criar preview
        const preview = URL.createObjectURL(compressedFile);
        
        newPhotos.push({
          id: Math.random().toString(36).slice(2),
          file: compressedFile,
          preview,
          uploadProgress: 0,
          uploaded: false,
        });
      } catch (error) {
        console.error(`[PhotoUploader] Erro ao processar ${file.name}:`, error);
        toast.error(`Erro ao processar ${file.name}`);
      }
    }
    
    if (newPhotos.length > 0) {
      const updatedPhotos = [...photos, ...newPhotos];
      handlePhotosUpdate(updatedPhotos);
      
      // Simular upload (em produção, fazer upload real para S3)
      uploadPhotos(newPhotos);
    }
  };

  /**
   * Simular upload (substituir por upload real para S3)
   */
  const uploadPhotos = async (photosToUpload: UploadedPhoto[]) => {
    for (const photo of photosToUpload) {
      // Simular progresso
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, uploadProgress: progress } : p
          )
        );
      }
      
      // Marcar como enviado
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                uploaded: true,
                url: `https://storage.example.com/${photo.id}.jpg`,
              }
            : p
        )
      );
      
      toast.success(`${photo.file.name} enviado com sucesso!`);
    }
  };

  /**
   * Remover foto
   */
  const removePhoto = (id: string) => {
    const photo = photos.find((p) => p.id === id);
    if (photo?.preview) {
      URL.revokeObjectURL(photo.preview);
    }
    
    const updatedPhotos = photos.filter((p) => p.id !== id);
    handlePhotosUpdate(updatedPhotos);
    toast.info('Foto removida');
  };

  /**
   * Handlers de drag and drop
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  /**
   * Abrir seletor de arquivos
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handler de mudança de arquivo
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        } ${photos.length >= maxPhotos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={photos.length < maxPhotos ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={photos.length >= maxPhotos}
        />
        
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-primary/10 p-4">
            {isDragging ? (
              <ImagePlus className="h-8 w-8 text-primary" />
            ) : (
              <Camera className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <div>
            <p className="text-sm font-medium">
              {isDragging
                ? 'Solte as fotos aqui'
                : 'Clique ou arraste fotos para enviar'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WEBP até {maxSizeMB}MB (máx: {maxPhotos} fotos)
            </p>
          </div>
          
          {photos.length < maxPhotos && (
            <Button type="button" size="sm" variant="outline" className="mt-2">
              <Upload className="h-4 w-4 mr-2" />
              Escolher Fotos
            </Button>
          )}
        </div>
      </div>

      {/* Grid de Previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="relative overflow-hidden group">
              {/* Preview da Imagem */}
              <div className="aspect-square relative">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay com botão de remover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removePhoto(photo.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Indicador de status */}
                <div className="absolute top-2 right-2">
                  {!photo.uploaded && (
                    <div className="bg-black/70 rounded-full p-1">
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    </div>
                  )}
                  {photo.error && (
                    <div className="bg-red-500 rounded-full p-1">
                      <AlertCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Barra de Progresso */}
              {!photo.uploaded && photo.uploadProgress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2">
                  <Progress value={photo.uploadProgress} className="h-1" />
                  <p className="text-xs text-white mt-1 text-center">
                    {photo.uploadProgress}%
                  </p>
                </div>
              )}
              
              {/* Nome do Arquivo */}
              <div className="p-2 bg-muted/50">
                <p className="text-xs truncate" title={photo.file.name}>
                  {photo.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(photo.file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Contador */}
      <div className="text-sm text-muted-foreground text-center">
        {photos.length} de {maxPhotos} fotos {photos.length > 0 && `(${photos.filter(p => p.uploaded).length} enviadas)`}
      </div>
    </div>
  );
}

export default PhotoUploaderEnhanced;
