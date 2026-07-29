'use client';
import React, { useState } from 'react';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { BlogPost } from '@/lib/types/blog';

export default function BlogTab() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [generatedPost, setGeneratedPost] = useState<Partial<BlogPost> | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

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
        setGeneratedPost({
          ...data,
          slug: data.title.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)+/g, '')
        });
      } else {
        alert("Erro: " + data.error);
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

  const publishPost = async () => {
    if (!generatedPost || !generatedPost.title) return;
    setSaving(true);
    
    try {
      let coverImageUrl = '';
      if (coverImageFile) {
        const storageRef = ref(storage, `blog/${Date.now()}_${coverImageFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, coverImageFile);
        coverImageUrl = await getDownloadURL(uploadTask.ref);
      }

      const postData: BlogPost = {
        title: generatedPost.title || '',
        slug: generatedPost.slug || '',
        content: generatedPost.content || '',
        coverImage: coverImageUrl,
        seoMetadata: generatedPost.seoMetadata || { title: '', description: '', keywords: [] },
        status: 'published',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addDoc(collection(db, 'blog_posts'), postData);
      alert("Post publicado com sucesso!");
      setGeneratedPost(null);
      setCoverImageFile(null);
      setPrompt('');
    } catch (err) {
      console.error(err);
      alert("Erro ao publicar post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#111111] p-6 rounded-2xl border border-white/5 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-2">Gerador de Blog IA</h2>
        <p className="text-gray-400 text-sm mb-4">Descreva o post que você deseja criar (ex: "As 5 maiores tendências de estampas para 2026").</p>
        <div className="flex gap-4">
          <input 
            type="text" 
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#fe7302]"
            placeholder="Digite seu comando..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            onClick={generateWithAI}
            disabled={loading || !prompt}
            className="bg-[#fe7302] hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Gerando..." : "Gerar com IA"}
          </button>
        </div>
      </div>

      {generatedPost && (
        <div className="space-y-6 bg-black/50 p-6 rounded-2xl border border-white/5 mt-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Título do Post</label>
              <input 
                type="text" 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white"
                value={generatedPost.title || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Slug (URL)</label>
              <input 
                type="text" 
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white"
                value={generatedPost.slug || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, slug: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Imagem de Capa (Upload Manual)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#fe7302] file:text-white hover:file:bg-orange-600"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-bold mb-2">Conteúdo HTML (Preview & Edição)</label>
              <textarea 
                className="w-full h-64 bg-black border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-sm leading-relaxed"
                value={generatedPost.content || ''}
                onChange={(e) => setGeneratedPost({...generatedPost, content: e.target.value})}
              />
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-[#fe7302] mb-4">SEO Metadata</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Título SEO</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white"
                  value={generatedPost.seoMetadata?.title || ''}
                  onChange={(e) => setGeneratedPost({...generatedPost, seoMetadata: {...generatedPost.seoMetadata!, title: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Meta Descrição</label>
                <textarea 
                  className="w-full h-24 bg-black border border-white/10 rounded-xl px-4 py-2 text-white text-sm"
                  value={generatedPost.seoMetadata?.description || ''}
                  onChange={(e) => setGeneratedPost({...generatedPost, seoMetadata: {...generatedPost.seoMetadata!, description: e.target.value}})}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm font-bold mb-2">Keywords (separadas por vírgula)</label>
                <input 
                  type="text" 
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-2 text-white"
                  value={generatedPost.seoMetadata?.keywords?.join(', ') || ''}
                  onChange={(e) => setGeneratedPost({...generatedPost, seoMetadata: {...generatedPost.seoMetadata!, keywords: e.target.value.split(',').map(k => k.trim())}})}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
             <button 
                onClick={publishPost}
                disabled={saving}
                className="bg-[#00c853] hover:bg-green-600 text-white px-8 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shadow-lg shadow-green-500/20"
              >
                {saving ? "Publicando..." : "Publicar Post"}
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
