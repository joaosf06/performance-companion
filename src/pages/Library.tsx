import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2, FolderOpen, Upload, FileText, Video, Image, File, Users, Download, X } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface LibFolder {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

interface LibFile {
  id: string;
  folder_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  description: string | null;
  created_at: string;
}

interface Athlete {
  athlete_id: string;
  full_name: string;
  short_id: string;
}

const getFileIcon = (type: string | null) => {
  if (!type) return <File className="h-5 w-5 text-muted-foreground" />;
  if (type.startsWith("video")) return <Video className="h-5 w-5 text-primary" />;
  if (type.startsWith("image")) return <Image className="h-5 w-5 text-primary" />;
  return <FileText className="h-5 w-5 text-primary" />;
};

const FilePreviewCard = ({
  file,
  isCoach,
  onDelete,
  onClick,
}: {
  file: LibFile;
  isCoach: boolean;
  onDelete: (id: string) => void;
  onClick: () => void;
}) => {
  const isVideo = file.file_type?.startsWith("video");
  const isImage = file.file_type?.startsWith("image");

  return (
    <div
      className="group relative rounded-lg overflow-hidden bg-card border border-border hover:border-primary/50 transition-all cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail / Preview area */}
      <div className="aspect-video bg-secondary flex items-center justify-center overflow-hidden relative">
        {isVideo ? (
          <>
            <video
              src={file.file_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
            <div className="absolute inset-0 bg-background/40 flex items-center justify-center group-hover:bg-background/20 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <Video className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </>
        ) : isImage ? (
          <img
            src={file.file_url}
            alt={file.file_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            {getFileIcon(file.file_type)}
            <span className="text-xs text-muted-foreground uppercase">
              {file.file_type?.split("/")[1] || "ficheiro"}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-foreground truncate">{file.file_name}</p>
        {file.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{file.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {format(new Date(file.created_at), "d MMM yyyy", { locale: pt })}
        </p>
      </div>

      {/* Delete button for coaches */}
      {isCoach && (
        <button
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 hover:bg-destructive/20"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(file.id);
          }}
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      )}
    </div>
  );
};

const Library = () => {
  const { user, role } = useAuth();
  const isCoach = role === "coach";
  const [folders, setFolders] = useState<LibFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<LibFolder | null>(null);
  const [files, setFiles] = useState<LibFile[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [previewFile, setPreviewFile] = useState<LibFile | null>(null);

  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDesc, setNewFolderDesc] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [fileDescription, setFileDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignFolderId, setAssignFolderId] = useState<string | null>(null);
  const [selectedAthletes, setSelectedAthletes] = useState<string[]>([]);
  const [existingAssignments, setExistingAssignments] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchFolders();
    if (isCoach) fetchAthletes();
  }, [user]);

  const fetchFolders = async () => {
    if (!user) return;
    const { data } = isCoach
      ? await supabase.from("library_folders").select("*").eq("coach_id", user.id).order("created_at", { ascending: false })
      : await supabase.from("library_folders").select("*").order("created_at", { ascending: false });
    setFolders((data as LibFolder[]) || []);
  };

  const fetchAthletes = async () => {
    if (!user) return;
    const { data: links } = await supabase.from("coach_athletes").select("athlete_id").eq("coach_id", user.id);
    if (links && links.length > 0) {
      const ids = links.map((l) => l.athlete_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, short_id").in("user_id", ids);
      setAthletes((profiles || []).map((p: any) => ({ athlete_id: p.user_id, full_name: p.full_name || "Sem nome", short_id: p.short_id || "" })));
    }
  };

  const fetchFiles = async (folderId: string) => {
    const { data } = await supabase.from("library_files").select("*").eq("folder_id", folderId).order("created_at", { ascending: false });
    setFiles((data as LibFile[]) || []);
  };

  const openFolder = (folder: LibFolder) => {
    setSelectedFolder(folder);
    fetchFiles(folder.id);
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { error } = await supabase.from("library_folders").insert({
      coach_id: user.id,
      name: newFolderName.trim(),
      description: newFolderDesc.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Pasta criada!");
      setNewFolderName("");
      setNewFolderDesc("");
      setCreatingFolder(false);
      fetchFolders();
    }
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from("library_folders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Pasta eliminada");
      if (selectedFolder?.id === id) { setSelectedFolder(null); setFiles([]); }
      fetchFolders();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFolder || !user) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${user.id}/${selectedFolder.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("library-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("library-files").getPublicUrl(path);

      const { error: insertError } = await supabase.from("library_files").insert({
        folder_id: selectedFolder.id,
        coach_id: user.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        description: fileDescription.trim() || null,
      });
      if (insertError) throw insertError;
      toast.success("Ficheiro carregado!");
      setFileDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchFiles(selectedFolder.id);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: string) => {
    const { error } = await supabase.from("library_files").delete().eq("id", fileId);
    if (error) toast.error(error.message);
    else {
      toast.success("Ficheiro eliminado");
      if (selectedFolder) fetchFiles(selectedFolder.id);
    }
  };

  const openAssign = async (folderId: string) => {
    setAssignFolderId(folderId);
    const { data } = await supabase.from("library_folder_assignments").select("athlete_id").eq("folder_id", folderId);
    const existing = (data || []).map((a: any) => a.athlete_id);
    setExistingAssignments(existing);
    setSelectedAthletes(existing);
    setAssignOpen(true);
  };

  const saveAssignments = async () => {
    if (!assignFolderId) return;
    try {
      const toRemove = existingAssignments.filter((id) => !selectedAthletes.includes(id));
      if (toRemove.length > 0) {
        await supabase.from("library_folder_assignments").delete().eq("folder_id", assignFolderId).in("athlete_id", toRemove);
      }
      const toAdd = selectedAthletes.filter((id) => !existingAssignments.includes(id));
      if (toAdd.length > 0) {
        const inserts = toAdd.map((athlete_id) => ({ folder_id: assignFolderId, athlete_id }));
        const { error } = await supabase.from("library_folder_assignments").insert(inserts);
        if (error) throw error;
      }
      toast.success("Atribuições atualizadas!");
      setAssignOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleAthlete = (id: string) => {
    setSelectedAthletes((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  };

  const renderPreviewContent = (file: LibFile) => {
    const isVideo = file.file_type?.startsWith("video");
    const isImage = file.file_type?.startsWith("image");

    if (isVideo) {
      return (
        <video
          src={file.file_url}
          controls
          autoPlay
          className="w-full max-h-[70vh] rounded-lg bg-black"
        />
      );
    }
    if (isImage) {
      return (
        <img
          src={file.file_url}
          alt={file.file_name}
          className="w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }
    // PDF or other
    if (file.file_type === "application/pdf") {
      return (
        <iframe
          src={file.file_url}
          className="w-full h-[70vh] rounded-lg"
          title={file.file_name}
        />
      );
    }
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        {getFileIcon(file.file_type)}
        <p className="text-muted-foreground">Pré-visualização não disponível para este tipo de ficheiro.</p>
        <a href={file.file_url} target="_blank" rel="noopener noreferrer">
          <Button><Download className="mr-2 h-4 w-4" /> Descarregar</Button>
        </a>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Biblioteca</h1>
            <p className="text-muted-foreground mt-1">
              {isCoach ? "Organiza materiais de treino em pastas e partilha com os teus atletas." : "Materiais de treino partilhados pelo teu treinador."}
            </p>
          </div>
          {isCoach && (
            <Button onClick={() => setCreatingFolder(!creatingFolder)}>
              <Plus className="mr-2 h-4 w-4" />
              {creatingFolder ? "Cancelar" : "Nova Pasta"}
            </Button>
          )}
        </div>

        {creatingFolder && isCoach && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label>Nome da Pasta</Label>
                <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Ex: Mobilidade" className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea value={newFolderDesc} onChange={(e) => setNewFolderDesc(e.target.value)} placeholder="Descrição da pasta..." className="bg-background" />
              </div>
              <Button onClick={createFolder} disabled={!newFolderName.trim()}>Criar Pasta</Button>
            </CardContent>
          </Card>
        )}

        {!selectedFolder ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {folders.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    {isCoach ? "Ainda não criaste nenhuma pasta." : "Nenhum material disponível."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              folders.map((folder) => (
                <Card key={folder.id} className="cursor-pointer transition-all hover:border-primary/50" onClick={() => openFolder(folder)}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{folder.name}</p>
                          {folder.description && <p className="text-xs text-muted-foreground mt-1">{folder.description}</p>}
                        </div>
                      </div>
                      {isCoach && (
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => openAssign(folder.id)}>
                            <Users className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteFolder(folder.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => { setSelectedFolder(null); setFiles([]); }}>
                ← Voltar
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-foreground">{selectedFolder.name}</h2>
                {selectedFolder.description && <p className="text-xs text-muted-foreground">{selectedFolder.description}</p>}
              </div>
            </div>

            {isCoach && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Label className="text-sm font-semibold">Carregar Ficheiro</Label>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Descrição do ficheiro (opcional)</Label>
                      <Input value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} placeholder="Ex: Exercício de mobilidade para tornozelos" className="bg-background" />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="library-upload"
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        {uploading ? "A carregar..." : "Escolher Ficheiro"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Netflix-style file grid */}
            {files.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">Esta pasta ainda não tem ficheiros.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {files.map((file) => (
                  <FilePreviewCard
                    key={file.id}
                    file={file}
                    isCoach={isCoach}
                    onDelete={deleteFile}
                    onClick={() => setPreviewFile(file)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* File preview dialog */}
        <Dialog open={!!previewFile} onOpenChange={(open) => !open && setPreviewFile(null)}>
          <DialogContent className="max-w-4xl w-[95vw]">
            {previewFile && (
              <div className="space-y-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {getFileIcon(previewFile.file_type)}
                    {previewFile.file_name}
                  </DialogTitle>
                </DialogHeader>
                {renderPreviewContent(previewFile)}
                {previewFile.description && (
                  <p className="text-sm text-muted-foreground">{previewFile.description}</p>
                )}
                <div className="flex justify-end gap-2">
                  <a href={previewFile.file_url} target="_blank" rel="noopener noreferrer" download>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" /> Descarregar
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assign Dialog */}
        <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Partilhar Pasta com Atletas</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {athletes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Não tens atletas associados.</p>
              ) : (
                athletes.map((a) => (
                  <div key={a.athlete_id} className="flex items-center gap-3 rounded-md bg-secondary p-3 cursor-pointer" onClick={() => toggleAthlete(a.athlete_id)}>
                    <Checkbox checked={selectedAthletes.includes(a.athlete_id)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">#{a.short_id}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button onClick={saveAssignments} className="w-full">Guardar Atribuições</Button>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Library;
