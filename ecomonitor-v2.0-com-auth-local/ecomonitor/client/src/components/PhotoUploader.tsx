import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Photo {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
}

interface PhotoUploaderProps {
  maxPhotos?: number;
  onPhotosChange?: (photos: Photo[]) => void;
}

export function PhotoUploader({ maxPhotos = 5, onPhotosChange }: PhotoUploaderProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    const newPhotos: Photo[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (photos.length + newPhotos.length >= maxPhotos) {
        toast.error(`Máximo de ${maxPhotos} fotos atingido`);
        break;
      }

      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} é maior que 5MB`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const photo: Photo = {
          id: Math.random().toString(36),
          file,
          preview: event.target?.result as string,
          uploading: false,
          uploaded: false,
        };
        setPhotos((prev) => {
          const updated = [...prev, photo];
          onPhotosChange?.(updated);
          return updated;
        });
      };
      reader.readAsDataURL(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (!photo) return;

    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, uploading: true } : p))
    );

    try {
      // Simular upload para S3
      // Em produção, isso chamaria uma rota tRPC que faz upload real
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockUrl = `https://s3.example.com/ecomonitor/${Date.now()}-${photo.file.name}`;

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId
            ? { ...p, uploading: false, uploaded: true, url: mockUrl }
            : p
        )
      );

      toast.success("Foto enviada com sucesso!");
    } catch (error) {
      toast.error("Erro ao enviar foto");
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, uploading: false } : p))
      );
    }
  };

  const handleRemove = (photoId: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((p) => p.id !== photoId);
      onPhotosChange?.(updated);
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={photos.length >= maxPhotos}
        className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
      >
        <Upload className="w-4 h-4 mr-2" />
        Adicionar Fotos ({photos.length}/{maxPhotos})
      </Button>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <Card key={photo.id} className="shadow-lg border-0 overflow-hidden">
              <CardContent className="p-0 relative">
                <img
                  src={photo.preview}
                  alt="Preview"
                  className="w-full h-32 object-cover"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {photo.uploaded ? (
                    <div className="text-center">
                      <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-white">Enviada</p>
                    </div>
                  ) : photo.uploading ? (
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUpload(photo.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemove(photo.id)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  {photo.uploaded && (
                    <div className="bg-green-500 text-white rounded-full p-1">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  {photo.uploading && (
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {photos.filter((p) => p.uploaded).length} de {photos.length} fotos enviadas
        </div>
      )}
    </div>
  );
}
