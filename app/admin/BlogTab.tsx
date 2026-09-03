'use client';
import React, { useState, useEffect } from 'react';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BlogPost } from '@/lib/types/blog';
import { RefreshCw, Trash2, Edit3, Eye, Sparkles, Image as ImageIcon, ExternalLink, BookOpen, TrendingUp } from 'lucide-react';

export default function BlogTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [generatedPost, setGeneratedPost] = useState<Partial<BlogPost> | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [publishedPosts, setPublishedPosts] = useState<any[]>([]);

  const fetchPosts = async () => {
    setFetching(true);
    try {
      const res = await fetch(`/api/admin/blog/list?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setPublishedPosts(data);
      } else {
        console.error("Erro na resposta:", data);
      }
    } catch (e) {
      console.error("Erro ao buscar posts:", e);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const generateWithAI = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (res.ok) {
        setEditingPostId(null);
        setGeneratedPost({
          ...data,
          slug: data.title ? data.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)+/g, '') : '',
          status: 'published'
        });
      } else {
        alert("Erro: " + (data.error || "Falha ao gerar post"));
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao gerar post");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImageFile(e.target.files[0]);
    }
  };

  const handleEditClick = (post: any) => {
    setEditingPostId(post.id);
    setGeneratedPost({
      id: post.id,
      title: post.title || '',
      slug: post.slug || '',
      content: post.content || '',
      coverImage: post.coverImage || '',
      seoMetadata: post.seoMetadata || { title: post.title || '', description: '', keywords: [] },
      status: post.status || 'published',
      createdAt: post.createdAt,
    });
    setCoverImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir o artigo "${title}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blog/delete?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setPublishedPosts(prev => prev.filter(p => p.id !== id));
        if (editingPostId === id) {
          setEditingPostId(null);
          setGeneratedPost(null);
        }
      } else {
        const errData = await res.json();
        alert("Erro ao excluir: " + (errData.error || "Erro desconhecido"));
      }
    } catch (err) {
      console.error("Erro ao excluir post:", err);
      alert("Erro de conexão ao excluir post");
    } finally {
      setDeletingId(null);
    }
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setGeneratedPost(null);
    setCoverImageFile(null);
  };

  const publishPost = async () => {
    if (!generatedPost || !generatedPost.title) return;
    setSaving(true);
    
    try {
      let coverImageUrl = generatedPost.coverImage || '';
      if (coverImageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_${coverImageFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(uploadTask.ref);
      }

      const postData: any = {
        title: generatedPost.title || '',
        slug: generatedPost.slug || '',
        content: generatedPost.content || '',
        coverImage: coverImageUrl,
        seoMetadata: generatedPost.seoMetadata || { title: '', description: '', keywords: [] },
        status: generatedPost.status || 'published',
      };

      if (editingPostId) {
        postData.id = editingPostId;
        if (generatedPost.createdAt) {
          postData.createdAt = generatedPost.createdAt;
        }
      } else {
        postData.createdAt = Date.now();
      }

      const res = await fetch('/api/admin/blog/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData)
      });
      
      if (!res.ok) {
         const errorData = await res.json();
         throw new Error(errorData.error || "Erro na API de publicação");
      }

      alert(editingPostId ? "Post atualizado com sucesso!" : "Post publicado com sucesso!");
      setEditingPostId(null);
      setGeneratedPost(null);
      setCoverImageFile(null);
      setPrompt('');
      fetchPosts();
    } catch (err: any) {
      console.error(err);
      alert("Erro ao salvar post: " + (err.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (val: any) => {
    if (!val) return 'Data não definida';
    const d = new Date(typeof val === 'number' ? val : val.seconds ? val.seconds * 1000 : val);
    return isNaN(d.getTime()) ? 'Data não definida' : d.toLocaleDateString('pt-BR');
  };

  // Métricas do Blog
  const totalViews = publishedPosts.reduce((sum, p) => sum + (p.views || 0), 0);
  const mostViewedPost = publishedPosts.length > 0
    ? [...publishedPosts].sort((a, b) => (b.views || 0) - (a.views || 0))[0]
    : null;

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 space-y-6">
      
      {/* PAINEL DE ESTATÍSTICAS / MÉTRICAS DE ACESSO AO BLOG */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-[#fe7302]/10 text-[#fe7302] flex items-center justify-center shrink-0 border border-[#fe7302]/20">
            <Eye size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total de Acessos
            </span>
            <span className="text-2xl font-black text-white">
              {totalViews.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Artigos Publicados
            </span>
            <span className="text-2xl font-black text-white">
              {publishedPosts.length}
            </span>
          </div>
        </div>

        <div className="bg-black/60 border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0 border border-green-500/20">
            <TrendingUp size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Mais Acessado
            </span>
            <span className="text-xs font-bold text-white truncate block">
              {mostViewedPost?.title ? mostViewedPost.title : 'Nenhum'}
            </span>
            {mostViewedPost && (
              <span className="text-[10px] text-green-400 font-semibold">
                {(mostViewedPost.views || 0).toLocaleString('pt-BR')} acessos
              </span>
            )}
          </div>
        </div>
      </div>

      {/* GERADOR DE BLOG IA */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="text-[#fe7302]" size={22} />
          <h2 className="text-xl font-bold text-white">Gerador de Blog IA</h2>
        </div>
        <p className="text-gray-400 text-sm mb-4">Descreva o post que você deseja criar (ex: "As 5 maiores tendências de estampas para 2026").</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe7302]"
            placeholder="Digite o tema para gerar com IA..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateWithAI()}
          />
          <button 
            onClick={generateWithAI}
            disabled={loading || !prompt}
            className="bg-[#fe7302] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors whitespace-nowrap flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Gerando com IA...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Gerar com IA
              </>
            )}
          </button>
          
          <button 
            onClick={() => {
              setEditingPostId(null);
              setGeneratedPost({
                title: '',
                slug: '',
                content: '',
                status: 'published',
                seoMetadata: { title: '', description: '', keywords: [] }
              });
              setCoverImageFile(null);
            }}
            className="bg-white/10 hover:bg-white/20 text-white px-5 py-3 rounded-xl font-bold transition-colors whitespace-nowrap flex items-center justify-center gap-2 border border-white/10"
          >
            + Novo Artigo
          </button>
        </div>
      </div>

      {generatedPost && (
        <div className="space-y-6 bg-black/50 p-6 rounded-2xl border border-orange-500/30 mt-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-[#fe7302]">
              {editingPostId ? '✏️ Editando Artigo' : '✨ Artigo Gerado / Editável'}
            </h3>
            <button 
              onClick={cancelEdit} 
              className="text-xs text-gray-400 hover:text-white px-3 py-1 bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Título do Post</label>
              <input 
                type="text" 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white font-bold"
                value={generatedPost.title || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Slug (URL)</label>
              <input 
                type="text" 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-xs text-gray-300"
                value={generatedPost.slug || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, slug: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Status do Post</label>
                <select 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white"
                  value={generatedPost.status || 'published'}
                  onChange={(e) => setGeneratedPost({...generatedPost, status: e.target.value as 'published' | 'draft'})}
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Imagem de Capa</label>
                {generatedPost.coverImage && !coverImageFile && (
                  <div className="mb-2 flex items-center gap-3">
                    <img src={generatedPost.coverImage} alt="Capa" className="w-12 h-12 object-cover rounded-lg border border-white/10" />
                    <span className="text-xs text-gray-400">Imagem atual mantida</span>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#fe7302] file:text-white hover:file:bg-orange-600 cursor-pointer text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Conteúdo HTML (Preview & Edição)</label>
              <textarea 
                className="w-full h-72 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm leading-relaxed focus:border-[#fe7302] focus:outline-none"
                value={generatedPost.content || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, content: e.target.value})}
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-base font-bold text-[#fe7302] mb-4">SEO Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Título SEO</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                  value={generatedPost.seoMetadata?.title || ''}
                  onChange={(e) => setGeneratedPost({
                    ...generatedPost, 
                    seoMetadata: {
                      title: e.target.value,
                      description: generatedPost.seoMetadata?.description || '',
                      keywords: generatedPost.seoMetadata?.keywords || []
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Meta Descrição</label>
                <textarea 
                  className="w-full h-20 bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                  value={generatedPost.seoMetadata?.description || ''}
                  onChange={(e) => setGeneratedPost({
                    ...generatedPost, 
                    seoMetadata: {
                      title: generatedPost.seoMetadata?.title || '',
                      description: e.target.value,
                      keywords: generatedPost.seoMetadata?.keywords || []
                    }
                  })}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Keywords (separadas por vírgula)</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                  value={generatedPost.seoMetadata?.keywords?.join(', ') || ''}
                  onChange={(e) => setGeneratedPost({
                    ...generatedPost, 
                    seoMetadata: {
                      title: generatedPost.seoMetadata?.title || '',
                      description: generatedPost.seoMetadata?.description || '',
                      keywords: e.target.value.split(',').map(k => k.trim())
                    }
                  })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
             <button 
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
              >
                Cancelar
              </button>

             <button 
                onClick={publishPost}
                disabled={saving}
                className="bg-[#00c853] hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : (
                  editingPostId ? "Atualizar Post" : "Publicar Post"
                )}
              </button>
          </div>
        </div>
      )}

      {/* Lista de Posts Publicados */}
      <div className="mt-12 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Artigos Publicados</h3>
            <span className="bg-white/10 text-gray-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {publishedPosts.length}
            </span>
          </div>

          <button 
            onClick={fetchPosts}
            disabled={fetching}
            className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-2 rounded-xl transition-colors disabled:opacity-50"
            title="Atualizar lista de artigos"
          >
            <RefreshCw size={14} className={fetching ? 'animate-spin text-[#fe7302]' : ''} />
            {fetching ? 'Atualizando...' : 'Atualizar Lista'}
          </button>
        </div>

        {fetching && publishedPosts.length === 0 ? (
          <div className="py-12 flex justify-center items-center gap-3 text-gray-400">
            <RefreshCw size={18} className="animate-spin text-[#fe7302]" />
            <span className="text-sm font-medium">Carregando artigos do blog...</span>
          </div>
        ) : publishedPosts.length === 0 ? (
          <div className="text-center py-12 bg-black/30 rounded-2xl border border-white/5">
            <p className="text-gray-500 text-sm mb-2">Nenhum artigo encontrado no banco de dados.</p>
            <p className="text-gray-600 text-xs">Use o campo acima para gerar seu primeiro artigo com IA.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedPosts.map(post => (
              <div 
                key={post.id} 
                className={`bg-black/50 border ${editingPostId === post.id ? 'border-[#fe7302]' : 'border-white/5'} p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-orange-500/30 transition-colors`}
              >
                <div className="flex items-start md:items-center gap-4">
                  {post.coverImage ? (
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      className="w-14 h-14 object-cover rounded-xl border border-white/10 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0 text-gray-600">
                      <ImageIcon size={20} />
                    </div>
                  )}

                  <div>
                    <h4 className="text-white font-bold text-base leading-snug">{post.title}</h4>
                    <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-gray-400">/{post.slug}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>•</span>
                      <span className={post.status === 'published' ? 'text-green-400 font-semibold' : 'text-orange-400 font-semibold'}>
                        {(post.status || 'published').toUpperCase()}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#fe7302] font-semibold bg-[#fe7302]/10 px-2.5 py-0.5 rounded-md border border-[#fe7302]/20">
                        <Eye size={13} />
                        {(post.views || 0).toLocaleString('pt-BR')} acessos
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <button
                    onClick={() => handleEditClick(post)}
                    className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 hover:text-white text-gray-300 px-3 py-2 rounded-lg transition-colors"
                    title="Editar artigo"
                  >
                    <Edit3 size={14} />
                    <span>Editar</span>
                  </button>

                  <a 
                    href={`/blog/${post.slug}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 hover:text-white text-gray-300 px-3 py-2 rounded-lg transition-colors"
                    title="Ver artigo no site público"
                  >
                    <ExternalLink size={14} />
                    <span>Ver no site</span>
                  </a>

                  <button
                    onClick={() => handleDeleteClick(post.id, post.title)}
                    disabled={deletingId === post.id}
                    className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                    title="Excluir artigo"
                  >
                    {deletingId === post.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
