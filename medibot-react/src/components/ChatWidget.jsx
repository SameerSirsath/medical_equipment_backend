import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { fetchBootstrapData, apiGet, apiPost } from '../api/client';
import './ChatWidget.css';

const ChatWidget = ({ avatarImg = 'medibot-react\\src\\components\\IMG.png' }) => {
  // ---------- States ----------
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelClosing, setPanelClosing] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [inputDisabled, setInputDisabled] = useState(true);
  const [sendDisabled, setSendDisabled] = useState(true);
  const [currentStep, setCurrentStep] = useState('category');
  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentProductId, setCurrentProductId] = useState(null);
  const [currentProductName, setCurrentProductName] = useState(null);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [authDropdownOpen, setAuthDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Category/product state
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [productsByCategory, setProductsByCategory] = useState({});

  // Welcome collapse state
  const [welcomeCollapsed, setWelcomeCollapsed] = useState(false);

  // Scroll-down button state
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Modal states
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [signupModalOpen, setSignupModalOpen] = useState(false);
  const [chatHistoryModalOpen, setChatHistoryModalOpen] = useState(false);
  const [myRequestsModalOpen, setMyRequestsModalOpen] = useState(false);
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [endChatModalOpen, setEndChatModalOpen] = useState(false);
  const [pendingRequirements, setPendingRequirements] = useState('');

  // ── Feedback states ──
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackType, setFeedbackType] = useState('general');

  // ── Pending end‑chat flag ──
  const [pendingEndChat, setPendingEndChat] = useState(false);

  // Login mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');

  // Password login states
  const [loginContact, setLoginContact] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // OTP login states
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');
  const [loginOtpStatus, setLoginOtpStatus] = useState('');
  const [loginOtpTimer, setLoginOtpTimer] = useState(0);
  const [loginOtpExpiry, setLoginOtpExpiry] = useState(0);
  const loginOtpIntervalRef = useRef(null);
  const isSendingLoginOtp = useRef(false);

  // Signup form states
  const [signupStep, setSignupStep] = useState(1);
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupOtpError, setSignupOtpError] = useState('');
  const [signupSendOtpDisabled, setSignupSendOtpDisabled] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false, uppercase: false, lowercase: false, digit: false, special: false
  });

  // Live validation for signup
  const [signupUsernameExists, setSignupUsernameExists] = useState(false);
  const [signupEmailExists, setSignupEmailExists] = useState(false);
  const [signupPhoneExists, setSignupPhoneExists] = useState(false);
  const checkUserTimer = useRef(null);

  // Inquiry OTP timers
  const [inqOtpTimer, setInqOtpTimer] = useState(0);
  const [inqOtpExpiry, setInqOtpExpiry] = useState(0);
  const inqOtpIntervalRef = useRef(null);
  const isSendingInqOtp = useRef(false);

  // Signup OTP timers
  const [signupOtpTimer, setSignupOtpTimer] = useState(0);
  const [signupOtpExpiry, setSignupOtpExpiry] = useState(0);
  const signupOtpIntervalRef = useRef(null);
  const isSendingSignupOtp = useRef(false);

  // Inquiry states
  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqContact, setInqContact] = useState('');
  const [inqOtp, setInqOtp] = useState('');
  const [inqSendOtpDisabled, setInqSendOtpDisabled] = useState(true);
  const [inqSubmitDisabled, setInqSubmitDisabled] = useState(true);
  const [inqOtpSent, setInqOtpSent] = useState(false);
  const [inqOtpVerified, setInqOtpVerified] = useState(false);
  const [inqOtpStatus, setInqOtpStatus] = useState('');
  const [inqOtpStatusColor, setInqOtpStatusColor] = useState('red');
  const [pendingInquiry, setPendingInquiry] = useState(null);
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Chat history / requests data
  const [chatHistory, setChatHistory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);

  // Cookie preferences
  const [prefPerformance, setPrefPerformance] = useState(false);
  const [prefAnalytics, setPrefAnalytics] = useState(false);
  const [prefAdvertising, setPrefAdvertising] = useState(false);

  // Password visibility (for signup)
  const [passwordVisible, setPasswordVisible] = useState({});

  // Refs
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ---------- Helper functions ----------
  const getTimestamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const formatIST = (dateString) => {
    if (!dateString) return 'N/A';
    const parts = dateString.split(/[- :]/);
    if (parts.length < 6) return dateString;
    const [year, month, day, hour, minute, second] = parts;
    return `${day}/${month}/${year}, ${hour}:${minute}:${second}`;
  };

  const addMessage = (text, sender, isHTML = false) => {
    const newMsg = {
      id: Date.now() + Math.random(),
      text,
      sender,
      isHTML,
      timestamp: getTimestamp(),
    };
    setMessages(prev => [...prev, newMsg]);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const clearMessages = () => setMessages([]);

  const setSuggestionsChips = (chips) => {
    setSuggestions(chips.map(chip => ({ label: chip.label, value: chip.value })));
  };

  const clearSuggestions = () => setSuggestions([]);

  const enableInput = (enable) => {
    setInputDisabled(!enable);
    setSendDisabled(!enable);
    if (!enable) {
      setInputValue('');
    }
  };

  // ---------- Cookie helpers ----------
  const setCookie = (name, value, days = 365) => {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; expires=${expires}; path=/; SameSite=Lax`;
  };

  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) {
      try { return JSON.parse(decodeURIComponent(match[2])); } catch(e) { return null; }
    }
    return null;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
  };

  // ---------- OTP Timer Helpers ----------
  const startOtpTimer = (setTimer, setExpiry, intervalRef) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(5);
    setExpiry(300);
    intervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
      setExpiry(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ---------- Persist / Restore chat state ----------
  const SAVE_KEY = 'kaizy_chat_state';

  const saveChatState = () => {
    const state = {
      messages,
      suggestions,
      currentStep,
      currentCategory,
      currentProductId,
      currentProductName,
      lastUserMessage,
      inputValue,
      inputDisabled,
      sendDisabled,
      welcomeCollapsed,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) { /* ignore */ }
  };

  const restoreChatState = () => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setMessages(state.messages || []);
        setSuggestions(state.suggestions || []);
        setCurrentStep(state.currentStep || 'category');
        setCurrentCategory(state.currentCategory || null);
        setCurrentProductId(state.currentProductId || null);
        setCurrentProductName(state.currentProductName || null);
        setLastUserMessage(state.lastUserMessage || '');
        setInputValue(state.inputValue || '');
        setInputDisabled(state.inputDisabled !== undefined ? state.inputDisabled : true);
        setSendDisabled(state.sendDisabled !== undefined ? state.sendDisabled : true);
        if (state.welcomeCollapsed !== undefined) setWelcomeCollapsed(state.welcomeCollapsed);
        console.log('✅ Chat state restored from localStorage');
        return true;
      }
    } catch (e) { /* ignore */ }
    console.log('ℹ️ No saved chat state found');
    return false;
  };

  const clearSavedState = () => {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) { /* ignore */ }
  };

  // ---- Restore saved state on component mount ----
  useEffect(() => {
    restoreChatState();
  }, []);

  // Save state whenever it changes (debounced)
  useEffect(() => {
    const timer = setTimeout(saveChatState, 500);
    return () => clearTimeout(timer);
  }, [messages, suggestions, currentStep, currentCategory, currentProductId, currentProductName, lastUserMessage, inputValue, inputDisabled, sendDisabled, welcomeCollapsed]);

  // ---------- Load user from cookie ----------
  useEffect(() => {
    const savedUser = getCookie('user');
    if (savedUser) {
      setCurrentUser(savedUser);
    }
  }, []);

  // ---------- Fetch categories & products ----------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchBootstrapData();
        if (data.categories && data.products_by_category) {
          setCategories(data.categories);
          setProductsByCategory(data.products_by_category);
        }
      } catch (err) {
        console.error('Failed to load categories/products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ---------- Cookie consent ----------
  useEffect(() => {
    const consent = getCookie('cookie_consent');
    const dismissed = getCookie('cookie_consent_dismissed');
    if (!consent && !dismissed) {
      setShowCookieBanner(true);
    }
  }, []);

  // ---------- Initialize welcome message ----------
  useEffect(() => {
    if (panelOpen && currentStep === 'category' && messages.length === 0 && !loading) {
      const welcomeMsg = {
        id: 'welcome',
        type: 'welcome',
        sender: 'bot',
        timestamp: getTimestamp(),
        pinned: true,
      };
      setMessages([welcomeMsg]);
      setWelcomeCollapsed(false);
    }
  }, [panelOpen, currentStep, messages.length, loading]);

  // ---------- Scroll listener for scroll-down button ----------
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const atBottom = scrollHeight - scrollTop - clientHeight < 10;
      setShowScrollDown(!atBottom);
    };

    container.addEventListener('scroll', handleScroll);
    setTimeout(handleScroll, 200);

    return () => container.removeEventListener('scroll', handleScroll);
  }, [messages]);

  // ---------- Click outside welcome to collapse ----------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!welcomeCollapsed && messagesContainerRef.current) {
        const welcomeBubble = messagesContainerRef.current.querySelector('.message.pinned .bubble');
        if (welcomeBubble && !welcomeBubble.contains(e.target)) {
          setWelcomeCollapsed(true);
        }
      }
    };
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('click', handleClickOutside);
      return () => container.removeEventListener('click', handleClickOutside);
    }
  }, [welcomeCollapsed]);

  // ---------- Panel controls ----------
  const openPanel = () => {
    setPanelOpen(true);
    setPanelClosing(false);
  };

  const closePanel = () => {
    setPanelClosing(true);
    setTimeout(() => {
      setPanelOpen(false);
      setPanelClosing(false);
      if (maximized) setMaximized(false);
    }, 300);
  };

  const toggleMaximize = () => setMaximized(!maximized);

  // ---------- Core end‑chat logic (extracted) ----------
  const performEndChat = () => {
    clearMessages();
    setCurrentStep('category');
    setCurrentCategory(null);
    setCurrentProductId(null);
    setCurrentProductName(null);
    clearSuggestions();
    enableInput(false);
    setWelcomeCollapsed(false);
    clearSavedState();
    closePanel();
    setPendingEndChat(false); // reset flag
    setTimeout(() => {
      const welcomeMsg = {
        id: 'welcome',
        type: 'welcome',
        sender: 'bot',
        timestamp: getTimestamp(),
        pinned: true,
      };
      setMessages([welcomeMsg]);
    }, 400);
  };

  // ---------- End chat (with feedback trigger) ----------
  const endChat = () => {
    setEndChatModalOpen(false); // close confirmation

    // Count user messages (excluding pinned welcome)
    const userMessages = messages.filter(m => m.sender === 'user' && !m.pinned);
    if (userMessages.length >= 2) {
      // Meaningful conversation → ask for feedback before ending
      setFeedbackModalOpen(true);
      setPendingEndChat(true);
      // Pre‑select "Chat Experience" as it fits the context
      setFeedbackType('chat_experience');
      return;
    }
    // Otherwise end immediately
    performEndChat();
  };

  // ---------- Helper: collapse welcome ----------
  const collapseWelcome = () => {
    if (!welcomeCollapsed) setWelcomeCollapsed(true);
  };

  // ---------- Reset chat to initial state ----------
  const resetChat = () => {
    clearMessages();
    setCurrentStep('category');
    setCurrentCategory(null);
    setCurrentProductId(null);
    setCurrentProductName(null);
    setSuggestions([]);
    setInputValue('');
    setInputDisabled(true);
    setSendDisabled(true);
    setWelcomeCollapsed(false);
    const welcomeMsg = {
      id: 'welcome',
      type: 'welcome',
      sender: 'bot',
      timestamp: getTimestamp(),
      pinned: true,
    };
    setMessages([welcomeMsg]);
  };

  // ---------- Chat flow handlers ----------
  const handleCategorySelect = (cat) => {
    setCurrentCategory(cat);
    setCurrentStep('product');
    addMessage(`✅ Selected: <b>${cat.replace(/_/g, ' ').toUpperCase()}</b>`, 'user', true);
    collapseWelcome();
    const productMsg = {
      id: Date.now(),
      type: 'productSelection',
      category: cat,
      sender: 'bot',
      timestamp: getTimestamp(),
    };
    setMessages(prev => [...prev, productMsg]);
    enableInput(false);
  };

  const handleProductSelect = (productId, productName) => {
    setCurrentProductId(productId);
    setCurrentProductName(productName);
    setCurrentStep('chat');
    addMessage(`✅ Selected: <b>${productName}</b>`, 'user', true);
    addMessage(`You're now chatting about <b>${productName}</b>. Ask me anything!`, 'bot', true);
    collapseWelcome();
    setSuggestionsChips([
      { label: '📋 About this product', value: 'Tell me about this product' },
      { label: '⚙️ Features', value: 'What are the features?' },
      { label: '💉 Uses', value: 'What are the uses?' },
      { label: '📊 Tech Specs', value: 'What are the technical specifications?' },
      { label: '⚖️ Pros & Cons', value: 'What are the advantages and disadvantages?' },
      { label: '💰 Request a Quote', value: 'Quotation' }
    ]);
    enableInput(true);
  };

  // ---- Send Message ----
  const sendMessage = async (messageOverride) => {
    const msg = messageOverride || inputValue.trim();
    if (!msg || currentStep !== 'chat' || !currentProductId) {
      if (currentStep !== 'chat' || !currentProductId) {
        alert('Please select a product first.');
      }
      return;
    }
    collapseWelcome();
    setInputValue('');
    addMessage(msg, 'user');
    setLastUserMessage(msg);
    setSendDisabled(true);
    setInputDisabled(true);

    const typingId = 'typing-' + Date.now();
    setMessages(prev => [...prev, { id: typingId, type: 'typing', sender: 'bot', timestamp: getTimestamp() }]);

    try {
      const res = await apiPost('/chat', {
        message: msg,
        product_id: currentProductId,
        category: currentCategory
      });
      setMessages(prev => prev.filter(m => m.id !== typingId));

      if (res.error) {
        addMessage('⚠️ ' + res.error, 'bot');
      } else {
        addMessage(res.response, 'bot', true);
        if (res.show_inquiry_modal) {
          showInquiryModal(res.product_id, res.product_name, res.category);
        }
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      if (error.message && error.message.includes('No active session')) {
        clearSavedState();
        resetChat();
        addMessage('Your session has expired. Please refresh the page and start a new chat.', 'bot');
      } else {
        addMessage('⚠️ Network error. Please try again.', 'bot');
      }
    } finally {
      setInputDisabled(false);
      setSendDisabled(false);
    }
  };

  // ---- Suggestion Chip Click ----
  const handleSuggestionClick = (value) => {
    setPendingRequirements(value);
    sendMessage(value);
  };

  // ---------- Inquiry modal ----------
  const showInquiryModal = (productId, productName, category) => {
    const requirements = pendingRequirements || lastUserMessage || 'Quotation request';
    if (currentUser) {
      apiPost('/inquiry', {
        name: currentUser.username,
        email: currentUser.email,
        contact: currentUser.phone,
        product_id: productId,
        product_name: productName,
        category,
        inquiry_type: 'quote',
        requirements: requirements
      }).then(data => {
        if (data.success) {
          addMessage('✅ Your inquiry has been submitted. Our team will reach out to you shortly.', 'bot');
        } else {
          addMessage('⚠️ ' + (data.error || 'Submission failed.'), 'bot');
        }
      }).catch(err => {
        addMessage('⚠️ ' + err.message, 'bot');
      });
    } else {
      setPendingInquiry({ productId, productName, category, requirements });
      resetInquiryForm();
      setInquiryModalOpen(true);
    }
  };

  const resetInquiryForm = () => {
    setInqName('');
    setInqEmail('');
    setInqContact('');
    setInqOtp('');
    setInqOtpSent(false);
    setInqOtpVerified(false);
    setInqOtpStatus('');
    setInqOtpStatusColor('red');
    setInqSendOtpDisabled(true);
    setInqSubmitDisabled(true);
    setInqOtpTimer(0);
    setInqOtpExpiry(0);
    if (inqOtpIntervalRef.current) {
      clearInterval(inqOtpIntervalRef.current);
      inqOtpIntervalRef.current = null;
    }
    isSendingInqOtp.current = false;
  };

  // ----- INQUIRY VALIDATION -----
  const validateInquiryForm = () => {
    const nameValid = /^[A-Za-z ]+$/.test(inqName) && inqName.length <= 50;
    const emailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(inqEmail);
    const phoneValid = /^[0-9]{10}$/.test(inqContact);
    const allValid = nameValid && emailValid && phoneValid;
    setInqSendOtpDisabled(!allValid);
    return { nameValid, emailValid, phoneValid, allValid };
  };

  // ----- Send OTP (inquiry) with cooldown and blocking -----
  const sendInqOtp = async () => {
    if (isSendingInqOtp.current || inqOtpTimer > 0) return;
    isSendingInqOtp.current = true;

    const { allValid } = validateInquiryForm();
    if (!allValid) {
      setInqOtpStatus('Please fill all fields correctly.');
      setInqOtpStatusColor('red');
      isSendingInqOtp.current = false;
      return;
    }

    startOtpTimer(setInqOtpTimer, setInqOtpExpiry, inqOtpIntervalRef);
    setInqOtpStatus('');
    setInqOtpStatusColor('red');

    try {
      const data = await apiPost('/api/generate-otp', { contact: inqEmail, type: 'email' });
      if (data.success) {
        setInqOtpSent(true);
        setInqOtpStatus('✅ OTP sent on your email.');
        setInqOtpStatusColor('green');
        setTimeout(() => document.getElementById('inqOtpInput')?.focus(), 100);
      } else {
        setInqOtpStatus(data.error || '❌ Failed to send OTP.');
        setInqOtpStatusColor('red');
      }
    } catch (e) {
      setInqOtpStatus('❌ Network error. Is the server running?');
      setInqOtpStatusColor('red');
    } finally {
      isSendingInqOtp.current = false;
    }
  };

  // ----- Verify OTP (inquiry) -----
  const verifyInqOtp = async () => {
    if (!inqOtp || inqOtp.length !== 6) {
      setInqOtpStatus('Please enter a 6-digit OTP.');
      setInqOtpStatusColor('red');
      return;
    }
    try {
      const data = await apiPost('/api/verify-otp', { contact: inqEmail, otp: inqOtp });
      if (data.success) {
        setInqOtpVerified(true);
        setInqSubmitDisabled(false);
        setInqOtpStatus('✅ OTP verified. You can now submit.');
        setInqOtpStatusColor('green');
      } else {
        setInqOtpStatus(data.error || '❌ Invalid OTP.');
        setInqOtpStatusColor('red');
      }
    } catch (e) {
      setInqOtpStatus('❌ Invalid OTP.');
      setInqOtpStatusColor('red');
    }
  };

  // ----- SUBMIT INQUIRY (with feedback trigger) -----
  const submitInquiry = async () => {
    if (!inqOtpVerified || !pendingInquiry) return;
    if (submittingInquiry) return;
    setSubmittingInquiry(true);

    const payload = {
      name: inqName,
      email: inqEmail,
      contact: inqContact,
      product_id: pendingInquiry.productId,
      product_name: pendingInquiry.productName,
      category: pendingInquiry.category,
      inquiry_type: 'quote',
      requirements: pendingInquiry.requirements
    };

    try {
      const data = await apiPost('/inquiry', payload);
      if (data.success) {
        alert('✅ Inquiry submitted.');
        closeInquiryModal();
        // ── Auto‑prompt for feedback after inquiry ──
        setTimeout(() => {
          setFeedbackType('service'); // pre‑select service type
          setFeedbackModalOpen(true);
        }, 1000);
      } else {
        setInqOtpStatus('⚠️ ' + (data.error || 'Submission failed.'));
        setInqOtpStatusColor('red');
      }
    } catch (error) {
      const msg = error.message || '';
      if (msg.includes('already submitted') || msg.includes('already')) {
        setInqOtpStatus('⚠️ ' + msg);
        setInqOtpStatusColor('orange');
      } else {
        setInqOtpStatus('❌ ' + msg);
        setInqOtpStatusColor('red');
      }
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const closeInquiryModal = () => {
    setInquiryModalOpen(false);
    resetInquiryForm();
    setPendingInquiry(null);
  };

  // ---------- LOGIN (Password and OTP) ----------
  const loginWithPassword = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      const data = await apiPost('/api/login', { contact: loginContact, password: loginPassword });
      if (data.success) {
        setCurrentUser(data.user);
        setCookie('user', data.user);
        setLoginModalOpen(false);
        setLoginContact('');
        setLoginPassword('');
        setLoginMode('password');
      } else {
        setLoginError(data.error || 'Login failed');
      }
    } catch (err) {
      setLoginError('Invalid login credentials. Please check your email/phone and password.');
    }
  };

  // ----- Send Login OTP with cooldown and blocking -----
  const sendLoginOtp = async () => {
    if (isSendingLoginOtp.current || loginOtpTimer > 0) return;
    isSendingLoginOtp.current = true;

    const contact = loginContact.trim();
    if (!contact) {
      setLoginError('Please enter your email or phone.');
      isSendingLoginOtp.current = false;
      return;
    }

    startOtpTimer(setLoginOtpTimer, setLoginOtpExpiry, loginOtpIntervalRef);
    setLoginError('');
    setLoginOtpStatus('Sending OTP...');

    try {
      const data = await apiPost('/api/send-login-otp', { contact });
      if (data.success) {
        setLoginOtpSent(true);
        setLoginOtpStatus('✅ OTP sent. Check your email.');
      } else {
        setLoginError(data.error || 'Failed to send OTP.');
      }
    } catch (err) {
      setLoginError('Network error. Is the server running?');
    } finally {
      isSendingLoginOtp.current = false;
    }
  };

  const verifyLoginOtp = async () => {
    if (!loginOtp || loginOtp.length !== 6) {
      setLoginError('Please enter a 6-digit OTP.');
      return;
    }
    setLoginError('');
    try {
      const data = await apiPost('/api/verify-login-otp', { contact: loginContact, otp: loginOtp });
      if (data.success) {
        setCurrentUser(data.user);
        setCookie('user', data.user);
        setLoginModalOpen(false);
        setLoginContact('');
        setLoginOtp('');
        setLoginOtpSent(false);
        setLoginOtpStatus('');
        if (loginOtpIntervalRef.current) {
          clearInterval(loginOtpIntervalRef.current);
          loginOtpIntervalRef.current = null;
        }
        setLoginMode('password');
      } else {
        setLoginError(data.error || 'Invalid OTP.');
      }
    } catch (err) {
      setLoginError('Network error.');
    }
  };

  // ---------- LOGOUT – clears user but NOT chat ----------
  const logout = () => {
    setCurrentUser(null);
    deleteCookie('user');
    setUserDropdownOpen(false);
  };

  // ---------- Live existence check for signup ----------
  const checkUserExists = (username, email, phone) => {
    clearTimeout(checkUserTimer.current);
    checkUserTimer.current = setTimeout(async () => {
      try {
        const data = await apiPost('/api/check-user', { username, email, phone });
        setSignupUsernameExists(data.username_exists || false);
        setSignupEmailExists(data.email_exists || false);
        setSignupPhoneExists(data.phone_exists || false);
      } catch (err) {
        console.warn('User check failed', err);
      }
    }, 400);
  };

  // ---------- Signup Step 1 with cooldown and blocking ----------
  const signupStep1 = async (e) => {
    e.preventDefault();
    if (isSendingSignupOtp.current || signupOtpTimer > 0) return;
    isSendingSignupOtp.current = true;

    setSignupError('');

    const nameValid = /^[A-Za-z ]+$/.test(signupUsername) && signupUsername.length <= 50;
    const emailValid = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(signupEmail);
    const phoneValid = /^[7-9][0-9]{9}$/.test(signupPhone);
    const passwordValid = validatePassword(signupPassword);

    if (!nameValid || !emailValid || !phoneValid || !passwordValid) {
      setSignupError('Please fill all fields correctly.');
      isSendingSignupOtp.current = false;
      return;
    }

    if (signupUsernameExists) {
      setSignupError('Username already taken.');
      isSendingSignupOtp.current = false;
      return;
    }
    if (signupEmailExists) {
      setSignupError('Email already registered.');
      isSendingSignupOtp.current = false;
      return;
    }
    if (signupPhoneExists) {
      setSignupError('Phone number already registered.');
      isSendingSignupOtp.current = false;
      return;
    }

    startOtpTimer(setSignupOtpTimer, setSignupOtpExpiry, signupOtpIntervalRef);

    try {
      const data = await apiPost('/api/generate-otp', { contact: signupEmail, type: 'email' });
      if (data.success) {
        setSignupStep(2);
      } else {
        setSignupError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setSignupError('Network error.');
    } finally {
      isSendingSignupOtp.current = false;
    }
  };

  // ---------- Signup Step 2 ----------
  const signupStep2 = async (e) => {
    e.preventDefault();
    setSignupOtpError('');
    try {
      const data = await apiPost('/api/signup', {
        username: signupUsername,
        email: signupEmail,
        phone: signupPhone,
        password: signupPassword,
        otp: signupOtp
      });
      if (data.success) {
        try {
          const loginData = await apiPost('/api/login', { contact: signupEmail, password: signupPassword });
          if (loginData.success) {
            setCurrentUser(loginData.user);
            setCookie('user', loginData.user);
            setSignupModalOpen(false);
            resetSignupForm();
            alert('✅ Account created! You are now logged in.');
          } else {
            setSignupOtpError('Signup succeeded but login failed. Please log in manually.');
          }
        } catch (loginErr) {
          setSignupOtpError('Signup succeeded but login failed. Please log in manually.');
        }
      } else {
        setSignupOtpError(data.error || 'Signup failed');
      }
    } catch (err) {
      const errorMsg = err.message || 'Signup failed. Please try again.';
      setSignupOtpError(errorMsg);
    }
  };

  const resetSignupForm = () => {
    setSignupStep(1);
    setSignupUsername('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
    setSignupOtp('');
    setSignupError('');
    setSignupOtpError('');
    setSignupSendOtpDisabled(true);
    setSignupUsernameExists(false);
    setSignupEmailExists(false);
    setSignupPhoneExists(false);
    setSignupOtpTimer(0);
    setSignupOtpExpiry(0);
    if (signupOtpIntervalRef.current) {
      clearInterval(signupOtpIntervalRef.current);
      signupOtpIntervalRef.current = null;
    }
    setPasswordRequirements({ length: false, uppercase: false, lowercase: false, digit: false, special: false });
    isSendingSignupOtp.current = false;
  };

  const validatePassword = (pwd) => {
    const reqs = {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      digit: /[0-9]/.test(pwd),
      special: /[!@#$%^&*]/.test(pwd)
    };
    setPasswordRequirements(reqs);
    const allValid = Object.values(reqs).every(v => v);
    setSignupSendOtpDisabled(!allValid);
    return allValid;
  };

  const togglePassword = (field) => {
    setPasswordVisible(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // ---------- Chat History / My Requests ----------
  const showChatHistory = async () => {
    setChatHistoryModalOpen(true);
    try {
      const data = await apiGet('/api/chat-history');
      if (data.success && data.history) {
        setChatHistory(data.history);
      } else {
        setChatHistory([]);
      }
    } catch (e) { setChatHistory([]); }
  };

  const showMyRequests = async () => {
    setMyRequestsModalOpen(true);
    try {
      const data = await apiGet('/api/user-requests');
      if (data.success && data.requests) {
        setMyRequests(data.requests);
      } else {
        setMyRequests([]);
      }
    } catch (e) { setMyRequests([]); }
  };

  // ---------- Cookie Consent ----------
  const acceptAll = () => {
    const prefs = { essential: true, performance: true, analytics: true, advertising: true };
    setCookie('cookie_consent', prefs);
    setShowCookieBanner(false);
    apiPost('/cookie-consent', { status: 'accepted', preferences: prefs });
  };
  const rejectAll = () => {
    const prefs = { essential: true, performance: false, analytics: false, advertising: false };
    setCookie('cookie_consent', prefs);
    setShowCookieBanner(false);
    apiPost('/cookie-consent', { status: 'rejected', preferences: prefs });
  };
  const dismissBanner = () => {
    setCookie('cookie_consent_dismissed', 'true', 1);
    setShowCookieBanner(false);
  };

  const openPreferences = () => {
    const consent = getCookie('cookie_consent') || {};
    setPrefPerformance(consent.performance || false);
    setPrefAnalytics(consent.analytics || false);
    setPrefAdvertising(consent.advertising || false);
    setPreferencesModalOpen(true);
  };

  const savePreferences = () => {
    const prefs = {
      essential: true,
      performance: prefPerformance,
      analytics: prefAnalytics,
      advertising: prefAdvertising
    };
    setCookie('cookie_consent', prefs);
    setPreferencesModalOpen(false);
    setShowCookieBanner(false);
    apiPost('/cookie-consent', { status: 'custom', preferences: prefs });
  };

  // ---------- FEEDBACK SUBMIT (handles pending end‑chat) ----------
  const submitFeedback = async () => {
    if (rating === 0) {
      alert('Please select a rating.');
      return;
    }
    try {
      const res = await apiPost('/api/feedback', {
        rating,
        comment: feedbackComment,
        type: feedbackType,
        product_id: currentProductId || null,
      });
      if (res.success) {
        alert('✅ Thank you for your feedback!');
        setFeedbackModalOpen(false);
        setRating(0);
        setFeedbackComment('');
        setFeedbackType('general');
        // If we were waiting to end chat, do it now
        if (pendingEndChat) {
          setPendingEndChat(false);
          performEndChat();
        }
      } else {
        alert('❌ ' + (res.error || 'Submission failed.'));
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  };

  // ---------- Render helpers ----------
  const renderMessageContent = (msg) => {
    if (msg.type === 'typing') {
      return (
        <div className="typing-dots">
          <span></span><span></span><span></span>
        </div>
      );
    }
    if (msg.type === 'productSelection') {
      const products = productsByCategory[msg.category] || [];
      return (
        <div>
          <span>Great! Now please select a <b>product</b> from the list below:</span>
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {products.map(p => (
              <button key={p.equipment_id} className="option-btn"
                onClick={() => handleProductSelect(p.equipment_id, p.name)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (msg.type === 'welcome') {
      if (welcomeCollapsed) {
        return (
          <div
            className="welcome-collapsed"
            onClick={() => setWelcomeCollapsed(false)}
          >
            📋 Select Category <span style={{ fontSize: '0.7rem', marginLeft: '6px' }}>▼</span>
          </div>
        );
      }
      return (
        <div>
          <span dangerouslySetInnerHTML={{ __html: `👋 Hi ${currentUser?.username || 'there'}! I'm KAIZY, your medical equipment assistant.<br><br><b>Let's get started:</b><br>Please select a <b>category</b> from the options below:` }} />
          <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map(cat => (
              <button key={cat} className="option-btn primary"
                onClick={() => handleCategorySelect(cat)}
              >
                {cat.replace(/_/g, ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      );
    }
    if (msg.isHTML) {
      return <span dangerouslySetInnerHTML={{ __html: msg.text }} />;
    }
    const escaped = (msg.text || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const withBold = escaped.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    return <span dangerouslySetInnerHTML={{ __html: withBold }} />;
  };

  // ---------- Render ----------
  return (
    <div className="chat-widget">
      <button className="ask-ai-btn" onClick={openPanel} style={{ display: panelOpen ? 'none' : 'flex' }}>
        <span className="icon">✨</span> Ask KAIZY
      </button>

      <div
        ref={panelRef}
        className={`chat-panel ${panelOpen ? 'open' : ''} ${panelClosing ? 'closing' : ''} ${maximized ? 'maximized' : ''}`}
        style={{ display: panelOpen || panelClosing ? 'flex' : 'none' }}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="avatar">
            <img src={avatarImg} alt="KAIZY" />
          </div>
          <h2>KAIZY</h2>
          <div className="auth-container">
            {!currentUser ? (
              <div className={`auth-dropdown ${authDropdownOpen ? 'active' : ''}`}>
                <button className="auth-btn" onClick={() => setAuthDropdownOpen(!authDropdownOpen)}>Account ▾</button>
                <div className="dropdown-content">
                  <a onClick={() => { setLoginModalOpen(true); setAuthDropdownOpen(false); }}>Login</a>
                  <a onClick={() => { setSignupModalOpen(true); setAuthDropdownOpen(false); }}>Sign Up</a>
                </div>
              </div>
            ) : (
              <div className="user-greeting-wrapper">
                <span className="user-greeting" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                  👋 {currentUser.username} ▾
                </span>
                <div className={`user-dropdown ${userDropdownOpen ? 'open' : ''}`}>
                  <a onClick={() => { showChatHistory(); setUserDropdownOpen(false); }}>💬 Chat History</a>
                  <a onClick={() => { showMyRequests(); setUserDropdownOpen(false); }}>📋 My Requests</a>
                  <a onClick={() => { logout(); setUserDropdownOpen(false); }}>🚪 Logout</a>
                </div>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button onClick={toggleMaximize} title="Maximize">{maximized ? '🗗' : '🗖'}</button>
            <button onClick={closePanel} title="Minimize">&ndash;</button>
            {/* NEW: Feedback button */}
            <button onClick={() => setFeedbackModalOpen(true)} title="Give feedback">💬</button>
            <button className="end-chat-btn" onClick={() => setEndChatModalOpen(true)} title="End chat">✕</button>
          </div>
        </div>

        {/* Messages with scroll-down button */}
        <div className="chat-messages" ref={messagesContainerRef}>
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.sender} ${msg.pinned ? 'pinned' : ''} ${msg.id === 'welcome' && welcomeCollapsed ? 'welcome-collapsed-mode' : ''}`}
            >
              <div className="bubble">
                {renderMessageContent(msg)}
              </div>
              {!msg.pinned && <div className="timestamp">{msg.timestamp}</div>}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-down button (circular) */}
        {showScrollDown && (
          <button
            onClick={scrollToBottom}
            style={{
              position: 'absolute',
              bottom: '150px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'white',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              fontSize: '1.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1e293b',
              transition: 'all 0.2s ease',
              zIndex: 5,
              padding: 0,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Scroll to bottom"
          >
            ↓
          </button>
        )}

        {/* Suggestion area */}
        <div className="suggestion-area">
          {suggestions.map((chip, idx) => (
            <span key={idx} className="suggestion-chip" onClick={() => handleSuggestionClick(chip.value)}>
              {chip.label}
            </span>
          ))}
        </div>

        {/* Cookie Banner */}
        {showCookieBanner && (
          <div className="cookie-banner" style={{ display: 'block' }}>
            <div className="cookie-header">
              <span style={{ fontWeight: 600, color: '#0b2a4a' }}>🍪 Cookie Preferences</span>
              <button className="cookie-close" onClick={dismissBanner}>×</button>
            </div>
            <p>We use essential cookies. <Link to="/cookies">Learn more</Link></p>
            <div className="cookie-actions">
              <button className="btn-accept" onClick={acceptAll}>Accept</button>
              <button className="btn-reject" onClick={rejectAll}>Reject</button>
              <button className="btn-preferences" onClick={openPreferences}>Preferences</button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="input-area">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !inputDisabled && sendMessage()}
            placeholder={inputDisabled ? 'Select a product first' : 'Ask anything...'}
            disabled={inputDisabled}
          />
          <button onClick={sendMessage} disabled={sendDisabled}>Send</button>
        </div>

        {/* Footer */}
        <div className="chat-footer">
          <span>
            AI can make mistakes. By using KAIZY, you agree to our{' '}
            <Link to="/privacy">Privacy Policy</Link> and{' '}
            <Link to="/cookies">Cookies Policy</Link>.
          </span>
        </div>

        {/* ---------- MODALS ---------- */}
        {/* Inquiry Modal */}
        {inquiryModalOpen && (
          <div className="modal-overlay active" onClick={closeInquiryModal}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>📩 Request a Quote / More Details</h3>
              <p>Please fill in your details and verify your contact.</p>
              <form onSubmit={(e) => { e.preventDefault(); submitInquiry(); }}>
                <label>Your Name *</label>
                <input
                  type="text"
                  value={inqName}
                  onChange={e => {
                    setInqName(e.target.value);
                    validateInquiryForm();
                  }}
                  onBlur={validateInquiryForm}
                  maxLength={50}
                  pattern="[A-Za-z ]+"
                  required
                />
                <div className={`error-message ${!/^[A-Za-z ]+$/.test(inqName) && inqName.length > 0 ? 'visible' : ''}`}>
                  Name should contain only letters and spaces.
                </div>

                <label>Email Address *</label>
                <input
                  type="email"
                  value={inqEmail}
                  onChange={e => {
                    setInqEmail(e.target.value);
                    validateInquiryForm();
                  }}
                  onBlur={validateInquiryForm}
                  required
                />
                <div className={`error-message ${!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(inqEmail) && inqEmail.length > 0 ? 'visible' : ''}`}>
                  Please enter a valid email address.
                </div>

                <label>Contact Number *</label>
                <input
                  type="tel"
                  value={inqContact}
                  onChange={e => {
                    setInqContact(e.target.value);
                    validateInquiryForm();
                  }}
                  onBlur={validateInquiryForm}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                />
                <div className={`error-message ${!/^[0-9]{10}$/.test(inqContact) && inqContact.length > 0 ? 'visible' : ''}`}>
                  Must be exactly 10 digits.
                </div>

                {inqOtpSent && (
                  <div style={{ marginTop: '10px' }}>
                    <label>OTP Code</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        id="inqOtpInput"
                        type="text"
                        value={inqOtp}
                        onChange={e => setInqOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        style={{ flex: 1 }}
                        maxLength="6"
                        pattern="[0-9]{6}"
                      />
                      <button type="button" className="btn-primary" onClick={verifyInqOtp}>Verify OTP</button>
                    </div>
                    {inqOtpExpiry > 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        OTP expires in {Math.floor(inqOtpExpiry / 60)}:{String(inqOtpExpiry % 60).padStart(2, '0')}
                      </p>
                    )}
                    {inqOtpExpiry === 0 && (
                      <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>
                        ⚠️ OTP expired. Please request a new one.
                      </p>
                    )}
                  </div>
                )}

                {inqOtpStatus && (
                  <p style={{ fontSize: '0.8rem', marginTop: '4px', color: inqOtpStatusColor }}>{inqOtpStatus}</p>
                )}

                <div className="modal-actions" style={{ flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={sendInqOtp}
                    disabled={inqSendOtpDisabled || inqOtpTimer > 0}
                  >
                    {inqOtpSent ? 'Resend OTP' : 'Send OTP'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeInquiryModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={inqSubmitDisabled || submittingInquiry}>
                    {submittingInquiry ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Login Modal */}
        {loginModalOpen && (
          <div className="modal-overlay active" onClick={() => setLoginModalOpen(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>🔐 Login</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e9edf2', paddingBottom: '10px' }}>
                <button
                  type="button"
                  className={`btn-${loginMode === 'password' ? 'primary' : 'secondary'}`}
                  onClick={() => setLoginMode('password')}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  Password
                </button>
                <button
                  type="button"
                  className={`btn-${loginMode === 'otp' ? 'primary' : 'secondary'}`}
                  onClick={() => setLoginMode('otp')}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  OTP
                </button>
              </div>

              {loginMode === 'password' ? (
                <form onSubmit={loginWithPassword}>
                  <label>Email or Phone</label>
                  <input
                    type="text"
                    value={loginContact}
                    onChange={(e) => setLoginContact(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                  />
                  <label>Password</label>
                  <div className="password-wrapper">
                    <input
                      type={passwordVisible.login ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => togglePassword('login')}
                      aria-label={passwordVisible.login ? 'Hide password' : 'Show password'}
                    >
                      {passwordVisible.login ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {loginError && <p style={{ color: 'red', marginTop: '4px' }}>{loginError}</p>}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setLoginModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn-primary">Login</button>
                  </div>
                </form>
              ) : (
                <>
                  {!loginOtpSent ? (
                    <form onSubmit={(e) => { e.preventDefault(); sendLoginOtp(); }}>
                      <label>Email or Phone</label>
                      <input
                        type="text"
                        value={loginContact}
                        onChange={(e) => setLoginContact(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                      {loginError && <p style={{ color: 'red', marginTop: '4px' }}>{loginError}</p>}
                      <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={() => setLoginModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loginOtpTimer > 0}>Send OTP</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); verifyLoginOtp(); }}>
                      <label>Enter OTP</label>
                      <input
                        type="text"
                        value={loginOtp}
                        onChange={(e) => setLoginOtp(e.target.value)}
                        placeholder="6-digit OTP"
                        maxLength="6"
                        required
                      />
                      <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                        {loginOtpExpiry > 0 ? `OTP expires in ${loginOtpExpiry}s` : 'OTP expired. Please request a new one.'}
                      </p>
                      {loginError && <p style={{ color: 'red', marginTop: '4px' }}>{loginError}</p>}
                      {loginOtpStatus && <p style={{ color: 'green', marginTop: '4px' }}>{loginOtpStatus}</p>}
                      <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setLoginOtpSent(false);
                            setLoginOtp('');
                            setLoginError('');
                            setLoginOtpStatus('');
                            if (loginOtpIntervalRef.current) {
                              clearInterval(loginOtpIntervalRef.current);
                              loginOtpIntervalRef.current = null;
                            }
                          }}
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={sendLoginOtp}
                          disabled={loginOtpTimer > 0}
                          style={{ marginRight: '8px' }}
                        >
                          Resend OTP
                        </button>
                        <button type="submit" className="btn-primary">Verify & Login</button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Signup Modal */}
        {signupModalOpen && (
          <div className="modal-overlay active" onClick={() => { setSignupModalOpen(false); resetSignupForm(); }}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>📝 Sign Up</h3>
              {signupStep === 1 ? (
                <form onSubmit={signupStep1}>
                  <label>Username *</label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => {
                      setSignupUsername(e.target.value);
                      checkUserExists(e.target.value, signupEmail, signupPhone);
                    }}
                    maxLength="50"
                    required
                  />
                  <div className={`error-message ${!/^[A-Za-z ]+$/.test(signupUsername) && signupUsername.length > 0 ? 'visible' : ''}`}>
                    Letters and spaces only.
                  </div>
                  {signupUsername && signupUsernameExists && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                      ⚠️ Username already taken.
                    </p>
                  )}

                  <label>Email *</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      checkUserExists(signupUsername, e.target.value, signupPhone);
                    }}
                    required
                  />
                  <div className={`error-message ${!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(signupEmail) && signupEmail.length > 0 ? 'visible' : ''}`}>
                    Valid email address required.
                  </div>
                  {signupEmail && signupEmailExists && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                      ⚠️ Email already registered.
                    </p>
                  )}

                  <label>Phone *</label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => {
                      setSignupPhone(e.target.value);
                      checkUserExists(signupUsername, signupEmail, e.target.value);
                    }}
                    maxLength="10"
                    required
                  />
                  <div className={`error-message ${!/^[7-9][0-9]{9}$/.test(signupPhone) && signupPhone.length > 0 ? 'visible' : ''}`}>
                    Must be 10 digits starting with 7-9.
                  </div>
                  {signupPhone && signupPhoneExists && (
                    <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '2px' }}>
                      ⚠️ Phone number already registered.
                    </p>
                  )}

                  <label>Password *</label>
                  <div className="password-wrapper">
                    <input
                      type={passwordVisible.signup ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => {
                        setSignupPassword(e.target.value);
                        validatePassword(e.target.value);
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => togglePassword('signup')}
                      aria-label={passwordVisible.signup ? 'Hide password' : 'Show password'}
                    >
                      {passwordVisible.signup ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <div className="password-requirements">
                    <div className={passwordRequirements.length ? 'valid' : 'invalid'}>
                      {passwordRequirements.length ? '✅' : '❌'} At least 8 characters
                    </div>
                    <div className={passwordRequirements.uppercase ? 'valid' : 'invalid'}>
                      {passwordRequirements.uppercase ? '✅' : '❌'} One uppercase letter
                    </div>
                    <div className={passwordRequirements.lowercase ? 'valid' : 'invalid'}>
                      {passwordRequirements.lowercase ? '✅' : '❌'} One lowercase letter
                    </div>
                    <div className={passwordRequirements.digit ? 'valid' : 'invalid'}>
                      {passwordRequirements.digit ? '✅' : '❌'} One number
                    </div>
                    <div className={passwordRequirements.special ? 'valid' : 'invalid'}>
                      {passwordRequirements.special ? '✅' : '❌'} One special char (!@#$%^&*)
                    </div>
                  </div>

                  {signupError && <p style={{ color: 'red' }}>{signupError}</p>}
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setSignupModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn-primary" disabled={signupSendOtpDisabled || signupOtpTimer > 0}>Send OTP</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={signupStep2}>
                  <p>We sent a 6‑digit OTP to your email.</p>
                  <label>OTP</label>
                  <input type="text" value={signupOtp} onChange={e => setSignupOtp(e.target.value)} maxLength="6" required />
                  {signupOtpExpiry > 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                      OTP expires in {Math.floor(signupOtpExpiry / 60)}:{String(signupOtpExpiry % 60).padStart(2, '0')}
                    </p>
                  )}
                  {signupOtpExpiry === 0 && (
                    <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '2px' }}>
                      ⚠️ OTP expired. Please request a new one.
                    </p>
                  )}
                  {signupOtpError && <p style={{ color: 'red' }}>{signupOtpError}</p>}
                  <div className="modal-actions" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setSignupStep(1)}
                      >
                        Back
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={(e) => signupStep1(e)}
                        disabled={signupOtpTimer > 0}
                      >
                        Resend OTP
                      </button>
                      <button type="submit" className="btn-primary">Verify & Sign Up</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Chat History Modal */}
        {chatHistoryModalOpen && (
          <div className="modal-overlay active" onClick={() => setChatHistoryModalOpen(false)}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
              <h3>💬 Your Chat History</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
                {chatHistory.length ? chatHistory.map((item, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid #e9edf2', padding: '10px 0' }}>
                    <small style={{ color: '#94a3b8' }}>{item.timestamp_ist || 'N/A'}</small>
                    {item.product_name && <><br /><b>Product:</b> {item.product_name}</>}
                    <br /><span style={{ color: '#2563eb', fontWeight: 600 }}>You:</span> {item.user_message}
                    <br /><span style={{ color: '#0b2a4a', fontWeight: 600 }}>Bot:</span> <span dangerouslySetInnerHTML={{ __html: item.bot_response }} />
                  </div>
                )) : <p>No chat history found.</p>}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setChatHistoryModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* My Requests Modal */}
        {myRequestsModalOpen && (
          <div className="modal-overlay active" onClick={() => setMyRequestsModalOpen(false)}>
            <div className="modal-box wide" onClick={e => e.stopPropagation()}>
              <h3>📋 Your Requests</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '10px' }}>
                {myRequests.length ? myRequests.map((req, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid #e9edf2', padding: '8px 0' }}>
                    <b>{req.product_name}</b>
                    <br />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      📅 Submitted: {req.created_at_ist || 'N/A'}
                    </span>
                    <br />
                    Type: {req.inquiry_type} | Status: <span style={{ fontWeight: 600, color: req.status === 'pending' ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#ef4444' }}>{req.status}</span>
                    <br />
                    {req.requirements && `Requirements: ${req.requirements}`}
                  </div>
                )) : <p>No requests found.</p>}
              </div>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setMyRequestsModalOpen(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Modal */}
        {preferencesModalOpen && (
          <div className="modal-overlay active" onClick={() => setPreferencesModalOpen(false)}>
            <div className="preferences-modal-box" onClick={e => e.stopPropagation()}>
              <h3>Cookie Preferences</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>Choose which cookies you allow.</p>
              <div className="pref-category">
                <div className="pref-header">
                  <label>Essential – Always Active</label>
                  <input type="checkbox" checked disabled />
                </div>
                <div className="pref-desc">Necessary for the chatbot to function.</div>
              </div>
              <div className="pref-category">
                <div className="pref-header">
                  <label>Functional</label>
                  <input type="checkbox" checked={prefPerformance} onChange={e => setPrefPerformance(e.target.checked)} />
                </div>
                <div className="pref-desc">Not currently used.</div>
              </div>
              <div className="pref-category">
                <div className="pref-header">
                  <label>Analytics</label>
                  <input type="checkbox" checked={prefAnalytics} onChange={e => setPrefAnalytics(e.target.checked)} />
                </div>
                <div className="pref-desc">We do not use analytics cookies.</div>
              </div>
              <div className="pref-category">
                <div className="pref-header">
                  <label>Advertising</label>
                  <input type="checkbox" checked={prefAdvertising} onChange={e => setPrefAdvertising(e.target.checked)} />
                </div>
                <div className="pref-desc">No advertising cookies.</div>
              </div>
              <div className="pref-actions">
                <button className="btn-close-pref" onClick={() => setPreferencesModalOpen(false)}>Cancel</button>
                <button className="btn-save" onClick={savePreferences}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* End Chat Confirmation */}
        {endChatModalOpen && (
          <div className="modal-overlay active" onClick={() => setEndChatModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>⚠️ End Chat</h3>
              <p>Do you really want to end this chat? All messages will be cleared from the window (but will remain in your chat history).</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setEndChatModalOpen(false)}>No</button>
                <button className="btn-primary" onClick={endChat}>Yes, end chat</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Feedback Modal ── */}
        {feedbackModalOpen && (
          <div className="modal-overlay active" onClick={() => {
            // If pending end‑chat, close feedback and still end chat
            if (pendingEndChat) {
              setFeedbackModalOpen(false);
              setRating(0);
              setFeedbackComment('');
              setFeedbackType('general');
              setPendingEndChat(false);
              performEndChat();
            } else {
              setFeedbackModalOpen(false);
              setRating(0);
              setFeedbackComment('');
              setFeedbackType('general');
            }
          }}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <h3>💬 Your Feedback Matters</h3>
              <p>How was your experience with KAIZY?</p>

              <div className="feedback-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    className={star <= rating ? 'active' : ''}
                    onClick={() => setRating(star)}
                  >
                    ★
                  </span>
                ))}
              </div>

              <label>Comment (optional)</label>
              <textarea
                rows="3"
                className="feedback-textarea"
                value={feedbackComment}
                onChange={e => setFeedbackComment(e.target.value)}
                placeholder="Tell us what you think…"
              />

              <label>Feedback Type</label>
              <select
                className="feedback-select"
                value={feedbackType}
                onChange={e => setFeedbackType(e.target.value)}
              >
                <option value="general">General</option>
                <option value="product">About Product Info</option>
                <option value="service">Service / Support</option>
                <option value="chat_experience">Chat Experience</option>
              </select>

              <div className="modal-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    // Cancel closes feedback and if pending, performs end chat
                    setFeedbackModalOpen(false);
                    setRating(0);
                    setFeedbackComment('');
                    setFeedbackType('general');
                    if (pendingEndChat) {
                      setPendingEndChat(false);
                      performEndChat();
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={submitFeedback}
                  disabled={rating === 0}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;
