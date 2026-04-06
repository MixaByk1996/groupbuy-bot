import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import {
  formatCurrency,
  formatTime,
  getInitials,
  getAvatarColor,
  getRoleText,
  getStatusText,
} from '../utils/helpers';
import {
  RequestsIcon,
  ShoppingBagIcon,
  MailIcon,
  HistoryIcon,
  PlusIcon,
  HomeIcon,
  FileIcon,
  SearchIcon,
} from './Icons';
import CompanyCardModal from './CompanyCardModal';
import PriceListModal from './PriceListModal';
import NewsModal from './NewsModal';
import WithdrawModal from './WithdrawModal';
import CreateRequestModal from './CreateRequestModal';
import ClosingDocumentsModal from './ClosingDocumentsModal';

// ─── Icons ────────────────────────────────────────────────────────────────────

function CloudDownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
  );
}

function SwapRoleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 3l4 4-4 4" />
      <line x1="20" y1="7" x2="4" y2="7" />
      <path d="M8 21l-4-4 4-4" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function InvitationIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

// ─── LC Slider categories with content metadata ──────────────────────────────

const LC_SLIDER_CATEGORIES = [
  {
    id: 'subscriptions',
    label: 'Подписки',
    description: 'Каналы и блоги на которые вы подписаны. Последние посты от авторов.',
    icon: '⭐',
  },
  {
    id: 'exchange',
    label: 'Биржа',
    description: 'Список желающих купить и продать. Оставьте заявку с ценой и описанием.',
    icon: '📈',
  },
  {
    id: 'rest',
    label: 'Отдых',
    description: 'Запросы и предложения по отдыху. Укажите когда, где, описание.',
    icon: '🏖',
  },
  {
    id: 'competitions',
    label: 'Соревнования',
    description: 'Правила, запросы участников и приглашения от организаторов.',
    icon: '🏆',
  },
  {
    id: 'housing',
    label: 'Жилье',
    description: 'Проект «Честное жильё». Запросы на покупку недвижимости.',
    icon: '🏠',
  },
  {
    id: 'news',
    label: 'Новости',
    description: 'Посты от организаторов и поставщиков по интересам.',
    icon: '📰',
  },
  {
    id: 'blogs',
    label: 'Блоги / Каналы',
    description: 'Лента последних постов: сначала ваши подписки, затем все остальные.',
    icon: '📝',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Telegram-style top header bar: Avatar | Download App | Change Role */
function CabinetTopBar({ user, onDownloadApp, onChangeRole }) {
  const initials = getInitials(user.first_name, user.last_name);
  const avatarBg = getAvatarColor(user.first_name || '');
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '10px 16px',
      background: 'var(--tg-bg-primary)',
      borderBottom: '1px solid var(--tg-border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {/* Avatar button */}
      <button
        onClick={() => {}}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: avatarBg,
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1rem',
          fontWeight: 700,
          flexShrink: 0,
        }}
        title={`${user.first_name} ${user.last_name || ''}`}
      >
        {initials}
      </button>

      {/* User name */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--tg-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.first_name} {user.last_name || ''}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
          {getRoleText(user.role)}
        </div>
      </div>

      {/* Download App button */}
      <button
        className="lc-top-btn"
        onClick={onDownloadApp}
        title="Скачать приложение"
      >
        <CloudDownloadIcon />
        <span>Приложение</span>
      </button>

      {/* Change Role button */}
      <button
        className="lc-top-btn lc-top-btn--accent"
        onClick={onChangeRole}
        title="Сменить роль"
      >
        <SwapRoleIcon />
        <span>Роль</span>
      </button>
    </div>
  );
}

/** Balance button — single wide row, bank API style */
function BalanceButton({ balance, onDeposit, onWithdraw }) {
  return (
    <div style={{
      margin: '8px 16px',
      background: 'var(--tg-bg-secondary)',
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      cursor: 'pointer',
      boxShadow: 'var(--tg-shadow)',
    }}
      onClick={onDeposit}
    >
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: 'var(--tg-primary)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <BankIcon />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>Баланс</div>
        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--tg-text-primary)' }}>
          {formatCurrency(balance || 0)}
        </div>
      </div>
      <button
        className="btn btn-outline btn-round"
        style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', whiteSpace: 'nowrap' }}
        onClick={(e) => { e.stopPropagation(); onWithdraw(); }}
      >
        Вывести
      </button>
    </div>
  );
}

