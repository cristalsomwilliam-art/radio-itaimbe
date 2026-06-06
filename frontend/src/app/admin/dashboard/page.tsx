"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Calendar,
  User as UserIcon,
  Newspaper,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  Power,
  LogOut,
  Upload,
  Music,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  email: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState("config");
  const [isLoading, setIsLoading] = useState(true);

  // --- Estados do Database ---
  const [streamStatus, setStreamStatus] = useState<any>({
    tv_online: false,
    tv_stream_title: "",
    tv_viewers_count: 0,
    current_song: "",
    current_artist: "",
    listeners_count: 0,
    show_logo_overlay: true,
  });

  const [hosts, setHosts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [videoclips, setVideoclips] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [musicRequests, setMusicRequests] = useState<any[]>([]);

  // --- Formulários / Uploads ---
  const [uploading, setUploading] = useState(false);
  const [newHost, setNewHost] = useState({ name: "", bio: "", photo_url: "", instagram: "", facebook: "", whatsapp: "" });
  const [newSchedule, setNewSchedule] = useState({ title: "", description: "", start_time: "", end_time: "", day_of_week: 1, host_id: "", image_url: "" });
  const [newNews, setNewNews] = useState({ title: "", slug: "", excerpt: "", content: "", image_url: "" });
  const [newClip, setNewClip] = useState({ title: "", artist: "", video_url: "", active: true });
  const [newBanner, setNewBanner] = useState({ title: "", image_url: "", link: "", active: true, position: "home" });

  // Verificar Auth
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/admin/login");
      } else {
        setUser({ id: authUser.id, email: authUser.email || "" });
        loadData();
      }
    };
    checkUser();
  }, []);

  // Carregar Dados do DB
  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Status
      const { data: status } = await supabase.from("stream_status").select("*").eq("id", "main").single();
      if (status) setStreamStatus(status);

      // 2. Locutores
      const { data: hostsData } = await supabase.from("hosts").select("*").order("name");
      if (hostsData) setHosts(hostsData);

      // 3. Programação
      const { data: schedulesData } = await supabase.from("schedules").select("*, hosts(name)").order("day_of_week").order("start_time");
      if (schedulesData) setSchedules(schedulesData);

      // 4. Notícias
      const { data: newsData } = await supabase.from("news").select("*").order("published_at", { ascending: false });
      if (newsData) setNews(newsData);

      // 5. Clipes
      const { data: clipsData } = await supabase.from("videoclips").select("*").order("created_at", { ascending: false });
      if (clipsData) setVideoclips(clipsData);

      // 6. Banners
      const { data: bannersData } = await supabase.from("banners").select("*").order("created_at", { ascending: false });
      if (bannersData) setBanners(bannersData);

      // 7. Pedidos de Música
      const { data: requestsData } = await supabase.from("music_requests").select("*").order("created_at", { ascending: false });
      if (requestsData) setMusicRequests(requestsData);

    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  // Upload Genérico para Supabase Storage
  const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, bucket: string) => {
    const file = e.target.files?.[0];
    if (!file) return null;
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      alert("Falha no upload: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // --- Ações de Alteração ---
  const saveStreamSettings = async () => {
    const { error } = await supabase
      .from("stream_status")
      .update({
        tv_stream_title: streamStatus.tv_stream_title,
        show_logo_overlay: streamStatus.show_logo_overlay,
        tv_online: streamStatus.tv_online
      })
      .eq("id", "main");

    if (!error) alert("Configurações atualizadas com sucesso!");
    else alert("Erro ao atualizar configurações: " + error.message);
  };

  const createHost = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("hosts").insert([newHost]);
    if (!error) {
      alert("Locutor cadastrado!");
      setNewHost({ name: "", bio: "", photo_url: "", instagram: "", facebook: "", whatsapp: "" });
      loadData();
    }
  };

  const deleteHost = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este locutor?")) return;
    const { error } = await supabase.from("hosts").delete().eq("id", id);
    if (!error) loadData();
  };

  const createSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("schedules").insert([{
      ...newSchedule,
      host_id: newSchedule.host_id || null
    }]);
    if (!error) {
      alert("Programa agendado!");
      setNewSchedule({ title: "", description: "", start_time: "", end_time: "", day_of_week: 1, host_id: "", image_url: "" });
      loadData();
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Deseja remover este programa da grade?")) return;
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (!error) loadData();
  };

  const createNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("news").insert([{
      ...newNews,
      author_id: user?.id
    }]);
    if (!error) {
      alert("Notícia publicada!");
      setNewNews({ title: "", slug: "", excerpt: "", content: "", image_url: "" });
      loadData();
    } else {
      alert(error.message);
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta notícia?")) return;
    const { error } = await supabase.from("news").delete().eq("id", id);
    if (!error) loadData();
  };

  const createClip = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("videoclips").insert([newClip]);
    if (!error) {
      alert("Videoclipe adicionado!");
      setNewClip({ title: "", artist: "", video_url: "", active: true });
      loadData();
    }
  };

  const deleteClip = async (id: string) => {
    const { error } = await supabase.from("videoclips").delete().eq("id", id);
    if (!error) loadData();
  };

  const createBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("banners").insert([newBanner]);
    if (!error) {
      alert("Banner cadastrado com sucesso!");
      setNewBanner({ title: "", image_url: "", link: "", active: true, position: "home" });
      loadData();
    }
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (!error) loadData();
  };

  const deleteMusicRequest = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este pedido do mural?")) return;
    const { error } = await supabase.from("music_requests").delete().eq("id", id);
    if (!error) {
      setMusicRequests((prev) => prev.filter((r) => r.id !== id));
    } else {
      alert("Erro ao excluir pedido: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-3">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-zinc-500 text-xs font-semibold">Carregando painel...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho do Dashboard */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider">Painel de Administração</h1>
          <p className="text-xs text-zinc-500 font-semibold mt-1">
            Conectado como: <span className="text-primary-400">{user?.email}</span>
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-bold transition-all"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      {/* Tabs Lateral/Superior */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-1">
          <button
            onClick={() => setActiveTab("config")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "config" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <Settings className="w-4 h-4" /> Configurações Gerais
          </button>
          <button
            onClick={() => setActiveTab("schedules")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "schedules" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <Calendar className="w-4 h-4" /> Grade de Programação
          </button>
          <button
            onClick={() => setActiveTab("hosts")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "hosts" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <UserIcon className="w-4 h-4" /> Locutores
          </button>
          <button
            onClick={() => setActiveTab("news")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "news" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <Newspaper className="w-4 h-4" /> Notícias
          </button>
          <button
            onClick={() => setActiveTab("clips")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "clips" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <Film className="w-4 h-4" /> Videoclipes (Auto)
          </button>
          <button
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "banners" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <ImageIcon className="w-4 h-4" /> Banners & Sponsors
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === "requests" ? "bg-primary-500 text-white shadow-lg" : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-900"
            }`}
          >
            <Music className="w-4 h-4" /> Pedidos de Música
          </button>
        </div>

        {/* Área do Conteúdo da Tab */}
        <div className="lg:col-span-3 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 min-h-[400px]">
          
          {/* TAB: CONFIGURAÇÕES */}
          {activeTab === "config" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Controle da TV & Stream</h2>
              
              <div className="grid gap-4 max-w-xl">
                {/* Switch Estado TV */}
                <div className="flex items-center justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Sinal de TV ao Vivo</h3>
                    <p className="text-[10px] text-zinc-500">Alterna manualmente a home entre Rádio Automática e sinal da TV.</p>
                  </div>
                  <button
                    onClick={() => setStreamStatus({ ...streamStatus, tv_online: !streamStatus.tv_online })}
                    className={`p-2 rounded-lg border transition-all ${
                      streamStatus.tv_online
                        ? "bg-red-500/10 border-red-500/20 text-red-500"
                        : "bg-zinc-800 border-zinc-700 text-zinc-500"
                    }`}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                </div>

                {/* Título do Stream */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-semibold">Nome do Programa Atual (Transmissão TV)</label>
                  <input
                    type="text"
                    value={streamStatus.tv_stream_title}
                    onChange={(e) => setStreamStatus({ ...streamStatus, tv_stream_title: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>

                {/* Switch Overlay Logo */}
                <div className="flex items-center justify-between py-2">
                  <label className="text-xs text-zinc-400 font-semibold">Exibir Marca D'água na TV</label>
                  <input
                    type="checkbox"
                    checked={streamStatus.show_logo_overlay}
                    onChange={(e) => setStreamStatus({ ...streamStatus, show_logo_overlay: e.target.checked })}
                    className="accent-primary-500 h-4 w-4"
                  />
                </div>

                <button
                  onClick={saveStreamSettings}
                  className="py-2.5 px-4 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-xl self-start transition-all shadow-md"
                >
                  Salvar Configurações
                </button>
              </div>
            </div>
          )}

          {/* TAB: PROGRAMAÇÃO */}
          {activeTab === "schedules" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Gerenciar Grade Semanal</h2>

              {/* Form Cadastro */}
              <form onSubmit={createSchedule} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Título do Programa"
                  value={newSchedule.title}
                  onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <select
                  value={newSchedule.host_id}
                  onChange={(e) => setNewSchedule({ ...newSchedule, host_id: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-400"
                >
                  <option value="">Selecione o Locutor (Opcional)</option>
                  {hosts.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    required
                    value={newSchedule.start_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="time"
                    required
                    value={newSchedule.end_time}
                    onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                </div>
                <select
                  value={newSchedule.day_of_week}
                  onChange={(e) => setNewSchedule({ ...newSchedule, day_of_week: parseInt(e.target.value) })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                >
                  <option value="0">Domingo</option>
                  <option value="1">Segunda-feira</option>
                  <option value="2">Terça-feira</option>
                  <option value="3">Quarta-feira</option>
                  <option value="4">Quinta-feira</option>
                  <option value="5">Sexta-feira</option>
                  <option value="6">Sábado</option>
                </select>
                <div className="md:col-span-2">
                  <textarea
                    placeholder="Descrição do Programa"
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white h-16 resize-none"
                  />
                </div>
                
                {/* Upload Imagem do Programa */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const url = await uploadFile(e, "hosts-photos");
                      if (url) setNewSchedule({ ...newSchedule, image_url: url });
                    }}
                    className="hidden"
                    id="schedule-image-upload"
                  />
                  <label
                    htmlFor="schedule-image-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Imagem do Programa
                  </label>
                  {newSchedule.image_url && <span className="text-[10px] text-green-400">Imagem carregada!</span>}
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Cadastrar Programa
                </button>
              </form>

              {/* Lista Grade */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {schedules.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-white">{s.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][s.day_of_week]} • {s.start_time.substring(0,5)}h às {s.end_time.substring(0,5)}h
                        {s.hosts?.name && ` • Locutor: ${s.hosts.name}`}
                      </p>
                    </div>
                    <button onClick={() => deleteSchedule(s.id)} className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LOCUTORES */}
          {activeTab === "hosts" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Gerenciar Locutores</h2>

              {/* Form Locutor */}
              <form onSubmit={createHost} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Nome do Locutor"
                  value={newHost.name}
                  onChange={(e) => setNewHost({ ...newHost, name: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Instagram (link)"
                  value={newHost.instagram}
                  onChange={(e) => setNewHost({ ...newHost, instagram: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <div className="md:col-span-2">
                  <textarea
                    placeholder="Mini biografia do Locutor"
                    value={newHost.bio}
                    onChange={(e) => setNewHost({ ...newHost, bio: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white h-16 resize-none"
                  />
                </div>
                
                {/* Upload Foto */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const url = await uploadFile(e, "hosts-photos");
                      if (url) setNewHost({ ...newHost, photo_url: url });
                    }}
                    className="hidden"
                    id="host-photo-upload"
                  />
                  <label
                    htmlFor="host-photo-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Foto do Locutor
                  </label>
                  {newHost.photo_url && <span className="text-[10px] text-green-400">Foto carregada!</span>}
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Cadastrar Locutor
                </button>
              </form>

              {/* Lista Locutores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {hosts.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                        {h.photo_url && <img src={h.photo_url} className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-bold text-white">{h.name}</span>
                    </div>
                    <button onClick={() => deleteHost(h.id)} className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: NOTÍCIAS */}
          {activeTab === "news" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Portal de Notícias</h2>

              {/* Form Notícia */}
              <form onSubmit={createNews} className="space-y-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    placeholder="Título da Notícia"
                    value={newNews.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
                      setNewNews({ ...newNews, title, slug });
                    }}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Slug (link amigável)"
                    value={newNews.slug}
                    onChange={(e) => setNewNews({ ...newNews, slug: e.target.value })}
                    className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Resumo (Excerpt)"
                  value={newNews.excerpt}
                  onChange={(e) => setNewNews({ ...newNews, excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <textarea
                  required
                  placeholder="Conteúdo completo da notícia (use parágrafos simples)"
                  value={newNews.content}
                  onChange={(e) => setNewNews({ ...newNews, content: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white h-32 resize-y"
                />

                {/* Upload Capa */}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const url = await uploadFile(e, "news-covers");
                      if (url) setNewNews({ ...newNews, image_url: url });
                    }}
                    className="hidden"
                    id="news-cover-upload"
                  />
                  <label
                    htmlFor="news-cover-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Imagem da Notícia
                  </label>
                  {newNews.image_url && <span className="text-[10px] text-green-400">Imagem carregada!</span>}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Publicar Matéria
                </button>
              </form>

              {/* Lista Notícias */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {news.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs">
                    <span className="font-bold text-white truncate max-w-[400px]">{item.title}</span>
                    <button onClick={() => deleteNews(item.id)} className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: VIDEOCLIPES */}
          {activeTab === "clips" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Cadastrar Clipes (Modo Rádio)</h2>

              {/* Form Clipe */}
              <form onSubmit={createClip} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Nome da Música"
                  value={newClip.title}
                  onChange={(e) => setNewClip({ ...newClip, title: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  required
                  placeholder="Artista"
                  value={newClip.artist}
                  onChange={(e) => setNewClip({ ...newClip, artist: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <div className="md:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="URL do arquivo MP4 do videoclipe"
                    value={newClip.video_url}
                    onChange={(e) => setNewClip({ ...newClip, video_url: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                </div>
                
                {/* Upload MP4 */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={async (e) => {
                      const url = await uploadFile(e, "videoclips-media");
                      if (url) setNewClip({ ...newClip, video_url: url });
                    }}
                    className="hidden"
                    id="clip-upload"
                  />
                  <label
                    htmlFor="clip-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar MP4 do Videoclipe (Max: 50MB)
                  </label>
                  {newClip.video_url && <span className="text-[10px] text-green-400">MP4 carregado com sucesso!</span>}
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Adicionar Clipe
                </button>
              </form>

              {/* Lista Clipes */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {videoclips.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-white">{c.title}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{c.artist}</p>
                    </div>
                    <button onClick={() => deleteClip(c.id)} className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: BANNERS */}
          {activeTab === "banners" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Patrocínios e Banners</h2>

              {/* Form Banner */}
              <form onSubmit={createBanner} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl">
                <input
                  type="text"
                  required
                  placeholder="Nome/Marca do Patrocinador"
                  value={newBanner.title}
                  onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Link do Sponsor (Ex: https://...)"
                  value={newBanner.link || ""}
                  onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })}
                  className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />

                {/* Upload Banner */}
                <div className="md:col-span-2 flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const url = await uploadFile(e, "banners");
                      if (url) setNewBanner({ ...newBanner, image_url: url });
                    }}
                    className="hidden"
                    id="banner-image-upload"
                  />
                  <label
                    htmlFor="banner-image-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-300 rounded text-[10px] font-bold"
                  >
                    <Upload className="w-3.5 h-3.5" /> Enviar Imagem do Banner (1200x400)
                  </label>
                  {newBanner.image_url && <span className="text-[10px] text-green-400">Imagem do banner carregada!</span>}
                </div>

                <button
                  type="submit"
                  className="md:col-span-2 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-xs rounded-lg transition-all"
                >
                  Cadastrar Banner
                </button>
              </form>

              {/* Lista Banners */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {banners.map((b) => (
                  <div key={b.id} className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl text-xs">
                    <div>
                      <p className="font-bold text-white">{b.title}</p>
                      {b.link && <p className="text-[10px] text-primary-400 truncate max-w-[300px]">{b.link}</p>}
                    </div>
                    <button onClick={() => deleteBanner(b.id)} className="text-red-400 hover:text-red-500 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PEDIDOS DE MÚSICA */}
          {activeTab === "requests" && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white border-b border-zinc-800 pb-2">Pedidos de Música (Mural)</h2>
              
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {musicRequests.length > 0 ? (
                  musicRequests.map((req) => (
                    <div key={req.id} className="flex items-start justify-between p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl text-xs gap-4 hover:border-zinc-750 transition-all">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{req.name}</span>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {new Date(req.created_at).toLocaleString("pt-BR")}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            req.status === 'queued' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            req.status === 'processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            req.status === 'not_found' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' :
                            req.status === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {req.status === 'queued' ? 'Na Fila' :
                             req.status === 'processing' ? 'Processando' :
                             req.status === 'not_found' ? 'Não Encontrada' :
                             req.status === 'error' ? 'Erro' : 'Pendente'}
                          </span>
                        </div>
                        <p className="text-cyan-400 font-bold text-[11px] flex items-center gap-1.5 mt-1">
                          <Music className="w-3.5 h-3.5 text-cyan-400" /> {req.song_title}
                        </p>
                        {req.file_path && (
                          <p className="text-[10px] text-zinc-500 mt-1 truncate" title={req.file_path}>
                            <span className="font-bold text-zinc-450">SSD:</span> {req.file_path}
                          </p>
                        )}
                        {req.status_message && (
                          <p className="text-[10px] text-zinc-400 mt-1 italic font-medium bg-zinc-950/20 px-2 py-1.5 rounded border border-white/5">
                            {req.status_message}
                          </p>
                        )}
                        {req.message && (
                          <p className="text-zinc-400 mt-2 italic bg-zinc-950/40 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                            "{req.message}"
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMusicRequest(req.id)}
                        className="text-red-400 hover:text-red-500 p-1.5 bg-zinc-950 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 text-xs py-12 text-center">Nenhum pedido de música recebido no momento.</p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
