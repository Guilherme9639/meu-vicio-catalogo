'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Check, ChevronDown, ImagePlus, LayoutDashboard, LogOut, MoreHorizontal, Package, Plus, Search, Settings2, ShoppingBag, Tags, Upload, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SizeOption = { label: string; values: number[] };
type AdminProduct = { id: string; name: string; category: string; price: string; stock: number; status: 'Ativo' | 'Rascunho'; sizes: string[]; image: string };
type AdminCategory = { id: string; name: string };
type AdminOrder = { id: string; total: number; status: string; whatsappNumber: string | null; createdAt: string; items: { productName: string; size: string; quantity: number }[] };
const initialProducts: AdminProduct[] = [
  { id: 'demo-1', name: 'Brasil Logo Branco', category: 'Adulto', price: 'R$ 39,90', stock: 17, status: 'Ativo', sizes: ['33/34', '35/36', '37/38', '39/40'], image: '/products/havaianas-branco.png' },
  { id: 'demo-2', name: 'Top Rosé', category: 'Adulto', price: 'R$ 34,90', stock: 13, status: 'Ativo', sizes: ['33/34', '35/36', '37/38', '39/40'], image: '/products/havaianas-branco.png' },
  { id: 'demo-3', name: 'Slim Preto', category: 'Adulto', price: 'R$ 44,90', stock: 14, status: 'Ativo', sizes: ['33/34', '35/36', '37/38', '39/40', '41/42'], image: '/products/havaianas-branco.png' },
  { id: 'demo-4', name: 'Top Max Comfort', category: 'Adulto', price: 'R$ 59,90', stock: 10, status: 'Rascunho', sizes: ['35/36', '37/38', '39/40', '41/42'], image: '/products/havaianas-branco.png' },
  { id: 'demo-5', name: 'Havaianas Kids Brasil', category: 'Infantil', price: 'R$ 29,90', stock: 12, status: 'Ativo', sizes: ['16/17', '18/19', '20/21', '22/23', '24/25'], image: '/products/havaianas-branco.png' },
];
const adminSizes: SizeOption[] = [
  { label: '16/17', values: [16, 17] }, { label: '18/19', values: [18, 19] },
  { label: '20/21', values: [20, 21] }, { label: '22/23', values: [22, 23] },
  { label: '24/25', values: [24, 25] }, { label: '26/27', values: [26, 27] },
  { label: '28/29', values: [28, 29] }, { label: '30/31', values: [30, 31] },
  { label: '32/33', values: [32, 33] }, { label: '33/34', values: [33, 34] },
  { label: '35/36', values: [35, 36] }, { label: '37/38', values: [37, 38] },
  { label: '39/40', values: [39, 40] }, { label: '41/42', values: [41, 42] },
  { label: '43/44', values: [43, 44] }, { label: '45/46', values: [45, 46] },
];

