'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, BarChart3, Bell, Check, ChevronDown, Eye, EyeOff, Heart, ImagePlus, LayoutDashboard, LogOut, MoreHorizontal, Package, Pencil, Plus, Search, Settings2, ShoppingBag, Tags, Trash2, Upload, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { DEFAULT_IMAGE_ADJUST, parseImageUrl, serializeImageUrl, type ImageAdjust } from '@/lib/image-adjust';

type SizeOption = { label: string; values: number[] };
type AdminProduct = { id: string; name: string; category: string; color?: string; tag?: string; price: string; stock: number; status: 'Ativo' | 'Rascunho'; sizes: string[]; sizeQuantities?: Record<string, number>; description?: string; image: string; imageAdjust?: ImageAdjust; createdAt?: string };
type AdminCategory = { id: string; name: string };
type AdminOrder = { id: string; total: number; status: string; stockDeducted: boolean; whatsappNumber: string | null; customerName: string | null; notes: string | null; createdAt: string; items: { productName: string; color: string; size: string; quantity: number }[] };
type StockMovement = { id: string; productName: string; size: string; previousQuantity: number; newQuantity: number; reason: string; createdAt: string };
type AdminSettings = { storeName: string; hours: string; whatsappPrimary: string; whatsappPrimaryLabel: string; whatsappSecondary: string; whatsappSecondaryLabel: string; whatsappMessage: string };
type AdminProfile = { fullName: string };
type LoyaltyPurchase = { id: string; purchaseDate: string };
type LoyaltyCard = { id: string; customerName: string; customerPhone: string; purchases: LoyaltyPurchase[] };
const defaultSettings: AdminSettings = { storeName: 'Meu Vício', hours: 'Segunda a sábado • 9h às 18h', whatsappPrimary: '5531994483976', whatsappPrimaryLabel: 'Atendimento principal', whatsappSecondary: '5531999999999', whatsappSecondaryLabel: 'Número de demonstração', whatsappMessage: 'Olá! Vim pelo catálogo Meu Vício e gostaria de fazer um pedido.' };

