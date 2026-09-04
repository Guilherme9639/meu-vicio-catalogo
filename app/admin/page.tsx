'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bell, Check, ChevronDown, Eye, EyeOff, ImagePlus, LayoutDashboard, LogOut, MoreHorizontal, Package, Plus, Search, Settings2, ShoppingBag, Tags, Upload, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type SizeOption = { label: string; values: number[] };
type AdminProduct = { id: string; name: string; category: string; price: string; stock: number; status: 'Ativo' | 'Rascunho'; sizes: string[]; sizeQuantities?: Record<string, number>; description?: string; image: string };
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
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Rascunho'>('Todos');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Adulto', price: '', description: '', isActive: true, sizes: [] as string[], quantities: {} as Record<string, number>, image: '/products/havaianas-branco.png' });
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
      const { data } = await supabase.from('products').select('id,name,category,price,description,is_active,image_url,product_sizes(size,quantity)').order('created_at', { ascending: false });
      if (!mounted || !data?.length) return;
      setItems(data.map((row) => {
        const sizeQuantities = Object.fromEntries((row.product_sizes || []).map((item: { size: number; quantity: number }) => {
          const option = adminSizes.find((candidate) => candidate.values.includes(item.size));
          return [option?.label || String(item.size), item.quantity];
        }));
        return { id: row.id, name: row.name, category: String(row.category || 'Adulto'), price: Number(row.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: Object.values(sizeQuantities).reduce((total, quantity) => total + Number(quantity), 0), status: row.is_active ? 'Ativo' : 'Rascunho', sizes: Object.keys(sizeQuantities).filter((label) => Number(sizeQuantities[label]) > 0), sizeQuantities, description: row.description || '', image: row.image_url || '/products/havaianas-branco.png' };
      }));
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
  const visibleItems = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'Todos' || item.status === statusFilter)), [items, search, statusFilter]);
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
  function handleImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const previewUrl = URL.createObjectURL(file); setImageFile(file); setForm((current) => ({ ...current, image: previewUrl })); }
  function parsePrice(value: string) { const normalized = value.replace(/[^\d,.-]/g, ''); return Number(normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized) || 0; }
  function toggleSize(size: string) { setForm((current) => { const selected = current.sizes.includes(size); const quantities = { ...current.quantities }; if (selected) delete quantities[size]; else quantities[size] = 1; return { ...current, sizes: selected ? current.sizes.filter((item) => item !== size) : [...current.sizes, size], quantities }; }); }
  function setSizeQuantity(size: string, quantity: string) { setForm((current) => ({ ...current, quantities: { ...current.quantities, [size]: Math.max(0, Number(quantity) || 0) } })); }
  function resetProductForm() { setEditingProductId(null); setImageFile(null); setForm({ name: '', category: categories[0]?.name || 'Adulto', price: '', description: '', isActive: true, sizes: [], quantities: {}, image: '/products/havaianas-branco.png' }); }
  function openNewProduct() { setActionMessage(''); resetProductForm(); setShowForm(true); }
  function openEditProduct(item: AdminProduct) { setActionMessage(''); setEditingProductId(item.id); setImageFile(null); setForm({ name: item.name, category: item.category, price: item.price.replace('R$', '').trim(), description: item.description || '', isActive: item.status === 'Ativo', sizes: item.sizes, quantities: item.sizeQuantities || Object.fromEntries(item.sizes.map((size) => [size, 1])), image: item.image }); setShowForm(true); }
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
  async function saveProduct() {
    if (!form.name.trim() || !form.price.trim()) { setActionMessage('Preencha o nome e o preço do produto.'); return; }
    const numericPrice = parsePrice(form.price);
    let imageUrl: string | null = form.image.startsWith('blob:') ? null : form.image;
    if (imageFile && supabase && session) {
      const path = `${crypto.randomUUID()}-${imageFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      const upload = await supabase.storage.from('product-images').upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (upload.error) { setActionMessage('Não foi possível enviar a imagem. Confira o bucket de imagens no Supabase.'); return; }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }
    const sizeRows = form.sizes.map((label) => ({ size: adminSizes.find((option) => option.label === label)?.values[0] ?? 0, quantity: Math.max(0, Number(form.quantities[label] ?? 1)) }));
    if (supabase && session && editingProductId && !editingProductId.startsWith('demo-')) {
      const update = await supabase.from('products').update({ name: form.name.trim(), category: form.category, price: numericPrice, description: form.description.trim(), image_url: imageUrl, is_active: form.isActive }).eq('id', editingProductId);
      if (update.error) { setActionMessage('Não foi possível atualizar o produto.'); return; }
      const sizes = sizeRows.map((row) => ({ ...row, product_id: editingProductId }));
      const sizesResult = sizes.length ? await supabase.from('product_sizes').upsert(sizes, { onConflict: 'product_id,size' }) : null;
      if (sizesResult?.error) { setActionMessage('Produto atualizado, mas não foi possível salvar os tamanhos.'); return; }
      const selectedValues = sizeRows.map((row) => row.size);
      const removeResult = selectedValues.length ? await supabase.from('product_sizes').delete().eq('product_id', editingProductId).not('size', 'in', `(${selectedValues.join(',')})`) : await supabase.from('product_sizes').delete().eq('product_id', editingProductId);
      if (removeResult.error) { setActionMessage('Produto atualizado, mas alguns tamanhos antigos permaneceram.'); return; }
      const nextItem = { id: editingProductId, name: form.name.trim(), category: form.category, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes.filter((label) => (form.quantities[label] ?? 0) > 0), sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || '/products/havaianas-branco.png' };
      setItems((current) => current.map((item) => item.id === editingProductId ? nextItem : item));
    } else if (supabase && session) {
      const inserted = await supabase.from('products').insert({ name: form.name.trim(), category: form.category, price: numericPrice, description: form.description.trim(), image_url: imageUrl, is_active: form.isActive }).select('id').single();
      if (inserted.error || !inserted.data) { setActionMessage('Não foi possível salvar o produto.'); return; }
      const sizes = sizeRows.map((row) => ({ ...row, product_id: inserted.data.id }));
      if (sizes.length) { const sizeResult = await supabase.from('product_sizes').insert(sizes); if (sizeResult.error) { setActionMessage('Produto salvo, mas não foi possível salvar os tamanhos.'); return; } }
      setItems((current) => [{ id: inserted.data.id, name: form.name.trim(), category: form.category, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes.filter((label) => (form.quantities[label] ?? 0) > 0), sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || '/products/havaianas-branco.png' }, ...current]);
    } else {
      const localId = editingProductId || String(Date.now());
      const nextItem = { id: localId, name: form.name.trim(), category: form.category, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes, sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || form.image };
      setItems((current) => editingProductId ? current.map((item) => item.id === editingProductId ? nextItem : item) : [nextItem, ...current]);
    }
    setActionMessage(editingProductId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
    resetProductForm();
    setShowForm(false);
  }
  async function updateOrderStatus(id: string, status: string) {
    if (!supabase || !session) return;
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) setActionMessage('Não foi possível atualizar o status do pedido.');
  }
  async function toggleProductStatus(item: AdminProduct) {
    const nextStatus = item.status === 'Ativo' ? 'Rascunho' : 'Ativo';
    if (supabase && session && !item.id.startsWith('demo-')) {
      const { error } = await supabase.from('products').update({ is_active: nextStatus === 'Ativo' }).eq('id', item.id);
      if (error) { setActionMessage('Não foi possível alterar o status do produto.'); return; }
    }
    setItems((current) => current.map((product) => product.id === item.id ? { ...product, status: nextStatus } : product));
    setActionMessage(`Produto ${nextStatus === 'Ativo' ? 'ativado' : 'colocado como rascunho'} com sucesso.`);
  }

  if (supabase && loading) return <main className="admin-auth-shell"><div className="admin-auth-card"><span className="admin-brand-mark">mv</span><h1>Carregando painel</h1><p>Preparando a conexão segura com a loja.</p></div></main>;
  if (supabase && !session) return <main className="admin-auth-shell"><form className="admin-auth-card" onSubmit={signIn}><span className="admin-brand-mark">mv</span><span className="admin-kicker">acesso restrito</span><h1>Painel da loja</h1><p>Entre com o usuário administrador do Supabase para gerenciar produtos e estoque.</p><label>E-mail<input type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="seu@email.com" /></label><label>Senha<input type="password" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Sua senha" /></label>{authError && <small className="auth-error">{authError}</small>}<button type="submit" className="new-product-button" disabled={authLoading}>{authLoading ? 'Entrando...' : 'Entrar no painel'}</button><a href="/" className="auth-back-link">Voltar ao catálogo</a></form></main>;

  return <main className="admin-shell">
    <aside className="admin-sidebar"><a href="/" className="admin-brand"><span className="admin-brand-mark">mv</span><span><strong>MEU VÍCIO</strong><small>painel da loja</small></span></a><div className="admin-menu-label">menu principal</div><nav className="admin-menu"><a className="active" href="#visao-geral"><LayoutDashboard size={17} /> Visão geral</a><a href="#produtos"><Package size={17} /> Produtos <span>{items.length}</span></a><a href="#categorias"><Tags size={17} /> Categorias</a><a href="#pedidos"><ShoppingBag size={17} /> Pedidos <span>{orders.length}</span></a></nav><div className="admin-menu-label settings-label">configurações</div><nav className="admin-menu"><a href="#configuracoes"><Settings2 size={17} /> Preferências</a></nav><div className="admin-sidebar-bottom"><div className="admin-user-avatar">MV</div><div><strong>Meu Vício</strong><span>Administrador</span></div><button type="button" onClick={signOut} aria-label="Sair do painel" title="Sair do painel" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', border: 0, background: 'transparent', color: '#7d9288', cursor: 'pointer', padding: '6px 3px', font: 'inherit' }}><LogOut size={16} /><span style={{ marginTop: 0, color: 'currentColor', fontSize: 10, fontWeight: 800 }}>Sair</span></button></div></aside>
    <section className="admin-content"><header className="admin-topbar"><div><span className="admin-breadcrumb">Painel / Visão geral</span><h1>Bom dia, Meu Vício <span>✦</span></h1></div><div className="admin-top-actions"><button type="button" aria-label="Notificações indisponíveis" title="Notificações em breve" disabled><Bell size={19} /></button><a className="view-store" href="/" target="_blank" rel="noreferrer">Ver catálogo <ArrowLeft size={15} /></a></div></header><nav className="admin-mobile-nav" aria-label="Seções do painel"><a href="#visao-geral">Visão geral</a><a href="#produtos">Produtos</a><a href="#categorias">Categorias</a><a href="#pedidos">Pedidos</a><a href="#configuracoes">Preferências</a></nav>
      <div className="admin-main" id="visao-geral">{actionMessage && <div className="admin-action-message" role="status"><Check size={16} /> <span>{actionMessage}</span><button type="button" onClick={() => setActionMessage('')} aria-label="Fechar mensagem"><X size={16} /></button></div>}{importNotice && <div className="import-notice"><div><span className="notice-icon"><Check size={16} /></span><div><strong>Drive usado somente para a primeira carga</strong><p>Depois da importação, novos produtos, fotos e estoques serão atualizados diretamente neste painel.</p></div></div><button type="button" onClick={() => setImportNotice(false)} aria-label="Fechar aviso"><X size={17} /></button></div>}
        <div className="admin-stats"><div className="stat-card accent"><span className="stat-icon"><Package size={18} /></span><div><small>Produtos ativos</small><strong>{summary.activeProducts.toString().padStart(2, '0')}</strong><em>{items.length} cadastrados no total</em></div></div><div className="stat-card"><span className="stat-icon green"><ShoppingBag size={18} /></span><div><small>Pares em estoque</small><strong>{summary.stockTotal}</strong><em>somatório das quantidades</em></div></div><div className="stat-card"><span className="stat-icon sand"><Tags size={18} /></span><div><small>Categorias</small><strong>{summary.categoryCount.toString().padStart(2, '0')}</strong><em>{summary.categoryLabel}</em></div></div><div className="stat-card"><span className="stat-icon lilac"><ImagePlus size={18} /></span><div><small>Imagens cadastradas</small><strong>{summary.imageCount.toString().padStart(2, '0')}</strong><em>imagens vinculadas</em></div></div></div>
        <div className="admin-section-head" id="produtos"><div><span className="admin-kicker">catálogo</span><h2>Produtos cadastrados</h2></div><div className="admin-head-actions"><button type="button" className="import-button" onClick={() => setImportNotice(true)}><Upload size={16} /> Orientações da carga</button><button type="button" className="new-product-button" onClick={openNewProduct}><Plus size={17} /> Novo produto</button></div></div>
        <div className="admin-toolbar"><div className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome do produto" /></div><label className="status-filter"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'Todos' | 'Ativo' | 'Rascunho')}><option>Todos</option><option>Ativo</option><option>Rascunho</option></select><ChevronDown size={15} /></label></div>
        <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Estoque total</th><th>Tamanhos com estoque</th><th>Status</th><th></th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><div className="table-product"><button type="button" className="table-product-image-button" onClick={() => setPreviewImage({ src: item.image, name: item.name })} aria-label={`Visualizar foto de ${item.name}`}><img src={item.image} alt="" /></button><strong>{item.name}</strong></div></td><td>{item.category}</td><td className="table-price">{item.price}</td><td><strong>{item.stock}</strong> pares</td><td><div className="table-sizes">{item.sizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}{item.sizes.length > 5 && <span>+{item.sizes.length - 5}</span>}</div></td><td><span className={item.status === 'Ativo' ? 'status active' : 'status draft'}><i />{item.status}</span></td><td><div className="row-actions"><button className="row-menu" type="button" onClick={() => openEditProduct(item)} aria-label={`Editar ${item.name}`} title="Editar produto"><MoreHorizontal size={18} /></button><button className="row-menu" type="button" onClick={() => toggleProductStatus(item)} aria-label={`${item.status === 'Ativo' ? 'Colocar' : 'Ativar'} ${item.name} como ${item.status === 'Ativo' ? 'rascunho' : 'ativo'}`} title={item.status === 'Ativo' ? 'Colocar como rascunho' : 'Ativar produto'}>{item.status === 'Ativo' ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></td></tr>)}</tbody></table></div>
        <div className="admin-help-card"><div className="help-illustration"><ImagePlus size={27} /></div><div><span className="admin-kicker">próximo passo</span><h3>Cadastre os produtos da loja</h3><p>Use o botão de novo produto para adicionar fotos, categorias, preços e estoque separado por tamanho.</p></div><button type="button" className="secondary-admin-button" onClick={openNewProduct}>Cadastrar produto <Plus size={15} /></button></div>
        <section id="categorias" style={{ marginTop: 34, borderTop: '1px solid #e4ece8', paddingTop: 4 }}>
          <div className="admin-section-head"><div><span className="admin-kicker">organização</span><h2>Categorias</h2></div><span className="admin-breadcrumb">{categories.length} cadastradas</span></div>
          <form onSubmit={saveCategory} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12, marginTop: 4 }}><label style={{ display: 'grid', flex: '1 1 240px', gap: 7, color: '#72877d', fontSize: 10, fontWeight: 800 }}>Nova categoria<input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Ex.: Feminino, Masculino ou Infantil" style={{ width: '100%', border: '1px solid #dbe5e0', borderRadius: 8, outline: 0, background: '#fff', color: '#365548', padding: '11px 12px', fontSize: 12 }} /></label><button type="submit" className="new-product-button" disabled={categorySaving} style={{ minHeight: 38 }}>{categorySaving ? 'Salvando...' : 'Adicionar categoria'} <Plus size={16} /></button></form>
          {categoryError && <small className="auth-error">{categoryError}</small>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 17 }}>{categories.map((category) => <span key={category.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid #d8e8df', borderRadius: 999, background: '#f4faf7', color: '#47715d', padding: '8px 12px', fontSize: 11, fontWeight: 800 }}><Tags size={14} />{category.name}</span>)}</div>
        </section>
        <section id="pedidos">
          <div className="admin-section-head"><div><span className="admin-kicker">acompanhamento</span><h2>Pedidos enviados</h2></div><span className="admin-breadcrumb">{orders.length} registrados</span></div>
          <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Pedido</th><th>Itens escolhidos</th><th>WhatsApp</th><th>Total</th><th>Data</th><th>Status</th></tr></thead><tbody>{ordersLoading ? <tr><td colSpan={6}>Carregando pedidos...</td></tr> : orders.length ? orders.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td>{order.items.map((item) => `${item.productName} • ${item.size} • ${item.quantity}x`).join(' | ')}</td><td>{order.whatsappNumber ? `(${order.whatsappNumber.slice(2, 4)}) ${order.whatsappNumber.slice(4, 9)}-${order.whatsappNumber.slice(9)}` : 'Não informado'}</td><td className="table-price">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><select className="order-status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} aria-label={`Status do pedido ${order.id.slice(0, 8)}`}><option>Novo</option><option>Em contato</option><option>Confirmado</option><option>Concluído</option><option>Cancelado</option></select></td></tr>) : <tr><td colSpan={6}>Ainda não há pedidos registrados. Eles aparecerão aqui quando alguém enviar uma sacola pelo WhatsApp.</td></tr>}</tbody></table></div>
        </section>
        <section id="configuracoes" className="admin-settings-section">
          <div className="admin-section-head"><div><span className="admin-kicker">configurações</span><h2>Preferências do catálogo</h2></div><span className="admin-breadcrumb">estrutura atual</span></div>
          <div className="admin-settings-grid"><div className="admin-settings-card"><span>Atendimento via WhatsApp</span><strong>2 números configurados</strong><small>O cliente escolhe o canal antes de enviar a sacola.</small></div><div className="admin-settings-card"><span>Estoque</span><strong>Controlado por tamanho</strong><small>Os pares cadastrados no painel alimentam os filtros do catálogo.</small></div><div className="admin-settings-card"><span>Imagens</span><strong>Armazenadas no sistema</strong><small>O Drive foi usado apenas como apoio na carga inicial.</small></div></div>
        </section>
      </div></section>
    {previewImage && <div className="admin-image-preview-backdrop" role="presentation" onClick={() => setPreviewImage(null)}><div className="admin-image-preview" role="dialog" aria-modal="true" aria-labelledby="image-preview-title" onClick={(event) => event.stopPropagation()}><div className="admin-form-header"><div><span className="admin-kicker">visualização</span><h2 id="image-preview-title">{previewImage.name}</h2></div><button type="button" onClick={() => setPreviewImage(null)} aria-label="Fechar visualização"><X size={19} /></button></div><div className="admin-image-preview-frame"><img src={previewImage.src} alt={`Foto de ${previewImage.name}`} /></div></div></div>}
    {showForm && <div className="admin-modal-backdrop" role="presentation" onClick={() => { setShowForm(false); resetProductForm(); }}><div className="admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onClick={(event) => event.stopPropagation()}><div className="admin-form-header"><div><span className="admin-kicker">{editingProductId ? 'edição de produto' : 'novo cadastro'}</span><h2 id="admin-form-title">{editingProductId ? 'Editar produto' : 'Adicionar produto'}</h2></div><button type="button" onClick={() => { setShowForm(false); resetProductForm(); }} aria-label="Fechar"><X size={19} /></button></div><div className="admin-form-body"><label>Nome do produto<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Havaianas Brasil Logo Branco" /></label><div className="admin-form-grid"><label>Categoria<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><label>Preço<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="39,90" /></label></div><label className="admin-inline-field">Status<select value={form.isActive ? 'Ativo' : 'Rascunho'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'Ativo' })}><option>Ativo</option><option>Rascunho</option></select></label><label>Descrição<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva o produto brevemente" rows={3} /></label><label className="upload-field"><span>Imagem principal</span><div className={form.image !== '/products/havaianas-branco.png' ? 'upload-preview' : undefined}>{form.image !== '/products/havaianas-branco.png' ? <><img src={form.image} alt="Prévia do produto" /><strong>Clique para trocar a foto</strong></> : <><ImagePlus size={18} /><strong>Selecione uma foto do produto</strong><small>PNG ou JPG • imagem quadrada recomendada</small></>}<input type="file" accept="image/png,image/jpeg" onChange={handleImage} /></div></label><fieldset><legend>Estoque por tamanho (pares)</legend><div className="admin-size-grid">{adminSizes.map((option) => <label key={option.label} className={form.sizes.includes(option.label) ? 'admin-size selected' : 'admin-size'}><input type="checkbox" checked={form.sizes.includes(option.label)} onChange={() => toggleSize(option.label)} /><span>{option.label}</span>{form.sizes.includes(option.label) && <input className="size-quantity-input" type="number" min="0" value={form.quantities[option.label] ?? 0} onChange={(event) => setSizeQuantity(option.label, event.target.value)} aria-label={`Quantidade para ${option.label}`} />}</label>)}</div></fieldset></div><div className="admin-form-footer"><button type="button" className="cancel-button" onClick={() => { setShowForm(false); resetProductForm(); }}>Cancelar</button><button type="button" className="new-product-button" onClick={saveProduct}>{editingProductId ? 'Atualizar produto' : 'Salvar produto'} <Check size={16} /></button></div></div></div>}
  </main>;
}
