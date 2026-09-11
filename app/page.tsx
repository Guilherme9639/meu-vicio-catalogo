'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Filter,
  Heart,
  Menu,
  MessageCircle,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_IMAGE_ADJUST,
  parseImageUrl,
  type ImageAdjust,
} from '@/lib/image-adjust';
import { normalizeProductName, productCategoryLabel } from '@/lib/catalog-text';

type Product = {
  id: string;
  name: string;
  category: string;
  color: string;
  price: number;
  description: string;
  image: string;
  imageAdjust?: ImageAdjust;
  sizes: Record<number, number>;
  sizeOptions?: SizeOption[];
  tag?: string;
};
type SizeOption = { label: string; values: number[] };
type CartItem = Product & { selectedSize: string; quantity: number };
type StoreSettings = {
  storeName: string;
  hours: string;
  whatsappPrimary: string;
  whatsappPrimaryLabel: string;
  whatsappSecondary: string;
  whatsappSecondaryLabel: string;
  whatsappMessage: string;
};
type PersonalizationImage = { src: string; alt: string };

const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Meu Vício',
  hours: 'Segunda a sábado • 9h às 18h',
  whatsappPrimary: '5531994483976',
  whatsappPrimaryLabel: 'Atendimento principal',
  whatsappSecondary: '5531999999999',
  whatsappSecondaryLabel: 'Número de demonstração',
  whatsappMessage:
    'Olá! Vim pelo catálogo Meu Vício e gostaria de fazer um pedido.',
};
const personalizationImages: PersonalizationImage[] = [
  {
    src: '/products/personalizacao-capa.jpg',
    alt: 'Chinelos personalizados em várias cores, com todos os modelos visíveis',
  },
  {
    src: '/products/personalizacao-2.jpg',
    alt: 'Chinelos brancos personalizados em destaque',
  },
  {
    src: '/products/personalizacao-3.jpg',
    alt: 'Par de chinelos claros com detalhes personalizados',
  },
];
const sizeOptions: SizeOption[] = [
  { label: '16/17', values: [16, 17] },
  { label: '18/19', values: [18, 19] },
  { label: '20/21', values: [20, 21] },
  { label: '22/23', values: [22, 23] },
  { label: '24/25', values: [24, 25] },
  { label: '26/27', values: [26, 27] },
  { label: '28/29', values: [28, 29] },
  { label: '30/31', values: [30, 31] },
  { label: '32/33', values: [32, 33] },
  { label: '33/34', values: [33, 34] },
  { label: '35/36', values: [35, 36] },
  { label: '37/38', values: [37, 38] },
  { label: '39/40', values: [39, 40] },
  { label: '41/42', values: [41, 42] },
  { label: '43/44', values: [43, 44] },
  { label: '45/46', values: [45, 46] },
];
const adultSizeOptions = sizeOptions.filter((option) => option.values[0] >= 33);
const infantSizeOptions = sizeOptions.filter(
  (option) => option.values[0] <= 32,
);
function defaultOptionsForCategory(category: string) {
  if (category === 'Adulto') return adultSizeOptions;
  if (category === 'Infantil') return infantSizeOptions;
  return sizeOptions;
}
function getAvailableQuantity(product: Product, size: string) {
  const option = (product.sizeOptions || defaultOptionsForCategory(product.category)).find(
    (item) => item.label === size,
  );
  if (!option) return 0;
  return Math.max(
    ...option.values.map((value) => Number(product.sizes[value] ?? 0)),
    0,
  );
}
const products: Product[] = [
  {
    id: 'demo-1',
    name: 'Brasil Logo Branco',
    category: 'Adulto',
    color: 'Branco',
    price: 39.9,
    description: 'O clássico brasileiro para todos os dias.',
    image: '/products/havaianas-branco.png',
    sizes: { 33: 2, 34: 0, 35: 4, 36: 3, 37: 5, 38: 2, 39: 0, 40: 1 },
    tag: 'Mais vendido',
  },
  {
    id: 'demo-2',
    name: 'Top Rosé',
    category: 'Adulto',
    color: 'Rosé',
    price: 34.9,
    description: 'Leve, confortável e com cor para destacar o look.',
    image: '/products/havaianas-branco.png',
    sizes: { 33: 0, 34: 2, 35: 0, 36: 4, 37: 2, 38: 3, 39: 2, 40: 0 },
    tag: 'Novidade',
  },
  {
    id: 'demo-3',
    name: 'Slim Preto',
    category: 'Adulto',
    color: 'Preto',
    price: 44.9,
    description: 'Tiras finas e visual versátil para combinar com tudo.',
    image: '/products/havaianas-branco.png',
    sizes: { 33: 1, 34: 1, 35: 2, 36: 0, 37: 3, 38: 4, 39: 2, 40: 1 },
  },
  {
    id: 'demo-4',
    name: 'Top Max Comfort',
    category: 'Adulto',
    color: 'Azul marinho',
    price: 59.9,
    description: 'Mais conforto para acompanhar a rotina com leveza.',
    image: '/products/havaianas-branco.png',
    sizes: { 33: 0, 34: 0, 35: 2, 36: 2, 37: 1, 38: 0, 39: 3, 40: 2 },
    tag: 'Conforto',
  },
  {
    id: 'demo-5',
    name: 'Havaianas Kids Brasil',
    category: 'Infantil',
    color: 'Branco',
    price: 29.9,
    description: 'Conforto e praticidade para os pequenos.',
    image: '/products/havaianas-branco.png',
    sizes: {
      16: 2,
      17: 1,
      18: 0,
      19: 2,
      20: 1,
      21: 0,
      22: 2,
      23: 1,
      24: 0,
      25: 2,
    },
    tag: 'Infantil',
  },
  {
    id: 'demo-6',
    name: 'Havaianas Kids Color',
    category: 'Infantil',
    color: 'Azul',
    price: 32.9,
    description: 'Uma opção leve e colorida para brincar o dia todo.',
    image: '/products/havaianas-branco.png',
    sizes: {
      20: 1,
      21: 2,
      22: 1,
      23: 0,
      24: 2,
      25: 1,
      26: 0,
      27: 2,
      28: 1,
      29: 0,
      30: 2,
      31: 1,
      32: 1,
    },
  },
  {
    id: 'demo-7',
    name: 'Havaianas Kids Slim',
    category: 'Infantil',
    color: 'Rosa',
    price: 34.9,
    description: 'Modelo delicado para completar os looks infantis.',
    image: '/products/havaianas-branco.png',
    sizes: {
      16: 1,
      17: 0,
      18: 2,
      19: 1,
      20: 0,
      21: 2,
      22: 1,
      23: 0,
      24: 2,
      25: 1,
      26: 0,
      27: 2,
      28: 1,
      29: 0,
      30: 1,
      31: 0,
      32: 1,
    },
  },
];