function imageAdjustStyle(adjust?: ImageAdjust) {
  const current = adjust || DEFAULT_IMAGE_ADJUST;
  return { transform: `translate(${current.x}%, ${current.y}%) scale(${current.zoom})` };
}
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
const adminAdultSizeOptions = adminSizes.filter((option) => option.values[0] >= 33);
const adminInfantSizeOptions = adminSizes.filter((option) => option.values[0] <= 32);
function defaultOptionsForCategory(category: string) {
  if (category === 'Adulto') return adminAdultSizeOptions;
  if (category === 'Infantil') return adminInfantSizeOptions;
  return adminSizes;
}
function parseCategorySizeDraft(value: string): SizeOption[] {
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({
      label,
      values: label
        .split('/')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0),
    }))
    .filter((option) => option.values.length > 0);
}
function formatCategorySizeOptions(options: SizeOption[]) {
  return options.map((option) => option.label).join(', ');
}

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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [categoryActionId, setCategoryActionId] = useState<string | null>(null);
  const [categorySizeOptions, setCategorySizeOptions] = useState<Record<string, SizeOption[]>>({ Adulto: adminAdultSizeOptions, Infantil: adminInfantSizeOptions });
  const [categorySizeDrafts, setCategorySizeDrafts] = useState<Record<string, string>>({});
  const [categorySizeSaving, setCategorySizeSaving] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [stockHistoryLoading, setStockHistoryLoading] = useState(false);
  const [loyaltyCards, setLoyaltyCards] = useState<LoyaltyCard[]>([]);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltySaving, setLoyaltySaving] = useState(false);
  const [loyaltyForm, setLoyaltyForm] = useState({ customerName: '', customerPhone: '' });
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [showAllLoyaltyCards, setShowAllLoyaltyCards] = useState(false);
  const [purchaseDates, setPurchaseDates] = useState<Record<string, string>>({});
  const [previewImage, setPreviewImage] = useState<{ src: string; name: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativo' | 'Rascunho'>('Todos');
  const [indicatorFilter, setIndicatorFilter] = useState<'Todos' | 'Finalizados'>('Finalizados');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [profile, setProfile] = useState<AdminProfile>({ fullName: '' });
  const [profilePassword, setProfilePassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Adulto', color: '', tag: '', price: '', description: '', isActive: true, sizes: [] as string[], quantities: {} as Record<string, number>, image: '/products/havaianas-branco.png', imageAdjust: DEFAULT_IMAGE_ADJUST });
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
    async function loadCatalog() {
      const [{ data: categoryRows }, { data: categorySizeRows }, { data: productRows }] = await Promise.all([
        supabase.from('categories').select('id,name').order('name', { ascending: true }),
        supabase.from('category_sizes').select('category_id,size_label,size_values,sort_order').order('sort_order', { ascending: true }),
        supabase.from('products').select('id,name,category,color,tag,price,description,is_active,image_url,created_at,product_sizes(size,quantity)').order('created_at', { ascending: false }),
      ]);
      if (!mounted) return;
      const nextCategories = (categoryRows || []) as AdminCategory[];
      if (nextCategories.length) setCategories(nextCategories);
      const categoryNamesById = new Map(nextCategories.map((category) => [category.id, category.name]));
      const customOptions: Record<string, SizeOption[]> = {};
      (categorySizeRows || []).forEach((row: { category_id: string; size_label: string; size_values: number[] }) => {
        const categoryName = categoryNamesById.get(row.category_id);
        const values = Array.isArray(row.size_values) ? row.size_values.map(Number).filter((value) => Number.isFinite(value) && value > 0) : [];
        if (!categoryName || !row.size_label || !values.length) return;
        (customOptions[categoryName] ||= []).push({ label: row.size_label, values });
      });
      const nextCategorySizeOptions: Record<string, SizeOption[]> = {};
      nextCategories.forEach((category) => {
        nextCategorySizeOptions[category.name] = customOptions[category.name] || defaultOptionsForCategory(category.name);
      });
      setCategorySizeOptions(nextCategorySizeOptions);
      setCategorySizeDrafts(Object.fromEntries(nextCategories.map((category) => [category.id, formatCategorySizeOptions(nextCategorySizeOptions[category.name] || defaultOptionsForCategory(category.name))])));
      if (!productRows?.length) return;
      setItems(productRows.map((row) => {
        const categoryName = String(row.category || 'Adulto');
        const options = nextCategorySizeOptions[categoryName] || defaultOptionsForCategory(categoryName);
        const sizeQuantities = Object.fromEntries((row.product_sizes || []).map((item: { size: number; quantity: number }) => {
          const option = options.find((candidate) => candidate.values.includes(item.size));
          return [option?.label || String(item.size), item.quantity];
        }));
        const image = parseImageUrl(row.image_url);
        return { id: row.id, name: row.name, category: categoryName, color: row.color || '', tag: row.tag || '', price: Number(row.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: Object.values(sizeQuantities).reduce((total, quantity) => total + Number(quantity), 0), status: row.is_active ? 'Ativo' : 'Rascunho', sizes: Object.keys(sizeQuantities).filter((label) => Number(sizeQuantities[label]) > 0), sizeQuantities, description: row.description || '', image: image.src, imageAdjust: image.adjust, createdAt: row.created_at || '' };
      }));
    }
    async function loadOrders() {
      setOrdersLoading(true);
      const { data } = await supabase.from('orders').select('id,total,status,stock_deducted,whatsapp_number,customer_name,notes,created_at,order_items(product_id,product_name,selected_size,quantity)').order('created_at', { ascending: false });
      let productRows: { id: string; color: string | null }[] = [];
      const productIds = Array.from(new Set((data || []).flatMap((row) => (row.order_items || []).map((item: { product_id: string | null }) => item.product_id).filter((id): id is string => Boolean(id)))));
      if (productIds.length) {
        const { data: rows } = await supabase.from('products').select('id,color').in('id', productIds);
        productRows = (rows || []) as { id: string; color: string | null }[];
      }
      const colorByProductId = new Map(productRows.map((row) => [row.id, row.color || '']));
      if (mounted && data) setOrders(data.map((row) => ({ id: row.id, total: Number(row.total), status: row.status, stockDeducted: Boolean(row.stock_deducted), whatsappNumber: row.whatsapp_number, customerName: row.customer_name || null, notes: row.notes || null, createdAt: row.created_at, items: (row.order_items || []).map((item: { product_id: string | null; product_name: string; selected_size: string; quantity: number }) => ({ productName: item.product_name, color: item.product_id ? colorByProductId.get(item.product_id) || '' : '', size: item.selected_size, quantity: item.quantity })) })));
      if (mounted) setOrdersLoading(false);
    }
    async function loadStockMovements() {
      setStockHistoryLoading(true);
      const { data } = await supabase.from('stock_movements').select('id,product_name,size_label,previous_quantity,new_quantity,reason,created_at').order('created_at', { ascending: false }).limit(30);
      if (mounted && data) setStockMovements(data.map((row) => ({ id: row.id, productName: row.product_name, size: row.size_label, previousQuantity: Number(row.previous_quantity), newQuantity: Number(row.new_quantity), reason: row.reason, createdAt: row.created_at })));
      if (mounted) setStockHistoryLoading(false);
    }
    async function loadLoyaltyCards() {
      setLoyaltyLoading(true);
      const { data } = await supabase.from('loyalty_cards').select('id,customer_name,customer_phone,created_at,loyalty_purchases(id,purchase_date)').order('created_at', { ascending: false });
      if (mounted && data) setLoyaltyCards(data.map((row) => ({ id: row.id, customerName: row.customer_name, customerPhone: row.customer_phone || '', purchases: (row.loyalty_purchases || []).map((purchase: { id: string; purchase_date: string }) => ({ id: purchase.id, purchaseDate: purchase.purchase_date })).sort((a: LoyaltyPurchase, b: LoyaltyPurchase) => a.purchaseDate.localeCompare(b.purchaseDate)) })));
      if (mounted) setLoyaltyLoading(false);
    }
    async function loadSettings() {
      const { data } = await supabase.from('store_settings').select('store_name,hours,whatsapp_primary,whatsapp_primary_label,whatsapp_secondary,whatsapp_secondary_label,whatsapp_message').eq('id', 'default').maybeSingle();
      if (mounted && data) setSettings({ storeName: data.store_name, hours: data.hours, whatsappPrimary: data.whatsapp_primary, whatsappPrimaryLabel: data.whatsapp_primary_label || 'Atendimento principal', whatsappSecondary: data.whatsapp_secondary, whatsappSecondaryLabel: data.whatsapp_secondary_label, whatsappMessage: data.whatsapp_message });
    }
    async function loadProfile() {
      const { data } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).maybeSingle();
      if (!mounted) return;
      const fallbackName = session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Administrador';
      setProfile({ fullName: data?.full_name || fallbackName });
    }
    loadCatalog();
    loadOrders();
    loadStockMovements();
    loadLoyaltyCards();
    loadSettings();
    loadProfile();
    return () => { mounted = false; };
  }, [session]);
  const visibleItems = useMemo(() => {
    const categoryOrder = new Map(categories.map((category, index) => [category.name.toLocaleLowerCase(), index]));
    return items
      .filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) && (statusFilter === 'Todos' || item.status === statusFilter))
      .sort((first, second) => {
        const categoryDifference = (categoryOrder.get(first.category.toLocaleLowerCase()) ?? Number.MAX_SAFE_INTEGER) - (categoryOrder.get(second.category.toLocaleLowerCase()) ?? Number.MAX_SAFE_INTEGER);
        return categoryDifference || (second.createdAt || '').localeCompare(first.createdAt || '');
      });
  }, [items, search, statusFilter, categories]);
  const visibleOrders = useMemo(() => { const term = orderSearch.trim().toLowerCase(); if (!term) return orders; return orders.filter((order) => `${order.id} ${order.whatsappNumber || ''} ${order.customerName || ''} ${order.notes || ''} ${order.items.map((item) => `${item.productName} ${item.color} ${item.size}`).join(' ')}`.toLowerCase().includes(term)); }, [orders, orderSearch]);
  const indicatorOrderCount = indicatorFilter === 'Finalizados' ? orders.filter((order) => order.status === 'Concluído').length : orders.length;
  const visibleLoyaltyCards = useMemo(() => { const term = loyaltySearch.trim().toLowerCase(); if (!term) return loyaltyCards; return loyaltyCards.filter((card) => `${card.customerName} ${card.customerPhone}`.toLowerCase().includes(term)); }, [loyaltyCards, loyaltySearch]);
  const displayedLoyaltyCards = useMemo(() => showAllLoyaltyCards || loyaltySearch.trim() ? visibleLoyaltyCards : visibleLoyaltyCards.slice(0, 2), [loyaltySearch, showAllLoyaltyCards, visibleLoyaltyCards]);
  const hiddenLoyaltyCardCount = Math.max(0, visibleLoyaltyCards.length - 2);
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
  function handleImage(event: ChangeEvent<HTMLInputElement>) { const file = event.target.files?.[0]; if (!file) return; const previewUrl = URL.createObjectURL(file); setImageFile(file); setForm((current) => ({ ...current, image: previewUrl, imageAdjust: DEFAULT_IMAGE_ADJUST })); }
  function parsePrice(value: string) { const normalized = value.replace(/[^\d,.-]/g, ''); return Number(normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized) || 0; }
  function toggleSize(size: string) { setForm((current) => { const selected = current.sizes.includes(size); const quantities = { ...current.quantities }; if (selected) delete quantities[size]; else quantities[size] = 1; return { ...current, sizes: selected ? current.sizes.filter((item) => item !== size) : [...current.sizes, size], quantities }; }); }
  function setSizeQuantity(size: string, quantity: string) { setForm((current) => ({ ...current, quantities: { ...current.quantities, [size]: Math.max(0, Number(quantity) || 0) } })); }
  function resetProductForm() { setEditingProductId(null); setImageFile(null); setForm({ name: '', category: categories[0]?.name || 'Adulto', color: '', tag: '', price: '', description: '', isActive: true, sizes: [], quantities: {}, image: '/products/havaianas-branco.png', imageAdjust: DEFAULT_IMAGE_ADJUST }); }
  function openNewProduct() { setActionMessage(''); resetProductForm(); setShowForm(true); }
  function openEditProduct(item: AdminProduct) { setActionMessage(''); setEditingProductId(item.id); setImageFile(null); setForm({ name: item.name, category: item.category, color: item.color || '', tag: item.tag || '', price: item.price.replace('R$', '').trim(), description: item.description || '', isActive: item.status === 'Ativo', sizes: item.sizes, quantities: item.sizeQuantities || Object.fromEntries(item.sizes.map((size) => [size, 1])), image: item.image, imageAdjust: item.imageAdjust || DEFAULT_IMAGE_ADJUST }); setShowForm(true); }
  async function moveProduct(item: AdminProduct, direction: -1 | 1) {
    const categoryItems = items
      .filter((current) => current.category === item.category)
      .sort((first, second) => (second.createdAt || '').localeCompare(first.createdAt || ''));
    const currentIndex = categoryItems.findIndex((current) => current.id === item.id);
    const target = categoryItems[currentIndex + direction];
    if (!target) return;
    if (supabase && session && (!item.createdAt || !target.createdAt)) {
      setActionMessage('Não foi possível alterar a ordem deste produto.');
      return;
    }
    if (supabase && session && !item.id.startsWith('demo-') && !target.id.startsWith('demo-')) {
      const [itemResult, targetResult] = await Promise.all([
        supabase.from('products').update({ created_at: target.createdAt }).eq('id', item.id),
        supabase.from('products').update({ created_at: item.createdAt }).eq('id', target.id),
      ]);
      if (itemResult.error || targetResult.error) {
        setActionMessage('Não foi possível salvar a nova ordem dos produtos.');
        return;
      }
    }
    setItems((current) => current.map((product) => product.id === item.id ? { ...product, createdAt: target.createdAt } : product.id === target.id ? { ...product, createdAt: item.createdAt } : product));
    setActionMessage(`${item.name} foi movido ${direction < 0 ? 'para cima' : 'para baixo'} na categoria ${item.category}.`);
  }
  function canMoveProduct(item: AdminProduct, direction: -1 | 1) {
    const categoryItems = items
      .filter((current) => current.category === item.category)
      .sort((first, second) => (second.createdAt || '').localeCompare(first.createdAt || ''));
    const currentIndex = categoryItems.findIndex((current) => current.id === item.id);
    return Boolean(categoryItems[currentIndex + direction]);
  }
  function setImageAdjust(field: keyof ImageAdjust, value: string) { setForm((current) => ({ ...current, imageAdjust: { ...current.imageAdjust, [field]: Number(value) } })); }
  function resetImageAdjust() { setForm((current) => ({ ...current, imageAdjust: DEFAULT_IMAGE_ADJUST })); }
  async function logStockChanges(productId: string, productName: string, previousQuantities: Record<string, number>, nextQuantities: Record<string, number>, reason: string) {
    if (!supabase || !session || productId.startsWith('demo-')) return;
    const labels = new Set([...Object.keys(previousQuantities), ...Object.keys(nextQuantities)]);
    const changes = Array.from(labels).map((size) => ({ product_id: productId, product_name: productName, size_label: size, previous_quantity: Number(previousQuantities[size] || 0), new_quantity: Number(nextQuantities[size] || 0), reason, changed_by: session.user.id })).filter((change) => change.previous_quantity !== change.new_quantity);
    if (!changes.length) return;
    const { data, error } = await supabase.from('stock_movements').insert(changes).select('id,product_name,size_label,previous_quantity,new_quantity,reason,created_at');
    if (error) { setActionMessage('Produto salvo, mas o histórico do estoque não foi registrado.'); return; }
    if (data) setStockMovements((current) => [...data.map((row) => ({ id: row.id, productName: row.product_name, size: row.size_label, previousQuantity: Number(row.previous_quantity), newQuantity: Number(row.new_quantity), reason: row.reason, createdAt: row.created_at })), ...current].slice(0, 30));
  }
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
  function startCategoryEdit(category: AdminCategory) {
    if (category.id === 'adulto' || category.id === 'infantil') {
      setCategoryError('As categorias Adulto e Infantil são padrão e não podem ser renomeadas.');
      return;
    }
    setCategoryError('');
    setEditingCategoryId(category.id);
    setEditingCategoryName(category.name);
  }
  function cancelCategoryEdit() {
    setEditingCategoryId(null);
    setEditingCategoryName('');
  }
  async function updateCategory(event: FormEvent, category: AdminCategory) {
    event.preventDefault();
    const nextName = editingCategoryName.trim();
    if (!nextName) {
      setCategoryError('Informe um nome para a categoria.');
      return;
    }
    if (categories.some((item) => item.id !== category.id && item.name.toLowerCase() === nextName.toLowerCase())) {
      setCategoryError('Essa categoria já está cadastrada.');
      return;
    }
    setCategoryActionId(category.id);
    setCategoryError('');
    if (supabase && session) {
      const productsResult = await supabase.from('products').update({ category: nextName }).eq('category', category.name);
      if (productsResult.error) {
        setCategoryError('Não foi possível atualizar os produtos desta categoria.');
        setCategoryActionId(null);
        return;
      }
      const categoryResult = await supabase.from('categories').update({ name: nextName }).eq('id', category.id);
      if (categoryResult.error) {
        await supabase.from('products').update({ category: category.name }).eq('category', nextName);
        setCategoryError('Não foi possível atualizar a categoria.');
        setCategoryActionId(null);
        return;
      }
    }
    setCategories((current) => current.map((item) => item.id === category.id ? { ...item, name: nextName } : item));
    setItems((current) => current.map((item) => item.category === category.name ? { ...item, category: nextName } : item));
    setCategorySizeOptions((current) => {
      const next = { ...current };
      if (next[category.name]) {
        next[nextName] = next[category.name];
        delete next[category.name];
      }
      return next;
    });
    setForm((current) => current.category === category.name ? { ...current, category: nextName } : current);
    setCategorySizeDrafts((current) => ({ ...current, [category.id]: current[category.id] || formatCategorySizeOptions(getOptionsForCategory(category.name)) }));
    cancelCategoryEdit();
    setCategoryActionId(null);
    setActionMessage(`Categoria ${nextName} atualizada com sucesso.`);
  }
  async function deleteCategory(category: AdminCategory) {
    if (category.id === 'adulto' || category.id === 'infantil') {
      setCategoryError('As categorias Adulto e Infantil são padrão e não podem ser excluídas.');
      return;
    }
    if (!window.confirm(`Excluir a categoria “${category.name}”?`)) return;
    setCategoryActionId(category.id);
    setCategoryError('');
    if (supabase && session) {
      const { count, error: productsError } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('category', category.name);
      if (productsError) {
        setCategoryError('Não foi possível verificar os produtos desta categoria.');
        setCategoryActionId(null);
        return;
      }
      if ((count || 0) > 0) {
        setCategoryError(`Não é possível excluir ${category.name} porque existem ${count} produto(s) vinculados. Edite esses produtos primeiro.`);
        setCategoryActionId(null);
        return;
      }
      const sizesResult = await supabase.from('category_sizes').delete().eq('category_id', category.id);
      if (sizesResult.error) {
        setCategoryError('Não foi possível remover as numerações vinculadas.');
        setCategoryActionId(null);
        return;
      }
      const categoryResult = await supabase.from('categories').delete().eq('id', category.id);
      if (categoryResult.error) {
        setCategoryError('Não foi possível excluir a categoria.');
        setCategoryActionId(null);
        return;
      }
    }
    setCategories((current) => current.filter((item) => item.id !== category.id));
    setCategorySizeOptions((current) => {
      const next = { ...current };
      delete next[category.name];
      return next;
    });
    setCategorySizeDrafts((current) => {
      const next = { ...current };
      delete next[category.id];
      return next;
    });
    setCategoryActionId(null);
    setActionMessage(`Categoria ${category.name} excluída com sucesso.`);
  }
  function getOptionsForCategory(category: string) {
    return categorySizeOptions[category] || defaultOptionsForCategory(category);
  }
  async function saveCategorySizes(event: FormEvent, category: AdminCategory) {
    event.preventDefault();
    const options = parseCategorySizeDraft(categorySizeDrafts[category.id] || '');
    if (!options.length) {
      setCategoryError(`Informe pelo menos um tamanho para ${category.name}.`);
      return;
    }
    setCategorySizeSaving(category.id);
    setCategoryError('');
    if (supabase && session) {
      const removeResult = await supabase.from('category_sizes').delete().eq('category_id', category.id);
      if (removeResult.error) {
        setCategoryError('Não foi possível atualizar os tamanhos desta categoria.');
        setCategorySizeSaving(null);
        return;
      }
      const insertResult = await supabase.from('category_sizes').insert(options.map((option, index) => ({ category_id: category.id, size_label: option.label, size_values: option.values, sort_order: index })));
      if (insertResult.error) {
        setCategoryError('Não foi possível salvar os tamanhos. Confira a estrutura do Supabase.');
        setCategorySizeSaving(null);
        return;
      }
    }
    setCategorySizeOptions((current) => ({ ...current, [category.name]: options }));
    setCategorySizeDrafts((current) => ({ ...current, [category.id]: formatCategorySizeOptions(options) }));
    setCategorySizeSaving(null);
    setActionMessage(`Tamanhos da categoria ${category.name} atualizados com sucesso.`);
  }
  async function saveProduct() {
    if (!form.name.trim() || !form.price.trim()) { setActionMessage('Preencha o nome e o preço do produto.'); return; }
    const previousItem = editingProductId ? items.find((item) => item.id === editingProductId) : undefined;
    const numericPrice = parsePrice(form.price);
    let imageUrl: string | null = form.image.startsWith('blob:') ? null : form.image;
    if (imageFile && supabase && session) {
      const path = `${crypto.randomUUID()}-${imageFile.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-')}`;
      const upload = await supabase.storage.from('product-images').upload(path, imageFile, { contentType: imageFile.type, upsert: false });
      if (upload.error) { setActionMessage('Não foi possível enviar a imagem. Confira o bucket de imagens no Supabase.'); return; }
      imageUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
    }
    const imageValue = imageUrl ? serializeImageUrl(imageUrl, form.imageAdjust) : form.image;
    const productSizeOptions = getOptionsForCategory(form.category);
    const sizeRows = form.sizes.map((label) => ({ size: productSizeOptions.find((option) => option.label === label)?.values[0] ?? 0, quantity: Math.max(0, Number(form.quantities[label] ?? 1)) }));
    if (supabase && session && editingProductId && !editingProductId.startsWith('demo-')) {
      const update = await supabase.from('products').update({ name: form.name.trim(), category: form.category, color: form.color.trim(), tag: form.tag || null, price: numericPrice, description: form.description.trim(), image_url: imageValue, is_active: form.isActive }).eq('id', editingProductId);
      if (update.error) { setActionMessage('Não foi possível atualizar o produto.'); return; }
      const sizes = sizeRows.map((row) => ({ ...row, product_id: editingProductId }));
      const sizesResult = sizes.length ? await supabase.from('product_sizes').upsert(sizes, { onConflict: 'product_id,size' }) : null;
      if (sizesResult?.error) { setActionMessage('Produto atualizado, mas não foi possível salvar os tamanhos.'); return; }
      const selectedValues = sizeRows.map((row) => row.size);
      const removeResult = selectedValues.length ? await supabase.from('product_sizes').delete().eq('product_id', editingProductId).not('size', 'in', `(${selectedValues.join(',')})`) : await supabase.from('product_sizes').delete().eq('product_id', editingProductId);
      if (removeResult.error) { setActionMessage('Produto atualizado, mas alguns tamanhos antigos permaneceram.'); return; }
      const nextItem = { id: editingProductId, name: form.name.trim(), category: form.category, color: form.color.trim(), tag: form.tag, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes.filter((label) => (form.quantities[label] ?? 0) > 0), sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || '/products/havaianas-branco.png', imageAdjust: form.imageAdjust, createdAt: previousItem?.createdAt || '' };
      await logStockChanges(editingProductId, form.name.trim(), previousItem?.sizeQuantities || {}, nextItem.sizeQuantities, 'Ajuste manual');
      setItems((current) => current.map((item) => item.id === editingProductId ? nextItem : item));
    } else if (supabase && session) {
      const inserted = await supabase.from('products').insert({ name: form.name.trim(), category: form.category, color: form.color.trim(), tag: form.tag || null, price: numericPrice, description: form.description.trim(), image_url: imageValue, is_active: form.isActive }).select('id,created_at').single();
      if (inserted.error || !inserted.data) { setActionMessage('Não foi possível salvar o produto.'); return; }
      const sizes = sizeRows.map((row) => ({ ...row, product_id: inserted.data.id }));
      if (sizes.length) { const sizeResult = await supabase.from('product_sizes').insert(sizes); if (sizeResult.error) { setActionMessage('Produto salvo, mas não foi possível salvar os tamanhos.'); return; } }
      await logStockChanges(inserted.data.id, form.name.trim(), {}, Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), 'Cadastro inicial');
      setItems((current) => [{ id: inserted.data.id, name: form.name.trim(), category: form.category, color: form.color.trim(), tag: form.tag, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes.filter((label) => (form.quantities[label] ?? 0) > 0), sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || '/products/havaianas-branco.png', imageAdjust: form.imageAdjust, createdAt: inserted.data.created_at || '' }, ...current]);
    } else {
      const localId = editingProductId || String(Date.now());
      const nextItem = { id: localId, name: form.name.trim(), category: form.category, color: form.color.trim(), tag: form.tag, price: numericPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), stock: sizeRows.reduce((total, row) => total + row.quantity, 0), status: form.isActive ? 'Ativo' as const : 'Rascunho' as const, sizes: form.sizes, sizeQuantities: Object.fromEntries(form.sizes.map((label) => [label, form.quantities[label] ?? 0])), description: form.description.trim(), image: imageUrl || form.image, imageAdjust: form.imageAdjust };
      setItems((current) => editingProductId ? current.map((item) => item.id === editingProductId ? nextItem : item) : [nextItem, ...current]);
    }
    setActionMessage(editingProductId ? 'Produto atualizado com sucesso.' : 'Produto cadastrado com sucesso.');
    resetProductForm();
    setShowForm(false);
  }
  async function updateOrderStatus(id: string, status: string) {
    if (!supabase || !session) return;
    const currentOrder = orders.find((order) => order.id === id);
    const shouldDeductStock = status === 'Confirmado' && currentOrder?.status !== 'Confirmado' && !currentOrder?.stockDeducted;
    if (shouldDeductStock) {
      setActionMessage('Confirmando pedido e ajustando o estoque...');
      const { data: orderItems, error: itemsError } = await supabase.from('order_items').select('product_id,selected_size,quantity').eq('order_id', id);
      if (itemsError) { setActionMessage('Não foi possível carregar os itens do pedido.'); return; }
      const { error: deductionError } = await supabase.rpc('confirm_order_and_deduct_stock', { p_order_id: id });
      if (deductionError) {
        const message = deductionError.message.includes('INSUFFICIENT_STOCK') ? 'Estoque insuficiente para confirmar este pedido.' : deductionError.message.includes('STOCK_NOT_REGISTERED') ? 'Um dos tamanhos do pedido não está cadastrado no estoque.' : 'Não foi possível confirmar o pedido e ajustar o estoque.';
        setActionMessage(message);
        return;
      }
      setItems((current) => current.map((product) => {
        const productItems = (orderItems || []).filter((item: { product_id: string | null }) => item.product_id === product.id);
        if (!productItems.length) return product;
        const nextQuantities = { ...(product.sizeQuantities || {}) };
        productItems.forEach((item: { selected_size: string; quantity: number }) => { nextQuantities[item.selected_size] = Math.max(0, (nextQuantities[item.selected_size] || 0) - Number(item.quantity)); });
        return { ...product, sizeQuantities: nextQuantities, stock: Object.values(nextQuantities).reduce((total, quantity) => total + Number(quantity), 0), sizes: Object.keys(nextQuantities).filter((size) => Number(nextQuantities[size]) > 0) };
      }));
    } else {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) { setActionMessage('Não foi possível atualizar o status do pedido.'); return; }
    }
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status, stockDeducted: order.stockDeducted || shouldDeductStock } : order));
    setActionMessage(shouldDeductStock ? 'Pedido confirmado e estoque atualizado.' : 'Status do pedido atualizado.');
  }
  async function deleteOrder(order: AdminOrder) {
    if (!supabase || !session) return;
    const confirmed = window.confirm(`Excluir o pedido #${order.id.slice(0, 8).toUpperCase()}? Essa ação remove o registro e os itens vinculados. Se o pedido já foi confirmado, o estoque não será devolvido automaticamente.`);
    if (!confirmed) return;
    setActionMessage('Excluindo pedido...');
    const itemsResult = await supabase.from('order_items').delete().eq('order_id', order.id);
    if (itemsResult.error) { setActionMessage('Não foi possível excluir os itens vinculados ao pedido.'); return; }
    const orderResult = await supabase.from('orders').delete().eq('id', order.id);
    if (orderResult.error) { setActionMessage('Não foi possível excluir o pedido.'); return; }
    setOrders((current) => current.filter((item) => item.id !== order.id));
    setActionMessage('Pedido excluído com sucesso.');
  }
  function exportOrders() {
    const escapeCell = (value: string | number | null) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = visibleOrders.map((order) => [order.id, order.customerName || '', order.whatsappNumber || '', order.items.map((item) => `${item.productName} • ${item.size} • ${item.quantity}x`).join(' | '), order.notes || '', order.total.toFixed(2).replace('.', ','), new Date(order.createdAt).toLocaleString('pt-BR'), order.status]);
    const csv = [['Pedido', 'Cliente', 'WhatsApp', 'Itens', 'Observações', 'Total', 'Data', 'Status'], ...rows].map((row) => row.map(escapeCell).join(';')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }));
    link.download = `pedidos-meu-vicio-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    setActionMessage(`${visibleOrders.length} pedido(s) exportado(s) para Excel.`);
  }
  function exportCatalogBackup() {
    const backup = {
      exportedAt: new Date().toISOString(),
      store: settings,
      categories,
      products: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        color: item.color || null,
        tag: item.tag || null,
        price: item.price,
        stock: item.stock,
        status: item.status,
        sizes: item.sizes,
        sizeQuantities: item.sizeQuantities || {},
        description: item.description || '',
        image: item.image,
        imageAdjust: item.imageAdjust || DEFAULT_IMAGE_ADJUST,
      })),
      orders,
      loyaltyCards,
      stockMovements,
    };
    const filename = `backup-meu-vicio-${new Date().toISOString().slice(0, 10)}.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setActionMessage('Backup do catálogo baixado com sucesso.');
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
  async function deleteProduct(item: AdminProduct) {
    if (!window.confirm(`Excluir o produto “${item.name}”? Essa ação remove o cadastro e os tamanhos vinculados.`)) return;
    if (supabase && session && !item.id.startsWith('demo-')) {
      const { count, error: referenceError } = await supabase.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', item.id);
      if (referenceError) { setActionMessage('Não foi possível verificar o histórico do produto.'); return; }
      if ((count || 0) > 0) { setActionMessage('Este produto possui pedidos vinculados. Coloque-o como rascunho para preservar o histórico.'); return; }
      const sizesResult = await supabase.from('product_sizes').delete().eq('product_id', item.id);
      if (sizesResult.error) { setActionMessage('Não foi possível remover os tamanhos vinculados.'); return; }
      const productResult = await supabase.from('products').delete().eq('id', item.id);
      if (productResult.error) { setActionMessage('Não foi possível excluir o produto.'); return; }
    }
    setItems((current) => current.filter((product) => product.id !== item.id));
    setActionMessage('Produto excluído com segurança.');
  }
  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session) return;
    setSettingsSaving(true);
    const { error } = await supabase.from('store_settings').upsert({ id: 'default', store_name: settings.storeName.trim() || 'Meu Vício', hours: settings.hours.trim(), whatsapp_primary: settings.whatsappPrimary.replace(/\D/g, ''), whatsapp_primary_label: settings.whatsappPrimaryLabel.trim() || 'Atendimento principal', whatsapp_secondary: settings.whatsappSecondary.replace(/\D/g, ''), whatsapp_secondary_label: settings.whatsappSecondaryLabel.trim(), whatsapp_message: settings.whatsappMessage.trim() }, { onConflict: 'id' });
    if (error) setActionMessage('Não foi possível salvar as preferências.');
    else setActionMessage('Preferências atualizadas com sucesso.');
    setSettingsSaving(false);
  }
  async function addLoyaltyCard(event: FormEvent) {
    event.preventDefault();
    const customerName = loyaltyForm.customerName.trim();
    if (!customerName) { setActionMessage('Informe o nome do cliente para criar a cartela.'); return; }
    if (!supabase || !session) return;
    setLoyaltySaving(true);
    const { data, error } = await supabase.from('loyalty_cards').insert({ customer_name: customerName, customer_phone: loyaltyForm.customerPhone.replace(/\D/g, '') }).select('id,customer_name,customer_phone').single();
    if (error || !data) { setActionMessage('Não foi possível cadastrar a cartela de fidelidade.'); setLoyaltySaving(false); return; }
    setLoyaltyCards((current) => [{ id: data.id, customerName: data.customer_name, customerPhone: data.customer_phone || '', purchases: [] }, ...current]);
    setLoyaltyForm({ customerName: '', customerPhone: '' });
    setActionMessage('Cartela cadastrada com sucesso.');
    setLoyaltySaving(false);
  }
  async function startLoyaltyEdit(card: LoyaltyCard) {
    if (!supabase || !session) return;
    const customerName = window.prompt('Nome do cliente', card.customerName);
    if (customerName === null) return;
    const trimmedName = customerName.trim();
    if (!trimmedName) { setActionMessage('Informe o nome do cliente.'); return; }
    const customerPhone = window.prompt('Telefone / WhatsApp', card.customerPhone);
    if (customerPhone === null) return;
    const normalizedPhone = customerPhone.replace(/\D/g, '');
    const { error } = await supabase.from('loyalty_cards').update({ customer_name: trimmedName, customer_phone: normalizedPhone }).eq('id', card.id);
    if (error) { setActionMessage('Não foi possível atualizar a cartela.'); return; }
    setLoyaltyCards((current) => current.map((item) => item.id === card.id ? { ...item, customerName: trimmedName, customerPhone: normalizedPhone } : item));
    setActionMessage('Cartela atualizada com sucesso.');
  }
  async function deleteLoyaltyCard(card: LoyaltyCard) {
    if (!supabase || !session) return;
    if (!window.confirm('Excluir a cartela de ' + card.customerName + '? As marcações e datas também serão removidas.')) return;
    const { error } = await supabase.from('loyalty_cards').delete().eq('id', card.id);
    if (error) { setActionMessage('Não foi possível excluir a cartela.'); return; }
    setLoyaltyCards((current) => current.filter((item) => item.id !== card.id));
    setActionMessage('Cartela excluída com sucesso.');
  }
  async function markLoyaltyPurchase(card: LoyaltyCard) {
    if (!supabase || !session) return;
    if (card.purchases.length >= 10) { setActionMessage('Essa cartela já está completa. Crie uma nova cartela para começar outro ciclo.'); return; }
    const purchaseDate = purchaseDates[card.id] || new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase.from('loyalty_purchases').insert({ loyalty_card_id: card.id, purchase_date: purchaseDate }).select('id,purchase_date').single();
    if (error || !data) { setActionMessage('Não foi possível registrar essa compra.'); return; }
    const purchase = { id: data.id, purchaseDate: data.purchase_date };
    setLoyaltyCards((current) => current.map((item) => item.id === card.id ? { ...item, purchases: [...item.purchases, purchase] } : item));
    setPurchaseDates((current) => ({ ...current, [card.id]: '' }));
    setActionMessage(`${card.customerName}: compra ${card.purchases.length + 1} de 10 registrada.`);
  }
  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session) return;
    const fullName = profile.fullName.trim();
    if (!fullName) { setActionMessage('Informe um nome para o perfil.'); return; }
    if (profilePassword && profilePassword.length < 6) { setActionMessage('A nova senha precisa ter pelo menos 6 caracteres.'); return; }
    setProfileSaving(true);
    const profileResult = await supabase.from('profiles').upsert({ id: session.user.id, full_name: fullName }, { onConflict: 'id' });
    if (profileResult.error) { setActionMessage('Não foi possível salvar o perfil.'); setProfileSaving(false); return; }
    const authResult = profilePassword
      ? await supabase.auth.updateUser({ data: { full_name: fullName }, password: profilePassword })
      : await supabase.auth.updateUser({ data: { full_name: fullName } });
    if (authResult.error) { setActionMessage('Perfil salvo, mas não foi possível atualizar a senha.'); setProfileSaving(false); return; }
    setProfilePassword('');
    setActionMessage('Perfil atualizado com sucesso.');
    setProfileSaving(false);
  }

  const fallbackProfileName = session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'Administrador';
  const displayName = profile.fullName || fallbackProfileName;
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';

  if (supabase && loading) return <main className="admin-auth-shell"><div className="admin-auth-card"><span className="admin-brand-mark">mv</span><h1>Carregando painel</h1><p>Preparando a conexão segura com a loja.</p></div></main>;
  if (supabase && !session) return <main className="admin-auth-shell"><form className="admin-auth-card" onSubmit={signIn}><span className="admin-brand-mark">mv</span><span className="admin-kicker">acesso restrito</span><h1>Painel da loja</h1><p>Entre com o usuário administrador do Supabase para gerenciar produtos e estoque.</p><label>E-mail<input type="email" required value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="seu@email.com" /></label><label>Senha<input type="password" required value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="Sua senha" /></label>{authError && <small className="auth-error">{authError}</small>}<button type="submit" className="new-product-button" disabled={authLoading}>{authLoading ? 'Entrando...' : 'Entrar no painel'}</button><a href="/" className="auth-back-link">Voltar ao catálogo</a></form></main>;

  return <main className="admin-shell">