export default function AdminPage() {
  const [items, setItems] = useState(initialProducts);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [importNotice, setImportNotice] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([{ id: 'adulto', name: 'Adulto' }, { id: 'infantil', name: 'Infantil' }]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categorySaving, setCategorySaving] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Adulto', price: '', description: '', sizes: [] as string[], image: '/products/havaianas-branco.png' });
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let mounted = true;
    async function initialize() {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);
      if (mounted) setLoading(false);
    }
    initialize();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => setSession(currentSession));
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!supabase || !session) return;
    let mounted = true;
    async function loadCategories() {
      const { data } = await supabase.from('categories').select('id,name').order('name', { ascending: true });
      if (mounted && data?.length) setCategories(data as AdminCategory[]);
    }
    async function loadProducts() {
      const { data } = await supabase.from('products').select('id,name,category,price,is_active,image_url,product_sizes(size,quantity)').order('created_at', { ascending: false });
      if (!mounted || !data?.length) return;
      setItems(data.map((row) => ({ id: row.id, name: row.name, category: String(row.category || 'Adulto'), price: Number(row.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: (row.product_sizes || []).reduce((total: number, item: { quantity: number }) => total + item.quantity, 0), status: row.is_active ? 'Ativo' : 'Rascunho', sizes: adminSizes.filter((option) => option.values.some((value) => (row.product_sizes || []).some((item: { size: number; quantity: number }) => item.size === value && item.quantity > 0))).map((option) => option.label), image: row.image_url || '/products/havaianas-branco.png' })));
    }
    async function loadOrders() {
      setOrdersLoading(true);
      const { data } = await supabase.from('orders').select('id,total,status,whatsapp_number,created_at,order_items(product_name,selected_size,quantity)').order('created_at', { ascending: false });
      if (mounted && data) setOrders(data.map((row) => ({ id: row.id, total: Number(row.total), status: row.status, whatsappNumber: row.whatsapp_number, createdAt: row.created_at, items: (row.order_items || []).map((item: { product_name: string; selected_size: string; quantity: number }) => ({ productName: item.product_name, size: item.selected_size, quantity: item.quantity })) })));
      if (mounted) setOrdersLoading(false);
    }
    loadCategories();
    loadProducts();
    loadOrders();
    return () => { mounted = false; };
  }, [session]);
  const visibleItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [items, search]);
  const summary = useMemo(() => {
    return {
      activeProducts: items.filter((item) => item.status === 'Ativo').length,
      stockTotal: items.reduce((total, item) => total + item.stock, 0),
      categoryCount: categories.length,
      categoryLabel: categories.length ? categories.map((category) => category.name).join(' e ').toLowerCase() : 'nenhuma cadastrada',
      imageCount: items.filter((item) => item.image !== '/products/havaianas-branco.png').length,
    };
  }, [items, categories]);
  async function signIn(event: FormEvent) { event.preventDefault(); if (!supabase) return; setAuthLoading(true); setAuthError(''); const { error } = await supabase.auth.signInWithPassword(authForm); if (error) setAuthError('Não foi possível entrar. Confira seu e-mail e senha.'); setAuthLoading(false); }
  async function signOut() { if (supabase) await supabase.auth.signOut(); }
  function handleImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; setImageFile(file); setForm((current) => ({ ...current, image: URL.createObjectURL(file) })); }
  function toggleSize(size: string) { setForm((current) => ({ ...current, sizes: current.sizes.includes(size) ? current.sizes.filter((item) => item !== size) : [...current.sizes, size] })); }
  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    const name = newCategoryName.trim();
    if (!name) return;
    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) { setCategoryError('Essa categoria já está cadastrada.'); return; }
    setCategorySaving(true);
    setCategoryError('');
    if (supabase && session) {
      const { data, error } = await supabase.from('categories').insert({ name }).select('id,name').single();
      if (error || !data) { setCategoryError(error?.code === '23505' ? 'Essa categoria já está cadastrada.' : 'Não foi possível salvar a categoria.'); setCategorySaving(false); return; }
      setCategories((current) => [...current, data as AdminCategory].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      setCategories((current) => [...current, { id: String(Date.now()), name }].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setNewCategoryName('');
    setForm((current) => ({ ...current, category: name }));
    setCategorySaving(false);
  }
  async function saveProduct() { if (!form.name.trim() || !form.price.trim()) return; if (supabase && session) { const numericPrice = Number(form.price.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0; let imageUrl: string | null = form.image.startsWith('blob:') ? null : form.image; if (imageFile) { const path = `${crypto.randomUUID()}-${imageFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`; const upload = await supabase.storage.from('product-images').upload(path, imageFile, { contentType: imageFile.type, upsert: false }); if (upload.error) return; imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl; } const inserted = await supabase.from('products').insert({ name: form.name.trim(), category: form.category, price: numericPrice, description: form.description.trim(), image_url: imageUrl, is_active: true }).select('id').single(); if (inserted.error || !inserted.data) return; if (form.sizes.length) await supabase.from('product_sizes').insert(form.sizes.map((label) => ({ product_id: inserted.data.id, size: adminSizes.find((option) => option.label === label)?.values[0] ?? 0, quantity: 1 }))); setItems((current) => [{ id: inserted.data.id, name: form.name.trim(), category: form.category, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: form.sizes.length, status: 'Ativo', sizes: form.sizes, image: imageUrl || '/products/havaianas-branco.png' }, ...current]); } else { setItems((current) => [...current, { id: String(Date.now()), name: form.name, category: form.category, price: `R$ ${form.price}`, stock: form.sizes.length, status: 'Rascunho', sizes: form.sizes, image: form.image }]); } setForm({ name: '', category: 'Adulto', price: '', description: '', sizes: [], image: '/products/havaianas-branco.png' }); setImageFile(null); setShowForm(false); }

  if (supabase && loading) return <main className="admin-auth-shell"><div className="admin-auth-card"><span className="admin-brand-mark">mv</span><h1>Carregando painel</h1><p>Preparando a conexão segura com a loja.</p></div></main>;
  if (supabase && !session) return <main className="admin-auth-shell"><form className="admin-auth-card" onSubmit={signIn}><span className="admin-brand-mark">mv</span><span className="admin-kicker">acesso restrito</span><h1>Painel da loja</h1><p>Entre com o usuário administrador do Supabase para gerenciar produtos e estoque.</p><label>E-mail<input type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="seu@email.com" /></label><label>Senha<input type="password" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Sua senha" /></label>{authError && <small className="auth-error">{authError}</small>}<button type="submit" className="new-product-button" disabled={authLoading}>{authLoading ? 'Entrando...' : 'Entrar no painel'}</button><a href="/" className="auth-back-link">Voltar ao catálogo</a></form></main>;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><a href="/" className="admin-brand"><span className="admin-brand-mark">mv</span><span><strong>MEU VÍCIO</strong><small>painel da loja</small></span></a><div className="admin-menu-label">menu principal</div><nav className="admin-menu"><a className="active" href="#visao-geral"><LayoutDashboard size={17} /> Visão geral</a><a href="#produtos"><Package size={17} /> Produtos <span>{items.length}</span></a><a href="#categorias"><Tags size={17} /> Categorias</a><a href="#pedidos"><ShoppingBag size={17} /> Pedidos <span>{orders.length}</span></a></nav><div className="admin-menu-label settings-label">configurações</div><nav className="admin-menu"><a href="#configuracoes"><Settings2 size={17} /> Preferências</a></nav><div className="admin-sidebar-bottom"><div className="admin-user-avatar">MV</div><div><strong>Meu Vício</strong><span>Administrador</span></div><button type="button" onClick={signOut} aria-label="Sair do painel" title="Sair do painel" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', border: 0, background: 'transparent', color: '#7d9288', cursor: 'pointer', padding: '6px 3px', font: 'inherit' }}><LogOut size={16} /><span style={{ marginTop: 0, color: 'currentColor', fontSize: 10, fontWeight: 800 }}>Sair</span></button></div></aside>
    <section className="admin-content"><header className="admin-topbar"><div><span className="admin-breadcrumb">Painel / Visão geral</span><h1>Bom dia, Meu Vício <span>✦</span></h1></div><div className="admin-top-actions"><button type="button" aria-label="Notificações"><Bell size={19} /></button><a className="view-store" href="/" target="_blank" rel="noreferrer">Ver catálogo <ArrowLeft size={15} /></a></div></header>
      <div className="admin-main" id="visao-geral">{importNotice && <div className="import-notice"><div><span className="notice-icon"><Check size={16} /></span><div><strong>Drive usado somente para a primeira carga</strong><p>Depois da importação, novos produtos, fotos e estoques serão atualizados diretamente neste painel.</p></div></div><button type="button" onClick={() => setImportNotice(false)} aria-label="Fechar aviso"><X size={17} /></button></div>}
        <div className="admin-stats"><div className="stat-card accent"><span className="stat-icon"><Package size={18} /></span><div><small>Produtos ativos</small><strong>{summary.activeProducts.toString().padStart(2, '0')}</strong><em>{items.length} cadastrados no total</em></div></div><div className="stat-card"><span className="stat-icon green"><ShoppingBag size={18} /></span><div><small>Pares em estoque</small><strong>{summary.stockTotal}</strong><em>somatório das quantidades</em></div></div><div className="stat-card"><span className="stat-icon sand"><Tags size={18} /></span><div><small>Categorias</small><strong>{summary.categoryCount.toString().padStart(2, '0')}</strong><em>{summary.categoryLabel}</em></div></div><div className="stat-card"><span className="stat-icon lilac"><ImagePlus size={18} /></span><div><small>Imagens cadastradas</small><strong>{summary.imageCount.toString().padStart(2, '0')}</strong><em>imagens vinculadas</em></div></div></div>
        <div className="admin-section-head" id="produtos"><div><span className="admin-kicker">catálogo</span><h2>Produtos cadastrados</h2></div><div className="admin-head-actions"><button type="button" className="import-button" onClick={() => setImportNotice(true)}><Upload size={16} /> Importar primeira carga</button><button type="button" className="new-product-button" onClick={() => setShowForm(true)}><Plus size={17} /> Novo produto</button></div></div>
        <div className="admin-toolbar"><div className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome do produto" /></div><button type="button" className="status-filter">Todos os status <ChevronDown size={15} /></button></div>
        <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque total</th><th>Tamanhos com estoque</th><th>Status</th><th></th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><div className="table-product"><img src={item.image} alt="" /><strong>{item.name}</strong></div></td><td>{item.category}</td><td className="table-price">{item.price}</td><td><strong>{item.stock}</strong> pares</td><td><div className="table-sizes">{item.sizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}{item.sizes.length > 5 && <span>+{item.sizes.length - 5}</span>}</div></td><td><span className={item.status === 'Ativo' ? 'status active' : 'status draft'}><i />{item.status}</span></td><td><button className="row-menu" type="button" aria-label={`Opções de ${item.name}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody></table></div>
        <div className="admin-help-card"><div className="help-illustration"><ImagePlus size={27} /></div><div><span className="admin-kicker">próximo passo</span><h3>Cadastre os produtos da loja</h3><p>Use o botão de novo produto para adicionar fotos, categorias, preços e estoque separado por tamanho.</p></div><button type="button" className="secondary-admin-button" onClick={() => setShowForm(true)}>Cadastrar produto <Plus size={15} /></button></div>
        <section id="categorias" style={{ marginTop: 34, borderTop: '1px solid #e4ece8', paddingTop: 4 }}>
          <div className="admin-section-head"><div><span className="admin-kicker">organização</span><h2>Categorias</h2></div><span className="admin-breadcrumb">{categories.length} cadastradas</span></div>
          <form onSubmit={saveCategory} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12, marginTop: 4 }}><label style={{ display: 'grid', flex: '1 1 240px', gap: 7, color: '#72877d', fontSize: 10, fontWeight: 800 }}>Nova categoria<input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Ex.: Feminino, Masculino ou Infantil" style={{ width: '100%', border: '1px solid #dbe5e0', borderRadius: 8, outline: 0, background: '#fff', color: '#365548', padding: '11px 12px', fontSize: 12 }} /></label><button type="submit" className="new-product-button" disabled={categorySaving} style={{ minHeight: 38 }}>{categorySaving ? 'Salvando...' : 'Adicionar categoria'} <Plus size={16} /></button></form>
          {categoryError && <small className="auth-error">{categoryError}</small>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 17 }}>{categories.map((category) => <span key={category.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #d8e8df', borderRadius: 999, background: '#f4faf7', color: '#47715d', padding: '8px 12px', fontSize: 11, fontWeight: 800 }}><Tags size={14} />{category.name}</span>)}</div>
        </section>
        <section id="pedidos">
          <div className="admin-section-head"><div><span className="admin-kicker">acompanhamento</span><h2>Pedidos enviados</h2></div><span className="admin-breadcrumb">{orders.length} registrados</span></div>
          <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Pedido</th><th>Itens escolhidos</th><th>WhatsApp</th><th>Total</th><th>Data</th><th>Status</th></tr></thead><tbody>{ordersLoading ? <tr><td colSpan={6}>Carregando pedidos...</td></tr> : orders.length ? orders.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td>{order.items.map((item) => `${item.productName} • ${item.size} • ${item.quantity}x`).join(' | ')}</td><td>{order.whatsappNumber ? `(${order.whatsappNumber.slice(2, 4)}) ${order.whatsappNumber.slice(4, 9)}-${order.whatsappNumber.slice(9)}` : 'Não informado'}</td><td className="table-price">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><span className="status active"><i />{order.status}</span></td></tr>) : <tr><td colSpan={6}>Ainda não há pedidos registrados. Eles aparecerão aqui quando alguém enviar uma sacola pelo WhatsApp.</td></tr>}</tbody></table></div>
        </section>
      </div></section>
    {showForm && <div className="admin-modal-backdrop" role="presentation" onClick={() => setShowForm(false)}><div className="admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onClick={(event) => event.stopPropagation()}><div className="admin-form-header"><div><span className="admin-kicker">novo cadastro</span><h2 id="admin-form-title">Adicionar produto</h2></div><button type="button" onClick={() => setShowForm(false)} aria-label="Fechar"><X size={19} /></button></div><div className="admin-form-body"><label>Nome do produto<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Havaianas Brasil Logo Branco" /></label><div className="admin-form-grid"><label>Categoria<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><label>Preço<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="39,90" /></label></div><label>Descrição<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva o produto brevemente" rows={3} /></label><label className="upload-field"><span>Imagem principal</span><div><ImagePlus size={18} /><strong>Selecione uma foto do produto</strong><small>PNG ou JPG • imagem quadrada recomendada</small><input type="file" accept="image/png,image/jpeg" onChange={handleImage} /></div></label><fieldset><legend>Faixas disponíveis</legend><div className="admin-size-grid">{adminSizes.map((option) => <label key={option.label} className={form.sizes.includes(option.label) ? 'admin-size selected' : 'admin-size'}><input type="checkbox" checked={form.sizes.includes(option.label)} onChange={() => toggleSize(option.label)} /><span>{option.label}</span></label>)}</div></fieldset></div><div className="admin-form-footer"><button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancelar</button><button type="button" className="new-product-button" onClick={saveProduct}>Salvar produto <Check size={16} /></button></div></div></div>}
  </main>;
}