const money = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const PERSONALIZATION_HERO_INTERVAL = 15000;
const FIDELITY_HERO_INTERVAL = 10000;
const PERSONALIZATION_SLIDE_INTERVAL = 5000;

function imageAdjustStyle(adjust?: ImageAdjust) {
  const current = adjust || DEFAULT_IMAGE_ADJUST;
  return {
    transform: `translate(${current.x}%, ${current.y}%) scale(${current.zoom})`,
  };
}

function Brand({ storeName = 'Meu Vício' }: { storeName?: string }) {
  return (
    <a
      href="#inicio"
      className="site-brand flex items-center gap-3"
      aria-label={`${storeName} - início`}
    >
      <span className="brand-mark">mv</span>
      <span>
        <span className="block font-[var(--font-display)] text-[17px] font-bold tracking-[0.14em] text-[#1e1e1e]">
          {storeName.toUpperCase()}
        </span>
        <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d71920]">
          calçados & acessórios
        </span>
      </span>
    </a>
  );
}

function StoreHeader({
  storeName,
  mobileMenu,
  setMobileMenu,
  search,
  setSearch,
  setCategory,
  categories,
  selectedCategory,
  cartCount,
  setCartOpen,
  favoritesCount,
  showFavoritesOnly,
  setShowFavoritesOnly,
}: {
  storeName: string;
  mobileMenu: boolean;
  setMobileMenu: (open: boolean) => void;
  search: string;
  setSearch: (value: string) => void;
  setCategory: (category: string) => void;
  categories: string[];
  selectedCategory: string;
  cartCount: number;
  setCartOpen: (open: boolean) => void;
  favoritesCount: number;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}) {
  const siteNavRef = useRef<HTMLElement | null>(null);
  const categoryLinksRef = useRef<HTMLElement | null>(null);
  const [hasMoreNav, setHasMoreNav] = useState(false);
  const [hasMoreCategories, setHasMoreCategories] = useState(false);
  useEffect(() => {
    const updateNavOverflow = () => {
      const element = siteNavRef.current;
      if (!element) return;
      setHasMoreNav(element.scrollWidth - element.clientWidth - element.scrollLeft > 8);
    };
    updateNavOverflow();
    window.addEventListener('resize', updateNavOverflow);
    return () => window.removeEventListener('resize', updateNavOverflow);
  }, []);
  useEffect(() => {
    const updateCategoryOverflow = () => {
      const element = categoryLinksRef.current;
      if (!element) return;
      setHasMoreCategories(
        element.scrollWidth - element.clientWidth - element.scrollLeft > 8,
      );
    };
    updateCategoryOverflow();
    window.addEventListener('resize', updateCategoryOverflow);
    return () => window.removeEventListener('resize', updateCategoryOverflow);
  }, [categories.length]);
  function showMoreCategories() {
    const element = categoryLinksRef.current;
    if (!element) return;
    element.scrollTo({ left: element.scrollWidth, behavior: 'smooth' });
  }
  function showMoreNav() {
    const element = siteNavRef.current;
    if (!element) return;
    element.scrollTo({ left: element.scrollWidth, behavior: 'smooth' });
  }
  return (
    <>
      <div className="announcement-bar">
        <div className="mx-auto flex max-w-[1240px] items-center justify-center gap-2 px-5 py-2 text-center">
          <Sparkles size={13} /> Atendimento personalizado pelo WhatsApp{' '}
          <span>•</span> escolha seu modelo e tamanho
        </div>
      </div>
      <header className="site-header">
        <div className="site-header-main mx-auto flex max-w-[1240px] items-center justify-between px-5 py-3 lg:px-8">
          <button
            className="icon-button lg:hidden"
            type="button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Abrir menu"
          >
            <Menu size={20} />
          </button>
          <Brand storeName={storeName} />
          <div className={hasMoreNav ? 'site-nav-shell has-more' : 'site-nav-shell'}>
            <nav
              ref={siteNavRef}
              className={`site-nav ${mobileMenu ? 'site-nav-open' : ''}`}
              aria-label="Navegação principal"
              onScroll={() => {
                const element = siteNavRef.current;
                if (element) {
                  setHasMoreNav(element.scrollWidth - element.clientWidth - element.scrollLeft > 8);
                }
              }}
            >
              <a href="#colecao" onClick={() => setMobileMenu(false)}>
                Coleção
              </a>
              <a href="#como-funciona" onClick={() => setMobileMenu(false)}>
                Como funciona
              </a>
              <a href="#contato" onClick={() => setMobileMenu(false)}>
                Atendimento
              </a>
            </nav>
            {hasMoreNav && (
              <button
                className="site-nav-scroll-button"
                type="button"
                onClick={showMoreNav}
                aria-label="Ir para o final da navegação"
                title="Ir para o final da navegação"
              >
                <ArrowRight size={15} />
              </button>
            )}
          </div>
          <div className="header-actions flex items-center gap-2">
            <button
              className={
                showFavoritesOnly
                  ? 'icon-button favorite-toggle active'
                  : 'icon-button favorite-toggle'
              }
              type="button"
              onClick={() => {
                setShowFavoritesOnly(!showFavoritesOnly);
                document
                  .getElementById('colecao')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
              aria-pressed={showFavoritesOnly}
              aria-label={
                showFavoritesOnly
                  ? 'Mostrar todos os produtos'
                  : 'Ver favoritos'
              }
              title={
                showFavoritesOnly
                  ? 'Mostrar todos os produtos'
                  : 'Ver favoritos'
              }
            >
              <Heart
                size={19}
                strokeWidth={1.8}
                fill={showFavoritesOnly ? 'currentColor' : 'none'}
              />
              {favoritesCount > 0 && (
                <span className="favorite-count">{favoritesCount}</span>
              )}
            </button>
            <button
              className="cart-button"
              type="button"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={18} strokeWidth={2} />
              <span className="hidden sm:inline">Sacola</span>
              <span className="cart-count">{cartCount}</span>
            </button>
          </div>
        </div>
        <div className="site-tools mx-auto max-w-[1240px] px-5 pb-3 lg:px-8">
          <label className="site-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="O que você está procurando?"
              aria-label="Buscar no catálogo"
            />
          </label>
          <div
            className={
              hasMoreCategories
                ? 'category-links-shell has-more'
                : 'category-links-shell'
            }
          >
            <nav
              ref={categoryLinksRef}
              className="category-links"
              aria-label="Categorias"
              onScroll={() => {
                const element = categoryLinksRef.current;
                if (element) {
                  setHasMoreCategories(
                    element.scrollWidth - element.clientWidth - element.scrollLeft >
                      8,
                  );
                }
              }}
            >
            <a
              className={selectedCategory === 'Todos' ? 'active' : ''}
              href="#colecao"
              onClick={() => setCategory('Todos')}
            >
              Todos
            </a>
            {categories.map((name) => (
              <a
                className={selectedCategory === name ? 'active' : ''}
                href="#colecao"
                key={name}
                onClick={() => setCategory(name)}
              >
                {name}
              </a>
            ))}
            <a
              className="category-special"
              href="#colecao"
              onClick={() => setCategory('Todos')}
            >
              Mais vendidos
            </a>
            <a className="category-special" href="#como-funciona">
              Personalizados
            </a>
            </nav>
            {hasMoreCategories && (
              <button
                className="category-scroll-button"
                type="button"
                onClick={showMoreCategories}
                aria-label="Ir para o final das categorias"
                title="Ir para o final das categorias"
              >
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

export default function Home() {
  const [category, setCategory] = useState('Todos');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [imagePreviewProduct, setImagePreviewProduct] =
    useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(
    supabase ? [] : products,
  );
  const [catalogCategories, setCatalogCategories] = useState<string[]>(
    supabase ? [] : ['Adulto', 'Infantil'],
  );
  const [categorySizeOptions, setCategorySizeOptions] = useState<
    Record<string, SizeOption[]>
  >({ Adulto: adultSizeOptions, Infantil: infantSizeOptions });
  const [catalogLoading, setCatalogLoading] = useState(Boolean(supabase));
  const [settings, setSettings] = useState<StoreSettings>(
    DEFAULT_STORE_SETTINGS,
  );
  const [cartOpen, setCartOpen] = useState(false);
  const [cartNotice, setCartNotice] = useState('');
  const [contactPickerOpen, setContactPickerOpen] = useState(false);
  const [contactPickerMode, setContactPickerMode] = useState<
    'order' | 'consultation'
  >('order');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    notes: '',
  });
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [personalizationImage, setPersonalizationImage] = useState(0);
  const heroTouchStartX = useRef<number | null>(null);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('meu-vicio-favoritos');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      /* preferência local indisponível */
    }
  }, []);
  useEffect(() => {
    const interval =
      heroSlide === 1 ? FIDELITY_HERO_INTERVAL : PERSONALIZATION_HERO_INTERVAL;
    const timer = window.setInterval(
      () => setHeroSlide((current) => (current + 1) % 2),
      interval,
    );
    return () => window.clearInterval(timer);
  }, [heroSlide]);
  useEffect(() => {
    const timer = window.setInterval(
      () =>
        setPersonalizationImage(
          (current) => (current + 1) % personalizationImages.length,
        ),
      PERSONALIZATION_SLIDE_INTERVAL,
    );
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.heroSlide = String(heroSlide);
    return () => {
      delete document.documentElement.dataset.heroSlide;
    };
  }, [heroSlide]);
  const visibleSizeOptions = useMemo(() => {
    if (category !== 'Todos') {
      return categorySizeOptions[category] || defaultOptionsForCategory(category);
    }
    const availableOptions = new Map<string, SizeOption>();
    catalogProducts.forEach((product) => {
      (product.sizeOptions || defaultOptionsForCategory(product.category))
        .filter((option) =>
          option.values.some((value) => (product.sizes[value] ?? 0) > 0),
        )
        .forEach((option) => availableOptions.set(option.label, option));
    });
    const standardOptions = sizeOptions.filter((option) =>
      availableOptions.has(option.label),
    );
    const customOptions = Array.from(availableOptions.values()).filter(
      (option) => !sizeOptions.some((item) => item.label === option.label),
    );
    return [...standardOptions, ...customOptions];
  }, [category, categorySizeOptions, catalogProducts]);
  useEffect(() => {
    let mounted = true;
    async function loadCatalog() {
      if (!supabase) return;
      const [{ data }, { data: categoryRows }, { data: categorySizeRows }] =
        await Promise.all([
        supabase
          .from('products')
          .select(
            'id,name,category,color,tag,price,description,image_url,product_sizes(size,quantity)',
          )
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id,name')
          .order('name', { ascending: true }),
        supabase
          .from('category_sizes')
          .select('category_id,size_label,size_values,sort_order')
          .order('sort_order', { ascending: true }),
      ]);
      if (!mounted) return;
      const categoryNamesById = new Map(
        (categoryRows || []).map((row: { id: string; name: string }) => [
          row.id,
          row.name,
        ]),
      );
      const customCategoryOptions: Record<string, SizeOption[]> = {};
      (categorySizeRows || []).forEach(
        (row: {
          category_id: string;
          size_label: string;
          size_values: number[];
        }) => {
          const name = categoryNamesById.get(row.category_id);
          if (!name) return;
          const values = Array.isArray(row.size_values)
            ? row.size_values.map(Number).filter(Number.isFinite)
            : [];
          if (!values.length || !row.size_label) return;
          (customCategoryOptions[name] ||= []).push({
            label: row.size_label,
            values,
          });
        },
      );
      const mergedCategoryOptions: Record<string, SizeOption[]> = {
        Adulto: adultSizeOptions,
        Infantil: infantSizeOptions,
        ...customCategoryOptions,
      };
      setCategorySizeOptions(mergedCategoryOptions);
      const nextProducts = (data || []).map((row) => {
        const image = parseImageUrl(row.image_url);
        const productCategory = String(row.category || 'Adulto');
        return {
          id: row.id,
          name: normalizeProductName(row.name),
          category: productCategory,
          color: row.color || 'Sem cor',
          tag: row.tag || undefined,
          price: Number(row.price),
          description: row.description || 'Confira os detalhes deste modelo.',
          image: image.src,
          imageAdjust: image.adjust,
          sizes: Object.fromEntries(
            (row.product_sizes || []).map(
              (item: { size: number; quantity: number }) => [
                item.size,
                item.quantity,
              ],
            ),
          ),
          sizeOptions:
            mergedCategoryOptions[productCategory] ||
            defaultOptionsForCategory(productCategory),
        };
      });
      setCatalogProducts(nextProducts);
      const available = new Map<string, string>();
      [...(categoryRows || []).map((row: { name?: string }) =>
        String(row.name || '').trim(),
      ), ...nextProducts.map((product) => product.category)].forEach((name) => {
        const normalizedName = name.toLocaleLowerCase();
        if (name && !available.has(normalizedName)) {
          available.set(normalizedName, name);
        }
      });
      setCatalogCategories(
        Array.from(available.values()).sort((a, b) => a.localeCompare(b)),
      );
      setCatalogLoading(false);
    }
    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    let mounted = true;
    async function loadSettings() {
      if (!supabase) return;
      const { data } = await supabase
        .from('store_settings')
        .select(
          'store_name,hours,whatsapp_primary,whatsapp_primary_label,whatsapp_secondary,whatsapp_secondary_label,whatsapp_message',
        )
        .eq('id', 'default')
        .maybeSingle();
      if (!mounted || !data) return;
      setSettings({
        storeName: data.store_name,
        hours: data.hours,
        whatsappPrimary: data.whatsapp_primary,
        whatsappPrimaryLabel: data.whatsapp_primary_label || 'Atendimento principal',
        whatsappSecondary: data.whatsapp_secondary,
        whatsappSecondaryLabel: data.whatsapp_secondary_label,
        whatsappMessage: data.whatsapp_message,
      });
    }
    void loadSettings();
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (
      selectedSize &&
      !visibleSizeOptions.some((option) => option.label === selectedSize)
    )
      setSelectedSize(null);
  }, [selectedSize, visibleSizeOptions]);
  const filteredProducts = useMemo(
    () => {
      const categoryOrder = new Map(
        catalogCategories.map((name, index) => [name.toLocaleLowerCase(), index]),
      );
      return catalogProducts
        .filter((product) => {
          const term = search.trim().toLowerCase();
          const selectedOption = (
            product.sizeOptions || defaultOptionsForCategory(product.category)
          ).find((option) => option.label === selectedSize);
          const hasSize =
            !selectedOption ||
            selectedOption.values.some(
              (value) => (product.sizes[value] ?? 0) > 0,
            );
          return (
            (category === 'Todos' || product.category === category) &&
            hasSize &&
            (!term ||
              `${product.name} ${product.color}`.toLowerCase().includes(term)) &&
            (!showFavoritesOnly || favorites.includes(product.id))
          );
        })
        .sort(
          (first, second) =>
            (categoryOrder.get(first.category.toLocaleLowerCase()) ?? Number.MAX_SAFE_INTEGER) -
            (categoryOrder.get(second.category.toLocaleLowerCase()) ?? Number.MAX_SAFE_INTEGER),
        );
    },
    [
      catalogProducts,
      catalogCategories,
      category,
      search,
      selectedSize,
      showFavoritesOnly,
      favorites,
    ],
  );
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
  function addToCart(product: Product, size: string) {
    const availableQuantity = getAvailableQuantity(product, size);
    const existing = cart.find(
      (item) => item.id === product.id && item.selectedSize === size,
    );
    if (availableQuantity <= 0) {
      setCartNotice(`O tamanho ${size} de ${product.name} está esgotado.`);
      setActiveProduct(null);
      setCartOpen(true);
      return;
    }
    if ((existing?.quantity ?? 0) >= availableQuantity) {
      setCartNotice(
        `Temos apenas ${availableQuantity} ${availableQuantity === 1 ? 'par' : 'pares'} de ${product.name} no tamanho ${size}.`,
      );
      setActiveProduct(null);
      setCartOpen(true);
      return;
    }
    setCart((current) => {
      if (existing)
        return current.map((item) =>
          item.id === product.id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      return [...current, { ...product, selectedSize: size, quantity: 1 }];
    });
    setCartNotice('');
    setActiveProduct(null);
    setCartOpen(true);
  }
  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];
      window.localStorage.setItem('meu-vicio-favoritos', JSON.stringify(next));
      return next;
    });
  }
  function updateQuantity(id: string, size: string, direction: number) {
    const item = cart.find(
      (currentItem) =>
        currentItem.id === id && currentItem.selectedSize === size,
    );
    if (direction > 0 && item) {
      const availableQuantity = getAvailableQuantity(item, size);
      if (item.quantity >= availableQuantity) {
        setCartNotice(
          availableQuantity > 0
            ? `Temos apenas ${availableQuantity} ${availableQuantity === 1 ? 'par' : 'pares'} de ${item.name} no tamanho ${size}.`
            : `O tamanho ${size} de ${item.name} ficou esgotado.`,
        );
        return;
      }
    }
    setCart((current) =>
      current
        .map((item) =>
          item.id === id && item.selectedSize === size
            ? { ...item, quantity: item.quantity + direction }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
    if (direction < 0) setCartNotice('');
  }
  function removeFromCart(id: string, size: string) {
    setCart((current) =>
      current.filter(
        (item) => !(item.id === id && item.selectedSize === size),
      ),
    );
    setCartNotice('');
  }
  function validateCartStock() {
    const unavailableItem = cart.find(
      (item) =>
        item.quantity > getAvailableQuantity(item, item.selectedSize),
    );
    if (!unavailableItem) {
      setCartNotice('');
      return true;
    }
    const availableQuantity = getAvailableQuantity(
      unavailableItem,
      unavailableItem.selectedSize,
    );
    setCartNotice(
      availableQuantity > 0
        ? `Ajuste a quantidade de ${unavailableItem.name}: temos apenas ${availableQuantity} ${availableQuantity === 1 ? 'par' : 'pares'} no tamanho ${unavailableItem.selectedSize}.`
        : `O tamanho ${unavailableItem.selectedSize} de ${unavailableItem.name} ficou esgotado.`,
    );
    return false;
  }
  function recordOrder(number: string) {
    const client = supabase;
    if (!client || !cart.length) return;
    const orderId = crypto.randomUUID();
    const orderItems = cart.map((item) => ({
      order_id: orderId,
      product_id:
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          item.id,
        )
          ? item.id
          : null,
      product_name: item.name,
      selected_size: item.selectedSize,
      quantity: item.quantity,
      unit_price: item.price,
    }));
    void client
      .from('orders')
      .insert({
        id: orderId,
        whatsapp_number: number,
        customer_name: customerDetails.name.trim() || null,
        notes: customerDetails.notes.trim() || null,
        total: cartTotal,
        status: 'Novo',
      })
      .then(({ error }) =>
        error ? null : client.from('order_items').insert(orderItems),
      );
  }
  function sendToWhatsApp(number: string) {
    if (!cart.length || !validateCartStock()) return;
    const lines = cart.map(
      (item) =>
        `- ${item.name} | cor ${item.color} | tamanho ${item.selectedSize} | qtd. ${item.quantity} | ${money(item.price * item.quantity)}`,
    );
    const customerLine = customerDetails.name.trim()
      ? `Cliente: ${customerDetails.name.trim()}`
      : '';
    const notesLine = customerDetails.notes.trim()
      ? `Observações: ${customerDetails.notes.trim()}`
      : '';
    const message = [
      settings.whatsappMessage,
      '',
      customerLine,
      ...lines,
      '',
      notesLine,
      notesLine ? '' : null,
      `Total estimado: ${money(cartTotal)}`,
      '',
      'Podem confirmar a disponibilidade e as formas de pagamento?',
    ]
      .filter((line): line is string => line !== null)
      .join('\n');
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(message)}`,
      '_blank',
    );
    recordOrder(number);
  }
  function openContactPicker(mode: 'order' | 'consultation') {
    setContactPickerMode(mode);
    setContactPickerOpen(true);
  }
  function sendConsultationToWhatsApp(number: string) {
    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(
        'Olá! Gostaria de conhecer os modelos, tamanhos e opções disponíveis.',
      )}`,
      '_blank',
    );
  }

  const whatsappContacts = [
    {
      id: 'atendimento-1',
      name: settings.whatsappPrimaryLabel || 'Atendimento principal',
      number: settings.whatsappPrimary,
      detail: settings.whatsappPrimary,
      demo: false,
    },
    {
      id: 'atendimento-2',
      name: settings.whatsappSecondaryLabel || 'Atendimento 2',
      number: settings.whatsappSecondary,
      detail: settings.whatsappSecondary,
      demo: false,
    },
  ];
  return (
    <main className="site-shell min-h-screen overflow-x-hidden bg-white text-[#1e1e1e]">
      <StoreHeader
        storeName={settings.storeName}
        mobileMenu={mobileMenu}
        setMobileMenu={setMobileMenu}
        search={search}
        setSearch={setSearch}
        setCategory={setCategory}
        categories={catalogCategories}
        selectedCategory={category}
        cartCount={cartCount}
        setCartOpen={setCartOpen}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />
      <section id="inicio" className="catalog-hero">
        <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-12 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:py-20">
          <div className="relative z-10">
            <div
              className="hero-carousel"
              aria-label="Destaques da loja"
              aria-roledescription="carousel"
              aria-live="polite"
              onTouchStart={(event) => {
                heroTouchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                const startX = heroTouchStartX.current;
                const endX = event.changedTouches[0]?.clientX;
                heroTouchStartX.current = null;
                if (startX === null || endX === undefined) return;
                const distance = endX - startX;
                if (Math.abs(distance) < 42) return;
                setHeroSlide((current) => (current + 1) % 2);
              }}
            >
              <div className="hero-carousel-topline">
                <span>deslize pelos destaques</span>
                <div className="hero-carousel-arrows">
                  <button
                    type="button"
                    aria-label="Destaque anterior"
                    onClick={() => setHeroSlide((current) => (current + 1) % 2)}
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <button
                    type="button"
                    aria-label="Próximo destaque"
                    onClick={() => setHeroSlide((current) => (current + 1) % 2)}
                  >
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
              {heroSlide === 0 && (
                <div className="hero-slide">
                  <p className="eyebrow">
                    <Sparkles size={14} /> personalização
                  </p>
                  <h1>
                    Monte seu par do seu <em>jeito.</em>
                  </h1>
                  <p className="hero-copy">
                    A loja também trabalha com Havaianas personalizadas.
                    Consulte os modelos e as opções disponíveis.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a
                      className="primary-button"
                      href="#contato"
                      onClick={(event) => {
                        event.preventDefault();
                        openContactPicker('consultation');
                      }}
                    >
                      Consultar no WhatsApp <MessageCircle size={17} />
                    </a>
                    <a className="secondary-button" href="#colecao">
                      Ver produtos
                    </a>
                  </div>
                </div>
              )}
              {heroSlide === 1 && (
                <div className="hero-slide">
                  <p className="eyebrow">
                    <Sparkles size={14} /> cartão fidelidade
                  </p>
                  <h1>
                    A cada 10 Havaianas, <em>ganhe 1.</em>
                  </h1>
                  <p className="hero-copy">
                    Junte suas compras, acompanhe sua fidelidade e aproveite uma
                    Havaiana de presente ao completar 10 unidades.
                  </p>
                  <div className="mt-7 flex flex-wrap gap-3">
                    <a className="primary-button" href="#colecao">
                      Começar a juntar <ArrowRight size={17} />
                    </a>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => openContactPicker('consultation')}
                    >
                      Falar com a loja
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          {heroSlide === 0 ? (
            <div
              className="hero-story-card hero-personalization-card"
              role="group"
              aria-roledescription="carousel"
              aria-label="Imagens de personalização"
            >
              <img
                key={personalizationImages[personalizationImage].src}
                src={personalizationImages[personalizationImage].src}
                alt={personalizationImages[personalizationImage].alt}
              />
              <div className="hero-story-overlay">
                <span>personalize do seu jeito:</span>
                <strong>
                  Escolha os melhores pingentes
                  <br />
                  para personalizar seu par.
                </strong>
              </div>
              <button
                className="hero-story-arrow previous"
                type="button"
                aria-label="Imagem anterior de personalização"
                onClick={() =>
                  setPersonalizationImage(
                    (current) =>
                      (current + personalizationImages.length - 1) %
                      personalizationImages.length,
                  )
                }
              >
                <ArrowLeft size={16} />
              </button>
              <button
                className="hero-story-arrow next"
                type="button"
                aria-label="Próxima imagem de personalização"
                onClick={() =>
                  setPersonalizationImage(
                    (current) => (current + 1) % personalizationImages.length,
                  )
                }
              >
                <ArrowRight size={16} />
              </button>
              <div
                className="hero-story-dots"
                role="tablist"
                aria-label="Fotos de personalização"
              >
                {personalizationImages.map((image, index) => (
                  <button
                    key={image.src}
                    className={personalizationImage === index ? 'active' : ''}
                    type="button"
                    role="tab"
                    aria-label={`Mostrar imagem ${index + 1}`}
                    aria-selected={personalizationImage === index}
                    onClick={() => setPersonalizationImage(index)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="hero-story-card hero-loyalty-card">
              <img
                src="/products/hero-fidelidade-modelo.png"
                alt="Cartão de fidelidade com dez marcações ao lado de Havaianas vermelhas e brancas"
              />
              <div className="hero-story-overlay">
                <span>benefício para clientes</span>
                <strong>
                  Volte sempre.
                  <br />A próxima conquista é sua.
                </strong>
              </div>
            </div>
          )}
          <div className="hero-carousel-support">
            {heroSlide === 0 ? (
              <div className="hero-notes">
                <span>
                  <Check size={15} /> Atendimento personalizado
                </span>
                <span>
                  <Check size={15} /> Consulte as opções
                </span>
              </div>
            ) : (
              <div className="hero-notes">
                <span>
                  <Check size={15} /> Benefício para clientes
                </span>
                <span>
                  <Check size={15} /> Consulte as regras na loja
                </span>
              </div>
            )}
            <div className="hero-carousel-progress" aria-hidden="true">
              <span style={{ width: ((heroSlide + 1) / 2) * 100 + '%' }} />
            </div>
            <div
              className="hero-carousel-tabs"
              role="tablist"
              aria-label="Destaques"
            >
              <button
                className={
                  heroSlide === 0
                    ? 'hero-carousel-tab active'
                    : 'hero-carousel-tab'
                }
                type="button"
                role="tab"
                aria-selected={heroSlide === 0}
                onClick={() => setHeroSlide(0)}
              >
                <span>01</span> Personalização
              </button>
              <button
                className={
                  heroSlide === 1
                    ? 'hero-carousel-tab active'
                    : 'hero-carousel-tab'
                }
                type="button"
                role="tab"
                aria-selected={heroSlide === 1}
                onClick={() => setHeroSlide(1)}
              >
                <span>02</span> Fidelidade
              </button>
            </div>
          </div>
        </div>
      </section>
      <section
        id="colecao"
        className="mx-auto max-w-[1240px] px-5 py-10 lg:px-8 lg:py-16"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow warm">nossa seleção</p>
            <h2>
              {showFavoritesOnly
                ? 'Seus favoritos'
                : 'Escolha pelo seu tamanho'}
            </h2>
          </div>
          <p>
            {showFavoritesOnly
              ? 'Os modelos que você salvou ficam disponíveis aqui neste aparelho.'
              : 'Filtre por faixa de numeração ou escolha entre adulto e infantil.'}
          </p>
        </div>
        <div className="filters-panel">
          <div className="filter-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar modelo ou cor"
              aria-label="Buscar modelo ou cor"
            />
          </div>
          <label className="category-select">
            <span>Categoria</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Todos</option>
              {catalogCategories.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </label>
          <div className="size-filter-row">
            <div className="filter-label">
              <Filter size={16} /> Tamanho
            </div>
            <div className="size-list" aria-label="Filtrar por tamanho">
              <button
                className={
                  selectedSize === null ? 'size-chip active' : 'size-chip'
                }
                onClick={() => {
                  setSelectedSize(null);
                  setCategory('Todos');
                }}
                type="button"
              >
                Todos
              </button>
              {visibleSizeOptions.map((option) => (
                <button
                  key={option.label}
                  className={
                    selectedSize === option.label
                      ? 'size-chip active'
                      : 'size-chip'
                  }
                  onClick={() => setSelectedSize(option.label)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="results-row">
          <span>
            <strong>{catalogLoading ? '—' : filteredProducts.length}</strong>{' '}
            modelos encontrados
          </span>
          <span className="results-actions">
            {showFavoritesOnly && (
              <button type="button" onClick={() => setShowFavoritesOnly(false)}>
                Ver todos <X size={14} />
              </button>
            )}
            {selectedSize && (
              <button type="button" onClick={() => setSelectedSize(null)}>
                Limpar tamanho <X size={14} />
              </button>
            )}
          </span>
        </div>
        {catalogLoading ? (
          <div className="empty-state">
            <span>
              <Search size={21} />
            </span>
            <h3>Carregando catálogo...</h3>
            <p>Buscando os produtos cadastrados pela loja.</p>
          </div>
        ) : filteredProducts.length ? (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              const availableSizes = (
                product.sizeOptions || defaultOptionsForCategory(product.category)
              ).filter((option) =>
                option.values.some((value) => (product.sizes[value] ?? 0) > 0),
              );
              const isFavorite = favorites.includes(product.id);
              return (
                <article key={product.id} className="product-card">
                  <div
                    className={`product-image ${product.color.toLowerCase().replace(' ', '-')}`}
                  >
                    {product.tag && (
                      <span className="product-tag">{product.tag}</span>
                    )}
                    <button
                      className={
                        isFavorite ? 'product-heart active' : 'product-heart'
                      }
                      type="button"
                      aria-pressed={isFavorite}
                      aria-label={
                        isFavorite
                          ? `Remover ${product.name} dos favoritos`
                          : `Favoritar ${product.name}`
                      }
                      onClick={() => toggleFavorite(product.id)}
                    >
                      <Heart
                        size={17}
                        fill={isFavorite ? 'currentColor' : 'none'}
                      />
                    </button>
                    <button
                      className="product-image-open"
                      type="button"
                      onClick={() => setImagePreviewProduct(product)}
                      aria-label={`Abrir foto completa de ${product.name}`}
                    >
                      <img
                        style={imageAdjustStyle(product.imageAdjust)}
                        src={product.image}
                        alt={`${product.name} - ${product.color}`}
                      />
                    </button>
                    <span className="product-color-dot" title={product.color} />
                  </div>
                  <div className="product-info">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="product-category">
                          {productCategoryLabel(product.category)}{' '}
                          <span>•</span> {product.color}
                        </span>
                        <h3>{product.name}</h3>
                      </div>
                      <strong className="product-price">
                        {money(product.price)}
                      </strong>
                    </div>
                    <p>{product.description}</p>
                    <div className="available-row">
                      <span>Tamanhos disponíveis</span>
                      <div className="available-sizes">
                        {availableSizes.slice(0, 6).map((option) => (
                          <span key={option.label}>{option.label}</span>
                        ))}
                        {availableSizes.length > 6 && (
                          <span>+{availableSizes.length - 6}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="choose-button"
                      type="button"
                      onClick={() => setActiveProduct(product)}
                    >
                      Escolher tamanho <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <span>
              <Heart size={21} />
            </span>
            <h3>
              {showFavoritesOnly
                ? 'Você ainda não salvou favoritos'
                : 'Nenhum modelo encontrado'}
            </h3>
            <p>
              {showFavoritesOnly
                ? 'Toque no coração de um produto para encontrá-lo rapidamente depois.'
                : 'Experimente outra numeração ou limpe os filtros.'}
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => {
                setSelectedSize(null);
                setSearch('');
                setShowFavoritesOnly(false);
              }}
            >
              Ver todos os produtos
            </button>
          </div>
        )}
      </section>
      <section id="como-funciona" className="how-section">
        <div className="mx-auto max-w-[1240px] px-5 py-12 lg:px-8 lg:py-16">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow warm">simples assim</p>
              <h2>Do catálogo para o WhatsApp</h2>
            </div>
            <p>
              Você escolhe o modelo, confirma o tamanho e a loja continua o
              atendimento por mensagem.
            </p>
          </div>
          <div className="how-grid">
            {[
              [
                '01',
                'Encontre',
                'Filtre por categoria ou escolha diretamente a sua numeração.',
              ],
              [
                '02',
                'Monte sua sacola',
                'Selecione o produto e o tamanho que deseja consultar.',
              ],
              [
                '03',
                'Fale com a loja',
                'Envie tudo pelo WhatsApp e confirme disponibilidade e pagamento.',
              ],
            ].map(([number, title, text]) => (
              <div className="how-card" key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer id="contato" className="site-footer">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-6 px-5 py-8 sm:flex-row sm:items-end sm:justify-between lg:px-8">
          <div>
            <Brand storeName={settings.storeName} />
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#826f63]">
              Calçados escolhidos para fazer parte dos seus momentos.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="footer-label">Atendimento</p>
            <button
              type="button"
              onClick={() => openContactPicker('consultation')}
              className="footer-phone"
            >
              {settings.whatsappPrimary}
            </button>
            <p className="text-xs text-[#9e897a]">{settings.hours}</p>
          </div>
        </div>
      </footer>
      {activeProduct && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setActiveProduct(null)}
        >
          <div
            className="size-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setActiveProduct(null)}
              aria-label="Fechar"
            >
              <X size={19} />
            </button>
            <div className="modal-product-image">
              <img
                style={imageAdjustStyle(activeProduct.imageAdjust)}
                src={activeProduct.image}
                alt=""
              />
            </div>
            <div className="modal-content">
              <span className="product-category">
                {productCategoryLabel(activeProduct.category)} •{' '}
                {activeProduct.color}
              </span>
              <h2 id="size-modal-title">{activeProduct.name}</h2>
              <p>{activeProduct.description}</p>
              <strong className="modal-price">
                {money(activeProduct.price)}
              </strong>
              <span className="modal-label">Escolha o tamanho</span>
              <div className="modal-sizes">
                {(
                  activeProduct.sizeOptions ||
                  defaultOptionsForCategory(activeProduct.category)
                ).map((option) => {
                  const available = option.values.some(
                    (value) => (activeProduct.sizes[value] ?? 0) > 0,
                  );
                  return (
                    <button
                      disabled={!available}
                      className={
                        available ? 'size-chip' : 'size-chip unavailable'
                      }
                      type="button"
                      key={option.label}
                      onClick={() => addToCart(activeProduct, option.label)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <small className="modal-hint">
                As faixas apagadas estão indisponíveis no momento.
              </small>
            </div>
          </div>
        </div>
      )}
      {imagePreviewProduct && (
        <div
          className="modal-backdrop full-image-backdrop"
          role="presentation"
          onClick={() => setImagePreviewProduct(null)}
        >
          <div
            className="full-image-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="full-image-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setImagePreviewProduct(null)}
              aria-label="Fechar foto completa"
            >
              <X size={19} />
            </button>
            <div className="full-image-frame">
              <img
                src={imagePreviewProduct.image}
                alt={`${imagePreviewProduct.name} - ${imagePreviewProduct.color}`}
              />
            </div>
            <div className="full-image-caption">
              <span className="product-category">
                {productCategoryLabel(imagePreviewProduct.category)} •{' '}
                {imagePreviewProduct.color}
              </span>
              <h2 id="full-image-title">{imagePreviewProduct.name}</h2>
              <button
                className="choose-button"
                type="button"
                onClick={() => {
                  setImagePreviewProduct(null);
                  setActiveProduct(imagePreviewProduct);
                }}
              >
                Escolher tamanho <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      {cartOpen && (
        <div
          className="drawer-backdrop"
          role="presentation"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="drawer-header">
              <div>
                <span className="eyebrow warm">seu pedido</span>
                <h2 id="cart-title">
                  Minha sacola <span>({cartCount})</span>
                </h2>
              </div>
              <button
                className="modal-close"
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Fechar sacola"
              >
                <X size={19} />
              </button>
            </div>
            {cart.length ? (
              <>
                <div className="drawer-items">
                  {cart.map((item) => (
                    <div
                      className="drawer-item"
                      key={`${item.id}-${item.selectedSize}`}
                    >
                      <div className="drawer-thumb">
                        <img src={item.image} alt="" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3>{item.name}</h3>
                        <p>
                          Tamanho {item.selectedSize} •{' '}
                          <span className="drawer-unit-price">
                            {money(item.price)}
                          </span>
                        </p>
                        <div className="quantity-control">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.selectedSize, -1)
                            }
                          >
                            <Minus size={13} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.selectedSize, 1)
                            }
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                      <strong>{money(item.price * item.quantity)}</strong>
                      <button
                        className="remove-cart-item"
                        type="button"
                        aria-label={`Remover ${item.name} do pedido`}
                        title="Remover produto"
                        onClick={() =>
                          removeFromCart(item.id, item.selectedSize)
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {cartNotice && (
                  <div className="cart-stock-notice" role="alert">
                    {cartNotice}
                  </div>
                )}
                <div className="drawer-order-fields">
                  <label>
                    Seu nome (opcional)
                    <input
                      value={customerDetails.name}
                      onChange={(event) =>
                        setCustomerDetails({
                          ...customerDetails,
                          name: event.target.value,
                        })
                      }
                      placeholder="Ex.: Maria Silva"
                    />
                  </label>
                  <label>
                    Observações (opcional)
                    <textarea
                      value={customerDetails.notes}
                      onChange={(event) =>
                        setCustomerDetails({
                          ...customerDetails,
                          notes: event.target.value,
                        })
                      }
                      placeholder="Ex.: cor ou preferência de entrega"
                      rows={2}
                    />
                  </label>
                </div>
                <div className="drawer-total">
                  <span>Total estimado</span>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <button
                  className="whatsapp-button"
                  type="button"
                  onClick={() => {
                    if (validateCartStock()) openContactPicker('order');
                  }}
                >
                  Enviar pedido pelo WhatsApp <ArrowRight size={17} />
                </button>
                <button
                  className="continue-shopping-button secondary-button"
                  type="button"
                  onClick={() => {
                    setCartOpen(false);
                    document
                      .getElementById('colecao')
                      ?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Continuar comprando <ArrowRight size={16} />
                </button>
                <p className="drawer-note">
                  A loja confirmará disponibilidade, pagamento e entrega pelo
                  WhatsApp.
                </p>
              </>
            ) : (
              <div className="empty-cart">
                <ShoppingBag size={30} />
                <h3>Sua sacola está vazia</h3>
                <p>Escolha um modelo e um tamanho para começar.</p>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setCartOpen(false)}
                >
                  Ver produtos
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {contactPickerOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setContactPickerOpen(false)}
        >
          <div
            className="contact-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setContactPickerOpen(false)}
              aria-label="Fechar escolha de atendimento"
            >
              <X size={19} />
            </button>
            <span className="eyebrow warm">escolha o atendimento</span>
            <h2 id="contact-modal-title">
              {contactPickerMode === 'order'
                ? 'Para quem você quer enviar?'
                : 'Fale com a loja'}
            </h2>
            <p>
              {contactPickerMode === 'order'
                ? 'O pedido será enviado com os produtos, tamanhos e quantidades escolhidos.'
                : 'Escolha um atendimento para tirar dúvidas e consultar modelos, tamanhos e opções.'}
            </p>
            <div className="contact-options">
              {whatsappContacts.map((contact) => (
                <button
                  className="contact-option"
                  type="button"
                  key={contact.id}
                  onClick={() => {
                    setContactPickerOpen(false);
                    if (contactPickerMode === 'order') {
                      setCartOpen(false);
                      sendToWhatsApp(contact.number);
                    } else {
                      sendConsultationToWhatsApp(contact.number);
                    }
                  }}
                >
                  <span className="contact-option-icon">
                    <MessageCircle size={19} />
                  </span>
                  <span className="contact-option-copy">
                    <strong>
                      {contact.name}
                      {contact.demo && <em> demonstração</em>}
                    </strong>
                    <small>{contact.detail}</small>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