/** Horizontal carousel slider — exactly 4-text-line height, 280-320pt wide cards */
function LCCarousel({ categories, activeCategory, onSelect }) {
  return (
    <div style={{ padding: '0 0 8px 0', position: 'relative' }}>
      <div style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '8px',
        padding: '4px 16px 4px 16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            style={{
              flexShrink: 0,
              width: 300,
              height: 108, // ~4 lines of text at 16px line-height + padding
              borderRadius: 10,
              border: activeCategory === cat.id
                ? '2px solid var(--tg-primary)'
                : '1px solid var(--tg-border-light)',
              background: activeCategory === cat.id
                ? 'rgba(52, 168, 240, 0.08)'
                : 'var(--tg-bg-secondary)',
              cursor: 'pointer',
              padding: '10px 14px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: 'var(--tg-shadow)',
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{cat.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--tg-text-primary)' }}>
                {cat.label}
              </span>
            </div>
            <span style={{
              fontSize: '0.78rem',
              color: 'var(--tg-text-secondary)',
              lineHeight: '1.4',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {cat.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/** Telegram-style search bar */
function SearchBar({ value, onChange, placeholder = 'Поиск...' }) {
  return (
    <div style={{
      margin: '0 16px 8px',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--tg-text-muted)',
        pointerEvents: 'none',
        display: 'flex',
      }}>
        <SearchIcon />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          height: 40,
          background: 'var(--tg-bg-secondary)',
          border: '1px solid var(--tg-border-light)',
          borderRadius: 20,
          padding: '0 16px 0 44px',
          fontSize: '0.9rem',
          color: 'var(--tg-text-primary)',
          outline: 'none',
        }}
      />
    </div>
  );
}

/** A single full-width action row — Telegram list item style, 2-line-height buttons */
function ActionRow({ icon, label, badge, onClick, danger }) {
  return (
    <div
      className="cabinet-menu-item"
      onClick={onClick}
      style={{
        minHeight: 56,
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        cursor: 'pointer',
        borderBottom: '1px solid var(--tg-border-light)',
        background: 'var(--tg-bg-primary)',
        transition: 'background 0.15s',
      }}
    >
      <span style={{ color: danger ? 'var(--tg-error)' : '#34A8F0', display: 'flex', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{
        flex: 1,
        fontSize: '0.95rem',
        fontWeight: 400,
        color: danger ? 'var(--tg-error)' : 'var(--tg-text-primary)',
      }}>
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span style={{
          background: '#34A8F0',
          color: '#fff',
          borderRadius: 12,
          fontSize: '0.7rem',
          padding: '0 7px',
          minWidth: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
        }}>
          {badge}
        </span>
      )}
      <span style={{ color: 'var(--tg-text-muted)', display: 'flex' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </span>
    </div>
  );
}

/** Section group header */
function SectionHeader({ title }) {
  return (
    <div style={{
      padding: '16px 16px 6px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: 'var(--tg-text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>
      {title}
    </div>
  );
}

/** Card content panel shown below an ActionRow when expanded */
function ContentPanel({ children }) {
  return (
    <div style={{
      background: 'var(--tg-bg-secondary)',
      borderBottom: '1px solid var(--tg-border-light)',
      padding: '8px 16px 12px',
    }}>
      {children}
    </div>
  );
}

// ─── Category page content ────────────────────────────────────────────────────

function CategoryPageContent({ category, procurements, user, newsFeed, newsFeedLoading, onLoadNewsFeed, navigate }) {
  if (!category) return null;

  if (category.id === 'subscriptions') {
    return (
      <div style={{ padding: '0 16px' }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--tg-text-secondary)', padding: '8px 0' }}>
          Последние посты из ваших подписок появятся здесь.
        </p>
      </div>
    );
  }

  if (category.id === 'exchange') {
    const allProcs = [
      ...(procurements?.organized || []),
      ...(procurements?.participating || []),
    ].filter((p) => p.status === 'active');
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', padding: '4px 0' }}>
          Биржа — список желающих купить и продать.
        </p>
        {allProcs.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)' }}>Нет активных позиций</p>
        ) : (
          allProcs.slice(0, 5).map((p) => (
            <div
              key={p.id}
              onClick={() => navigate && navigate(`/chat/${p.id}`)}
              style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', boxShadow: 'var(--tg-shadow)', cursor: 'pointer' }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
                {p.city} · {formatCurrency(p.current_amount || 0)} · {p.participant_count || 0} участн.
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  if (category.id === 'news') {
    return (
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', margin: 0 }}>
            Посты от организаторов и поставщиков.
          </p>
          <button
            className="btn btn-outline btn-round"
            style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={onLoadNewsFeed}
            disabled={newsFeedLoading}
          >
            {newsFeedLoading ? 'Загрузка...' : '🔄 Обновить'}
          </button>
        </div>
        {newsFeed.length === 0 && !newsFeedLoading && (
          <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)' }}>
            Нажмите «Обновить» чтобы загрузить новости
          </p>
        )}
        {newsFeed.map((item) => (
          <div
            key={item.id}
            onClick={() => item.procurement_id && navigate && navigate(`/chat/${item.procurement_id}`)}
            style={{
              background: 'var(--tg-bg-primary)',
              borderRadius: 8,
              padding: '10px 12px',
              boxShadow: 'var(--tg-shadow)',
              cursor: item.procurement_id ? 'pointer' : 'default',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--tg-text-primary)', marginBottom: 6, lineHeight: 1.4 }}>{item.text}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)', fontWeight: 500 }}>{item.author}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)' }}>{formatTime(item.date)}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // For all other categories
  return (
    <div style={{ padding: '0 16px' }}>
      <p style={{ fontSize: '0.875rem', color: 'var(--tg-text-secondary)', padding: '8px 0' }}>
        {category.description}
      </p>
      <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-muted)' }}>Раздел разрабатывается...</p>
    </div>
  );
}

// ─── Main Cabinet component ───────────────────────────────────────────────────

function Cabinet() {
  const navigate = useNavigate();
  const { user, openDepositModal, openCreateProcurementModal, logout, addToast, openLoginModal } = useStore();
  const [userStats, setUserStats] = useState(null);
  const [companyCardOpen, setCompanyCardOpen] = useState(false);
  const [priceListOpen, setPriceListOpen] = useState(false);
  const [newsOpen, setNewsOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const [closingDocsOpen, setClosingDocsOpen] = useState(false);
  const [selectedOrderTableId, setSelectedOrderTableId] = useState(null);
  const [roleSwitchOpen, setRoleSwitchOpen] = useState(false);

  const [myProcurements, setMyProcurements] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [procurementHistory, setProcurementHistory] = useState([]);
  const [paymentProcurements, setPaymentProcurements] = useState([]);
  const [orderTables, setOrderTables] = useState([]);
  const [shipmentHistory, setShipmentHistory] = useState([]);

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const userSearchTimeout = React.useRef(null);

  // Add participant modal state
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [addParticipantProcurement, setAddParticipantProcurement] = useState(null);
  const [addParticipantUserQuery, setAddParticipantUserQuery] = useState('');
  const [addParticipantResults, setAddParticipantResults] = useState([]);
  const [addParticipantLoading, setAddParticipantLoading] = useState(false);
  const [addParticipantSelected, setAddParticipantSelected] = useState(null);
  const [addParticipantAmount, setAddParticipantAmount] = useState('');
  const [addParticipantQuantity, setAddParticipantQuantity] = useState('1');
  const addParticipantSearchTimeout = React.useRef(null);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, type: 'category', name: 'Биржа', active: true },
    { id: 2, type: 'category', name: 'Быт', active: true },
    { id: 3, type: 'organizer', name: 'Организатор Иванов', active: false },
  ]);
  const [newSubscription, setNewSubscription] = useState('');

  // Messages/Invitations
  const [messages, setMessages] = useState([]);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Invitations
  const [invitations, setInvitations] = useState([]);

  // Pending procurements
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  // Approve supplier modal
  const [approveSupplierOpen, setApproveSupplierOpen] = useState(false);
  const [approveSupplierProcurement, setApproveSupplierProcurement] = useState(null);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [supplierSearchResults, setSupplierSearchResults] = useState([]);
  const [supplierSearchLoading, setSupplierSearchLoading] = useState(false);
  const supplierSearchTimeout = React.useRef(null);

  // News feed state
  const [newsFeed, setNewsFeed] = useState([]);
  const [newsFeedLoading, setNewsFeedLoading] = useState(false);

  // LC state
  const [activeSection, setActiveSection] = useState(null);
  const [selectedCarouselCategory, setSelectedCarouselCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;
    const loadStats = async () => {
      try {
        const [balance, procurements, notifications] = await Promise.all([
          api.getUserBalance(user.id).catch(() => null),
          api.getUserProcurements(user.id).catch(() => null),
          api.getNotifications(user.id).catch(() => null),
        ]);

        if (notifications) {
          const notifList = notifications.results || notifications;
          const invites = notifList.filter((n) => n.notification_type === 'invite' || n.notification_type === 'invitation');
          const msgs = notifList.filter((n) => n.notification_type !== 'invite' && n.notification_type !== 'invitation');
          setInvitations(invites.map((n) => ({
            id: n.id,
            from: n.sender_name || 'Организатор',
            text: n.title ? `${n.title}: ${n.message}` : n.message,
            date: n.created_at,
            read: n.is_read,
            procurement_id: n.procurement_id || n.related_object_id,
          })));
          setMessages(msgs.map((n) => ({
            id: n.id,
            from: n.notification_type === 'system' ? 'Система' : (n.sender_name || 'Администратор'),
            text: n.title ? `${n.title}: ${n.message}` : n.message,
            date: n.created_at,
            read: n.is_read,
          })));
        }

        let organized = [];
        let participating = [];
        if (procurements) {
          if (Array.isArray(procurements)) {
            organized = procurements.filter((p) => p.organizer === user.id);
            participating = procurements.filter((p) => p.organizer !== user.id);
          } else {
            organized = procurements.organized || [];
            participating = procurements.participating || [];
          }
        }
        const procs = [...organized, ...participating];
        setMyProcurements({ organized, participating });
        setPaymentProcurements(organized.filter((p) => p.status === 'payment' || p.status === 'stopped'));
        const history = procs.filter((p) => p.status === 'completed' || p.status === 'cancelled');
        setProcurementHistory(history);

        setUserStats({
          balance: balance || {},
          procurementsCount: procs.length,
          activeProcurements: procs.filter((p) => p.status === 'active').length,
          completedProcurements: procs.filter((p) => p.status === 'completed').length,
        });
      } catch {
        // ignore stats loading errors
      }
    };
    loadStats();
  }, [user]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleSaveCompanyCard = async (data) => {
    try {
      await api.updateUser(user.id, {
        first_name: data.company_name,
        phone: data.phone,
        email: data.email,
      });
      addToast('Карточка компании сохранена', 'success');
    } catch {
      addToast('Ошибка сохранения карточки компании', 'error');
      throw new Error('Save failed');
    }
  };

  const handleSavePriceList = async () => {
    addToast('Прайс-лист загружен', 'success');
  };

  const handleSaveNews = async () => {
    addToast('Новость опубликована', 'success');
  };

  const handleSaveRequest = async (data) => {
    const newRequest = { id: Date.now(), ...data, created_at: new Date().toISOString() };
    setMyRequests((prev) => [newRequest, ...prev]);
    addToast('Запрос успешно создан', 'success');
  };

  const handleDeleteRequest = (id) => {
    setMyRequests((prev) => prev.filter((r) => r.id !== id));
    addToast('Запрос удалён', 'info');
  };

  const handleProcurementStatusChange = async (procurementId, newStatus) => {
    try {
      await api.updateProcurementStatus(procurementId, newStatus, user.id);
      setMyProcurements((prev) => {
        if (!prev) return prev;
        const updateList = (list) =>
          list.map((p) => p.id === procurementId ? { ...p, status: newStatus } : p);
        return { organized: updateList(prev.organized), participating: updateList(prev.participating) };
      });
      setPaymentProcurements((prev) =>
        prev.map((p) => p.id === procurementId ? { ...p, status: newStatus } : p)
      );
      setProcurementHistory((prev) =>
        prev.map((p) => p.id === procurementId ? { ...p, status: newStatus } : p)
      );
      addToast('Статус закупки обновлён', 'success');
    } catch (error) {
      addToast(error.message || 'Ошибка при изменении статуса', 'error');
    }
  };

  const handleSendClosingDocuments = async () => {
    addToast('Закрывающие документы отправлены покупателям', 'success');
  };

  const handleAddSubscription = () => {
    const name = newSubscription.trim();
    if (!name) return;
    setSubscriptions((prev) => [...prev, { id: Date.now(), type: 'category', name, active: true }]);
    setNewSubscription('');
    addToast('Подписка добавлена', 'success');
  };

  const handleToggleSubscription = (id) => {
    setSubscriptions((prev) => prev.map((s) => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleDeleteSubscription = (id) => {
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    addToast('Подписка удалена', 'info');
  };

  const handleMarkMessageRead = async (id) => {
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
  };

  const handleMarkInvitationRead = async (id) => {
    try {
      await api.markNotificationRead(id);
    } catch {
      // ignore
    }
    setInvitations((prev) => prev.map((inv) => inv.id === id ? { ...inv, read: true } : inv));
  };

  const handleReplyMessage = async () => {
    if (!replyText.trim() || !replyTarget) return;
    try {
      await api.sendMessage({ text: replyText, recipient_id: replyTarget.sender_id });
      addToast('Ответ отправлен', 'success');
    } catch {
      addToast('Ошибка отправки ответа', 'error');
    }
    setReplyTarget(null);
    setReplyText('');
  };

  const handleStopProcurement = async (procurement) => {
    if (!window.confirm(`Остановить закупку "${procurement.title}"? Участники получат уведомление с запросом подтверждения.`)) return;
    try {
      await api.stopProcurement(procurement.id);
      setMyProcurements((prev) => {
        if (!prev) return prev;
        const updateList = (list) => list.map((p) => p.id === procurement.id ? { ...p, status: 'stopped' } : p);
        return { organized: updateList(prev.organized), participating: updateList(prev.participating) };
      });
      setPaymentProcurements((prev) => prev.map((p) => p.id === procurement.id ? { ...p, status: 'stopped' } : p));
      addToast('Закупка остановлена. Создан закрытый чат для участников.', 'success');
    } catch (err) {
      addToast(err.message || 'Ошибка остановки закупки', 'error');
    }
  };

  const handleOpenApproveSupplier = (procurement) => {
    setApproveSupplierProcurement(procurement);
    setSupplierSearchQuery('');
    setSupplierSearchResults([]);
    setApproveSupplierOpen(true);
  };

  const handleSupplierSearch = (query) => {
    setSupplierSearchQuery(query);
    if (supplierSearchTimeout.current) clearTimeout(supplierSearchTimeout.current);
    if (!query.trim()) { setSupplierSearchResults([]); return; }
    supplierSearchTimeout.current = setTimeout(async () => {
      setSupplierSearchLoading(true);
      try {
        const results = await api.searchUsers(query);
        const all = Array.isArray(results) ? results : (results.results || []);
        setSupplierSearchResults(all.filter((u) => u.role === 'supplier'));
      } catch {
        setSupplierSearchResults([]);
      } finally {
        setSupplierSearchLoading(false);
      }
    }, 400);
  };

  const handleApproveSupplierSubmit = async (supplier) => {
    if (!approveSupplierProcurement) return;
    try {
      await api.approveSupplier(approveSupplierProcurement.id, supplier.id);
      setMyProcurements((prev) => {
        if (!prev) return prev;
        const updateList = (list) => list.map((p) => p.id === approveSupplierProcurement.id ? { ...p, supplier: supplier.id, supplier_name: `${supplier.first_name || ''} ${supplier.last_name || ''}`.trim() } : p);
        return { organized: updateList(prev.organized), participating: updateList(prev.participating) };
      });
      addToast(`Поставщик ${supplier.first_name || ''} ${supplier.last_name || ''} одобрен`, 'success');
      setApproveSupplierOpen(false);
    } catch (err) {
      addToast(err.message || 'Ошибка одобрения поставщика', 'error');
    }
  };

  const handleCreateReceiptTable = async (procurement) => {
    try {
      const table = await api.getReceiptTable(procurement.id);
      if (table) {
        addToast('Таблица квитанций создана и отправлена поставщику', 'success');
      }
    } catch (err) {
      addToast(err.message || 'Ошибка создания таблицы квитанций', 'error');
    }
  };

  const handleCloseProcurement = async (procurement) => {
    if (!window.confirm(`Закрыть закупку "${procurement.title}"? Она будет перенесена в историю.`)) return;
    try {
      await api.closeProcurement(procurement.id);
      setMyProcurements((prev) => {
        if (!prev) return prev;
        const updateList = (list) => list.map((p) => p.id === procurement.id ? { ...p, status: 'completed' } : p);
        return { organized: updateList(prev.organized), participating: updateList(prev.participating) };
      });
      setPaymentProcurements((prev) => prev.filter((p) => p.id !== procurement.id));
      const completed = { ...procurement, status: 'completed' };
      setProcurementHistory((prev) => [completed, ...prev.filter((p) => p.id !== procurement.id)]);
      addToast('Закупка завершена и перенесена в историю', 'success');
    } catch (err) {
      addToast(err.message || 'Ошибка закрытия закупки', 'error');
    }
  };

  const handleLoadNewsFeed = async () => {
    setNewsFeedLoading(true);
    try {
      // Load procurements as a proxy for news (organizer/supplier updates)
      const result = await api.getProcurements({ status: 'active' }).catch(() => null);
      const list = result ? (result.results || result) : [];
      // Use procurements as news items (title, organizer, city, date)
      setNewsFeed(list.slice(0, 20).map((p) => ({
        id: p.id,
        title: p.title,
        author: p.organizer_name || `Организатор #${p.organizer}`,
        text: p.description || `Закупка в ${p.city || '...'}`,
        date: p.created_at,
        type: 'procurement',
        procurement_id: p.id,
      })));
    } catch {
      setNewsFeed([]);
    } finally {
      setNewsFeedLoading(false);
    }
  };

  const handleOpenPending = async () => {
    setActiveSection(activeSection === 'pending' ? null : 'pending');
    if (activeSection !== 'pending' && !pendingLoaded) {
      setPendingLoaded(true);
      try {
        const waiting = myProcurements?.organized?.filter((p) => p.status === 'stopped') || [];
        setPendingItems(waiting);
      } catch {
        // ignore
      }
    }
  };

  const handleOpenOrderTables = async () => {
    setActiveSection(activeSection === 'orderTables' ? null : 'orderTables');
    if (activeSection !== 'orderTables' && orderTables.length === 0) {
      try {
        const completed = myProcurements?.organized?.filter((p) => ['payment', 'completed', 'stopped'].includes(p.status)) || [];
        const tables = await Promise.all(
          completed.map((p) =>
            api.getReceiptTable(p.id)
              .then((t) => ({ ...t, procurement_title: p.title, procurement_id: p.id }))
              .catch(() => null)
          )
        );
        setOrderTables(tables.filter(Boolean));
      } catch {
        // ignore
      }
    }
  };

  const handleCarouselSelect = (cat) => {
    setSelectedCarouselCategory(selectedCarouselCategory?.id === cat.id ? null : cat);
  };

  const handleOpenAddParticipant = (procurement) => {
    setAddParticipantProcurement(procurement);
    setAddParticipantOpen(true);
    setAddParticipantUserQuery('');
    setAddParticipantResults([]);
    setAddParticipantSelected(null);
    setAddParticipantAmount('');
    setAddParticipantQuantity('1');
  };

  const handleAddParticipantSearch = (query) => {
    setAddParticipantUserQuery(query);
    setAddParticipantSelected(null);
    if (addParticipantSearchTimeout.current) clearTimeout(addParticipantSearchTimeout.current);
    if (!query.trim()) { setAddParticipantResults([]); return; }
    addParticipantSearchTimeout.current = setTimeout(async () => {
      setAddParticipantLoading(true);
      try {
        const results = await api.searchUsers(query);
        setAddParticipantResults(Array.isArray(results) ? results : (results.results || []));
      } catch {
        setAddParticipantResults([]);
      } finally {
        setAddParticipantLoading(false);
      }
    }, 400);
  };

  const handleAddParticipantSubmit = async () => {
    if (!addParticipantSelected || !addParticipantAmount || !addParticipantProcurement) return;
    try {
      await api.addParticipant(addParticipantProcurement.id, {
        organizer_id: user.id,
        user_id: addParticipantSelected.id,
        quantity: parseFloat(addParticipantQuantity) || 1,
        amount: parseFloat(addParticipantAmount),
      });
      addToast(`Пользователь ${addParticipantSelected.first_name || ''} добавлен в закупку`, 'success');
      setAddParticipantOpen(false);
    } catch (err) {
      addToast(err.message || 'Ошибка добавления участника', 'error');
    }
  };

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    if (userSearchTimeout.current) clearTimeout(userSearchTimeout.current);
    if (!query.trim()) { setUserSearchResults([]); return; }
    userSearchTimeout.current = setTimeout(async () => {
      setUserSearchLoading(true);
      try {
        const results = await api.searchUsers(query);
        setUserSearchResults(Array.isArray(results) ? results : (results.results || []));
      } catch {
        setUserSearchResults([]);
      } finally {
        setUserSearchLoading(false);
      }
    }, 400);
  };

  const handleRoleSwitch = async (newRole) => {
    if (newRole === user.role) { setRoleSwitchOpen(false); return; }
    try {
      await api.updateUser(user.id, { role: newRole });
      const updated = await api.getUser(user.id);
      useStore.setState({ user: updated });
      setRoleSwitchOpen(false);
      addToast(`Роль изменена на: ${getRoleText(newRole)}`, 'success');
    } catch {
      addToast('Ошибка смены роли', 'error');
    }
  };

  const toggleSection = (id) => setActiveSection((prev) => (prev === id ? null : id));

  // ─── Section renderers ──────────────────────────────────────────────────────

  const renderMessages = () => (
    <ContentPanel>
      {messages.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>Нет сообщений</p>
      ) : (
        messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 6 }}>
            <div
              onClick={() => { handleMarkMessageRead(m.id); setReplyTarget(m); }}
              style={{
                background: m.read ? 'var(--tg-bg-primary)' : 'rgba(52,168,240,0.08)',
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                borderLeft: m.read ? 'none' : '3px solid #34A8F0',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{m.from}</span>
                {!m.read && (
                  <span style={{ background: '#34A8F0', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '0 6px' }}>
                    Новое
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--tg-text-primary)', display: 'block', marginTop: 2 }}>{m.text}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)' }}>{formatTime(m.date)}</span>
                <span style={{ fontSize: '0.7rem', color: '#34A8F0' }}>Ответить</span>
              </div>
            </div>
            {replyTarget?.id === m.id && (
              <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.8rem', padding: '6px 10px', flex: 1, borderRadius: 8 }}
                  placeholder="Написать ответ..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReplyMessage()}
                  autoFocus
                />
                <button className="btn btn-primary btn-round" style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap' }} onClick={handleReplyMessage}>
                  Отправить
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-text-secondary)', fontSize: '1rem', padding: '0 4px' }} onClick={() => { setReplyTarget(null); setReplyText(''); }}>
                  ×
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </ContentPanel>
  );

  const renderInvitations = () => (
    <ContentPanel>
      {invitations.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>Нет новых приглашений</p>
      ) : (
        invitations.map((inv) => (
          <div
            key={inv.id}
            onClick={() => {
              handleMarkInvitationRead(inv.id);
              if (inv.procurement_id) navigate(`/chat/${inv.procurement_id}`);
            }}
            style={{
              background: inv.read ? 'var(--tg-bg-primary)' : 'rgba(52,168,240,0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              marginBottom: 6,
              cursor: 'pointer',
              borderLeft: inv.read ? 'none' : '3px solid #34A8F0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{inv.from}</span>
              {!inv.read && (
                <span style={{ background: '#34A8F0', color: '#fff', borderRadius: 10, fontSize: '0.65rem', padding: '0 6px' }}>
                  Новое
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--tg-text-primary)', display: 'block', marginTop: 2 }}>{inv.text}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)' }}>{formatTime(inv.date)}</span>
              {inv.procurement_id && (
                <span style={{ fontSize: '0.7rem', color: '#34A8F0', fontWeight: 500 }}>Перейти в чат →</span>
              )}
            </div>
          </div>
        ))
      )}
    </ContentPanel>
  );

  const renderCurrentPurchases = () => {
    const activeProcs = [
      ...(myProcurements?.organized || []),
      ...(myProcurements?.participating || []),
    ].filter((p) => ['active', 'stopped', 'payment'].includes(p.status));

    return (
      <ContentPanel>
        {activeProcs.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>Нет активных закупок</p>
        ) : (
          activeProcs.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/chat/${p.id}`)}
              style={{
                background: 'var(--tg-bg-primary)',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 6,
                cursor: 'pointer',
                boxShadow: 'var(--tg-shadow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title}</span>
                <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.65rem' }}>
                  {getStatusText(p.status)}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
                {p.city} · {p.participant_count || 0} участн.
              </span>
            </div>
          ))
        )}
      </ContentPanel>
    );
  };

  const renderPurchaseHistory = () => (
    <ContentPanel>
      {procurementHistory.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>История закупок пуста</p>
      ) : (
        procurementHistory.map((p) => (
          <div key={p.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, boxShadow: 'var(--tg-shadow)' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>{p.title}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
              {p.city} · {formatCurrency(p.current_amount || 0)} / {formatCurrency(p.target_amount || 0)}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              {user.role === 'organizer' && p.organizer === user.id ? (
                <select
                  value={p.status}
                  onChange={(e) => handleProcurementStatusChange(p.id, e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--tg-border)', background: 'var(--tg-bg-primary)', cursor: 'pointer' }}
                >
                  {[
                    { value: 'draft', label: 'Черновик' },
                    { value: 'active', label: 'Активная' },
                    { value: 'stopped', label: 'Остановлена' },
                    { value: 'payment', label: 'Оплата' },
                    { value: 'completed', label: 'Завершена' },
                    { value: 'cancelled', label: 'Отменена' },
                  ].map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              ) : (
                <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.7rem' }}>
                  {getStatusText(p.status)}
                </span>
              )}
              <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)' }}>{formatTime(p.updated_at)}</span>
            </div>
          </div>
        ))
      )}
    </ContentPanel>
  );

  const renderSubscriptions = () => (
    <ContentPanel>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          className="form-input"
          style={{ fontSize: '0.8rem', padding: '6px 10px', flex: 1, borderRadius: 8 }}
          placeholder="Категория или организатор..."
          value={newSubscription}
          onChange={(e) => setNewSubscription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubscription()}
        />
        <button className="btn btn-primary btn-round" style={{ fontSize: '0.8rem', padding: '6px 12px', whiteSpace: 'nowrap' }} onClick={handleAddSubscription}>
          + Добавить
        </button>
      </div>
      {subscriptions.map((s) => (
        <div key={s.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, boxShadow: 'var(--tg-shadow)' }}>
          <span style={{ fontSize: '0.8rem', flex: 1, fontWeight: 500 }}>
            {s.type === 'organizer' ? '👤' : '🏷️'} {s.name}
          </span>
          <button
            className={`btn btn-round ${s.active ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
            onClick={() => handleToggleSubscription(s.id)}
          >
            {s.active ? 'Вкл' : 'Выкл'}
          </button>
          <button onClick={() => handleDeleteSubscription(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-text-secondary)', fontSize: '1rem', padding: 0 }}>×</button>
        </div>
      ))}
    </ContentPanel>
  );

  const renderSettings = () => (
    <ContentPanel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '10px 12px', boxShadow: 'var(--tg-shadow)' }}>
          <span style={{ fontSize: '0.875rem' }}>Тема оформления</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['light', 'dark'].map((t) => (
              <button
                key={t}
                className={`btn btn-round ${document.documentElement.getAttribute('data-theme') === t ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                onClick={() => {
                  document.documentElement.setAttribute('data-theme', t);
                  localStorage.setItem('theme', t);
                }}
              >
                {t === 'light' ? '☀️ Светлая' : '🌙 Тёмная'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  );

  const renderUserSearch = () => (
    <ContentPanel>
      <input
        type="text"
        className="form-input"
        style={{ fontSize: '0.85rem', padding: '8px 12px', width: '100%', marginBottom: 8, borderRadius: 8 }}
        placeholder="Имя, email, телефон..."
        value={userSearchQuery}
        onChange={(e) => handleUserSearch(e.target.value)}
      />
      {userSearchLoading && <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-muted)' }}>Поиск...</p>}
      {!userSearchLoading && userSearchQuery.trim() && userSearchResults.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-muted)' }}>Пользователи не найдены</p>
      )}
      {userSearchResults.map((u) => (
        <div key={u.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10, boxShadow: 'var(--tg-shadow)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#34A8F0', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
            {getInitials(u.first_name, u.last_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.first_name || ''} {u.last_name || ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
              {u.username ? `@${u.username}` : u.email || u.phone || getRoleText(u.role)}
            </div>
          </div>
          <span style={{ fontSize: '0.65rem', background: 'rgba(52,168,240,0.12)', color: '#34A8F0', borderRadius: 4, padding: '2px 6px', flexShrink: 0 }}>
            {getRoleText(u.role)}
          </span>
        </div>
      ))}
    </ContentPanel>
  );

  const renderMyProcurements = () => {
    const procs = myProcurements?.organized || [];
    return (
      <ContentPanel>
        {procs.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>Нет закупок</p>
        ) : (
          procs.map((p) => (
            <div key={p.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: 'var(--tg-shadow)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => navigate(`/chat/${p.id}`)}>
                {p.title}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>
                {p.city} · {p.participant_count || 0} участн. · {formatCurrency(p.current_amount || 0)}
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={p.status}
                  onChange={(e) => handleProcurementStatusChange(p.id, e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--tg-border)', background: 'var(--tg-bg-primary)', cursor: 'pointer' }}
                >
                  {[
                    { value: 'draft', label: 'Черновик' },
                    { value: 'active', label: 'Активная' },
                    { value: 'stopped', label: 'Остановлена' },
                    { value: 'payment', label: 'Оплата' },
                    { value: 'completed', label: 'Завершена' },
                    { value: 'cancelled', label: 'Отменена' },
                  ].map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {p.status === 'active' && (
                  <button className="btn btn-outline btn-round" style={{ fontSize: '0.7rem', padding: '2px 8px' }} onClick={() => handleOpenAddParticipant(p)}>
                    + Добавить участника
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </ContentPanel>
    );
  };

  const renderPaymentProcurements = () => (
    <ContentPanel>
      {paymentProcurements.length === 0 ? (
        <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>Нет закупок в стадии оплаты</p>
      ) : (
        paymentProcurements.map((p) => (
          <div key={p.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, boxShadow: 'var(--tg-shadow)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/chat/${p.id}`)}>
                {p.title}
              </span>
              <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.65rem', flexShrink: 0, marginLeft: 6 }}>
                {getStatusText(p.status)}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)', display: 'block', marginBottom: 8 }}>
              {p.city} · {p.participant_count || 0} участн. · {formatCurrency(p.current_amount || 0)}
              {p.participation_deadline && ` · до ${formatTime(p.participation_deadline)}`}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.status === 'active' && (
                <button
                  className="btn btn-outline btn-round"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  onClick={() => handleStopProcurement(p)}
                >
                  🛑 Стоп-сумма
                </button>
              )}
              {(p.status === 'active' || p.status === 'stopped') && (
                <button
                  className="btn btn-outline btn-round"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  onClick={() => handleOpenApproveSupplier(p)}
                >
                  ✅ Одобрить поставщика
                </button>
              )}
              {(p.status === 'stopped' || p.status === 'payment') && (
                <button
                  className="btn btn-outline btn-round"
                  style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                  onClick={() => handleCreateReceiptTable(p)}
                >
                  📊 Создать таблицу
                </button>
              )}
              {(p.status === 'stopped' || p.status === 'payment') && (
                <button
                  className="btn btn-outline btn-round"
                  style={{ fontSize: '0.7rem', padding: '3px 8px', color: 'var(--tg-error)', borderColor: 'var(--tg-error)' }}
                  onClick={() => handleCloseProcurement(p)}
                >
                  🔒 Закрыть закупку
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </ContentPanel>
  );

  const renderShipmentHistory = () => {
    const completedShipments = myProcurements?.organized?.filter((p) => p.status === 'completed') || [];
    return (
      <ContentPanel>
        {completedShipments.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)', padding: '4px 0' }}>История отгрузок пуста</p>
        ) : (
          completedShipments.map((p) => (
            <div key={p.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, boxShadow: 'var(--tg-shadow)' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>{p.title}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)', display: 'block' }}>
                {p.city} · {formatCurrency(p.current_amount || 0)} · {formatTime(p.updated_at)}
              </span>
              <span className="status-badge status-completed" style={{ fontSize: '0.65rem', marginTop: 4, display: 'inline-block' }}>Завершена</span>
            </div>
          ))
        )}
      </ContentPanel>
    );
  };

  // ─── Role-specific extra sections ──────────────────────────────────────────

  const renderRoleRows = () => {
    const role = user.role;
    const unreadCount = messages.filter((m) => !m.read).length;
    const activeProcCount = [
      ...(myProcurements?.organized || []),
      ...(myProcurements?.participating || []),
    ].filter((p) => ['active', 'stopped', 'payment'].includes(p.status)).length;

    if (role === 'organizer') {
      return (
        <>
          <SectionHeader title="Закупки" />
          <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
            <ActionRow icon={<PlusIcon />} label="Создать закупку" onClick={openCreateProcurementModal} />
            <ActionRow icon={<ShoppingBagIcon />} label="Открытые закупки" badge={myProcurements?.organized?.filter((p) => p.status === 'active' || p.status === 'draft').length || 0} onClick={() => toggleSection('myProcurements')} />
            {activeSection === 'myProcurements' && renderMyProcurements()}
            <ActionRow icon={<ShoppingBagIcon />} label="Закупки в стадии оплаты" badge={paymentProcurements.length} onClick={() => toggleSection('paymentProcurements')} />
            {activeSection === 'paymentProcurements' && renderPaymentProcurements()}
            <ActionRow icon={<HistoryIcon />} label="История закупок" badge={procurementHistory.length} onClick={() => toggleSection('history')} />
            {activeSection === 'history' && renderPurchaseHistory()}
            <ActionRow icon={<PlusIcon />} label="Создать новость" onClick={() => setNewsOpen(true)} />
          </div>
          <SectionHeader title="Коммуникация" />
          <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
            <ActionRow icon={<MailIcon />} label="Сообщения" badge={unreadCount} onClick={() => toggleSection('messages')} />
            {activeSection === 'messages' && renderMessages()}
            <ActionRow icon={<SearchIcon className={undefined} />} label="Поиск пользователей" onClick={() => toggleSection('userSearch')} />
            {activeSection === 'userSearch' && renderUserSearch()}
          </div>
        </>
      );
    }

    if (role === 'supplier') {
      return (
        <>
          <SectionHeader title="Отгрузки" />
          <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
            <ActionRow icon={<HomeIcon />} label="Карточка компании" onClick={() => setCompanyCardOpen(true)} />
            <ActionRow icon={<FileIcon />} label="Загрузить прайс-лист" onClick={() => setPriceListOpen(true)} />
            <ActionRow icon={<ShoppingBagIcon />} label="Текущие отгрузки" badge={orderTables.length} onClick={handleOpenOrderTables} />
            {activeSection === 'orderTables' && (
              <ContentPanel>
                {orderTables.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)' }}>Нет текущих отгрузок</p>
                ) : (
                  orderTables.map((table, idx) => (
                    <div key={idx} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, boxShadow: 'var(--tg-shadow)' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>{table.procurement_title}</span>
                      {table.total_amount && <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>Сумма: {formatCurrency(table.total_amount)}</span>}
                      <button className="btn btn-outline btn-round" style={{ fontSize: '0.75rem', padding: '4px 10px', marginTop: 6 }} onClick={() => { setSelectedOrderTableId(table.procurement_id); setClosingDocsOpen(true); }}>
                        Отправить закрывающие документы
                      </button>
                    </div>
                  ))
                )}
              </ContentPanel>
            )}
            <ActionRow icon={<HistoryIcon />} label="В ожидании" badge={pendingItems.length} onClick={handleOpenPending} />
            {activeSection === 'pending' && (
              <ContentPanel>
                {pendingItems.length === 0 ? (
                  <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)' }}>Нет закупок в ожидании</p>
                ) : (
                  pendingItems.map((p) => (
                    <div key={p.id} onClick={() => navigate(`/chat/${p.id}`)} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, cursor: 'pointer', boxShadow: 'var(--tg-shadow)' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'block' }}>{p.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>{p.city} · {p.participant_count || 0} участн.</span>
                    </div>
                  ))
                )}
              </ContentPanel>
            )}
            <ActionRow icon={<HistoryIcon />} label="История отгрузок" badge={myProcurements?.organized?.filter((p) => p.status === 'completed').length || 0} onClick={() => toggleSection('shipmentHistory')} />
            {activeSection === 'shipmentHistory' && renderShipmentHistory()}
          </div>
          <SectionHeader title="Коммуникация" />
          <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
            <ActionRow icon={<MailIcon />} label="Приглашения и сообщения" badge={unreadCount} onClick={() => toggleSection('messages')} />
            {activeSection === 'messages' && renderMessages()}
            <ActionRow icon={<SearchIcon className={undefined} />} label="Поиск пользователей" onClick={() => toggleSection('userSearch')} />
            {activeSection === 'userSearch' && renderUserSearch()}
            <ActionRow icon={<PlusIcon />} label="Написать в ленту новостей" onClick={() => setNewsOpen(true)} />
          </div>
        </>
      );
    }

    // Buyer
    const unreadInvitations = invitations.filter((inv) => !inv.read).length;
    return (
      <>
        <SectionHeader title="Закупки" />
        <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
          <ActionRow icon={<ShoppingBagIcon />} label="Текущие закупки" badge={activeProcCount} onClick={() => toggleSection('currentPurchases')} />
          {activeSection === 'currentPurchases' && renderCurrentPurchases()}
          <ActionRow icon={<HistoryIcon />} label="История закупок" badge={procurementHistory.length} onClick={() => toggleSection('history')} />
          {activeSection === 'history' && renderPurchaseHistory()}
          <ActionRow icon={<PlusIcon />} label="Создать запрос" onClick={() => setCreateRequestOpen(true)} />
          <ActionRow icon={<RequestsIcon />} label="Мои запросы" badge={myRequests.length} onClick={() => toggleSection('myRequests')} />
          {activeSection === 'myRequests' && (
            <ContentPanel>
              <button className="btn btn-primary btn-round" style={{ fontSize: '0.8rem', padding: '6px 14px', marginBottom: 8 }} onClick={() => setCreateRequestOpen(true)}>
                + Создать запрос
              </button>
              {myRequests.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-muted)' }}>Нет активных запросов</p>
              ) : (
                myRequests.map((req) => (
                  <div key={req.id} style={{ background: 'var(--tg-bg-primary)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, boxShadow: 'var(--tg-shadow)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.product_name}</span>
                      <button onClick={() => handleDeleteRequest(req.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-text-secondary)', padding: 0, fontSize: '1rem' }}>×</button>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>Кол-во: {req.quantity} · {req.city}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--tg-text-secondary)', display: 'block' }}>{formatTime(req.created_at)}</span>
                    <button
                      className="btn btn-outline btn-round"
                      style={{ fontSize: '0.7rem', padding: '2px 8px', marginTop: 4 }}
                      onClick={() => handleDeleteRequest(req.id)}
                    >
                      Удалить из заявки
                    </button>
                  </div>
                ))
              )}
            </ContentPanel>
          )}
        </div>
        <SectionHeader title="Мои приглашения и сообщения" />
        <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
          <ActionRow icon={<InvitationIcon />} label="Приглашения в закупки" badge={unreadInvitations} onClick={() => toggleSection('invitations')} />
          {activeSection === 'invitations' && renderInvitations()}
          <ActionRow icon={<MailIcon />} label="Сообщения" badge={unreadCount} onClick={() => toggleSection('messages')} />
          {activeSection === 'messages' && renderMessages()}
        </div>
      </>
    );
  };

  // ─── Not logged in ──────────────────────────────────────────────────────────

  if (!user) {
    return (
      <div className="cabinet" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <p className="text-muted">Войдите для доступа к личному кабинету</p>
        <button className="btn btn-primary" onClick={openLoginModal}>
          Войти / Зарегистрироваться
        </button>
      </div>
    );
  }

  // ─── Main render ────────────────────────────────────────────────────────────

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: 'var(--tg-bg-primary)', maxWidth: 430 }}>
      {/* Sticky top bar */}
      <CabinetTopBar
        user={user}
        onDownloadApp={() => addToast('Скачать приложение', 'info')}
        onChangeRole={() => setRoleSwitchOpen(true)}
      />

      {/* Balance button */}
      <BalanceButton
        balance={user.balance || 0}
        onDeposit={openDepositModal}
        onWithdraw={() => setWithdrawOpen(true)}
      />

      {/* LC Horizontal carousel */}
      <LCCarousel
        categories={LC_SLIDER_CATEGORIES}
        activeCategory={selectedCarouselCategory?.id}
        onSelect={handleCarouselSelect}
      />

      {/* Category page content (shown below carousel when a card is selected) */}
      {selectedCarouselCategory && (
        <div style={{ margin: '0 16px 8px', background: 'var(--tg-bg-secondary)', borderRadius: 10, padding: '12px 0', boxShadow: 'var(--tg-shadow)' }}>
          <div style={{ padding: '0 16px 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--tg-text-primary)' }}>
              {selectedCarouselCategory.icon} {selectedCarouselCategory.label}
            </span>
            <button onClick={() => setSelectedCarouselCategory(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tg-text-secondary)', fontSize: '1.2rem', padding: 0 }}>×</button>
          </div>
          <CategoryPageContent
            category={selectedCarouselCategory}
            procurements={myProcurements}
            user={user}
            newsFeed={newsFeed}
            newsFeedLoading={newsFeedLoading}
            onLoadNewsFeed={handleLoadNewsFeed}
            navigate={navigate}
          />
        </div>
      )}

      {/* Telegram-style search bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Поиск в личном кабинете..." />

      {/* Role-specific rows */}
      {renderRoleRows()}

      {/* Subscriptions section (common) */}
      <SectionHeader title="Подписки" />
      <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
        <ActionRow icon={<HistoryIcon />} label="Управление подписками" badge={subscriptions.filter((s) => s.active).length} onClick={() => toggleSection('subscriptions')} />
        {activeSection === 'subscriptions' && renderSubscriptions()}
      </div>

      {/* Settings */}
      <SectionHeader title="Настройки" />
      <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 8px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
        <ActionRow icon={<SettingsIcon />} label="Тема и шрифт" onClick={() => toggleSection('settings')} />
        {activeSection === 'settings' && renderSettings()}
      </div>

      {/* Logout */}
      <div style={{ background: 'var(--tg-bg-secondary)', borderRadius: 10, margin: '0 16px 24px', overflow: 'hidden', boxShadow: 'var(--tg-shadow)' }}>
        <ActionRow
          danger
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>}
          label="Выйти"
          onClick={logout}
        />
      </div>

      {/* Role switch modal */}
      {roleSwitchOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setRoleSwitchOpen(false)}>
          <div className="modal" style={{ maxWidth: 320 }}>
            <div className="modal-header">
              <h3 className="modal-title">Сменить роль</h3>
              <button className="modal-close" onClick={() => setRoleSwitchOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { value: 'buyer', label: 'Покупатель' },
                { value: 'organizer', label: 'Организатор' },
                { value: 'supplier', label: 'Поставщик' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`btn btn-round ${user.role === value ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', textAlign: 'left', padding: '10px 16px' }}
                  onClick={() => handleRoleSwitch(value)}
                >
                  {label}{user.role === value && ' (текущая)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CompanyCardModal isOpen={companyCardOpen} onClose={() => setCompanyCardOpen(false)} onSave={handleSaveCompanyCard} />
      <PriceListModal isOpen={priceListOpen} onClose={() => setPriceListOpen(false)} onSave={handleSavePriceList} />
      <NewsModal isOpen={newsOpen} onClose={() => setNewsOpen(false)} onSave={handleSaveNews} />
      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
      <CreateRequestModal isOpen={createRequestOpen} onClose={() => setCreateRequestOpen(false)} onSave={handleSaveRequest} />
      <ClosingDocumentsModal isOpen={closingDocsOpen} onClose={() => setClosingDocsOpen(false)} onSave={handleSendClosingDocuments} orderTableId={selectedOrderTableId} />

      {/* Approve Supplier modal */}
      {approveSupplierOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setApproveSupplierOpen(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 className="modal-title">Одобрить поставщика</h3>
              <button className="modal-close" onClick={() => setApproveSupplierOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {approveSupplierProcurement && (
                <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-secondary)', margin: 0 }}>
                  Закупка: <strong>{approveSupplierProcurement.title}</strong>
                </p>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', display: 'block', marginBottom: 4 }}>Поиск поставщика</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '7px 12px', width: '100%' }}
                  placeholder="Имя, компания, email..."
                  value={supplierSearchQuery}
                  onChange={(e) => handleSupplierSearch(e.target.value)}
                  autoFocus
                />
                {supplierSearchLoading && <p style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)', margin: '4px 0 0' }}>Поиск...</p>}
                {supplierSearchResults.length > 0 && (
                  <div style={{ border: '1px solid var(--tg-border)', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                    {supplierSearchResults.map((s) => (
                      <div
                        key={s.id}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--tg-border)', display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={() => handleApproveSupplierSubmit(s)}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{s.first_name || ''} {s.last_name || ''}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)' }}>{s.email || s.phone || 'Поставщик'}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', background: 'rgba(52,168,240,0.12)', color: '#34A8F0', borderRadius: 4, padding: '2px 6px' }}>
                          Одобрить
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {!supplierSearchLoading && supplierSearchQuery.trim() && supplierSearchResults.length === 0 && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--tg-text-muted)', marginTop: 4 }}>Поставщики не найдены</p>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-round" onClick={() => setApproveSupplierOpen(false)}>Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add participant modal */}
      {addParticipantOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setAddParticipantOpen(false)}>
          <div className="modal" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3 className="modal-title">Добавить участника в закупку</h3>
              <button className="modal-close" onClick={() => setAddParticipantOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {addParticipantProcurement && (
                <p style={{ fontSize: '0.85rem', color: 'var(--tg-text-secondary)', margin: 0 }}>
                  Закупка: <strong>{addParticipantProcurement.title}</strong>
                </p>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', display: 'block', marginBottom: 4 }}>Поиск пользователя</label>
                <input type="text" className="form-input" style={{ fontSize: '0.85rem', padding: '7px 12px', width: '100%' }} placeholder="Имя, email, телефон..." value={addParticipantUserQuery} onChange={(e) => handleAddParticipantSearch(e.target.value)} autoFocus />
                {addParticipantLoading && <p style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)', margin: '4px 0 0' }}>Поиск...</p>}
                {addParticipantResults.length > 0 && !addParticipantSelected && (
                  <div style={{ border: '1px solid var(--tg-border)', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
                    {addParticipantResults.map((u) => (
                      <div key={u.id} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--tg-border)', display: 'flex', alignItems: 'center', gap: 8 }}
                        onClick={() => { setAddParticipantSelected(u); setAddParticipantUserQuery(`${u.first_name || ''} ${u.last_name || ''}`.trim()); setAddParticipantResults([]); }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.first_name || ''} {u.last_name || ''}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--tg-text-secondary)', marginLeft: 'auto' }}>{u.email || u.phone || getRoleText(u.role)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {addParticipantSelected && (
                  <div style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--tg-success)' }}>
                    ✓ Выбран: {addParticipantSelected.first_name} {addParticipantSelected.last_name || ''} ({addParticipantSelected.email || addParticipantSelected.phone || `ID ${addParticipantSelected.id}`})
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', display: 'block', marginBottom: 4 }}>Количество</label>
                  <input type="number" className="form-input" style={{ fontSize: '0.85rem', padding: '7px 12px', width: '100%' }} min="0.01" step="0.01" value={addParticipantQuantity} onChange={(e) => setAddParticipantQuantity(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--tg-text-secondary)', display: 'block', marginBottom: 4 }}>Сумма (₽)</label>
                  <input type="number" className="form-input" style={{ fontSize: '0.85rem', padding: '7px 12px', width: '100%' }} min="0" step="0.01" placeholder="0.00" value={addParticipantAmount} onChange={(e) => setAddParticipantAmount(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-round" onClick={() => setAddParticipantOpen(false)}>Отмена</button>
                <button className="btn btn-primary btn-round" disabled={!addParticipantSelected || !addParticipantAmount} onClick={handleAddParticipantSubmit}>Добавить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cabinet;
