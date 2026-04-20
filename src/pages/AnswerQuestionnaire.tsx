import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import InlineFilePreview from "@/components/InlineFilePreview";

interface Field {
  id: string;
  field_type: string;
  label: string;
  required: boolean;
  sort_order: number;
}

const AnswerQuestionnaire = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<any>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [answers, setAnswers] = useState<Record<string, { text_value?: string; number_value?: number; file_url?: string }>>({});
  const [attachments, setAttachments] = useState<any[]>([]);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  useEffect(() => {
    if (!user || !assignmentId) return;
    fetchData();
  }, [user, assignmentId]);

  const fetchData = async () => {
    try {
      // Get assignment
      const { data: assignment, error: aErr } = await supabase
        .from("custom_questionnaire_assignments")
        .select("*")
        .eq("id", assignmentId)
        .eq("athlete_id", user!.id)
        .single();

      if (aErr || !assignment) {
        toast.error("Questionário não encontrado");
        navigate("/dashboard");
        return;
      }

      if (assignment.completed_at) {
        setAlreadyCompleted(true);
      }

      // Get questionnaire and fields
      const [qRes, fRes] = await Promise.all([
        supabase.from("custom_questionnaires").select("*").eq("id", assignment.questionnaire_id).single(),
        supabase.from("custom_questionnaire_fields").select("*").eq("questionnaire_id", assignment.questionnaire_id).order("sort_order"),
      ]);

      if (qRes.data) {
        setQuestionnaire(qRes.data);
        setAttachments((qRes.data as any).attachments || []);
      }
      if (fRes.data) {
        setFields(fRes.data as Field[]);
        // Initialize answers
        const init: Record<string, any> = {};
        fRes.data.forEach((f: any) => {
          init[f.id] = f.field_type === "number" || f.field_type === "slider" ? { number_value: f.field_type === "slider" ? 5 : 0 } : { text_value: "" };
        });
        setAnswers(init);
      }

      // Load existing responses if completed
      if (assignment.completed_at) {
        const { data: responses } = await supabase
          .from("custom_questionnaire_responses")
          .select("*")
          .eq("assignment_id", assignmentId);
        if (responses) {
          const loaded: Record<string, any> = {};
          responses.forEach((r: any) => {
            loaded[r.field_id] = { text_value: r.text_value, number_value: r.number_value, file_url: r.file_url };
          });
          setAnswers(loaded);
        }
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: { ...prev[fieldId], ...value } }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    for (const f of fields) {
      if (f.required) {
        const ans = answers[f.id];
        if (!ans) { toast.error(`Responde ao campo obrigatório: ${f.label}`); return; }
        if (f.field_type === "text" || f.field_type === "textarea") {
          if (!ans.text_value?.trim()) { toast.error(`Responde ao campo obrigatório: ${f.label}`); return; }
        }
      }
    }

    setSubmitting(true);
    try {
      const inserts = fields.map((f) => ({
        assignment_id: assignmentId!,
        field_id: f.id,
        text_value: answers[f.id]?.text_value || null,
        number_value: answers[f.id]?.number_value ?? null,
        file_url: answers[f.id]?.file_url || null,
      }));

      const { error: rErr } = await supabase.from("custom_questionnaire_responses").insert(inserts);
      if (rErr) throw rErr;

      const { error: uErr } = await supabase
        .from("custom_questionnaire_assignments")
        .update({ completed_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (uErr) throw uErr;

      toast.success("Respostas enviadas com sucesso!");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{questionnaire?.title}</h1>
          {questionnaire?.description && (
            <p className="text-muted-foreground mt-1">{questionnaire.description}</p>
          )}
          {alreadyCompleted && (
            <Badge variant="default" className="mt-2">Já respondido</Badge>
          )}
        </div>

        {/* Attachments from coach - rendered inline */}
        {attachments.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Anexos do treinador</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {attachments.map((att: any, i: number) => (
                <InlineFilePreview key={i} url={att.url} name={att.name} mimeType={att.type} />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Fields */}
        <Card>
          <CardContent className="pt-6 space-y-6">
            {fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>

                {field.field_type === "text" && (
                  <Input
                    value={answers[field.id]?.text_value || ""}
                    onChange={(e) => updateAnswer(field.id, { text_value: e.target.value })}
                    disabled={alreadyCompleted}
                    className="bg-background"
                  />
                )}

                {field.field_type === "textarea" && (
                  <Textarea
                    value={answers[field.id]?.text_value || ""}
                    onChange={(e) => updateAnswer(field.id, { text_value: e.target.value })}
                    disabled={alreadyCompleted}
                    className="bg-background"
                  />
                )}

                {field.field_type === "number" && (
                  <Input
                    type="number"
                    value={answers[field.id]?.number_value ?? ""}
                    onChange={(e) => updateAnswer(field.id, { number_value: Number(e.target.value) })}
                    disabled={alreadyCompleted}
                    className="bg-background"
                  />
                )}

                {field.field_type === "slider" && (
                  <div className="space-y-2">
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={[answers[field.id]?.number_value ?? 5]}
                      onValueChange={([v]) => updateAnswer(field.id, { number_value: v })}
                      disabled={alreadyCompleted}
                    />
                    <p className="text-sm text-muted-foreground text-center">{answers[field.id]?.number_value ?? 5} / 10</p>
                  </div>
                )}

                {field.field_type === "file" && (
                  <div className="space-y-2">
                    {answers[field.id]?.file_url && (
                      <InlineFilePreview
                        url={answers[field.id].file_url!}
                        name={answers[field.id]?.text_value || undefined}
                      />
                    )}
                    {!alreadyCompleted && (
                      <Input
                        type="file"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file || !user) return;
                          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
                          const path = `${user.id}/${Date.now()}_${safeName}`;
                          const { error } = await supabase.storage.from("questionnaire-files").upload(path, file);
                          if (error) { toast.error(error.message); return; }
                          const { data } = supabase.storage.from("questionnaire-files").getPublicUrl(path);
                          updateAnswer(field.id, { file_url: data.publicUrl, text_value: file.name });
                          toast.success("Ficheiro carregado");
                        }}
                        className="bg-background"
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {!alreadyCompleted && (
          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? "A enviar..." : "Enviar Respostas"}
          </Button>
        )}
      </div>
    </Layout>
  );
};

export default AnswerQuestionnaire;
