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

// Category slider items per role
const SUPPLIER_CATEGORY_ITEMS = ['Биржа', 'Езда', 'Быт', 'Отдых', 'Общение', 'Публичные чаты'];
const ORGANIZER_SLIDER_ITEMS = ['Биржа', 'Езда', 'Быт', 'Отдых', 'Общение', 'Публичные чаты', 'Делегаты'];
const BUYER_SLIDER_ITEMS = ['Биржа', 'Езда', 'Быт', 'Отдых', 'Жилье', 'Соревнования'];

// Slider items that should navigate to chat instead of the under-development page
const CHAT_SLIDER_ITEMS = new Set(['Общение', 'Публичные чаты', 'Делегаты']);

function CategorySlider({ items, onSelect }) {
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      scrollbarWidth: 'none',
    }}>
      {items.map((item) => (
        <button
          key={item}
          className="btn btn-outline btn-round"
          style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          onClick={() => onSelect && onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function TopActionButtons({ buttons }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '0.4rem',
      padding: '0.5rem 1rem 0',
      flexWrap: 'wrap',
    }}>
      {buttons.map(({ label, icon, onClick }) => (
        <button
          key={label}
          className="btn btn-icon"
          title={label}
          onClick={onClick}
          style={{ fontSize: '0.75rem', minWidth: '2rem', minHeight: '2rem' }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}

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

  // Subscriptions: list of category/organizer subscriptions
  const [subscriptions, setSubscriptions] = useState([
    { id: 1, type: 'category', name: 'Биржа', active: true },
    { id: 2, type: 'category', name: 'Быт', active: true },
    { id: 3, type: 'organizer', name: 'Организатор Иванов', active: false },
  ]);
  const [newSubscription, setNewSubscription] = useState('');

  // Messages/Invitations: notifications from API
  const [messages, setMessages] = useState([]);

  // Pending procurements (supplier: awaiting shipment confirmation)
  const [pendingItems, setPendingItems] = useState([]);
  const [pendingLoaded, setPendingLoaded] = useState(false);

  // View state for sections
  const [activeSection, setActiveSection] = useState(null);
  // Slider/page swap state (for supplier top button)
  const [sliderOnTop, setSliderOnTop] = useState(true);

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
          setMessages(notifList.map((n) => ({
            id: n.id,
            from: n.notification_type === 'system' ? 'Система' : 'Администратор',
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

        // Separate payment-stage procurements for organizer
        setPaymentProcurements(organized.filter((p) => p.status === 'payment' || p.status === 'stopped'));

        // History: completed procurements
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

  const handleSavePriceList = async (data) => {
    addToast('Прайс-лист загружен', 'success');
  };

  const handleSaveNews = async (data) => {
    addToast('Новость опубликована', 'success');
  };

  const handleSaveRequest = async (data) => {
    const newRequest = {
      id: Date.now(),
      ...data,
      created_at: new Date().toISOString(),
    };
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
      // Update local state to reflect new status immediately
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

  const handleSendClosingDocuments = async (data) => {
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
      // ignore read errors silently
    }
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
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

  const handleCategorySelect = (category) => {
    // All slider categories navigate to home — chat-related ones show all procurements,
    // others pre-fill the sidebar search with the category name.
    navigate(CHAT_SLIDER_ITEMS.has(category) ? '/' : `/?category=${encodeURIComponent(category)}`);
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
    if (!query.trim()) {
      setAddParticipantResults([]);
      return;
    }
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
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }
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
    if (newRole === user.role) {
      setRoleSwitchOpen(false);
      return;
    }
    try {
      await api.updateUser(user.id, { role: newRole });
      // Reload user to get updated role
      const updated = await api.getUser(user.id);
      // Update store user directly via zustand setter
      useStore.setState({ user: updated });
      setRoleSwitchOpen(false);
      addToast(`Роль изменена на: ${getRoleText(newRole)}`, 'success');
    } catch {
      addToast('Ошибка смены роли', 'error');
    }
  };

  if (!user) {
    return (
      <div className="cabinet flex flex-col items-center justify-center" style={{ flex: 1, gap: '1rem' }}>
        <p className="text-muted">Войдите для доступа к личному кабинету</p>
        <button className="btn btn-primary" onClick={openLoginModal}>
          Войти / Зарегистрироваться
        </button>
      </div>
    );
  }

  const renderSupplierCabinet = () => (
    <>
      {/* Top-right 5 action buttons */}
      <TopActionButtons buttons={[
        {
          label: 'Баланс',
          icon: <span style={{ fontSize: '0.9rem' }}>💳</span>,
          onClick: openDepositModal,
        },
        {
          label: 'Скачать приложение',
          icon: <span style={{ fontSize: '0.9rem' }}>📱</span>,
          onClick: () => addToast('Скачать приложение', 'info'),
        },
        {
          label: 'Скачать Mesh приложение',
          icon: <span style={{ fontSize: '0.9rem' }}>🔗</span>,
          onClick: () => addToast('Скачать Mesh приложение', 'info'),
        },
        {
          label: 'Хотелки (улучшения сервиса)',
          icon: <span style={{ fontSize: '0.9rem' }}>☭</span>,
          onClick: () => addToast('Приём предложений по улучшению сервиса', 'info'),
        },
        {
          label: 'Поменять местами слайдер и страницу',
          icon: <span style={{ fontSize: '0.9rem' }}>⇅</span>,
          onClick: () => setSliderOnTop((v) => !v),
        },
      ]} />

      {/* Slider: news and subscriptions */}
      <div style={{ padding: '0.5rem 1rem 0' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          Новости и подписки
        </div>
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          gap: '0.5rem',
          scrollbarWidth: 'none',
        }}>
          <button
            className={`btn btn-round ${activeSection === 'supplierNews' ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setActiveSection(activeSection === 'supplierNews' ? null : 'supplierNews')}
          >
            Новости
          </button>
          <button
            className={`btn btn-round ${activeSection === 'supplierSubscriptions' ? 'btn-primary' : 'btn-outline'}`}
            style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
            onClick={() => setActiveSection(activeSection === 'supplierSubscriptions' ? null : 'supplierSubscriptions')}
          >
            Подписки
          </button>
        </div>
        {activeSection === 'supplierNews' && (
          <div style={{ marginTop: '0.5rem', background: 'var(--bg-secondary,#f0f2f5)', borderRadius: '0.5rem', padding: '0.75rem' }}>
            <p style={{ fontSize: '0.85rem', margin: 0 }} className="text-muted">Нет новостей для отображения</p>
          </div>
        )}
        {activeSection === 'supplierSubscriptions' && renderSubscriptions()}
      </div>

      {/* Category slider */}
      <CategorySlider items={SUPPLIER_CATEGORY_ITEMS} onSelect={handleCategorySelect} />

      {/* Page buttons */}
      <div className="cabinet-menu">
        <div className="cabinet-menu-item" onClick={() => setCompanyCardOpen(true)}>
          <HomeIcon />
          <span className="cabinet-menu-text">Карта компании</span>
        </div>
        <div className="cabinet-menu-item" onClick={() => setPriceListOpen(true)}>
          <FileIcon />
          <span className="cabinet-menu-text">Загрузить прайс лист</span>
        </div>
        <div className="cabinet-menu-item" onClick={() => setNewsOpen(true)}>
          <PlusIcon />
          <span className="cabinet-menu-text">Создать новость</span>
        </div>
        <div
          className="cabinet-menu-item"
          onClick={handleOpenOrderTables}
        >
          <ShoppingBagIcon />
          <span className="cabinet-menu-text">Текущие отгрузки</span>
          {orderTables.length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{orderTables.length}</span>
          )}
        </div>
        {activeSection === 'orderTables' && (
          <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {orderTables.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет текущих отгрузок</p>
            ) : (
              orderTables.map((table, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-secondary, #f0f2f5)',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{table.procurement_title}</span>
                  {table.total_amount && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Сумма: {formatCurrency(table.total_amount)}
                    </span>
                  )}
                  <button
                    className="btn btn-outline btn-round"
                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem', marginTop: '0.25rem', alignSelf: 'flex-start' }}
                    onClick={() => {
                      setSelectedOrderTableId(table.procurement_id);
                      setClosingDocsOpen(true);
                    }}
                  >
                    Отправить закрывающие документы
                  </button>
                </div>
              ))
            )}
          </div>
        )}
        <div
          className="cabinet-menu-item"
          onClick={handleOpenPending}
        >
          <HistoryIcon />
          <span className="cabinet-menu-text">В ожидании</span>
          {pendingItems.length > 0 && (
            <span style={{ background: 'var(--warning-color,#f57c00)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{pendingItems.length}</span>
          )}
        </div>
        {activeSection === 'pending' && renderPending()}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'shipmentHistory' ? null : 'shipmentHistory')}
        >
          <HistoryIcon />
          <span className="cabinet-menu-text">История отгрузок</span>
        </div>
        {activeSection === 'shipmentHistory' && (
          <div style={{ padding: '0 1rem 0.5rem' }}>
            {shipmentHistory.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>История отгрузок пуста</p>
            ) : (
              shipmentHistory.map((s, idx) => (
                <div key={idx} style={{
                  background: 'var(--bg-secondary, #f0f2f5)',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  marginBottom: '0.4rem',
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.title}</span>
                </div>
              ))
            )}
          </div>
        )}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'supplierMessages' ? null : 'supplierMessages')}
        >
          <MailIcon />
          <span className="cabinet-menu-text">Приглашения и сообщения</span>
          {messages.filter((m) => !m.read).length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{messages.filter((m) => !m.read).length}</span>
          )}
        </div>
        {activeSection === 'supplierMessages' && renderMessages('Приглашения и сообщения')}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'supplierChatList' ? null : 'supplierChatList')}
        >
          <RequestsIcon />
          <span className="cabinet-menu-text">Чаты закупок</span>
        </div>
        {activeSection === 'supplierChatList' && renderChatList()}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'supplierUserSearch' ? null : 'supplierUserSearch')}
        >
          <SearchIcon className="cabinet-menu-icon" />
          <span className="cabinet-menu-text">Поиск пользователей</span>
        </div>
        {activeSection === 'supplierUserSearch' && renderUserSearch()}
      </div>
    </>
  );

  const renderOrganizerCabinet = () => {
    const activeProcurements = myProcurements?.organized?.filter((p) => p.status === 'active') || [];

    return (
      <>
        {/* Top: slider with category buttons + 5 action buttons */}
        <CategorySlider items={ORGANIZER_SLIDER_ITEMS} onSelect={handleCategorySelect} />
        <TopActionButtons buttons={[
          {
            label: 'Баланс',
            icon: <span style={{ fontSize: '0.9rem' }}>💳</span>,
            onClick: openDepositModal,
          },
          {
            label: 'Скачать приложение',
            icon: <span style={{ fontSize: '0.9rem' }}>📱</span>,
            onClick: () => addToast('Скачать приложение', 'info'),
          },
          {
            label: 'Скачать Mesh приложение',
            icon: <span style={{ fontSize: '0.9rem' }}>🔗</span>,
            onClick: () => addToast('Скачать Mesh приложение', 'info'),
          },
          {
            label: 'Хотелки (улучшения сервиса)',
            icon: <span style={{ fontSize: '0.9rem' }}>☭</span>,
            onClick: () => addToast('Приём предложений по улучшению сервиса', 'info'),
          },
          {
            label: 'Поменять местами слайдер и страницу',
            icon: <span style={{ fontSize: '0.9rem' }}>⇅</span>,
            onClick: () => setSliderOnTop((v) => !v),
          },
        ]} />

        {/* Page buttons */}
        <div className="cabinet-menu">
          <div className="cabinet-menu-item" onClick={() => {
            if (activeProcurements.length > 0) {
              navigate(`/chat/${activeProcurements[0].id}`);
            } else {
              addToast('Нет открытых закупок', 'info');
            }
          }}>
            <ShoppingBagIcon />
            <span className="cabinet-menu-text">Текущие закупки</span>
            {activeProcurements.length > 0 && (
              <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{activeProcurements.length}</span>
            )}
          </div>
          <div className="cabinet-menu-item" onClick={() => setNewsOpen(true)}>
            <PlusIcon />
            <span className="cabinet-menu-text">Создать новость</span>
          </div>
          <div className="cabinet-menu-item" onClick={openCreateProcurementModal}>
            <PlusIcon />
            <span className="cabinet-menu-text">Создать закупку</span>
          </div>
          <div className="cabinet-menu-item" onClick={() => navigate('/')}>
            <SearchIcon className="cabinet-menu-icon" />
            <span className="cabinet-menu-text">Поиск</span>
          </div>
          <div
            className="cabinet-menu-item"
            onClick={() => setActiveSection(activeSection === 'chatList' ? null : 'chatList')}
          >
            <RequestsIcon />
            <span className="cabinet-menu-text">Чаты</span>
            {(myProcurements?.organized?.filter((p) => ['active', 'stopped', 'payment'].includes(p.status)).length || 0) > 0 && (
              <span style={{ background: 'var(--primary-color,#3390ec)', color: '#fff', borderRadius: '1rem', fontSize: '0.7rem', padding: '0 0.4rem', minWidth: '1.2rem', textAlign: 'center' }}>
                {myProcurements.organized.filter((p) => ['active', 'stopped', 'payment'].includes(p.status)).length}
              </span>
            )}
          </div>
          {activeSection === 'chatList' && renderChatList()}
          <div
            className="cabinet-menu-item"
            onClick={() => setActiveSection(activeSection === 'userSearch' ? null : 'userSearch')}
          >
            <SearchIcon className="cabinet-menu-icon" />
            <span className="cabinet-menu-text">Поиск пользователей</span>
          </div>
          {activeSection === 'userSearch' && renderUserSearch()}
          <div className="cabinet-menu-item" onClick={() => navigate('/')}>
            <RequestsIcon />
            <span className="cabinet-menu-text">Делегаты</span>
          </div>

          {/* Мои закупки — управление статусами */}
          <div
            className="cabinet-menu-item"
            onClick={() => setActiveSection(activeSection === 'myOrgProcurements' ? null : 'myOrgProcurements')}
          >
            <ShoppingBagIcon />
            <span className="cabinet-menu-text">Мои закупки</span>
            {(myProcurements?.organized?.length || 0) > 0 && (
              <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{myProcurements.organized.length}</span>
            )}
          </div>
          {activeSection === 'myOrgProcurements' && (
            <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {(myProcurements?.organized?.length || 0) === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет закупок</p>
              ) : (
                myProcurements.organized.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-secondary, #f0f2f5)',
                      borderRadius: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem',
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                      onClick={() => navigate(`/chat/${p.id}`)}
                    >
                      {p.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.city} · {p.participant_count || 0} участн. · {formatCurrency(p.current_amount || 0)}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem', flexWrap: 'wrap' }}>
                      <select
                        value={p.status}
                        onChange={(e) => handleProcurementStatusChange(p.id, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-color,#e0e4e8)', background: 'var(--bg-primary,#fff)', cursor: 'pointer' }}
                      >
                        {[
                          { value: 'draft', label: 'Черновик' },
                          { value: 'active', label: 'Активная' },
                          { value: 'stopped', label: 'Остановлена' },
                          { value: 'payment', label: 'Оплата' },
                          { value: 'completed', label: 'Завершена' },
                          { value: 'cancelled', label: 'Отменена' },
                        ].map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {p.status === 'active' && (
                        <button
                          className="btn btn-outline btn-round"
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}
                          onClick={() => handleOpenAddParticipant(p)}
                        >
                          + Добавить участника
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Закупки в стадии оплаты */}
          <div
            className="cabinet-menu-item"
            onClick={() => setActiveSection(activeSection === 'paymentProcurements' ? null : 'paymentProcurements')}
          >
            <HistoryIcon />
            <span className="cabinet-menu-text">Закупки в стадии оплаты</span>
            {paymentProcurements.length > 0 && (
              <span style={{ background: 'var(--warning-color,#f57c00)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{paymentProcurements.length}</span>
            )}
          </div>
          {activeSection === 'paymentProcurements' && (
            <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {paymentProcurements.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет закупок в стадии оплаты</p>
              ) : (
                paymentProcurements.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-secondary, #f0f2f5)',
                      borderRadius: '0.5rem',
                      padding: '0.6rem 0.75rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.15rem',
                    }}
                  >
                    <span
                      style={{ fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}
                      onClick={() => navigate(`/chat/${p.id}`)}
                    >
                      {p.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #8e99a4)' }}>
                      Остановлена: {formatTime(p.updated_at)} · {p.participant_count || 0} участн.
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                      <select
                        value={p.status}
                        onChange={(e) => handleProcurementStatusChange(p.id, e.target.value)}
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-color,#e0e4e8)', background: 'var(--bg-primary,#fff)', cursor: 'pointer' }}
                      >
                        {[
                          { value: 'draft', label: 'Черновик' },
                          { value: 'active', label: 'Активная' },
                          { value: 'stopped', label: 'Остановлена' },
                          { value: 'payment', label: 'Оплата' },
                          { value: 'completed', label: 'Завершена' },
                          { value: 'cancelled', label: 'Отменена' },
                        ].map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* История закупок */}
          <div
            className="cabinet-menu-item"
            onClick={() => setActiveSection(activeSection === 'history' ? null : 'history')}
          >
            <HistoryIcon />
            <span className="cabinet-menu-text">История закупок</span>
            {procurementHistory.length > 0 && (
              <span style={{ background: 'var(--text-secondary,#8e99a4)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{procurementHistory.length}</span>
            )}
          </div>
          {activeSection === 'history' && renderProcurementHistory()}
        </div>
      </>
    );
  };

  const renderBuyerCabinet = () => (
    <>
      {/* Top: slider with category buttons + 5 action buttons */}
      <CategorySlider items={BUYER_SLIDER_ITEMS} onSelect={handleCategorySelect} />
      <TopActionButtons buttons={[
        {
          label: 'Баланс',
          icon: <span style={{ fontSize: '0.9rem' }}>💳</span>,
          onClick: openDepositModal,
        },
        {
          label: 'Скачать приложение',
          icon: <span style={{ fontSize: '0.9rem' }}>📱</span>,
          onClick: () => addToast('Скачать приложение', 'info'),
        },
        {
          label: 'Скачать Mesh приложение',
          icon: <span style={{ fontSize: '0.9rem' }}>🔗</span>,
          onClick: () => addToast('Скачать Mesh приложение', 'info'),
        },
        {
          label: 'Хотелки (улучшения сервиса)',
          icon: <span style={{ fontSize: '0.9rem' }}>☭</span>,
          onClick: () => addToast('Приём предложений по улучшению сервиса', 'info'),
        },
        {
          label: 'Поменять местами слайдер и страницу',
          icon: <span style={{ fontSize: '0.9rem' }}>⇅</span>,
          onClick: () => setSliderOnTop((v) => !v),
        },
      ]} />

      {/* Page buttons */}
      <div className="cabinet-menu">
        <div className="cabinet-menu-item" onClick={() => setCreateRequestOpen(true)}>
          <PlusIcon />
          <span className="cabinet-menu-text">Создать запрос</span>
        </div>
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'buyerChatList' ? null : 'buyerChatList')}
        >
          <ShoppingBagIcon />
          <span className="cabinet-menu-text">Текущие закупки</span>
          {myProcurements?.participating?.filter((p) => ['active', 'stopped', 'payment'].includes(p.status)).length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>
              {myProcurements.participating.filter((p) => ['active', 'stopped', 'payment'].includes(p.status)).length}
            </span>
          )}
        </div>
        {activeSection === 'buyerChatList' && renderChatList()}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'buyerSubscriptions' ? null : 'buyerSubscriptions')}
        >
          <HistoryIcon />
          <span className="cabinet-menu-text">Подписки</span>
          {subscriptions.filter((s) => s.active).length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{subscriptions.filter((s) => s.active).length}</span>
          )}
        </div>
        {activeSection === 'buyerSubscriptions' && renderSubscriptions()}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'buyerMessages' ? null : 'buyerMessages')}
        >
          <MailIcon />
          <span className="cabinet-menu-text">Сообщения</span>
          {messages.filter((m) => !m.read).length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{messages.filter((m) => !m.read).length}</span>
          )}
        </div>
        {activeSection === 'buyerMessages' && renderMessages()}

        {/* История закупок */}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'history' ? null : 'history')}
        >
          <HistoryIcon />
          <span className="cabinet-menu-text">История закупок</span>
          {procurementHistory.length > 0 && (
            <span style={{ background: 'var(--text-secondary,#8e99a4)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{procurementHistory.length}</span>
          )}
        </div>
        {activeSection === 'history' && renderProcurementHistory()}

        <div className="cabinet-menu-item" onClick={() => navigate('/')}>
          <SearchIcon className="cabinet-menu-icon" />
          <span className="cabinet-menu-text">Поиск закупок</span>
        </div>
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'buyerUserSearch' ? null : 'buyerUserSearch')}
        >
          <SearchIcon className="cabinet-menu-icon" />
          <span className="cabinet-menu-text">Поиск пользователей</span>
        </div>
        {activeSection === 'buyerUserSearch' && renderUserSearch()}

        {/* Категории */}
        {['Жилье', 'Авто', 'Стройка', 'Движимость', 'Фермерские продукты', 'Деликатесы', 'Памперсы', 'Средства по уходу'].map((cat) => (
          <div
            key={cat}
            className="cabinet-menu-item"
            onClick={() => navigate(`/?category=${encodeURIComponent(cat)}`)}
          >
            <HomeIcon />
            <span className="cabinet-menu-text">{cat}</span>
          </div>
        ))}

        {/* Мои запросы */}
        <div
          className="cabinet-menu-item"
          onClick={() => setActiveSection(activeSection === 'myRequests' ? null : 'myRequests')}
        >
          <RequestsIcon />
          <span className="cabinet-menu-text">Мои запросы</span>
          {myRequests.length > 0 && (
            <span style={{ background: 'var(--primary-color,#3390ec)', color:'#fff', borderRadius:'1rem', fontSize:'0.7rem', padding:'0 0.4rem', minWidth:'1.2rem', textAlign:'center' }}>{myRequests.length}</span>
          )}
        </div>
        {activeSection === 'myRequests' && (
          <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button
              className="btn btn-primary btn-round"
              style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', marginBottom: '0.5rem', alignSelf: 'flex-start' }}
              onClick={() => setCreateRequestOpen(true)}
            >
              + Создать запрос
            </button>
            {myRequests.length === 0 ? (
              <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет активных запросов</p>
            ) : (
              myRequests.map((req) => (
                <div key={req.id} style={{
                  background: 'var(--bg-secondary, #f0f2f5)',
                  borderRadius: '0.5rem',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.15rem',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.product_name}</span>
                    <button
                      onClick={() => handleDeleteRequest(req.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 0, fontSize: '1rem' }}
                      title="Удалить"
                    >
                      ×
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Кол-во: {req.quantity} · Город: {req.city}
                  </span>
                  {req.notes && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{req.notes}</span>
                  )}
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{formatTime(req.created_at)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  );

  const renderProcurementHistory = () => (
    <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {procurementHistory.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>История закупок пуста</p>
      ) : (
        procurementHistory.map((p) => (
          <div key={p.id} style={{
            background: 'var(--bg-secondary, #f0f2f5)',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.15rem',
          }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {p.city} · {formatCurrency(p.current_amount || 0)} / {formatCurrency(p.target_amount || 0)}
            </span>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {user.role === 'organizer' && p.organizer === user.id ? (
                <select
                  value={p.status}
                  onChange={(e) => handleProcurementStatusChange(p.id, e.target.value)}
                  style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', borderRadius: '0.35rem', border: '1px solid var(--border-color,#e0e4e8)', background: 'var(--bg-primary,#fff)', cursor: 'pointer' }}
                >
                  {[
                    { value: 'draft', label: 'Черновик' },
                    { value: 'active', label: 'Активная' },
                    { value: 'stopped', label: 'Остановлена' },
                    { value: 'payment', label: 'Оплата' },
                    { value: 'completed', label: 'Завершена' },
                    { value: 'cancelled', label: 'Отменена' },
                  ].map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.7rem' }}>
                  {getStatusText(p.status)}
                </span>
              )}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                {formatTime(p.updated_at)}
              </span>
            </div>
            {user.role === 'organizer' && p.organizer === user.id && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Вознаграждение: {formatCurrency((p.current_amount || 0) * ((p.commission_percent || 0) / 100))}
              </span>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderSubscriptions = () => (
    <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.25rem' }}>
        <input
          type="text"
          className="form-input"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem', flex: 1 }}
          placeholder="Категория или организатор..."
          value={newSubscription}
          onChange={(e) => setNewSubscription(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubscription()}
        />
        <button
          className="btn btn-primary btn-round"
          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
          onClick={handleAddSubscription}
        >
          + Добавить
        </button>
      </div>
      {subscriptions.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет подписок</p>
      ) : (
        subscriptions.map((s) => (
          <div key={s.id} style={{
            background: 'var(--bg-secondary, #f0f2f5)',
            borderRadius: '0.5rem',
            padding: '0.5rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span style={{ fontSize: '0.75rem', flex: 1, fontWeight: 500 }}>
              {s.type === 'organizer' ? '👤' : '🏷️'} {s.name}
            </span>
            <button
              className={`btn btn-round ${s.active ? 'btn-primary' : 'btn-outline'}`}
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
              onClick={() => handleToggleSubscription(s.id)}
            >
              {s.active ? 'Вкл' : 'Выкл'}
            </button>
            <button
              onClick={() => handleDeleteSubscription(s.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', padding: 0 }}
              title="Удалить"
            >
              ×
            </button>
          </div>
        ))
      )}
    </div>
  );

  const renderMessages = (title = 'Сообщения') => (
    <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {messages.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет сообщений</p>
      ) : (
        messages.map((m) => (
          <div
            key={m.id}
            onClick={() => handleMarkMessageRead(m.id)}
            style={{
              background: m.read ? 'var(--bg-secondary, #f0f2f5)' : 'var(--primary-bg, #e8f4fd)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
              cursor: 'pointer',
              borderLeft: m.read ? 'none' : '3px solid var(--primary-color, #3390ec)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{m.from}</span>
              {!m.read && (
                <span style={{ background: 'var(--primary-color,#3390ec)', color: '#fff', borderRadius: '1rem', fontSize: '0.65rem', padding: '0 0.4rem' }}>
                  Новое
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{m.text}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{formatTime(m.date)}</span>
          </div>
        ))
      )}
    </div>
  );

  const renderPending = () => (
    <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {pendingItems.length === 0 ? (
        <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет закупок в ожидании</p>
      ) : (
        pendingItems.map((p) => (
          <div
            key={p.id}
            style={{
              background: 'var(--bg-secondary, #f0f2f5)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
            }}
            onClick={() => navigate(`/chat/${p.id}`)}
          >
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.title}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {p.city} · {p.participant_count || 0} участн.
            </span>
            <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.7rem', alignSelf: 'flex-start' }}>
              {getStatusText(p.status)}
            </span>
          </div>
        ))
      )}
    </div>
  );

  const renderBotSection = (botName, icon, description) => (
    <div style={{ padding: '0 1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{
        background: 'var(--bg-secondary, #f0f2f5)',
        borderRadius: '0.75rem',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{icon}</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{botName}</span>
          <span style={{
            background: 'var(--warning-color,#f57c00)',
            color: '#fff',
            borderRadius: '1rem',
            fontSize: '0.65rem',
            padding: '0.1rem 0.5rem',
            marginLeft: 'auto',
          }}>
            Скоро
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          {description}
        </p>
        <button
          className="btn btn-outline btn-round"
          style={{ fontSize: '0.8rem', padding: '0.4rem 1rem', alignSelf: 'flex-start' }}
          onClick={() => addToast(`Интеграция с ${botName} появится в следующем обновлении`, 'info')}
        >
          Подключить
        </button>
      </div>
    </div>
  );

  const renderUserSearch = () => (
    <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <input
        type="text"
        className="form-input"
        style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}
        placeholder="Имя, email, телефон..."
        value={userSearchQuery}
        onChange={(e) => handleUserSearch(e.target.value)}
        autoFocus
      />
      {userSearchLoading && (
        <p className="text-muted" style={{ fontSize: '0.8rem', padding: '0.25rem 0' }}>Поиск...</p>
      )}
      {!userSearchLoading && userSearchQuery.trim() && userSearchResults.length === 0 && (
        <p className="text-muted" style={{ fontSize: '0.8rem', padding: '0.25rem 0' }}>Пользователи не найдены</p>
      )}
      {userSearchResults.map((u) => (
        <div
          key={u.id}
          style={{
            background: 'var(--bg-secondary, #f0f2f5)',
            borderRadius: '0.5rem',
            padding: '0.6rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'var(--primary-color, #3390ec)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {getInitials(u.first_name, u.last_name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.first_name || ''} {u.last_name || ''}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {u.username ? `@${u.username}` : u.email || u.phone || getRoleText(u.role)}
            </div>
          </div>
          <span style={{
            fontSize: '0.65rem',
            background: 'rgba(51,144,236,0.1)',
            color: 'var(--primary-color,#3390ec)',
            borderRadius: '0.25rem',
            padding: '0.1rem 0.4rem',
            flexShrink: 0,
          }}>
            {getRoleText(u.role)}
          </span>
        </div>
      ))}
    </div>
  );

  const renderChatList = () => {
    const allProcurements = [
      ...(myProcurements?.organized || []),
      ...(myProcurements?.participating || []),
    ].filter((p) => ['active', 'stopped', 'payment'].includes(p.status));

    if (allProcurements.length === 0) {
      return (
        <div style={{ padding: '0 1rem 0.5rem' }}>
          <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.5rem 0' }}>Нет активных чатов</p>
        </div>
      );
    }

    return (
      <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {allProcurements.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/chat/${p.id}`)}
            style={{
              background: 'var(--bg-secondary, #f0f2f5)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.875rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title}
              </span>
              <span className={`status-badge status-${p.status}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                {getStatusText(p.status)}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {p.city} · {p.participant_count || 0} участн.
            </span>
          </div>
        ))}
      </div>
    );
  };

  const renderRoleContent = () => {
    if (user.role === 'supplier') return renderSupplierCabinet();
    if (user.role === 'organizer') return renderOrganizerCabinet();
    return renderBuyerCabinet();
  };

  return (
    <div className="cabinet" style={{ flex: 1, overflowY: 'auto' }}>
      <div className="cabinet-header">
        <div
          className="cabinet-avatar"
          style={{ backgroundColor: getAvatarColor(user.first_name || '') }}
        >
          {getInitials(user.first_name, user.last_name)}
        </div>
        <div className="cabinet-info">
          <h2>
            {user.first_name} {user.last_name || ''}
          </h2>
          <div className="cabinet-role">{getRoleText(user.role)}</div>
        </div>
        <button
          className="btn btn-outline btn-round"
          style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '0.3rem 0.7rem', whiteSpace: 'nowrap' }}
          onClick={() => setRoleSwitchOpen(true)}
          title="Сменить роль"
        >
          Сменить роль
        </button>
      </div>

      {/* Role switch modal */}
      {roleSwitchOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setRoleSwitchOpen(false)}>
          <div className="modal" style={{ maxWidth: '320px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Сменить роль</h3>
              <button className="modal-close" onClick={() => setRoleSwitchOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { value: 'buyer', label: 'Покупатель' },
                { value: 'organizer', label: 'Организатор' },
                { value: 'supplier', label: 'Поставщик' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`btn btn-round ${user.role === value ? 'btn-primary' : 'btn-outline'}`}
                  style={{ width: '100%', textAlign: 'left', padding: '0.6rem 1rem' }}
                  onClick={() => handleRoleSwitch(value)}
                >
                  {label}
                  {user.role === value && ' (текущая)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="cabinet-balance">
        <div className="balance-label">Баланс</div>
        <div className="balance-amount">{formatCurrency(user.balance || 0)}</div>
        <div className="balance-actions">
          <button className="btn btn-primary btn-round" onClick={openDepositModal}>
            Пополнить
          </button>
          <button className="btn btn-outline btn-round" onClick={() => setWithdrawOpen(true)}>
            Вывести
          </button>
        </div>
      </div>

      {/* User Analytics */}
      {userStats && (
        <div className="cabinet-stats">
          <div className="cabinet-stat-card">
            <div className="cabinet-stat-icon">🛒</div>
            <div className="cabinet-stat-value">{userStats.procurementsCount}</div>
            <div className="cabinet-stat-label">Закупок</div>
          </div>
          <div className="cabinet-stat-card cabinet-stat-card--active">
            <div className="cabinet-stat-icon">✅</div>
            <div className="cabinet-stat-value">{userStats.activeProcurements}</div>
            <div className="cabinet-stat-label">Активных</div>
          </div>
          <div className="cabinet-stat-card cabinet-stat-card--done">
            <div className="cabinet-stat-icon">🏁</div>
            <div className="cabinet-stat-value">{userStats.completedProcurements}</div>
            <div className="cabinet-stat-label">Завершённых</div>
          </div>
          <div className="cabinet-stat-card cabinet-stat-card--money">
            <div className="cabinet-stat-icon">💰</div>
            <div className="cabinet-stat-value cabinet-stat-value--sm">
              {formatCurrency(userStats.balance.total_deposited || 0)}
            </div>
            <div className="cabinet-stat-label">Пополнено</div>
          </div>
        </div>
      )}

      {/* Role-specific content */}
      {renderRoleContent()}

      {/* Logout button at the bottom */}
      <div className="cabinet-menu" style={{ marginTop: 0 }}>
        <div className="cabinet-menu-item" onClick={logout}>
          <svg
            className="cabinet-menu-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="cabinet-menu-text text-error">Выйти</span>
        </div>
      </div>

      {/* Modals */}
      <CompanyCardModal
        isOpen={companyCardOpen}
        onClose={() => setCompanyCardOpen(false)}
        onSave={handleSaveCompanyCard}
      />
      <PriceListModal
        isOpen={priceListOpen}
        onClose={() => setPriceListOpen(false)}
        onSave={handleSavePriceList}
      />
      <NewsModal
        isOpen={newsOpen}
        onClose={() => setNewsOpen(false)}
        onSave={handleSaveNews}
      />
      <WithdrawModal
        isOpen={withdrawOpen}
        onClose={() => setWithdrawOpen(false)}
      />
      <CreateRequestModal
        isOpen={createRequestOpen}
        onClose={() => setCreateRequestOpen(false)}
        onSave={handleSaveRequest}
      />
      <ClosingDocumentsModal
        isOpen={closingDocsOpen}
        onClose={() => setClosingDocsOpen(false)}
        onSave={handleSendClosingDocuments}
        orderTableId={selectedOrderTableId}
      />

      {/* Add participant modal */}
      {addParticipantOpen && (
        <div className="modal-overlay active" onClick={(e) => e.target === e.currentTarget && setAddParticipantOpen(false)}>
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Добавить участника в закупку</h3>
              <button className="modal-close" onClick={() => setAddParticipantOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {addParticipantProcurement && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Закупка: <strong>{addParticipantProcurement.title}</strong>
                </p>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
                  Поиск пользователя
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', width: '100%' }}
                  placeholder="Имя, email, телефон..."
                  value={addParticipantUserQuery}
                  onChange={(e) => handleAddParticipantSearch(e.target.value)}
                  autoFocus
                />
                {addParticipantLoading && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Поиск...</p>
                )}
                {addParticipantResults.length > 0 && !addParticipantSelected && (
                  <div style={{ border: '1px solid var(--border-color,#e0e4e8)', borderRadius: '0.5rem', marginTop: '0.25rem', overflow: 'hidden' }}>
                    {addParticipantResults.map((u) => (
                      <div
                        key={u.id}
                        style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color,#e0e4e8)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        onClick={() => {
                          setAddParticipantSelected(u);
                          setAddParticipantUserQuery(`${u.first_name || ''} ${u.last_name || ''}`.trim());
                          setAddParticipantResults([]);
                        }}
                      >
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{u.first_name || ''} {u.last_name || ''}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{u.email || u.phone || getRoleText(u.role)}</div>
                      </div>
                    ))}
                  </div>
                )}
                {addParticipantSelected && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--success-color,#4caf50)' }}>
                    ✓ Выбран: {addParticipantSelected.first_name} {addParticipantSelected.last_name || ''} ({addParticipantSelected.email || addParticipantSelected.phone || `ID ${addParticipantSelected.id}`})
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Количество</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', width: '100%' }}
                    min="0.01"
                    step="0.01"
                    value={addParticipantQuantity}
                    onChange={(e) => setAddParticipantQuantity(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Сумма (₽)</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem', width: '100%' }}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={addParticipantAmount}
                    onChange={(e) => setAddParticipantAmount(e.target.value)}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline btn-round" onClick={() => setAddParticipantOpen(false)}>
                  Отмена
                </button>
                <button
                  className="btn btn-primary btn-round"
                  disabled={!addParticipantSelected || !addParticipantAmount}
                  onClick={handleAddParticipantSubmit}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cabinet;