<aside className="admin-sidebar"><a href="/" className="admin-brand"><span className="admin-brand-mark">mv</span><span><strong>MEU VÍCIO</strong><small>painel da loja</small></span></a><div className="admin-menu-label">menu principal</div><nav className="admin-menu"><a className="active" href="#visao-geral"><LayoutDashboard size={17} /> Visão geral</a><a href="#indicadores"><BarChart3 size={17} /> Indicadores</a><a href="#produtos"><Package size={17} /> Produtos <span>{items.length}</span></a><a href="#categorias"><Tags size={17} /> Categorias</a><a href="#pedidos"><ShoppingBag size={17} /> Pedidos <span>{orders.length}</span></a><a href="#fidelidade"><Heart size={17} /> Fidelidade</a></nav><div className="admin-menu-label settings-label">configurações</div><nav className="admin-menu"><a href="#configuracoes"><Settings2 size={17} /> Preferências</a><a href="#perfil"><Settings2 size={17} /> Perfil</a></nav><div className="admin-sidebar-bottom"><div className="admin-user-avatar">{displayName.slice(0, 2).toUpperCase()}</div><div><strong>{displayName}</strong><span>Administrador</span></div><button type="button" onClick={signOut} aria-label="Sair do painel" title="Sair do painel" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginLeft: 'auto', border: 0, background: 'transparent', color: '#7d9288', cursor: 'pointer', padding: '6px 3px', font: 'inherit' }}><LogOut size={16} /><span style={{ marginTop: 0, color: 'currentColor', fontSize: 10, fontWeight: 800 }}>Sair</span></button></div></aside>
<section className="admin-content"><header className="admin-topbar"><div><span className="admin-breadcrumb">Painel / Visão geral</span><h1>{greeting}, {displayName} <span>✦</span></h1></div><div className="admin-top-actions"><button type="button" aria-label="Notificações indisponíveis" title="Notificações em breve" disabled><Bell size={19} /></button><a className="view-store" href="/" target="_blank" rel="noreferrer">Ver catálogo <ArrowLeft size={15} /></a></div></header><nav className="admin-mobile-nav" aria-label="Seções do painel"><a href="#visao-geral">Visão geral</a><a href="#indicadores">Indicadores</a><a href="#produtos">Produtos</a><a href="#categorias">Categorias</a><a href="#fidelidade">Fidelidade</a><a href="#pedidos">Pedidos</a><a href="#configuracoes">Preferências</a></nav>
      <div className="admin-main" id="visao-geral">{actionMessage && <div className="admin-action-message" role="status"><Check size={16} /> <span>{actionMessage}</span><button type="button" onClick={() => setActionMessage('')} aria-label="Fechar mensagem"><X size={16} /></button></div>}{importNotice && <div className="import-notice"><div><span className="notice-icon"><Check size={16} /></span><div><strong>Drive usado somente para a primeira carga</strong><p>Depois da importação, novos produtos, fotos e estoques serão atualizados diretamente neste painel.</p></div></div><button type="button" onClick={() => setImportNotice(false)} aria-label="Fechar aviso"><X size={17} /></button></div>}
        <div className="admin-stats"><div className="stat-card accent"><span className="stat-icon"><Package size={18} /></span><div><small>Produtos ativos</small><strong>{summary.activeProducts.toString().padStart(2, '0')}</strong><em>{items.length} cadastrados no total</em></div></div><div className="stat-card"><span className="stat-icon green"><ShoppingBag size={18} /></span><div><small>Pares em estoque</small><strong>{summary.stockTotal}</strong><em>somatório das quantidades</em></div></div><div className="stat-card"><span className="stat-icon sand"><Tags size={18} /></span><div><small>Categorias</small><strong>{summary.categoryCount.toString().padStart(2, '0')}</strong><em>{summary.categoryLabel}</em></div></div><div className="stat-card"><span className="stat-icon lilac"><ImagePlus size={18} /></span><div><small>Imagens cadastradas</small><strong>{summary.imageCount.toString().padStart(2, '0')}</strong><em>imagens vinculadas</em></div></div></div>
        <section id="indicadores" className="admin-indicators-section">
          <div className="admin-section-head"><div><span className="admin-kicker">acompanhamento</span><h2>Indicadores</h2></div><label className="indicator-filter"><span>Filtrar pedidos</span><select value={indicatorFilter} onChange={(event) => setIndicatorFilter(event.target.value as 'Todos' | 'Finalizados')}><option value="Finalizados">Pedidos finalizados</option><option value="Todos">Todos os pedidos</option></select><ChevronDown size={15} /></label></div>
          <div className="indicator-card"><span className="indicator-icon"><BarChart3 size={20} /></span><div><small>{indicatorFilter === 'Finalizados' ? 'Pedidos realizados' : 'Pedidos registrados'}</small><strong>{indicatorOrderCount}</strong><em>{indicatorFilter === 'Finalizados' ? 'com status Concluído' : 'independentemente do status'}</em></div></div>
        </section>
        <div className="admin-section-head" id="produtos"><div><span className="admin-kicker">catálogo</span><h2>Produtos cadastrados</h2></div><div className="admin-head-actions"><button type="button" className="import-button" onClick={() => setImportNotice(true)}><Upload size={16} /> Orientações da carga</button><button type="button" className="new-product-button" onClick={openNewProduct}><Plus size={17} /> Novo produto</button></div></div>
        <div className="admin-order-note"><ArrowUp size={15} /><span>Use as setas em cada produto para definir a ordem dentro da categoria. Essa sequência também vale quando o cliente filtrar por tamanho.</span></div>
        <div className="admin-toolbar"><div className="admin-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome do produto" /></div><label className="status-filter"><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'Todos' | 'Ativo' | 'Rascunho')}><option>Todos</option><option>Ativo</option><option>Rascunho</option></select><ChevronDown size={15} /></label></div>
        <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Produto</th><th>Categoria</th><th>Cor</th><th>Preço</th><th>Estoque total</th><th>Tamanhos com estoque</th><th>Status</th><th></th></tr></thead><tbody>{visibleItems.map((item) => <tr key={item.id}><td><div className="table-product"><button type="button" className="table-product-image-button" onClick={() => setPreviewImage({ src: item.image, name: item.name })} aria-label={`Visualizar foto de ${item.name}`}><img src={item.image} alt="" /></button><strong>{item.name}</strong></div></td><td>{item.category}</td><td>{item.color || 'Não informada'}</td><td className="table-price">{item.price}</td><td><strong>{item.stock}</strong> pares</td><td><div className="table-sizes">{item.sizes.slice(0, 5).map((size) => <span key={size}>{size}</span>)}{item.sizes.length > 5 && <span>+{item.sizes.length - 5}</span>}</div></td><td><span className={item.status === 'Ativo' ? 'status active' : 'status draft'}><i />{item.status}</span></td><td><div className="row-actions"><button className="row-menu" type="button" onClick={() => moveProduct(item, -1)} disabled={!canMoveProduct(item, -1)} aria-label={`Mover ${item.name} para cima`} title="Mover para cima"><ArrowUp size={16} /></button><button className="row-menu" type="button" onClick={() => moveProduct(item, 1)} disabled={!canMoveProduct(item, 1)} aria-label={`Mover ${item.name} para baixo`} title="Mover para baixo"><ArrowDown size={16} /></button><button className="row-menu" type="button" onClick={() => openEditProduct(item)} aria-label={`Editar ${item.name}`} title="Editar produto"><MoreHorizontal size={18} /></button><button className="row-menu" type="button" onClick={() => toggleProductStatus(item)} aria-label={`${item.status === 'Ativo' ? 'Colocar' : 'Ativar'} ${item.name} como ${item.status === 'Ativo' ? 'rascunho' : 'ativo'}`} title={item.status === 'Ativo' ? 'Colocar como rascunho' : 'Ativar produto'}>{item.status === 'Ativo' ? <EyeOff size={16} /> : <Eye size={16} />}</button><button className="row-menu row-menu-danger" type="button" onClick={() => deleteProduct(item)} aria-label={`Excluir ${item.name}`} title="Excluir produto"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
        <div className="admin-help-card"><div className="help-illustration"><ImagePlus size={27} /></div><div><span className="admin-kicker">próximo passo</span><h3>Cadastre os produtos da loja</h3><p>Use o botão de novo produto para adicionar fotos, categorias, preços e estoque separado por tamanho.</p></div><button type="button" className="secondary-admin-button" onClick={openNewProduct}>Cadastrar produto <Plus size={15} /></button></div>
        <section id="categorias" style={{ marginTop: 34, borderTop: '1px solid #e4ece8', paddingTop: 4 }}>
          <div className="admin-section-head"><div><span className="admin-kicker">organização</span><h2>Categorias</h2></div><span className="admin-breadcrumb">{categories.length} cadastradas</span></div>
          <form onSubmit={saveCategory} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', gap: 12, marginTop: 4 }}><label style={{ display: 'grid', flex: '1 1 240px', gap: 7, color: '#72877d', fontSize: 10, fontWeight: 800 }}>Nova categoria<input value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Ex.: Feminino, Masculino ou Infantil" style={{ width: '100%', border: '1px solid #dbe5e0', borderRadius: 8, outline: 0, background: '#fff', color: '#365548', padding: '11px 12px', fontSize: 12 }} /></label><button type="submit" className="new-product-button" disabled={categorySaving} style={{ minHeight: 38 }}>{categorySaving ? 'Salvando...' : 'Adicionar categoria'} <Plus size={16} /></button></form>
          {categoryError && <small className="auth-error">{categoryError}</small>}
          <div className="category-management-list">
            {categories.map((category) => editingCategoryId === category.id ? <form className="category-management-row category-management-edit" key={category.id} onSubmit={(event) => updateCategory(event, category)}><label><span>Nome da categoria</span><input value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} /></label><div className="category-management-actions"><button type="button" className="cancel-button" onClick={cancelCategoryEdit}>Cancelar</button><button type="submit" className="secondary-admin-button" disabled={categoryActionId === category.id}>{categoryActionId === category.id ? 'Salvando...' : 'Salvar'} <Check size={15} /></button></div></form> : <div className="category-management-row" key={category.id}><div className="category-management-name"><Tags size={16} /><strong>{category.name}</strong>{(category.id === 'adulto' || category.id === 'infantil') && <small>Categoria padrão</small>}</div>{category.id === 'adulto' || category.id === 'infantil' ? <small className="category-management-locked">Protegida</small> : <div className="category-management-actions"><button type="button" className="secondary-admin-button" onClick={() => startCategoryEdit(category)}><Pencil size={14} /> Editar</button><button type="button" className="category-delete-button" onClick={() => deleteCategory(category)} disabled={categoryActionId === category.id}><Trash2 size={14} /> {categoryActionId === category.id ? 'Excluindo...' : 'Excluir'}</button></div>}</div>)}
          </div>
          <div className="category-size-config-list">
            <div className="category-size-config-intro"><strong>Tamanhos por categoria</strong><span>Defina as opções que aparecerão no filtro e no cadastro de estoque de cada categoria.</span></div>
            {categories.map((category) => <form className="category-size-config" key={category.id} onSubmit={(event) => saveCategorySizes(event, category)}><div className="category-size-config-name"><strong>{category.name}</strong><small>Ex.: 41, 42/43, 44/45</small></div><label>Tamanhos disponíveis<input value={categorySizeDrafts[category.id] || ''} onChange={(event) => setCategorySizeDrafts((current) => ({ ...current, [category.id]: event.target.value }))} placeholder="Ex.: 33/34, 35/36, 41/42" /></label><button type="submit" className="secondary-admin-button" disabled={categorySizeSaving === category.id}>{categorySizeSaving === category.id ? 'Salvando...' : 'Salvar tamanhos'} <Check size={15} /></button></form>)}
            <small className="category-size-config-note">Separe os tamanhos por vírgula. Para usar uma numeração individual, informe apenas um número, como “41”. Alterar esta lista não altera automaticamente o estoque já cadastrado dos produtos.</small>
          </div>
        </section>
        <section id="pedidos">
          <div className="admin-section-head"><div><span className="admin-kicker">acompanhamento</span><h2>Pedidos enviados</h2></div><span className="admin-breadcrumb">{orders.length} registrados</span></div>
          <div className="admin-toolbar order-toolbar"><div className="admin-search"><Search size={17} /><input value={orderSearch} onChange={(event) => setOrderSearch(event.target.value)} placeholder="Buscar por pedido, nome, WhatsApp ou produto" /></div><button type="button" className="secondary-admin-button export-orders-button" onClick={exportOrders} disabled={!visibleOrders.length}>Exportar Excel (CSV) <Upload size={15} /></button></div>
          <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Pedido</th><th>Cliente</th><th>Itens escolhidos</th><th>WhatsApp</th><th>Total</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead><tbody>{ordersLoading ? <tr><td colSpan={8}>Carregando pedidos...</td></tr> : visibleOrders.length ? visibleOrders.map((order) => <tr key={order.id}><td><strong>#{order.id.slice(0, 8).toUpperCase()}</strong></td><td><strong>{order.customerName || 'Não informado'}</strong>{order.notes && <small className="order-note">{order.notes}</small>}</td><td>{order.items.map((item) => `${item.productName}${item.color ? ` • cor ${item.color}` : ''} • ${item.size} • ${item.quantity}x`).join(' | ')}</td><td>{order.whatsappNumber ? <a className="order-whatsapp-link" href={`https://wa.me/${order.whatsappNumber}`} target="_blank" rel="noreferrer">{order.whatsappNumber}</a> : 'Não informado'}</td><td className="table-price">{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td><td><select className="order-status-select" value={order.status} onChange={(event) => updateOrderStatus(order.id, event.target.value)} aria-label={`Status do pedido ${order.id.slice(0, 8)}`}><option>Novo</option><option>Em contato</option><option>Confirmado</option><option>Concluído</option><option>Cancelado</option></select></td><td><div className="row-actions"><button type="button" className="row-menu row-menu-danger" onClick={() => deleteOrder(order)} aria-label={`Excluir pedido ${order.id.slice(0, 8)}`} title="Excluir pedido"><Trash2 size={16} /></button></div></td></tr>) : <tr><td colSpan={8}>{orders.length ? 'Nenhum pedido corresponde à busca.' : 'Ainda não há pedidos registrados. Eles aparecerão aqui quando alguém enviar uma sacola pelo WhatsApp.'}</td></tr>}</tbody></table></div>
        </section>
        <section className="stock-history-section" id="historico-estoque">
          <div className="admin-section-head"><div><span className="admin-kicker">controle</span><h2>Histórico do estoque</h2></div><div className="admin-head-actions"><button type="button" className="secondary-admin-button" onClick={exportCatalogBackup}><Upload size={15} /> Baixar backup</button><span className="admin-breadcrumb">últimas 30 alterações</span></div></div>
          <p className="stock-history-intro">Veja quando um tamanho foi alterado, qual era a quantidade anterior e quem realizou o ajuste.</p>
          <div className="products-table-wrap"><table className="products-table"><thead><tr><th>Produto</th><th>Tamanho</th><th>Antes</th><th>Depois</th><th>Motivo</th><th>Data</th></tr></thead><tbody>{stockHistoryLoading ? <tr><td colSpan={6}>Carregando histórico...</td></tr> : stockMovements.length ? stockMovements.map((movement) => <tr key={movement.id}><td><strong>{movement.productName}</strong></td><td>{movement.size}</td><td>{movement.previousQuantity} pares</td><td><strong>{movement.newQuantity} pares</strong></td><td>{movement.reason}</td><td>{new Date(movement.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</td></tr>) : <tr><td colSpan={6}>As alterações de estoque aparecerão aqui após novos cadastros, edições ou confirmações de pedidos.</td></tr>}</tbody></table></div>
        </section>
        <section id="fidelidade" className="admin-loyalty-section">
          <div className="admin-section-head"><div><span className="admin-kicker">relacionamento</span><h2>Cartão fidelidade</h2></div><span className="admin-breadcrumb">{loyaltyCards.length} clientes</span></div>
          <p className="admin-loyalty-intro">Cadastre o cliente e registre cada compra manualmente. Ao completar 10 marcações, a cartela fica pronta para liberar o benefício.</p>
          <div className="admin-search loyalty-search"><Search size={17} /><input value={loyaltySearch} onChange={(event) => setLoyaltySearch(event.target.value)} placeholder="Buscar cliente por nome ou telefone" aria-label="Buscar cliente por nome ou telefone" /></div>
          <form className="admin-loyalty-form" onSubmit={addLoyaltyCard}><label><span>Nome do cliente</span><input value={loyaltyForm.customerName} onChange={(event) => setLoyaltyForm({ ...loyaltyForm, customerName: event.target.value })} placeholder="Ex.: Maria Silva" /></label><label><span>Telefone / WhatsApp</span><input value={loyaltyForm.customerPhone} onChange={(event) => setLoyaltyForm({ ...loyaltyForm, customerPhone: event.target.value })} placeholder="(31) 99999-9999" inputMode="tel" /></label><button type="submit" className="new-product-button" disabled={loyaltySaving}>{loyaltySaving ? 'Salvando...' : 'Criar cartela'} <Plus size={16} /></button></form>
          {loyaltyLoading ? <div className="admin-loyalty-empty">Carregando clientes cadastrados...</div> : visibleLoyaltyCards.length ? <><div className="loyalty-card-grid">{displayedLoyaltyCards.map((card) => { const completed = card.purchases.length; return <article className="loyalty-card" key={card.id}><div className="loyalty-card-head"><div><span className="admin-kicker">cliente</span><h3>{card.customerName}</h3><p>{card.customerPhone || 'Telefone não informado'}</p></div><strong>{completed}<small>/10</small></strong></div><div className="loyalty-card-manage-actions"><button type="button" onClick={() => startLoyaltyEdit(card)}><Pencil size={14} /> Editar</button><button type="button" className="loyalty-delete-button" onClick={() => deleteLoyaltyCard(card)}><Trash2 size={14} /> Excluir</button></div><div className="loyalty-stamps" aria-label={'Cartela de ' + card.customerName}>{Array.from({ length: 10 }, (_, index) => { const purchase = card.purchases[index]; return <span className={purchase ? 'loyalty-stamp filled' : 'loyalty-stamp'} key={purchase?.id || index}>{purchase ? <><Check size={13} /><small>{new Date(purchase.purchaseDate + 'T12:00:00').toLocaleDateString('pt-BR')}</small></> : index + 1}</span>; })}</div><div className="loyalty-card-actions"><input type="date" value={purchaseDates[card.id] || ''} onChange={(event) => setPurchaseDates((current) => ({ ...current, [card.id]: event.target.value }))} aria-label={'Data da próxima compra de ' + card.customerName} disabled={completed >= 10} /><button type="button" className="secondary-admin-button" onClick={() => markLoyaltyPurchase(card)} disabled={completed >= 10}>{completed >= 10 ? 'Cartela completa' : 'Marcar compra'} <Check size={15} /></button></div>{completed >= 10 && <small className="loyalty-complete-note">Benefício liberado • crie uma nova cartela para o próximo ciclo.</small>}</article>; })}</div>{hiddenLoyaltyCardCount > 0 && !loyaltySearch.trim() && <button type="button" className="loyalty-see-more" onClick={() => setShowAllLoyaltyCards((current) => !current)}>{showAllLoyaltyCards ? 'Mostrar somente 2 cartões' : `Ver mais cartões (${hiddenLoyaltyCardCount})`} <ChevronDown size={16} className={showAllLoyaltyCards ? 'is-open' : ''} /></button>}</> : <div className="admin-loyalty-empty"><Heart size={24} /><strong>{loyaltyCards.length ? 'Nenhuma cartela encontrada' : 'Nenhuma cartela cadastrada'}</strong><p>{loyaltyCards.length ? 'Tente buscar pelo nome ou telefone completo.' : 'Comece adicionando o primeiro cliente acima.'}</p></div>}
        </section>
        <section className="loyalty-management-section">
          <div className="admin-section-head"><div><span className="admin-kicker">manutenção</span><h2>Gerenciar cartelas</h2></div><span className="admin-breadcrumb">editar ou excluir</span></div>
          {visibleLoyaltyCards.length ? <div className="loyalty-management-list">{displayedLoyaltyCards.map((card) => <div className="loyalty-management-row" key={card.id}><div><strong>{card.customerName}</strong><span>{card.customerPhone || 'Telefone não informado'} • {card.purchases.length}/10 compras</span></div><div className="loyalty-management-actions"><button type="button" onClick={() => startLoyaltyEdit(card)}><Pencil size={14} /> Editar</button><button type="button" className="loyalty-delete-button" onClick={() => deleteLoyaltyCard(card)}><Trash2 size={14} /> Excluir</button></div></div>)}</div> : <p className="admin-loyalty-management-empty">{loyaltyCards.length ? 'Nenhuma cartela corresponde à busca.' : 'As ações de edição e exclusão aparecerão aqui depois que uma cartela for cadastrada.'}</p>}
        </section>
        <section id="configuracoes" className="admin-settings-section">
          <div className="admin-profile-block" id="perfil">
            <div className="admin-section-head"><div><span className="admin-kicker">conta</span><h2>Meu perfil</h2></div><span className="admin-breadcrumb">acesso atual</span></div>
            <form className="admin-settings-form" onSubmit={saveProfile}><div className="admin-profile-grid"><label className="admin-settings-card"><span>Nome de exibição</span><input value={profile.fullName} onChange={(event) => setProfile({ ...profile, fullName: event.target.value })} placeholder={fallbackProfileName} /></label><label className="admin-settings-card"><span>E-mail de acesso</span><input value={session?.user.email || ''} readOnly /></label><label className="admin-settings-card"><span>Nova senha (opcional)</span><input type="password" value={profilePassword} onChange={(event) => setProfilePassword(event.target.value)} placeholder="Mínimo de 6 caracteres" /></label></div><div className="admin-settings-footer"><small>O nome aparece na saudação e no usuário do painel. O e-mail de acesso permanece protegido.</small><button type="submit" className="new-product-button" disabled={profileSaving}>{profileSaving ? 'Salvando...' : 'Salvar perfil'} <Check size={16} /></button></div></form>
          </div>
          <div className="admin-section-head"><div><span className="admin-kicker">configurações</span><h2>Preferências do catálogo</h2></div><span className="admin-breadcrumb">estrutura atual</span></div>
          <form className="admin-settings-form" onSubmit={saveSettings}><div className="admin-settings-grid"><label className="admin-settings-card"><span>Nome da loja</span><input value={settings.storeName} onChange={(event) => setSettings({ ...settings, storeName: event.target.value })} /></label><label className="admin-settings-card"><span>Horário de atendimento</span><input value={settings.hours} onChange={(event) => setSettings({ ...settings, hours: event.target.value })} /></label><label className="admin-settings-card"><span>Identificação do WhatsApp principal</span><input value={settings.whatsappPrimaryLabel} onChange={(event) => setSettings({ ...settings, whatsappPrimaryLabel: event.target.value })} placeholder="Ex.: Guilherme" /></label><label className="admin-settings-card"><span>WhatsApp principal</span><input value={settings.whatsappPrimary} onChange={(event) => setSettings({ ...settings, whatsappPrimary: event.target.value })} inputMode="numeric" /></label><label className="admin-settings-card"><span>WhatsApp secundário</span><input value={settings.whatsappSecondary} onChange={(event) => setSettings({ ...settings, whatsappSecondary: event.target.value })} inputMode="numeric" /></label><label className="admin-settings-card"><span>Identificação do segundo atendimento</span><input value={settings.whatsappSecondaryLabel} onChange={(event) => setSettings({ ...settings, whatsappSecondaryLabel: event.target.value })} /></label><label className="admin-settings-card"><span>Mensagem inicial do pedido</span><textarea value={settings.whatsappMessage} onChange={(event) => setSettings({ ...settings, whatsappMessage: event.target.value })} rows={2} /></label></div><div className="admin-settings-footer"><small>O Drive foi usado apenas como apoio na carga inicial. O catálogo usa os dados salvos no sistema.</small><button type="submit" className="new-product-button" disabled={settingsSaving}>{settingsSaving ? 'Salvando...' : 'Salvar preferências'} <Check size={16} /></button></div></form>
        </section>
      </div></section>
    {previewImage && <div className="admin-image-preview-backdrop" role="presentation" onClick={() => setPreviewImage(null)}><div className="admin-image-preview" role="dialog" aria-modal="true" aria-labelledby="image-preview-title" onClick={(event) => event.stopPropagation()}><div className="admin-form-header"><div><span className="admin-kicker">visualização</span><h2 id="image-preview-title">{previewImage.name}</h2></div><button type="button" onClick={() => setPreviewImage(null)} aria-label="Fechar visualização"><X size={19} /></button></div><div className="admin-image-preview-frame"><img src={previewImage.src} alt={`Foto de ${previewImage.name}`} /></div></div></div>}
    {showForm && <div className="admin-modal-backdrop" role="presentation" onClick={() => { setShowForm(false); resetProductForm(); }}><div className="admin-form-modal" role="dialog" aria-modal="true" aria-labelledby="admin-form-title" onClick={(event) => event.stopPropagation()}><div className="admin-form-header"><div><span className="admin-kicker">{editingProductId ? 'edição de produto' : 'novo cadastro'}</span><h2 id="admin-form-title">{editingProductId ? 'Editar produto' : 'Adicionar produto'}</h2></div><button type="button" onClick={() => { setShowForm(false); resetProductForm(); }} aria-label="Fechar"><X size={19} /></button></div><div className="admin-form-body"><label>Nome do produto<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ex.: Havaianas Brasil Logo Branco" /></label><div className="admin-form-grid admin-product-fields"><label>Categoria<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label><label>Cor<input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="Ex.: Branco, Azul ou Preto" /></label><label>Preço<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="39,90" /></label><label>Etiqueta<select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })}><option value="">Sem etiqueta</option><option>Mais vendido</option><option>Novidade</option><option>Infantil</option><option>Personalizado</option><option>Conforto</option></select></label></div><label className="admin-inline-field">Status<select value={form.isActive ? 'Ativo' : 'Rascunho'} onChange={(event) => setForm({ ...form, isActive: event.target.value === 'Ativo' })}><option>Ativo</option><option>Rascunho</option></select></label><label>Descrição<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descreva o produto brevemente" rows={3} /></label><label className="upload-field"><span>Imagem principal</span><div className={form.image !== '/products/havaianas-branco.png' ? 'upload-preview' : undefined}>{form.image !== '/products/havaianas-branco.png' ? <><img style={imageAdjustStyle(form.imageAdjust)} src={form.image} alt="Prévia do produto" /><strong>Clique para trocar a foto</strong></> : <><ImagePlus size={18} /><strong>Selecione uma foto do produto</strong><small>PNG ou JPG • imagem quadrada recomendada</small></>}<input type="file" accept="image/png,image/jpeg" onChange={handleImage} /></div></label><fieldset className="image-adjust-fieldset"><div className="image-adjust-heading"><div><legend>Ajuste da imagem</legend><p>Defina o que deve aparecer no card do catálogo.</p></div><button type="button" className="image-adjust-reset" onClick={resetImageAdjust}>Voltar ao centro</button></div><div className="image-adjust-preview"><img style={imageAdjustStyle(form.imageAdjust)} src={form.image} alt="Prévia do enquadramento" /></div><label>Zoom <input type="range" min="0.8" max="1.35" step="0.01" value={form.imageAdjust.zoom} onChange={(event) => setImageAdjust('zoom', event.target.value)} /><output>{Math.round(form.imageAdjust.zoom * 100)}%</output></label><label>Horizontal <input type="range" min="-25" max="25" step="1" value={form.imageAdjust.x} onChange={(event) => setImageAdjust('x', event.target.value)} /><output>{form.imageAdjust.x > 0 ? '+' : ''}{form.imageAdjust.x}%</output></label><label>Vertical <input type="range" min="-25" max="25" step="1" value={form.imageAdjust.y} onChange={(event) => setImageAdjust('y', event.target.value)} /><output>{form.imageAdjust.y > 0 ? '+' : ''}{form.imageAdjust.y}%</output></label></fieldset><fieldset><legend>Estoque por tamanho (pares)</legend><div className="admin-size-grid">{getOptionsForCategory(form.category).map((option) => <label key={option.label} className={form.sizes.includes(option.label) ? 'admin-size selected' : 'admin-size'}><input type="checkbox" checked={form.sizes.includes(option.label)} onChange={() => toggleSize(option.label)} /><span>{option.label}</span>{form.sizes.includes(option.label) && <input className="size-quantity-input" type="number" min="0" value={form.quantities[option.label] ?? 0} onChange={(event) => setSizeQuantity(option.label, event.target.value)} aria-label={`Quantidade para ${option.label}`} />}</label>)}</div></fieldset></div><div className="admin-form-footer"><button type="button" className="cancel-button" onClick={() => { setShowForm(false); resetProductForm(); }}>Cancelar</button><button type="button" className="new-product-button" onClick={saveProduct}>{editingProductId ? 'Atualizar produto' : 'Salvar produto'} <Check size={16} /></button></div></div></div>}
  </main>;
}
