import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Paperclip, ArrowLeft, File, Image, Video, FileText } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Contact {
  user_id: string;
  full_name: string;
  last_message?: string;
  last_message_time?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  created_at: string;
  read_at: string | null;
}

const Chat = () => {
  const { user, role } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch contacts (coach sees athletes, player sees coach)
  useEffect(() => {
    if (!user) return;

    const fetchContacts = async () => {
      if (role === "coach") {
        const { data: athleteLinks } = await supabase
          .from("coach_athletes")
          .select("athlete_id")
          .eq("coach_id", user.id);

        if (athleteLinks && athleteLinks.length > 0) {
          const ids = athleteLinks.map((a) => a.athlete_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", ids);

          if (profiles) {
            const contactList = await Promise.all(
              profiles.map(async (p) => {
                const { data: lastMsg } = await supabase
                  .from("messages")
                  .select("content, created_at")
                  .or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.user_id}),and(sender_id.eq.${p.user_id},receiver_id.eq.${user.id})`)
                  .order("created_at", { ascending: false })
                  .limit(1)
                  .maybeSingle();

                const { count } = await supabase
                  .from("messages")
                  .select("*", { count: "exact", head: true })
                  .eq("sender_id", p.user_id)
                  .eq("receiver_id", user.id)
                  .is("read_at", null);

                return {
                  user_id: p.user_id,
                  full_name: p.full_name || "Sem nome",
                  last_message: lastMsg?.content || undefined,
                  last_message_time: lastMsg?.created_at || undefined,
                  unread_count: count || 0,
                };
              })
            );
            contactList.sort((a, b) => {
              if (!a.last_message_time && !b.last_message_time) return 0;
              if (!a.last_message_time) return 1;
              if (!b.last_message_time) return -1;
              return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
            });
            setContacts(contactList);
          }
        }
      } else {
        // Player: find coach
        const { data: coachLinks } = await supabase
          .from("coach_athletes")
          .select("coach_id")
          .eq("athlete_id", user.id);

        if (coachLinks && coachLinks.length > 0) {
          const coachIds = coachLinks.map((c) => c.coach_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", coachIds);

          if (profiles) {
            setContacts(
              profiles.map((p) => ({
                user_id: p.user_id,
                full_name: p.full_name || "Treinador",
              }))
            );
          }
        }
      }
    };

    fetchContacts();
  }, [user, role]);

  // Fetch messages for selected contact
  useEffect(() => {
    if (!user || !selectedContact) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedContact.user_id}),and(sender_id.eq.${selectedContact.user_id},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages((data as Message[]) || []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("sender_id", selectedContact.user_id)
        .eq("receiver_id", user.id)
        .is("read_at", null);
    };

    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`chat-${selectedContact.user_id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === user.id && msg.receiver_id === selectedContact.user_id) ||
            (msg.sender_id === selectedContact.user_id && msg.receiver_id === user.id)
          ) {
            setMessages((prev) => [...prev, msg]);
            // Mark as read if received
            if (msg.sender_id === selectedContact.user_id) {
              supabase
                .from("messages")
                .update({ read_at: new Date().toISOString() })
                .eq("id", msg.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedContact]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (content?: string, fileUrl?: string, fileName?: string, fileType?: string) => {
    if (!user || !selectedContact) return;
    if (!content && !fileUrl) return;

    setSending(true);
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedContact.user_id,
      content: content || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
      file_type: fileType || null,
    });
    setSending(false);
    setNewMessage("");
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage.trim());
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedContact) return;

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("chat-files").upload(filePath, file);

    if (!error) {
      const { data: urlData } = supabase.storage.from("chat-files").getPublicUrl(filePath);
      await sendMessage(null, urlData.publicUrl, file.name, file.type);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return <File className="h-4 w-4" />;
    if (fileType.startsWith("image/")) return <Image className="h-4 w-4" />;
    if (fileType.startsWith("video/")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const renderMessage = (msg: Message) => {
    const isMine = msg.sender_id === user?.id;

    return (
      <div key={msg.id} className={cn("flex mb-2", isMine ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
            isMine
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-secondary text-secondary-foreground rounded-bl-md"
          )}
        >
          {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
          {msg.file_url && (
            <a
              href={msg.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block mt-1"
            >
              {msg.file_type?.startsWith("image/") ? (
                <img
                  src={msg.file_url}
                  alt={msg.file_name || "imagem"}
                  className="max-w-full rounded-lg max-h-60 object-cover"
                />
              ) : (
                <div className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2",
                  isMine ? "bg-primary-foreground/10" : "bg-background"
                )}>
                  {getFileIcon(msg.file_type)}
                  <span className="text-xs truncate max-w-[180px] underline">
                    {msg.file_name || "Ficheiro"}
                  </span>
                </div>
              )}
            </a>
          )}
          <p className={cn(
            "text-[10px] mt-1",
            isMine ? "text-primary-foreground/60" : "text-muted-foreground"
          )}>
            {format(new Date(msg.created_at), "HH:mm")}
          </p>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] -m-8">
        {/* Contact List */}
        <div className={cn(
          "w-80 border-r border-border flex flex-col bg-card",
          selectedContact ? "hidden md:flex" : "flex w-full md:w-80"
        )}>
          <div className="p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Mensagens</h2>
          </div>
          <ScrollArea className="flex-1">
            {contacts.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {role === "coach"
                  ? "Adiciona atletas para começar a conversar."
                  : "Ainda não estás associado a nenhum treinador."}
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.user_id}
                  onClick={() => setSelectedContact(contact)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                    selectedContact?.user_id === contact.user_id && "bg-accent"
                  )}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                      {contact.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">
                        {contact.full_name}
                      </p>
                      {contact.last_message_time && (
                        <span className="text-[10px] text-muted-foreground ml-2 shrink-0">
                          {format(new Date(contact.last_message_time), "HH:mm")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.last_message || "Sem mensagens"}
                      </p>
                      {(contact.unread_count ?? 0) > 0 && (
                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                          {contact.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedContact ? "hidden md:flex" : "flex"
        )}>
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedContact(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {selectedContact.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedContact.full_name}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Envia a primeira mensagem!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="shrink-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    placeholder="Escreve uma mensagem..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!newMessage.trim() || sending}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Send className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Seleciona um contacto para começar a conversar
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
